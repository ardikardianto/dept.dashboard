export const LECTURER_CLASS_LIMIT = 4;

const LOW_RATING_THRESHOLD = 2;
const EQUAL_DISTRIBUTION_TARGET = 2;
const AUTO_PILOT_AVAILABILITY_FALLBACK_NOTE = "No positive availability slots were found, so auto-pilot used the 4-class lecturer cap as a fallback for this run.";

const COURSE_EXPERTISE_RULES = [
  {
    expertise: "English Language Teaching",
    keywords: ["reading", "writing", "listening", "speaking", "teaching", "elt", "tesol", "grammar", "vocabulary", "composition", "language assessment"],
  },
  {
    expertise: "English Linguistics",
    keywords: ["english linguistics", "linguistics", "syntax", "phonology", "morphology", "semantics", "pragmatics", "discourse", "grammar"],
  },
  {
    expertise: "Translation Studies",
    keywords: ["translation", "translating", "translator", "interpreting"],
  },
  {
    expertise: "Indonesian Linguistics",
    keywords: ["indonesian", "bahasa indonesia", "tata bahasa", "analisis teks", "pemahaman"],
  },
  {
    expertise: "Literary Studies",
    keywords: ["literary", "literature", "poetry", "prose", "drama", "novel"],
  },
  {
    expertise: "English for Specific Purposes",
    keywords: ["specific purposes", "esp", "academic english", "business english", "professional english"],
  },
];

const toLookupKey = (value) => String(value || "").trim().toLowerCase();
const normalizeText = (value) => toLookupKey(value).replace(/[^a-z0-9]+/g, " ").trim();

function clampRating(value) {
  const rating = Number(value);
  if (!Number.isFinite(rating)) return 0;
  return Math.min(5, Math.max(0, Math.round(rating)));
}

function toClassCount(value) {
  const count = Number(value);
  if (!Number.isFinite(count)) return 0;
  return Math.max(0, Math.floor(count));
}

function getCourseText(course) {
  return normalizeText(`${course?.code || ""} ${course?.title || ""}`);
}

function getLecturerExpertiseKeys(lecturer) {
  return (Array.isArray(lecturer?.expertise) ? lecturer.expertise : [])
    .map((item) => normalizeText(item))
    .filter(Boolean);
}

export function getCourseExpertiseMatches(course) {
  const courseText = getCourseText(course);
  if (!courseText) return [];
  return COURSE_EXPERTISE_RULES
    .filter((rule) => rule.keywords.some((keyword) => courseText.includes(normalizeText(keyword))))
    .map((rule) => rule.expertise);
}

export function expertiseMatchesCourse(lecturer, course) {
  const expertiseKeys = getLecturerExpertiseKeys(lecturer);
  if (!expertiseKeys.length) return false;

  const courseText = getCourseText(course);
  const mappedExpertise = getCourseExpertiseMatches(course).map((item) => normalizeText(item));
  if (expertiseKeys.some((expertise) => mappedExpertise.includes(expertise))) return true;

  const titleText = normalizeText(course?.title || "");
  return expertiseKeys.some((expertise) => {
    if (!expertise) return false;
    return courseText.includes(expertise) || expertise.includes(titleText);
  });
}

export function getLecturerAutoPilotCapacity(lecturer, useAvailabilityFallback = false) {
  const currentLoad = Array.isArray(lecturer?.plotted) ? lecturer.plotted.length : 0;
  if (useAvailabilityFallback) return LECTURER_CLASS_LIMIT;
  const availableSlots = Number(lecturer?.available ?? 0);
  return Math.min(LECTURER_CLASS_LIMIT, Math.max(0, currentLoad + (Number.isFinite(availableSlots) ? availableSlots : 0)));
}

export function lecturerHasAutoPilotRisk(lecturer) {
  const rating = clampRating(lecturer?.rating);
  const hasLowRating = rating > 0 && rating <= LOW_RATING_THRESHOLD;
  return Boolean(String(lecturer?.warning_note || "").trim()) || hasLowRating;
}

function getRiskLabel(lecturer) {
  const rating = clampRating(lecturer?.rating);
  if (String(lecturer?.warning_note || "").trim()) return "warning note";
  if (rating > 0 && rating <= LOW_RATING_THRESHOLD) return `${rating}-star rating`;
  return "";
}

function buildAutoPilotCourseSlots(courses, classCounts, lecturers) {
  return courses.flatMap((course) => Array.from({ length: toClassCount(classCounts[course.code]) }, (_, index) => ({ course, index }))).sort((a, b) => {
    const aMatches = lecturers.filter((lecturer) => expertiseMatchesCourse(lecturer, a.course)).length;
    const bMatches = lecturers.filter((lecturer) => expertiseMatchesCourse(lecturer, b.course)).length;
    return aMatches - bMatches || a.course.code.localeCompare(b.course.code) || a.index - b.index;
  });
}

function buildInitialAssignmentMap(lecturers, courses, classCounts, existingAssignmentMap = {}) {
  const lecturerIds = new Set(lecturers.map((lecturer) => lecturer.id));
  return Object.fromEntries(courses.map((course) => {
    const count = toClassCount(classCounts[course.code]);
    const existing = Array.isArray(existingAssignmentMap[course.code]) ? existingAssignmentMap[course.code] : [];
    return [course.code, Array.from({ length: count }, (_, index) => {
      const lecturerId = String(existing[index] || "");
      return !lecturerId || lecturerIds.has(lecturerId) ? lecturerId : "";
    })];
  }));
}

function countLecturerAssignments(assignmentMap = {}, lecturerId) {
  if (!lecturerId) return 0;
  return Object.values(assignmentMap).reduce((sum, ids) => sum + (Array.isArray(ids) ? ids.filter((id) => id === lecturerId).length : 0), 0);
}

function calculateAutoPilotMetrics(lecturers, courses, assignmentMap, preservedAssignmentMap, assignmentExplanations) {
  const plannedCount = courses.reduce((sum, course) => sum + (assignmentMap[course.code] || []).length, 0);
  const assignedCount = courses.reduce((sum, course) => sum + (assignmentMap[course.code] || []).filter(Boolean).length, 0);
  const lecturerLoads = lecturers.map((lecturer) => ({
    id: lecturer.id,
    name: lecturer.name,
    load: countLecturerAssignments(assignmentMap, lecturer.id),
    rating: clampRating(lecturer.rating),
    warningNote: String(lecturer.warning_note || "").trim(),
  }));
  const averageLoad = lecturerLoads.length ? lecturerLoads.reduce((sum, item) => sum + item.load, 0) / lecturerLoads.length : 0;
  const loadSpread = lecturerLoads.length ? Math.max(...lecturerLoads.map((item) => item.load)) - Math.min(...lecturerLoads.map((item) => item.load)) : 0;
  const loadStdDev = lecturerLoads.length ? Math.sqrt(lecturerLoads.reduce((sum, item) => sum + (item.load - averageLoad) ** 2, 0) / lecturerLoads.length) : 0;
  const loadDistribution = Array.from({ length: LECTURER_CLASS_LIMIT + 1 }, (_, load) => ({
    load,
    count: lecturerLoads.filter((item) => item.load === load).length,
  }));
  const overLimitLecturers = lecturerLoads.filter((item) => item.load > LECTURER_CLASS_LIMIT);

  const lecturerById = new Map(lecturers.map((lecturer) => [lecturer.id, lecturer]));
  const expertiseMatchCount = courses.reduce((sum, course) => sum + (assignmentMap[course.code] || []).filter((id) => {
    const lecturer = lecturerById.get(id);
    return lecturer && expertiseMatchesCourse(lecturer, course);
  }).length, 0);
  const warningAssignmentCount = courses.reduce((sum, course) => sum + (assignmentMap[course.code] || []).filter((id) => String(lecturerById.get(id)?.warning_note || "").trim()).length, 0);
  const lowRatingAssignmentCount = courses.reduce((sum, course) => sum + (assignmentMap[course.code] || []).filter((id) => {
    const rating = clampRating(lecturerById.get(id)?.rating);
    return rating > 0 && rating <= LOW_RATING_THRESHOLD;
  }).length, 0);
  const unratedAssignmentCount = courses.reduce((sum, course) => sum + (assignmentMap[course.code] || []).filter((id) => id && !clampRating(lecturerById.get(id)?.rating)).length, 0);
  const preservedCount = courses.reduce((sum, course) => sum + (preservedAssignmentMap[course.code] || []).filter(Boolean).length, 0);

  return {
    assignedCount,
    plannedCount,
    unassignedCount: Math.max(0, plannedCount - assignedCount),
    newlyAssignedCount: assignmentExplanations.length,
    preservedCount,
    expertiseMatchCount,
    expertiseMatchRate: assignedCount ? Math.round((expertiseMatchCount / assignedCount) * 100) : 0,
    warningAssignmentCount,
    lowRatingAssignmentCount,
    unratedAssignmentCount,
    averageLoad,
    loadSpread,
    loadStdDev,
    loadDistribution,
    overLimitLecturers,
    lecturerLoads,
  };
}

export function buildAutoPilotPlotting(lecturers, courses, classCounts, existingAssignmentMap = {}) {
  const plannedCourses = courses.filter((course) => toClassCount(classCounts[course.code]) > 0);
  const assignmentMap = buildInitialAssignmentMap(lecturers, courses, classCounts, existingAssignmentMap);
  const preservedAssignmentMap = Object.fromEntries(Object.entries(assignmentMap).map(([code, ids]) => [code, [...ids]]));
  const slots = buildAutoPilotCourseSlots(plannedCourses, classCounts, lecturers).filter((slot) => !assignmentMap[slot.course.code]?.[slot.index]);
  const hasPositiveAvailabilityData = lecturers.some((lecturer) => Number(lecturer?.available || 0) > 0);
  const useAvailabilityFallback = Boolean(slots.length && lecturers.length && !hasPositiveAvailabilityData);
  const assignmentExplanations = [];
  const conflictWarningSet = new Set();
  const states = lecturers.map((lecturer) => {
    const assigned = countLecturerAssignments(assignmentMap, lecturer.id);
    return {
      lecturer,
      assigned,
      capacity: getLecturerAutoPilotCapacity(lecturer, useAvailabilityFallback),
      rating: clampRating(lecturer.rating),
      restricted: lecturerHasAutoPilotRisk(lecturer),
    };
  });

  states
    .filter((state) => state.assigned > state.capacity)
    .forEach((state) => conflictWarningSet.add(`${state.lecturer.name} already has ${state.assigned} preserved assignment(s), above the ${LECTURER_CLASS_LIMIT}-class cap.`));

  const scoreCandidate = (state, course) => {
    const expertiseScore = expertiseMatchesCourse(state.lecturer, course) ? 120 : 0;
    const ratingScore = state.rating ? state.rating * 12 : 18;
    const remainingCapacity = Math.max(0, state.capacity - state.assigned);
    const currentCourseCount = (assignmentMap[course.code] || []).filter((id) => id === state.lecturer.id).length;
    const warningPenalty = String(state.lecturer.warning_note || "").trim() ? 35 : 0;
    const lowRatingPenalty = state.rating > 0 && state.rating <= LOW_RATING_THRESHOLD ? 40 : 0;
    return expertiseScore + ratingScore + remainingCapacity * 8 + state.capacity * 2 - state.assigned * 30 - currentCourseCount * 14 - warningPenalty - lowRatingPenalty;
  };

  const chooseCandidate = (course, targetLimit, includeRestricted) => {
    return states
      .filter((state) => state.capacity > 0 && state.assigned < state.capacity && state.assigned < targetLimit && (includeRestricted || !state.restricted))
      .map((state) => ({ state, score: scoreCandidate(state, course) }))
      .sort((a, b) => b.score - a.score || a.state.assigned - b.state.assigned || b.state.rating - a.state.rating || a.state.lecturer.name.localeCompare(b.state.lecturer.name))[0]?.state || null;
  };

  const assignSlot = (slot, state, phaseLabel) => {
    if (!state) return false;
    const expertiseMatched = expertiseMatchesCourse(state.lecturer, slot.course);
    const priorCourseCount = (assignmentMap[slot.course.code] || []).filter((id) => id === state.lecturer.id).length;
    const warningNote = String(state.lecturer.warning_note || "").trim();
    const riskLabel = getRiskLabel(state.lecturer);
    const warnings = [];
    if (!expertiseMatched) {
      warnings.push("No listed expertise match");
      conflictWarningSet.add(`${slot.course.code}.${slot.index + 1} was assigned outside listed expertise to ${state.lecturer.name}.`);
    }
    if (!state.rating) {
      warnings.push("No performance rating recorded");
      conflictWarningSet.add(`${state.lecturer.name} has no performance rating; confirm suitability for ${slot.course.code}.${slot.index + 1}.`);
    }
    if (state.rating > 0 && state.rating <= LOW_RATING_THRESHOLD) {
      warnings.push(`${state.rating}-star rating used after eligible pass`);
      conflictWarningSet.add(`${state.lecturer.name} has a ${state.rating}-star rating and was used only after eligible lecturers were considered.`);
    }
    if (warningNote) {
      warnings.push(`Warning note: ${warningNote}`);
      conflictWarningSet.add(`${state.lecturer.name} has a warning note and was used only after eligible lecturers were considered.`);
    }
    if (state.assigned + 1 >= state.capacity && state.capacity > 0) warnings.push("Lecturer reaches available/capacity limit");
    assignmentMap[slot.course.code][slot.index] = state.lecturer.id;
    assignmentExplanations.push({
      id: `${slot.course.code}.${slot.index + 1}`,
      courseCode: slot.course.code,
      courseTitle: slot.course.title,
      className: `${slot.course.code}.${slot.index + 1}`,
      lecturerId: state.lecturer.id,
      lecturerName: state.lecturer.name,
      reasons: [
        expertiseMatched ? "Expertise matches the course." : "Selected by rating, availability, and workload because no expertise match was available.",
        state.rating ? `${state.rating}-star performance rating.` : "No performance rating recorded.",
        `Capacity after assignment: ${state.assigned + 1}/${state.capacity}.`,
        priorCourseCount ? `Already had ${priorCourseCount} class(es) for this course.` : "No duplicate class for this course before assignment.",
        riskLabel ? `Risk label: ${riskLabel}.` : "No warning note or low-rating risk.",
        phaseLabel,
      ],
      warnings,
    });
    state.assigned += 1;
    return true;
  };

  [1, EQUAL_DISTRIBUTION_TARGET].forEach((targetLimit) => {
    slots.forEach((slot) => {
      if (assignmentMap[slot.course.code][slot.index]) return;
      assignSlot(slot, chooseCandidate(slot.course, targetLimit, false), `Equal distribution pass for up to ${targetLimit} class(es), excluding warning notes and 1-2 star ratings.`);
    });
  });

  [3, LECTURER_CLASS_LIMIT].forEach((targetLimit) => {
    slots.forEach((slot) => {
      if (assignmentMap[slot.course.code][slot.index]) return;
      assignSlot(slot, chooseCandidate(slot.course, targetLimit, true), `Additional distribution pass for up to ${targetLimit} class(es), using full scoring rules.`);
    });
  });

  const metrics = calculateAutoPilotMetrics(lecturers, courses, assignmentMap, preservedAssignmentMap, assignmentExplanations);
  const eligibleFirstPass = states.filter((state) => state.capacity > 0 && !state.restricted).length;
  const restrictedLecturers = states.filter((state) => state.restricted);
  const fullLecturers = states.filter((state) => state.assigned >= state.capacity && state.capacity > 0);
  const unassignedByCourse = plannedCourses
    .map((course) => ({ course, count: (assignmentMap[course.code] || []).filter((id) => !id).length }))
    .filter((item) => item.count > 0);

  const reviewNotes = [
    `Auto-pilot preserved ${metrics.preservedCount} existing assignment(s) and filled ${metrics.newlyAssignedCount} open class slot(s).`,
    useAvailabilityFallback ? AUTO_PILOT_AVAILABILITY_FALLBACK_NOTE : "",
    `Total result: ${metrics.assignedCount} of ${metrics.plannedCount} planned classes assigned with a ${LECTURER_CLASS_LIMIT}-class lecturer cap.`,
    `First pass prioritized ${eligibleFirstPass} lecturers for up to ${EQUAL_DISTRIBUTION_TARGET} classes each, excluding lecturers with warning notes or 1-2 star ratings.`,
    `Expertise matched ${metrics.expertiseMatchCount} assigned ${metrics.expertiseMatchCount === 1 ? "class" : "classes"} (${metrics.expertiseMatchRate}%); remaining choices used rating, available capacity, and current plotted load.`,
  ].filter(Boolean);
  if (restrictedLecturers.length) reviewNotes.push(`${restrictedLecturers.length} lecturer(s) with warning notes or 1-2 star ratings were deprioritized for the first ${EQUAL_DISTRIBUTION_TARGET} classes: ${restrictedLecturers.map((state) => state.lecturer.name).join(", ")}.`);
  if (fullLecturers.length) reviewNotes.push(`${fullLecturers.length} lecturer(s) reached their available/capacity limit: ${fullLecturers.map((state) => `${state.lecturer.name} (${state.assigned}/${state.capacity})`).join(", ")}.`);
  if (unassignedByCourse.length) reviewNotes.push(`Manual review needed for unassigned classes: ${unassignedByCourse.map(({ course, count }) => `${course.code} ${course.title} (${count})`).join("; ")}.`);
  if (!metrics.plannedCount) reviewNotes.push("No planned classes were found. Set planned class counts before running auto-pilot.");
  unassignedByCourse.forEach(({ course, count }) => conflictWarningSet.add(`${course.code} ${course.title} still has ${count} unassigned planned class(es).`));
  metrics.overLimitLecturers.forEach((item) => conflictWarningSet.add(`${item.name} has ${item.load} assignment(s), above the ${LECTURER_CLASS_LIMIT}-class cap.`));

  return {
    assignmentMap,
    reviewNotes,
    conflictWarnings: Array.from(conflictWarningSet),
    assignmentExplanations,
    assignedCount: metrics.assignedCount,
    plannedCount: metrics.plannedCount,
    metrics,
  };
}
