import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart as RePieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

function IconBase({ children, className = "h-5 w-5", ...props }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true" {...props}>{children}</svg>;
}

const Icons = {
  book: (p) => <IconBase {...p}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5z" /></IconBase>,
  calendar: (p) => <IconBase {...p}><path d="M8 2v4M16 2v4M3 10h18" /><rect x="3" y="4" width="18" height="18" rx="2" /></IconBase>,
  chevronDown: (p) => <IconBase {...p}><path d="m6 9 6 6 6-6" /></IconBase>,
  download: (p) => <IconBase {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M7 10l5 5 5-5" /><path d="M12 15V3" /></IconBase>,
  edit: (p) => <IconBase {...p}><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></IconBase>,
  eye: (p) => <IconBase {...p}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></IconBase>,
  file: (p) => <IconBase {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6" /><path d="M8 13h8M8 17h8" /></IconBase>,
  graduation: (p) => <IconBase {...p}><path d="m22 10-10-5-10 5 10 5 10-5Z" /><path d="M6 12v5c3 2 9 2 12 0v-5" /><path d="M22 10v6" /></IconBase>,
  dashboard: (p) => <IconBase {...p}><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /></IconBase>,
  logout: (p) => <IconBase {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="M16 17l5-5-5-5" /><path d="M21 12H9" /></IconBase>,
  menu: (p) => <IconBase {...p}><path d="M4 6h16M4 12h16M4 18h16" /></IconBase>,
  plus: (p) => <IconBase {...p}><path d="M12 5v14M5 12h14" /></IconBase>,
  search: (p) => <IconBase {...p}><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></IconBase>,
  star: (p) => <IconBase {...p}><path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8-6.2-3.3-6.2 3.3 1.2-6.8-5-4.9 6.9-1L12 2Z" /></IconBase>,
  trash: (p) => <IconBase {...p}><path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /></IconBase>,
  users: (p) => <IconBase {...p}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></IconBase>,
  warning: (p) => <IconBase {...p}><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" /><path d="M12 9v4M12 17h.01" /></IconBase>,
  x: (p) => <IconBase {...p}><path d="M18 6 6 18M6 6l12 12" /></IconBase>,
  chart: (p) => <IconBase {...p}><path d="M3 3v18h18" /><rect x="7" y="12" width="3" height="5" /><rect x="12" y="8" width="3" height="9" /><rect x="17" y="5" width="3" height="12" /></IconBase>,
  check: (p) => <IconBase {...p}><circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-5" /></IconBase>,
};

const department = { name: "UT English Dept.", email: "sastra.inggris@ecampus.ut.ac.id", subtitle: "Lecturer Admin" };
const TUTOR_DATA_FORM_URL = "https://sl.ut.ac.id/kepakaran_sasing";
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
const USE_SUPABASE = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
const DEMO_ACCOUNT = { email: "demo@englishdept.test", password: "Demo@12345" };

const nav = [
  { id: "dashboard", label: "Dashboard", icon: Icons.dashboard }, { id: "lecturers", label: "Lecturers", icon: Icons.users },
  { id: "plotting", label: "Plotting", icon: Icons.file }, { id: "courses", label: "Courses", icon: Icons.book },
  { id: "terms", label: "Terms", icon: Icons.calendar },
];
const dashboardPalette = ["#005baa", "#ffd23f", "#3d8bd6", "#f4b000", "#8fbbe8"];
const DEFAULT_DEGREE_OPTIONS = ["M.A.", "M.Ed.", "Ph.D."];
const DEFAULT_EXPERTISE_OPTIONS = [];
let lecturerFormExpertiseOptions = DEFAULT_EXPERTISE_OPTIONS;

const uniq = (items) => [...new Set(items.filter(Boolean))];
const includes = (value, query) => String(value || "").toLowerCase().includes(String(query || "").toLowerCase());
const lookupKey = (value) => String(value || "").trim().toLowerCase();
const compactLookupKey = (value) => lookupKey(value).replace(/[\s_-]+/g, "");
const findLecturerById = (lecturers, id) => {
  const normalizedId = lookupKey(id);
  const compactId = compactLookupKey(id);
  if (!normalizedId) return null;
  return lecturers.find((lecturer) => lookupKey(lecturer.id) === normalizedId || compactLookupKey(lecturer.id) === compactId) || null;
};
const courseTitleByCode = (courses, code) => courses.find((course) => course.code === code)?.title || code;
const plottedCourseTitles = (lecturer, courses) => lecturer.plotted.map((code) => courseTitleByCode(courses, code));
const plottedCourseCountLabel = (count) => `${count} plotted ${count === 1 ? "course" : "courses"}`;
const termPlottingId = (termCode, lecturerId) => `${termCode}::${lecturerId}`;
const MAX_CLASS_ASSIGNMENTS_PER_COURSE = 99;
const LECTURER_CLASS_LIMIT = 4;
const COURSE_CLASS_PLANS_STORAGE_KEY = "ut_course_class_plans";

const DEMO_COURSES = [
  { code: "BING4110", title: "Basic Reading", credits: 3 },
  { code: "BING4211", title: "Intermediate Writing", credits: 3 },
  { code: "BING4312", title: "English Linguistics", credits: 3 },
  { code: "BING4413", title: "Translation Studies", credits: 3 },
  { code: "BING4514", title: "Indonesian Linguistics", credits: 3 },
  { code: "BING4615", title: "Literary Studies", credits: 3 },
];
const DEMO_LECTURERS = [
  { id: "D001", degree: "Ph.D.", name: "Alya Prameswari", email: "alya.demo@example.com", phone: "0812-0000-1001", expertise: ["English Linguistics", "English Language Teaching"], plotted: [], available: 4, rating: 5, warning_note: "" },
  { id: "D002", degree: "M.Ed.", name: "Bagus Santoso", email: "bagus.demo@example.com", phone: "0812-0000-1002", expertise: ["English Language Teaching"], plotted: ["BING4110"], available: 3, rating: 4, warning_note: "" },
  { id: "D003", degree: "M.A.", name: "Citra Dewi", email: "citra.demo@example.com", phone: "0812-0000-1003", expertise: ["Translation Studies", "English Linguistics"], plotted: ["BING4413", "BING4211"], available: 2, rating: 4, warning_note: "" },
  { id: "D004", degree: "Ph.D.", name: "Damar Nugroho", email: "damar.demo@example.com", phone: "0812-0000-1004", expertise: ["Literary Studies"], plotted: ["BING4615"], available: 3, rating: 5, warning_note: "" },
  { id: "D005", degree: "M.Ed.", name: "Eka Rahmawati", email: "eka.demo@example.com", phone: "0812-0000-1005", expertise: ["English Language Teaching", "Literary Studies"], plotted: ["BING4110", "BING4211", "BING4312"], available: 1, rating: 3, warning_note: "Needs coordination follow-up before extra classes." },
  { id: "D006", degree: "M.A.", name: "Farhan Wijaya", email: "farhan.demo@example.com", phone: "0812-0000-1006", expertise: ["Indonesian Linguistics", "Translation Studies"], plotted: [], available: 4, rating: 0, warning_note: "" },
  { id: "D007", degree: "Ph.D.", name: "Gita Larasati", email: "gita.demo@example.com", phone: "0812-0000-1007", expertise: ["Indonesian Linguistics", "English Linguistics"], plotted: ["BING4514", "BING4312", "BING4413", "BING4615"], available: 0, rating: 5, warning_note: "" },
  { id: "D008", degree: "M.Ed.", name: "Hendra Saputra", email: "hendra.demo@example.com", phone: "0812-0000-1008", expertise: ["English Language Teaching", "Translation Studies"], plotted: ["BING4110", "BING4211"], available: 2, rating: 4, warning_note: "" },
];
const DEMO_TERMS = [
  { code: "DEMO-2026-1", name: "Demo Term 2026 - Semester 1", ay: "2026/2027", semester: "Semester 1", active: true },
  { code: "DEMO-2025-2", name: "Demo Term 2025 - Semester 2", ay: "2025/2026", semester: "Semester 2", active: false },
];
const DEMO_TERM_PLOTTINGS = DEMO_LECTURERS.map((lecturer) => buildDemoTermPlotting("DEMO-2026-1", lecturer)).concat([
  buildDemoTermPlotting("DEMO-2025-2", { ...DEMO_LECTURERS[0], plotted: ["BING4110", "BING4312"], available: 2 }),
  buildDemoTermPlotting("DEMO-2025-2", { ...DEMO_LECTURERS[2], plotted: ["BING4413"], available: 3 }),
  buildDemoTermPlotting("DEMO-2025-2", { ...DEMO_LECTURERS[4], plotted: ["BING4211", "BING4615"], available: 2 }),
]);
const DEMO_COURSE_CLASS_PLANS = {
  "DEMO-2026-1": {
    counts: { BING4110: 3, BING4211: 3, BING4312: 2, BING4413: 2, BING4514: 1, BING4615: 2 },
    assignments: {
      BING4110: ["D002", "D005", "D008"],
      BING4211: ["D003", "D005", "D008"],
      BING4312: ["D005", "D007"],
      BING4413: ["D003", "D007"],
      BING4514: ["D007"],
      BING4615: ["D004", "D007"],
    },
  },
  "DEMO-2025-2": {
    counts: { BING4110: 1, BING4211: 1, BING4312: 1, BING4413: 1, BING4615: 1 },
    assignments: { BING4110: ["D001"], BING4211: ["D005"], BING4312: ["D001"], BING4413: ["D003"], BING4615: ["D005"] },
  },
};

function buildDemoTermPlotting(termCode, lecturer) {
  return {
    id: `${termCode}::${lecturer.id}`,
    term_code: termCode,
    lecturer_id: lecturer.id,
    plotted: Array.isArray(lecturer.plotted) ? lecturer.plotted : [],
    available: Number(lecturer.available ?? 0),
  };
}

function cloneDemoSnapshot() {
  return {
    lecturers: DEMO_LECTURERS.map(normalizeLecturer),
    courses: DEMO_COURSES.map((course) => ({ ...course })),
    terms: DEMO_TERMS.map((term) => ({ ...term })),
    termPlottings: DEMO_TERM_PLOTTINGS.map(normalizeTermPlotting),
  };
}

function cloneDemoCourseClassPlans() {
  return JSON.parse(JSON.stringify(DEMO_COURSE_CLASS_PLANS));
}

function toClassCount(value) {
  const count = Number(value);
  if (!Number.isFinite(count)) return 0;
  return Math.min(MAX_CLASS_ASSIGNMENTS_PER_COURSE, Math.max(0, Math.floor(count)));
}

function getPlottedCourseCounts(plotted = []) {
  return Object.entries(plotted.reduce((acc, code) => {
    acc[code] = (acc[code] || 0) + 1;
    return acc;
  }, {})).map(([code, count]) => ({ code, count }));
}

function PlottedCourseBadges({ plotted, courses }) {
  return getPlottedCourseCounts(plotted).map(({ code, count }) => <Badge key={code} tone="slate">{courseTitleByCode(courses, code)}{count > 1 ? ` x${count}` : ""}</Badge>);
}

function getStoredCourseClassPlans() {
  if (typeof localStorage === "undefined") return {};
  try {
    const parsed = JSON.parse(localStorage.getItem(COURSE_CLASS_PLANS_STORAGE_KEY) || "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function getCourseClassPlan(courseClassPlans, termCode) {
  const plan = courseClassPlans?.[termCode] || {};
  const counts = plan.counts && typeof plan.counts === "object" ? plan.counts : plan;
  return Object.fromEntries(Object.entries(counts).filter(([code]) => code !== "assignments").map(([code, count]) => [code, toClassCount(count)]));
}

function getCoursePlanParts(courseClassPlans, termCode) {
  const current = courseClassPlans?.[termCode] || {};
  return {
    counts: current.counts && typeof current.counts === "object" ? current.counts : Object.fromEntries(Object.entries(current).filter(([key]) => key !== "assignments")),
    assignments: current.assignments && typeof current.assignments === "object" ? current.assignments : {},
  };
}

function countAssignmentsByCourse(lecturers, courses) {
  const courseCodes = new Set(courses.map((course) => course.code));
  return lecturers.reduce((acc, lecturer) => {
    lecturer.plotted.filter((code) => courseCodes.has(code)).forEach((code) => {
      acc[code] = (acc[code] || 0) + 1;
    });
    return acc;
  }, {});
}

function getCourseClassCounts(lecturers, courses, plannedCounts = {}, assignmentMap = null) {
  const assignedCounts = countAssignmentsByCourse(lecturers, courses);
  return Object.fromEntries(courses.map((course) => [course.code, Math.max(toClassCount(plannedCounts[course.code]), assignedCounts[course.code] || 0, assignmentMap?.[course.code]?.length || 0)]));
}

function getCourseAssignmentMap(lecturers, courses) {
  const assignments = Object.fromEntries(courses.map((course) => [course.code, []]));
  lecturers.forEach((lecturer) => {
    lecturer.plotted.forEach((code) => {
      if (assignments[code]) assignments[code].push(lecturer.id);
    });
  });
  return assignments;
}

function countLecturerAssignments(assignmentMap = {}, lecturerId) {
  if (!lecturerId) return 0;
  return Object.values(assignmentMap).reduce((sum, ids) => sum + (Array.isArray(ids) ? ids.filter((id) => id === lecturerId).length : 0), 0);
}

function limitAssignmentMapByLecturer(assignmentMap = {}) {
  const lecturerCounts = {};
  return Object.fromEntries(Object.entries(assignmentMap).map(([courseCode, ids]) => [courseCode, (Array.isArray(ids) ? ids : []).map((lecturerId) => {
    if (!lecturerId) return "";
    lecturerCounts[lecturerId] = lecturerCounts[lecturerId] || 0;
    if (lecturerCounts[lecturerId] >= LECTURER_CLASS_LIMIT) return "";
    lecturerCounts[lecturerId] += 1;
    return lecturerId;
  })]));
}

function mergeAssignmentMapWithLecturerLimit(baseAssignmentMap = {}, incomingAssignmentMap = {}) {
  const incomingCourseCodes = new Set(Object.keys(incomingAssignmentMap));
  const lecturerCounts = {};
  Object.entries(baseAssignmentMap).forEach(([courseCode, ids]) => {
    if (incomingCourseCodes.has(courseCode)) return;
    (Array.isArray(ids) ? ids : []).forEach((lecturerId) => {
      if (lecturerId) lecturerCounts[lecturerId] = (lecturerCounts[lecturerId] || 0) + 1;
    });
  });
  const limitedIncoming = Object.fromEntries(Object.entries(incomingAssignmentMap).map(([courseCode, ids]) => [courseCode, (Array.isArray(ids) ? ids : []).map((lecturerId) => {
    if (!lecturerId) return "";
    lecturerCounts[lecturerId] = lecturerCounts[lecturerId] || 0;
    if (lecturerCounts[lecturerId] >= LECTURER_CLASS_LIMIT) return "";
    lecturerCounts[lecturerId] += 1;
    return lecturerId;
  })]));
  return { ...baseAssignmentMap, ...limitedIncoming };
}

function getCourseClassAssignmentPlan(courseClassPlans, termCode, lecturers, courses) {
  const plan = courseClassPlans?.[termCode] || {};
  const storedAssignments = plan.assignments && typeof plan.assignments === "object" ? plan.assignments : {};
  const fallbackAssignments = getCourseAssignmentMap(lecturers, courses);
  const lecturerIds = new Set(lecturers.map((lecturer) => lecturer.id));
  return Object.fromEntries(courses.map((course) => {
    const stored = Array.isArray(storedAssignments[course.code]) ? storedAssignments[course.code].map((id) => String(id || "")).filter((id) => !id || lecturerIds.has(id)) : null;
    return [course.code, stored?.some(Boolean) ? stored : fallbackAssignments[course.code] || stored || []];
  }));
}

function applyCourseAssignmentsToLecturers(lecturers, courses, assignmentMap) {
  const courseCodes = new Set(courses.map((course) => course.code));
  const plottedByLecturer = new Map(lecturers.map((lecturer) => [lecturer.id, lecturer.plotted.filter((code) => !courseCodes.has(code))]));
  courses.forEach((course) => {
    (assignmentMap[course.code] || []).forEach((lecturerId) => {
      if (!lecturerId || !plottedByLecturer.has(lecturerId)) return;
      plottedByLecturer.get(lecturerId).push(course.code);
    });
  });
  return lecturers.map((lecturer) => ({ ...lecturer, plotted: plottedByLecturer.get(lecturer.id) || [] }));
}

function expertiseMatchesCourse(lecturer, course) {
  const courseText = `${course.code} ${course.title}`.toLowerCase();
  return lecturer.expertise.some((item) => {
    const expertise = String(item || "").trim().toLowerCase();
    return expertise && (courseText.includes(expertise) || expertise.includes(course.title.toLowerCase()));
  });
}

function buildPlottingExportRows(lecturers, courses, plannedCounts = {}, assignmentMap = null) {
  const assignments = assignmentMap || getCourseAssignmentMap(lecturers, courses);
  const counts = getCourseClassCounts(lecturers, courses, plannedCounts, assignments);
  const lecturersById = new Map(lecturers.map((lecturer) => [lecturer.id, lecturer]));
  return courses.flatMap((course) => Array.from({ length: counts[course.code] || 0 }, (_, index) => {
    const lecturer = lecturersById.get(assignments[course.code]?.[index]);
    return {
      "": "",
      Idtutor: lecturer?.id || "",
      Nama: lecturer?.name || "",
      Kelas: `${course.code}.${index + 1}`,
      "Nama MK": course.title,
    };
  }));
}

function getCourseCodeFromClass(value) {
  return String(value || "").trim().split(".")[0];
}

function mapImportedPlottingRows(rows, lecturers, courses) {
  const lecturerIds = new Set(lecturers.map((lecturer) => lecturer.id));
  const lecturersByName = new Map(lecturers.map((lecturer) => [lecturer.name.toLowerCase(), lecturer]));
  const coursesByCode = new Map(courses.map((course) => [course.code, course]));
  const coursesByTitle = new Map(courses.map((course) => [course.title.toLowerCase(), course]));
  const assignments = {};
  const counts = {};
  const ignored = { courses: new Set(), lecturers: new Set() };

	  rows.filter((row) => !isImportRowBlank(row)).forEach((row) => {
	    const className = String(getImportedValue(row, ["Kelas", "Class"])).trim();
	    const importedCourseCode = String(getImportedValue(row, ["Course_Code", "Course Code", "CourseCode", "Code", "Course"])).trim();
	    const courseName = String(getImportedValue(row, ["Nama MK", "Course Name", "Course Title", "Course"])).trim();
	    const importedLecturerId = String(getImportedValue(row, ["Idtutor", "Lecturer_ID", "Lecturer ID", "ID"])).trim();
	    const lecturerName = String(getImportedValue(row, ["Nama", "Name", "Full Name"])).trim();
	    const lecturerId = lecturerIds.has(importedLecturerId) ? importedLecturerId : lecturersByName.get(lecturerName.toLowerCase())?.id || importedLecturerId;
	    const courseCode = getCourseCodeFromClass(className) || importedCourseCode;
	    const course = coursesByCode.get(courseCode) || coursesByCode.get(courseName) || coursesByTitle.get(courseName.toLowerCase());
    if (!course) {
      ignored.courses.add(courseCode || courseName || "blank course");
      return;
    }
    if (lecturerId && !lecturerIds.has(lecturerId)) {
      ignored.lecturers.add(lecturerId);
      return;
    }
    const classNumber = Number(className.split(".")[1]);
    const index = Number.isFinite(classNumber) && classNumber > 0 ? Math.floor(classNumber) - 1 : (assignments[course.code] || []).length;
    assignments[course.code] = assignments[course.code] || [];
    assignments[course.code][index] = lecturerId;
    counts[course.code] = Math.max(counts[course.code] || 0, index + 1);
  });

  return {
    assignments: Object.fromEntries(Object.entries(assignments).map(([code, ids]) => [code, Array.from({ length: counts[code] || ids.length }, (_, index) => ids[index] || "")])),
    counts,
    ignoredCourses: Array.from(ignored.courses),
    ignoredLecturers: Array.from(ignored.lecturers),
  };
}

function normalizeLecturer(row) {
  return {
    id: String(row.id || "").trim(),
    degree: String(row.degree || "").trim(),
    name: String(row.name || "").trim(),
    email: String(row.email || "").trim(),
    phone: String(row.phone || "").trim(),
    expertise: Array.isArray(row.expertise) ? row.expertise : [],
    plotted: Array.isArray(row.plotted) ? row.plotted : [],
    available: Number(row.available ?? 0),
    rating: clampRating(row.rating),
    warning_note: String(row.warning_note || row.warningNote || "").trim(),
  };
}

function mergeImportedLecturer(existing = {}, imported = {}) {
  return normalizeLecturer({
    ...existing,
    id: imported.id || existing.id,
    degree: imported.degree || existing.degree,
    name: imported.name || existing.name,
    email: imported.email || existing.email,
    phone: imported.phone || existing.phone,
    expertise: imported.expertise?.length ? imported.expertise : existing.expertise,
    plotted: imported.plotted?.length ? imported.plotted : existing.plotted,
    available: imported._hasImportedAvailable ? imported.available : existing.available ?? imported.available,
    rating: imported._hasImportedRating ? imported.rating : existing.rating ?? imported.rating,
    warning_note: imported._hasImportedWarningNote ? imported.warning_note : existing.warning_note ?? imported.warning_note,
  });
}

function dedupeImportedLecturers(items) {
  const byId = new Map();
  items.forEach((item) => {
    const existing = byId.get(item.id);
    if (!existing) {
      byId.set(item.id, item);
      return;
    }
    const merged = normalizeLecturer({
      ...existing,
      degree: item.degree || existing.degree,
      name: item.name || existing.name,
      email: item.email || existing.email,
      phone: item.phone || existing.phone,
      expertise: uniq([...(existing.expertise || []), ...(item.expertise || [])]),
      plotted: uniq([...(existing.plotted || []), ...(item.plotted || [])]),
      available: item._hasImportedAvailable ? item.available : existing.available,
      rating: item._hasImportedRating ? item.rating : existing.rating,
      warning_note: item._hasImportedWarningNote ? item.warning_note : existing.warning_note,
    });
    byId.set(item.id, { ...merged, _hasImportedAvailable: existing._hasImportedAvailable || item._hasImportedAvailable, _hasImportedRating: existing._hasImportedRating || item._hasImportedRating, _hasImportedWarningNote: existing._hasImportedWarningNote || item._hasImportedWarningNote });
  });
  return Array.from(byId.values());
}

function normalizeTermPlotting(row) {
  return {
    id: row.id || termPlottingId(row.term_code, row.lecturer_id),
    term_code: row.term_code,
    lecturer_id: row.lecturer_id,
    plotted: Array.isArray(row.plotted) ? row.plotted : [],
    available: Number(row.available ?? 0),
  };
}

function buildTermPlottingRow(termCode, lecturer) {
  return {
    id: termPlottingId(termCode, lecturer.id),
    term_code: termCode,
    lecturer_id: lecturer.id,
    plotted: Array.isArray(lecturer.plotted) ? lecturer.plotted : [],
    available: Number(lecturer.available ?? 0),
  };
}

function getTermScopedLecturers(lecturers, termPlottings, termCode) {
  const rows = new Map(termPlottings.filter((row) => row.term_code === termCode).map((row) => [row.lecturer_id, row]));
  return lecturers.map((lecturer) => {
    const termRow = rows.get(lecturer.id);
    return {
      ...lecturer,
      plotted: termRow?.plotted || [],
      available: Number(termRow?.available ?? 0),
    };
  });
}

function availabilityTone(value) {
  const n = Number(value);
  if (n <= 0) return "red";
  if (n === 1) return "orange";
  if (n === 2) return "amber";
  if (n === 3) return "blue";
  return "green";
}

function clampRating(value) {
  const rating = Number(value);
  if (!Number.isFinite(rating)) return 0;
  return Math.min(5, Math.max(0, Math.round(rating)));
}

function serializeLecturersForDatabase(lecturers, includeLabels = false) {
  return lecturers.map((lecturer) => {
    const row = { ...lecturer };
    if (!includeLabels) {
      delete row.rating;
      delete row.warning_note;
    }
    return row;
  });
}

function buildLecturerExportRows(lecturers, courses) {
  return lecturers.map((lecturer) => ({
    Lecturer_ID: lecturer.id,
    Name: lecturer.name,
    Degree: lecturer.degree,
    Email: lecturer.email,
    Phone: lecturer.phone,
    Rating: lecturer.rating,
    Warning_Note: lecturer.warning_note,
    Expertise: lecturer.expertise.join("; "),
    Plotted_Course_Codes: lecturer.plotted.join("; "),
    Plotted_Course_Names: plottedCourseTitles(lecturer, courses).join("; "),
    Available_Slots: lecturer.available,
  }));
}

function getPlottedCountData(lecturers) {
  return Object.entries(lecturers.reduce((acc, lecturer) => {
    const label = plottedCourseCountLabel(lecturer.plotted.length);
    acc[label] = (acc[label] || 0) + 1;
    return acc;
  }, {})).map(([name, value]) => ({ name, value }));
}

function runTests() {
  const testCourses = [
    { code: "COURSE101", title: "Basic Reading", credits: 3 },
    { code: "COURSE102", title: "Academic Writing", credits: 3 },
  ];
  const testLecturers = [
    { id: "LECT001", degree: "M.A.", name: "Test Lecturer", email: "lecturer@example.com", phone: "0800000000", expertise: ["Reading"], plotted: ["COURSE101"], available: 1, rating: 4, warning_note: "" },
    { id: "LECT002", degree: "Ph.D.", name: "Second Lecturer", email: "second@example.com", phone: "0800000001", expertise: ["Writing"], plotted: ["COURSE101", "COURSE102"], available: 4, rating: 3, warning_note: "Needs follow-up" },
  ];
  const testTerms = [
    { code: "TERM001", name: "Active Term", ay: "2025/2026", semester: "Semester 2", active: true },
    { code: "TERM002", name: "Previous Term", ay: "2025/2026", semester: "Semester 1", active: false },
  ];
  console.assert(testCourses.length > 0, "Courses should not be empty");
  console.assert(testLecturers.length > 0, "Lecturers should not be empty");
  console.assert(testTerms.filter((term) => term.active).length === 1, "Exactly one term should be active");
  console.assert(findLecturerById(testLecturers, " lect001 ")?.name === "Test Lecturer", "Public lookup should find a lecturer by ID");
  const courseCodes = new Set(testCourses.map((course) => course.code));
  const missingCodes = testLecturers.flatMap((lecturer) => lecturer.plotted.filter((code) => !courseCodes.has(code)));
  console.assert(missingCodes.length === 0, `Missing course codes: ${missingCodes.join(", ")}`);
  const exportRows = buildLecturerExportRows(testLecturers, testCourses);
  console.assert(exportRows.length === testLecturers.length, "Export row count should match lecturer count");
  console.assert(exportRows[0].Plotted_Course_Names.includes("Basic Reading"), "Export should include plotted course names");
  console.assert(exportRows[1].Rating === 3 && exportRows[1].Warning_Note === "Needs follow-up", "Export should include lecturer labels");
  console.assert(plottedCourseTitles(testLecturers[0], testCourses).includes("Basic Reading"), "Lecturer display should resolve plotted course names");
  console.assert(plottedCourseCountLabel(1) === "1 plotted course", "Singular label should work");
  console.assert(plottedCourseCountLabel(2) === "2 plotted courses", "Plural label should work");
  console.assert(getPlottedCountData(testLecturers).some((item) => item.name === "1 plotted course"), "Dashboard data should include 1 plotted course");
  console.assert(getCourseClassCounts(testLecturers, testCourses, { COURSE101: 3 }).COURSE101 === 3, "Planned class count should override assigned count when larger");
  console.assert(getCourseAssignmentMap(testLecturers, testCourses).COURSE101.length === 2, "Course assignment map should include each assigned class");
  console.assert(expertiseMatchesCourse(testLecturers[0], testCourses[0]), "Expertise should match course title");
  const plottingRows = buildPlottingExportRows(testLecturers, testCourses, { COURSE101: 3 });
  console.assert(plottingRows.length === 4, "Plotting export should include planned classes and existing assignments");
  console.assert(plottingRows[0].Idtutor === "LECT001" && plottingRows[0].Kelas === "COURSE101.1" && plottingRows[0]["Nama MK"] === "Basic Reading", "Plotting export should match the Excel plotting schema");
  console.assert(plottingRows[2].Idtutor === "", "Unassigned planned classes should export as blank lecturer cells");
	  const importedPlotting = mapImportedPlottingRows([{ Idtutor: "LECT002", Nama: "Second Lecturer", Kelas: "COURSE102.1", "Nama MK": "Academic Writing" }], testLecturers, testCourses);
	  console.assert(importedPlotting.counts.COURSE102 === 1, "Plotting import should set class count from Kelas");
	  console.assert(importedPlotting.assignments.COURSE102[0] === "LECT002", "Plotting import should map lecturer ID to class");
	  const simpleImportedPlotting = mapImportedPlottingRows([{ ID: "LECT001", Course_Code: "COURSE101" }], testLecturers, testCourses);
	  console.assert(simpleImportedPlotting.assignments.COURSE101[0] === "LECT001", "Plotting import should support ID and Course_Code only");
  const limitedAssignments = limitAssignmentMapByLecturer({ COURSE101: ["LECT001", "LECT001", "LECT001"], COURSE102: ["LECT001", "LECT001"] });
  console.assert(countLecturerAssignments(limitedAssignments, "LECT001") === LECTURER_CLASS_LIMIT, "Lecturer assignments should be capped at four classes");
  const scopedLecturers = getTermScopedLecturers(testLecturers, [buildTermPlottingRow("TERM002", { ...testLecturers[0], plotted: ["COURSE102"], available: 3 })], "TERM002");
  console.assert(scopedLecturers[0].plotted.includes("COURSE102"), "Term plotting should override lecturer plotting");
  console.assert(scopedLecturers[1].plotted.length === 0, "Missing term plotting should stay empty for a new term");
  console.assert(availabilityTone(0) === "red", "0 available should be red");
  console.assert(availabilityTone(1) === "orange", "1 available should be orange");
	  console.assert(availabilityTone(2) === "amber", "2 available should be yellow/amber");
	  console.assert(availabilityTone(3) === "blue", "3 available should be blue");
	  console.assert(availabilityTone(4) === "green", "4 available should be green");
	  const mergedLecturerImport = mergeImportedLecturer(testLecturers[0], { id: "LECT001", email: "new@example.com", phone: "08123456789", plotted: [], available: 0 });
	  console.assert(mergedLecturerImport.email === "new@example.com" && mergedLecturerImport.phone === "08123456789", "Lecturer import should update completed profile fields");
	  console.assert(mergedLecturerImport.plotted.includes("COURSE101") && mergedLecturerImport.available === 1, "Lecturer import should preserve existing plotting data");
	  const availabilityImport = mergeImportedLecturer(testLecturers[0], { id: "LECT001", available: 3, _hasImportedAvailable: true });
	  console.assert(availabilityImport.available === 3 && availabilityImport.plotted.includes("COURSE101"), "Lecturer import should update availability without changing plotted courses");
  const labelImport = mergeImportedLecturer(testLecturers[0], { id: "LECT001", rating: 5, warning_note: "Review before plotting", _hasImportedRating: true, _hasImportedWarningNote: true });
  console.assert(labelImport.rating === 5 && labelImport.warning_note === "Review before plotting", "Lecturer import should update labels when provided");
  console.assert(!("rating" in serializeLecturersForDatabase(testLecturers, false)[0]) && serializeLecturersForDatabase(testLecturers, true)[0].rating === 4, "Lecturer label sync should be database-compatible");
	  const dedupedImport = dedupeImportedLecturers([{ id: "LECT001", email: "a@example.com", expertise: ["Reading"] }, { id: "LECT001", phone: "0800", expertise: ["Writing"], available: 2, _hasImportedAvailable: true }]);
	  console.assert(dedupedImport.length === 1 && dedupedImport[0].phone === "0800" && dedupedImport[0].expertise.length === 2 && dedupedImport[0].available === 2, "Lecturer import should merge duplicate IDs before upsert");
	  console.assert(typeof USE_SUPABASE === "boolean", "Supabase config flag should be boolean");
  const demoSnapshot = cloneDemoSnapshot();
  console.assert(demoSnapshot.lecturers.length >= 5 && demoSnapshot.courses.length >= 5, "Demo snapshot should include enough data for presentation");
  console.assert(demoSnapshot.terms.some((term) => term.active), "Demo snapshot should include an active term");
	}
runTests();

function downloadBlob(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

const xlsxContentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

function xmlEscape(value) {
  return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function columnName(index) {
  let name = "";
  let current = index + 1;
  while (current > 0) {
    const remainder = (current - 1) % 26;
    name = String.fromCharCode(65 + remainder) + name;
    current = Math.floor((current - 1) / 26);
  }
  return name;
}

function crc32(bytes) {
  let crc = -1;
  for (const byte of bytes) {
    crc ^= byte;
    for (let i = 0; i < 8; i += 1) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return (crc ^ -1) >>> 0;
}

function writeUint16(target, value) {
  target.push(value & 255, (value >>> 8) & 255);
}

function writeUint32(target, value) {
  target.push(value & 255, (value >>> 8) & 255, (value >>> 16) & 255, (value >>> 24) & 255);
}

function createZip(files) {
  const encoder = new TextEncoder();
  const output = [];
  const centralDirectory = [];
  let offset = 0;
  const now = new Date();
  const dosTime = (now.getHours() << 11) | (now.getMinutes() << 5) | Math.floor(now.getSeconds() / 2);
  const dosDate = ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();

  files.forEach(({ name, content }) => {
    const nameBytes = encoder.encode(name);
    const dataBytes = encoder.encode(content);
    const checksum = crc32(dataBytes);
    const localHeader = [];
    writeUint32(localHeader, 0x04034b50);
    writeUint16(localHeader, 20);
    writeUint16(localHeader, 0);
    writeUint16(localHeader, 0);
    writeUint16(localHeader, dosTime);
    writeUint16(localHeader, dosDate);
    writeUint32(localHeader, checksum);
    writeUint32(localHeader, dataBytes.length);
    writeUint32(localHeader, dataBytes.length);
    writeUint16(localHeader, nameBytes.length);
    writeUint16(localHeader, 0);
    output.push(...localHeader, ...nameBytes, ...dataBytes);

    const centralHeader = [];
    writeUint32(centralHeader, 0x02014b50);
    writeUint16(centralHeader, 20);
    writeUint16(centralHeader, 20);
    writeUint16(centralHeader, 0);
    writeUint16(centralHeader, 0);
    writeUint16(centralHeader, dosTime);
    writeUint16(centralHeader, dosDate);
    writeUint32(centralHeader, checksum);
    writeUint32(centralHeader, dataBytes.length);
    writeUint32(centralHeader, dataBytes.length);
    writeUint16(centralHeader, nameBytes.length);
    writeUint16(centralHeader, 0);
    writeUint16(centralHeader, 0);
    writeUint16(centralHeader, 0);
    writeUint16(centralHeader, 0);
    writeUint32(centralHeader, 0);
    writeUint32(centralHeader, offset);
    centralDirectory.push(...centralHeader, ...nameBytes);
    offset = output.length;
  });

  const centralDirectoryOffset = output.length;
  output.push(...centralDirectory);
  const endRecord = [];
  writeUint32(endRecord, 0x06054b50);
  writeUint16(endRecord, 0);
  writeUint16(endRecord, 0);
  writeUint16(endRecord, files.length);
  writeUint16(endRecord, files.length);
  writeUint32(endRecord, centralDirectory.length);
  writeUint32(endRecord, centralDirectoryOffset);
  writeUint16(endRecord, 0);
  output.push(...endRecord);
  return new Uint8Array(output);
}

function createXLSX(rows, sheetName = "Lecturers") {
  const headers = Object.keys(rows[0]);
  const sheetRows = [headers].concat(rows.map((row) => headers.map((header) => row[header])));
  const sheetData = sheetRows.map((row, rowIndex) => `<row r="${rowIndex + 1}">${row.map((value, columnIndex) => {
    const cellRef = `${columnName(columnIndex)}${rowIndex + 1}`;
    return typeof value === "number" && Number.isFinite(value)
      ? `<c r="${cellRef}"><v>${value}</v></c>`
      : `<c r="${cellRef}" t="inlineStr"><is><t>${xmlEscape(value)}</t></is></c>`;
  }).join("")}</row>`).join("");
  const worksheet = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${sheetData}</sheetData></worksheet>`;
  return createZip([
    { name: "[Content_Types].xml", content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>` },
    { name: "_rels/.rels", content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>` },
    { name: "xl/workbook.xml", content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="${xmlEscape(sheetName)}" sheetId="1" r:id="rId1"/></sheets></workbook>` },
    { name: "xl/_rels/workbook.xml.rels", content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>` },
    { name: "xl/styles.xml", content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="1"><font><sz val="11"/><name val="Calibri"/></font></fonts><fills count="1"><fill><patternFill patternType="none"/></fill></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/></cellXfs></styleSheet>` },
    { name: "xl/worksheets/sheet1.xml", content: worksheet },
  ]);
}

function exportLecturersToXLSX(lecturers, courses) {
  const rows = buildLecturerExportRows(lecturers, courses);
  if (!rows.length) return;
  const filenameDate = new Date().toISOString().slice(0, 10);
  if (typeof window !== "undefined" && window.XLSX?.utils && window.XLSX?.writeFile) {
    const worksheet = window.XLSX.utils.json_to_sheet(rows);
    const workbook = window.XLSX.utils.book_new();
    window.XLSX.utils.book_append_sheet(workbook, worksheet, "Lecturers");
    window.XLSX.writeFile(workbook, `UT_English_Lecturers_${filenameDate}.xlsx`);
    return;
  }
  downloadBlob(`UT_English_Lecturers_${filenameDate}.xlsx`, createXLSX(rows), xlsxContentType);
}

function exportPlottingToXLSX(lecturers, courses, plannedCounts, assignmentMap) {
  const rows = buildPlottingExportRows(lecturers, courses, plannedCounts, assignmentMap);
  if (!rows.length) return;
  const filenameDate = new Date().toISOString().slice(0, 10);
  if (typeof window !== "undefined" && window.XLSX?.utils && window.XLSX?.writeFile) {
    const worksheet = window.XLSX.utils.json_to_sheet(rows);
    const workbook = window.XLSX.utils.book_new();
    window.XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    window.XLSX.writeFile(workbook, `Plotting_${filenameDate}.xlsx`);
    return;
  }
  downloadBlob(`Plotting_${filenameDate}.xlsx`, createXLSX(rows, "Sheet1"), xlsxContentType);
}

function parseCSV(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];
    if (char === '"' && quoted && next === '"') {
      cell += '"';
      i += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(cell);
      cell = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") i += 1;
      row.push(cell);
      if (row.some((value) => value !== "")) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }
  row.push(cell);
  if (row.some((value) => value !== "")) rows.push(row);
  return rows;
}

function rowsToObjects(rows) {
  const [headers = [], ...body] = rows;
  return body.map((row) => headers.reduce((acc, header, index) => ({ ...acc, [String(header || "").trim()]: row[index] ?? "" }), {}));
}

function getUint16(view, offset) {
  return view.getUint16(offset, true);
}

function getUint32(view, offset) {
  return view.getUint32(offset, true);
}

async function inflateZipEntry(bytes) {
  for (const format of ["deflate-raw", "deflate"]) {
    try {
      const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream(format));
      return new Uint8Array(await new Response(stream).arrayBuffer());
    } catch {
      // Try the next supported browser decompression format.
    }
  }
  throw new Error("Could not decompress this XLSX file.");
}

async function readZipEntries(buffer) {
  const bytes = new Uint8Array(buffer);
  const view = new DataView(buffer);
  const decoder = new TextDecoder();
  let eocdOffset = -1;
  for (let i = bytes.length - 22; i >= 0; i -= 1) {
    if (getUint32(view, i) === 0x06054b50) {
      eocdOffset = i;
      break;
    }
  }
  if (eocdOffset < 0) throw new Error("Invalid XLSX file.");
  const entryCount = getUint16(view, eocdOffset + 10);
  let centralOffset = getUint32(view, eocdOffset + 16);
  const entries = {};

  for (let i = 0; i < entryCount; i += 1) {
    if (getUint32(view, centralOffset) !== 0x02014b50) throw new Error("Invalid XLSX directory.");
    const method = getUint16(view, centralOffset + 10);
    const compressedSize = getUint32(view, centralOffset + 20);
    const nameLength = getUint16(view, centralOffset + 28);
    const extraLength = getUint16(view, centralOffset + 30);
    const commentLength = getUint16(view, centralOffset + 32);
    const localOffset = getUint32(view, centralOffset + 42);
    const name = decoder.decode(bytes.slice(centralOffset + 46, centralOffset + 46 + nameLength));
    const localNameLength = getUint16(view, localOffset + 26);
    const localExtraLength = getUint16(view, localOffset + 28);
    const dataOffset = localOffset + 30 + localNameLength + localExtraLength;
    const compressed = bytes.slice(dataOffset, dataOffset + compressedSize);
    const data = method === 0 ? compressed : method === 8 ? await inflateZipEntry(compressed) : null;
    if (!data) throw new Error("Unsupported XLSX compression method.");
    entries[name] = decoder.decode(data);
    centralOffset += 46 + nameLength + extraLength + commentLength;
  }
  return entries;
}

function parseSharedStrings(xml) {
  if (!xml) return [];
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  return Array.from(doc.querySelectorAll("si")).map((item) => Array.from(item.querySelectorAll("t")).map((node) => node.textContent || "").join(""));
}

function parseWorksheet(xml, sharedStrings) {
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  return Array.from(doc.querySelectorAll("sheetData row")).map((row) => {
    const cells = [];
    Array.from(row.querySelectorAll("c")).forEach((cell) => {
      const ref = cell.getAttribute("r") || "";
      const column = ref.replace(/\d/g, "").split("").reduce((sum, char) => (sum * 26) + char.charCodeAt(0) - 64, 0) - 1;
      const type = cell.getAttribute("t");
      const valueNode = cell.querySelector("v");
      const inlineNode = cell.querySelector("is t");
      const rawValue = valueNode?.textContent || inlineNode?.textContent || "";
      cells[column] = type === "s" ? sharedStrings[Number(rawValue)] || "" : rawValue;
    });
    return cells.map((value) => value ?? "");
  });
}

async function parseXLSX(file) {
  const entries = await readZipEntries(await file.arrayBuffer());
  const worksheetName = entries["xl/worksheets/sheet1.xml"] ? "xl/worksheets/sheet1.xml" : Object.keys(entries).find((name) => name.startsWith("xl/worksheets/") && name.endsWith(".xml"));
  if (!worksheetName) throw new Error("No worksheet found in this XLSX file.");
  return rowsToObjects(parseWorksheet(entries[worksheetName], parseSharedStrings(entries["xl/sharedStrings.xml"])));
}

function splitList(value) {
  return String(value || "").split(/[;,]/).map((item) => item.trim()).filter(Boolean);
}

function getImportedValue(row, names) {
  const entries = Object.entries(row);
  const match = entries.find(([key]) => names.some((name) => key.trim().toLowerCase() === name.toLowerCase()));
  return match?.[1] ?? "";
}

function hasImportedValue(row, names) {
  return String(getImportedValue(row, names)).trim() !== "";
}

function isImportRowBlank(row) {
  return Object.values(row).every((value) => String(value ?? "").trim() === "");
}

function mapImportedLecturers(rows, courses) {
  return rows.filter((row) => !isImportRowBlank(row)).map((row, index) => {
    const plotted = splitList(getImportedValue(row, ["Plotted_Course_Codes", "Plotted Course Codes", "Plotted Courses", "Plotted", "Courses"]));
    const knownPlotted = plotted.filter((code) => !courses.length || courses.some((course) => course.code === code));
    const importedId = String(getImportedValue(row, ["Lecturer_ID", "Lecturer ID", "ID"])).trim();
    const availableKeys = ["Available_Slots", "Available Slots", "Available"];
    const importedAvailable = Number(getImportedValue(row, availableKeys));
    const ratingKeys = ["Rating", "Teaching_Rating", "Teaching Rating", "Performance Rating"];
    const importedRating = Number(getImportedValue(row, ratingKeys));
    const warningNoteKeys = ["Warning_Note", "Warning Note", "Warning", "Notice"];
    return { ...normalizeLecturer({
      id: importedId || `imported-${Date.now()}-${index + 1}`,
      degree: String(getImportedValue(row, ["Degree"])).trim(),
      name: String(getImportedValue(row, ["Name", "Full Name"])).trim(),
      email: String(getImportedValue(row, ["Email"])).trim(),
      phone: String(getImportedValue(row, ["Phone"])).trim(),
      expertise: splitList(getImportedValue(row, ["Expertise"])),
      plotted: knownPlotted,
      available: Number.isFinite(importedAvailable) ? importedAvailable : 0,
      rating: Number.isFinite(importedRating) ? importedRating : 0,
      warning_note: String(getImportedValue(row, warningNoteKeys)).trim(),
    }), _hasImportedAvailable: hasImportedValue(row, availableKeys), _hasImportedRating: hasImportedValue(row, ratingKeys), _hasImportedWarningNote: hasImportedValue(row, warningNoteKeys) };
  });
}

function getAccessToken() {
  return localStorage.getItem("ut_supabase_access_token") || "";
}

function supabaseHeaders({ preferReturn = false } = {}) {
  const token = getAccessToken() || SUPABASE_ANON_KEY;
  return {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    ...(preferReturn ? { Prefer: "return=representation" } : {}),
  };
}

async function supabaseRequest(path, options = {}) {
  if (!USE_SUPABASE) throw new Error("Supabase is not configured.");
  const response = await fetch(`${SUPABASE_URL}${path}`, options);
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) {
    const error = new Error(data?.message || data?.msg || data?.error_description || "Supabase request failed.");
    error.status = response.status;
    throw error;
  }
  return data;
}

async function fetchTable(table, orderBy) {
  return supabaseRequest(`/rest/v1/${table}?select=*&order=${orderBy}.asc`, {
    method: "GET",
    headers: supabaseHeaders(),
  });
}

async function fetchDatabaseSnapshot() {
  const [lecturerRows, courseRows, termRows, plottingRows] = await Promise.all([
    fetchTable("lecturers", "name"),
    fetchTable("courses", "code"),
    fetchTable("academic_terms", "code"),
    fetchTable("term_plottings", "id"),
  ]);
  return {
    lecturers: Array.isArray(lecturerRows) ? lecturerRows.map(normalizeLecturer) : [],
    courses: Array.isArray(courseRows) ? courseRows : [],
    terms: Array.isArray(termRows) ? termRows : [],
    termPlottings: Array.isArray(plottingRows) ? plottingRows.map(normalizeTermPlotting) : [],
  };
}

async function fetchPublicDatabaseSnapshot() {
  const [lecturerRows, courseRows, termRows, plottingRows] = await Promise.all([
    fetchTable("public_lecturer_profiles", "name"),
    fetchTable("public_courses", "code"),
    fetchTable("public_academic_terms", "code"),
    fetchTable("public_term_plottings", "id"),
  ]);
  return {
    lecturers: Array.isArray(lecturerRows) ? lecturerRows.map(normalizeLecturer) : [],
    courses: Array.isArray(courseRows) ? courseRows : [],
    terms: Array.isArray(termRows) ? termRows : [],
    termPlottings: Array.isArray(plottingRows) ? plottingRows.map(normalizeTermPlotting) : [],
  };
}

async function fetchLecturerLabelColumnSupport() {
  if (!USE_SUPABASE) return false;
  try {
    await supabaseRequest("/rest/v1/lecturers?select=rating,warning_note&limit=1", {
      method: "GET",
      headers: supabaseHeaders(),
    });
    return true;
  } catch {
    return false;
  }
}

async function upsertRows(table, rows, conflictKey) {
  if (!rows.length) return [];
  return supabaseRequest(`/rest/v1/${table}?on_conflict=${conflictKey}`, {
    method: "POST",
    headers: { ...supabaseHeaders({ preferReturn: true }), Prefer: "resolution=merge-duplicates,return=representation" },
    body: JSON.stringify(rows),
  });
}

async function deleteMissingRows(table, key, currentKeys) {
  const existing = await supabaseRequest(`/rest/v1/${table}?select=${key}`, {
    method: "GET",
    headers: supabaseHeaders(),
  });
  const keep = new Set(currentKeys);
  const staleKeys = existing.map((row) => row[key]).filter((value) => !keep.has(value));
  await Promise.all(staleKeys.map((value) => supabaseRequest(`/rest/v1/${table}?${key}=eq.${encodeURIComponent(value)}`, {
    method: "DELETE",
    headers: supabaseHeaders(),
  })));
}

async function syncTable(table, rows, key) {
  await upsertRows(table, rows, key);
  await deleteMissingRows(table, key, rows.map((row) => row[key]));
}

async function signIn(email, password) {
  if (!USE_SUPABASE) throw new Error("Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable access.");
  const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: SUPABASE_ANON_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error_description || data.msg || "Login failed.");
  localStorage.setItem("ut_supabase_access_token", data.access_token);
  localStorage.setItem("ut_user_email", data.user?.email || email);
  return data.user?.email || email;
}

function signOut() {
  localStorage.removeItem("ut_user_email");
  localStorage.removeItem("ut_supabase_access_token");
}

function getStoredUserEmail() {
  if (!USE_SUPABASE || !getAccessToken()) {
    signOut();
    return "";
  }
  return localStorage.getItem("ut_user_email") || "";
}

function Button({ children, variant = "primary", className = "", ...props }) {
  const styles = {
    primary: "bg-[#005baa] text-white hover:bg-[#004984] shadow-sm",
    secondary: "bg-white text-[#102f52] border border-[#d7e6f7] hover:bg-[#f4f9ff]",
    ghost: "bg-transparent text-[#315577] hover:bg-[#eef5ff]",
    danger: "bg-[#fffafa] text-[#8a3a3a] border border-[#f3caca] hover:bg-[#fdeaea]",
  };
  return <button className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${styles[variant]} ${className}`} {...props}>{children}</button>;
}

function Badge({ children, tone = "blue" }) {
  const tones = {
    red: "bg-[#fde2e2] text-[#8a3a3a] border-[#f3caca]",
    orange: "bg-[#ffe5cf] text-[#8a4f26] border-[#f5d3b9]",
    amber: "bg-[#fff0c2] text-[#71540f] border-[#f3dda2]",
    blue: "bg-[#dcecff] text-[#315577] border-[#c7dbf2]",
    green: "bg-[#dff3e6] text-[#315f45] border-[#c6e3d1]",
    slate: "bg-[#eef3f2] text-[#4d5d66] border-[#dce9e6]",
  };
  return <span className={`inline-flex items-center rounded-lg border px-2 py-1 text-xs font-normal ${tones[tone] || tones.blue}`}>{children}</span>;
}

function RatingStars({ rating = 0, showEmpty = true }) {
  const value = clampRating(rating);
  if (!showEmpty && value === 0) return null;
  return <span className="inline-flex items-center gap-1" aria-label={`${value} of 5 rating`}>{Array.from({ length: 5 }, (_, index) => <svg key={index} viewBox="0 0 24 24" className={`h-4 w-4 ${index < value ? "text-[#f4b000]" : "text-[#d7e0ea]"}`} aria-hidden="true"><path fill="currentColor" d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8-6.2-3.3-6.2 3.3 1.2-6.8-5-4.9 6.9-1L12 2Z" /></svg>)}</span>;
}

function WarningNotice({ note }) {
  if (!String(note || "").trim()) return null;
  return <span className="inline-flex max-w-xs items-center gap-1 rounded-lg border border-[#f3caca] bg-[#fde2e2] px-2 py-1 text-xs font-semibold text-[#8a3a3a]" title={note}><Icons.warning className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{note}</span></span>;
}

function Card({ children, className = "" }) {
  return <div className={`rounded-2xl border border-[#d7e6f7] bg-white shadow-sm shadow-[#005baa]/5 ${className}`}>{children}</div>;
}

function TextInput({ icon: Icon, value = "", onChange, placeholder, type = "text" }) {
  return <div className="flex h-12 items-center gap-3 rounded-xl border border-[#d7e6f7] bg-white px-3">{Icon && <Icon className="h-4 w-4 text-[#6f90af]" />}<input value={value} onChange={(event) => onChange?.(event.target.value)} type={type} className="w-full bg-transparent text-sm text-[#102f52] outline-none placeholder:text-[#8aa0b6]" placeholder={placeholder} /></div>;
}

function SelectBox({ label, value, onChange, options = [] }) {
  return <label className="space-y-1.5"><span className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#315577]">{label}</span><div className="relative"><select value={value} onChange={(event) => onChange?.(event.target.value)} className="w-full appearance-none rounded-xl border border-[#d7e6f7] bg-white px-3 py-2.5 pr-9 text-sm font-normal text-[#102f52] outline-none"><option value="All">All</option>{options.filter((option) => option !== "All").map((option) => <option key={option} value={option}>{option}</option>)}</select><Icons.chevronDown className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-[#6f90af]" /></div></label>;
}

const filterOptionLabel = (option) => String(option) === "id" ? "ID" : String(option).replace(/\b\w/g, (char) => char.toUpperCase());

function FilterButtonGroup({ label, value, onChange, options = [], includeAll = true }) {
  const items = uniq([...(includeAll ? ["All"] : []), ...options]);
  return <div className="space-y-2"><p className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#315577]">{label}</p><div className="flex flex-wrap gap-2">{items.map((option) => { const selected = String(value) === String(option); return <button key={option} type="button" onClick={() => onChange?.(option)} className={`rounded-full border px-3 py-2 text-sm font-medium transition ${selected ? "border-[#005baa] bg-[#005baa] text-white shadow-sm" : "border-[#d7e6f7] bg-white text-[#315577] hover:border-[#9bbfe8]"}`}>{filterOptionLabel(option)}</button>; })}</div></div>;
}

function NativeFilterIconSelect({ label, value, onChange, options = [], includeAll = true, icon: Icon }) {
  const items = uniq([...(includeAll ? ["All"] : []), ...options]);
  return <span className={`mobile-native-filter-select ${String(value) !== "All" ? "is-active" : ""}`} title={label} aria-label={label}>{Icon && <Icon className="h-4 w-4" />}<select aria-label={label} value={value} onChange={(event) => onChange?.(event.target.value)}>{items.map((option) => <option key={option} value={option}>{filterOptionLabel(option)}</option>)}</select></span>;
}

function Modal({ title, children, onClose }) {
  return <div className="mobile-modal fixed inset-0 z-50 flex items-center justify-center bg-[#24333f]/35 p-4" onClick={onClose}><motion.div onClick={(event) => event.stopPropagation()} initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="mobile-modal__panel max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[#dce9e6] bg-[#fffffb] p-5 shadow-2xl shadow-[#9fb8b1]/30"><div className="mb-5 flex items-center justify-between gap-4"><h2 className="text-xl font-black text-[#26353f]">{title}</h2><button onClick={onClose} className="rounded-xl p-2 hover:bg-[#eef6f2]"><Icons.x /></button></div>{children}</motion.div></div>;
}

function PlainInput({ label, value = "", onChange, placeholder, type = "text" }) {
  return <label className="space-y-1.5"><span className="text-xs font-normal text-[#53616c]">{label}</span><input value={value} onChange={(event) => onChange(event.target.value)} type={type} placeholder={placeholder} className="w-full rounded-xl border border-[#dce9e6] bg-[#fffffb] px-3 py-2.5 text-sm font-normal text-[#26353f] outline-none focus:border-[#9bbfe8]" /></label>;
}

function PlainTextarea({ label, value = "", onChange, placeholder }) {
  return <label className="space-y-1.5"><span className="text-xs font-normal text-[#53616c]">{label}</span><textarea value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} rows={3} className="w-full resize-y rounded-xl border border-[#dce9e6] bg-[#fffffb] px-3 py-2.5 text-sm font-normal text-[#26353f] outline-none focus:border-[#9bbfe8]" /></label>;
}

function PlainSelect({ label, value = "", onChange, options = [] }) {
  const items = uniq(options);
  return <label className="space-y-1.5"><span className="text-xs font-normal text-[#53616c]">{label}</span><div className="relative"><select value={value} onChange={(event) => onChange(event.target.value)} className="w-full appearance-none rounded-xl border border-[#dce9e6] bg-[#fffffb] px-3 py-2.5 pr-9 text-sm font-normal text-[#26353f] outline-none focus:border-[#9bbfe8]">{items.map((option) => <option key={option} value={option}>{option}</option>)}</select><Icons.chevronDown className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-[#6f90af]" /></div></label>;
}

function ExpertiseSelect({ label, value = [], onChange, options = [] }) {
  const selected = Array.isArray(value) ? value : splitList(value);
  const [baseOptions] = useState(() => uniq([...options, ...selected]));
  const available = uniq([...baseOptions, ...options, ...selected]);
  const remaining = available.filter((option) => !selected.includes(option));
  const addExpertise = (item) => {
    if (!item) return;
    onChange(uniq([...selected, item]));
  };
  const removeExpertise = (item) => onChange(selected.filter((option) => option !== item));
  return <div className="space-y-2"><label className="space-y-1.5"><span className="text-xs font-normal text-[#53616c]">{label}</span><div className="relative"><select value="" onChange={(event) => addExpertise(event.target.value)} className="w-full appearance-none rounded-xl border border-[#dce9e6] bg-[#fffffb] px-3 py-2.5 pr-9 text-sm font-normal text-[#26353f] outline-none focus:border-[#9bbfe8]"><option value="" disabled>{remaining.length ? "Select expertise" : "All expertise selected"}</option>{remaining.map((option) => <option key={option} value={option}>{option}</option>)}</select><Icons.chevronDown className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-[#6f90af]" /></div></label><div className="flex min-h-9 flex-wrap gap-2">{selected.length ? selected.map((item) => <button key={item} type="button" onClick={() => removeExpertise(item)} className="inline-flex items-center gap-1 rounded-lg border border-[#c7dbf2] bg-[#dcecff] px-2 py-1 text-xs font-normal text-[#315577]">{item}<Icons.x className="h-3 w-3" /></button>) : <span className="text-xs text-[#8aa0b6]">No expertise selected</span>}</div></div>;
}

function FormGrid({ children }) {
  return <div className="grid gap-3 sm:grid-cols-2">{children}</div>;
}

function FloatingBottomNav({ active, setActive, onLogout }) {
  return <nav className="mobile-bottom-nav fixed inset-x-0 bottom-4 z-40 px-3 sm:bottom-6 sm:px-6"><div className="mx-auto flex max-w-5xl items-center gap-2 overflow-x-auto rounded-[1.75rem] border border-[#d7e6f7] bg-white/95 p-2 shadow-[0_18px_60px_rgba(0,91,170,0.14)] backdrop-blur-xl"><div className="hidden shrink-0 items-center gap-3 border-r border-[#d7e6f7] px-3 pr-4 md:flex"><div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#005baa] text-[#ffd23f]"><Icons.graduation className="h-5 w-5" /></div><div><p className="text-sm font-black text-[#102f52]">{department.name}</p><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#005baa]">{department.subtitle}</p></div></div>{nav.map((item) => { const Icon = item.icon; const selected = active === item.id; return <button key={item.id} title={item.label} onClick={() => setActive(item.id)} className={`flex min-w-16 shrink-0 flex-col items-center justify-center gap-1 rounded-2xl px-3 py-2 text-[11px] font-black transition sm:min-w-24 sm:flex-row sm:px-4 sm:text-sm ${selected ? "bg-[#ffd23f] text-[#102f52] shadow-sm" : "text-[#315577] hover:bg-[#eef5ff] hover:text-[#005baa]"}`}><Icon className="h-5 w-5" /><span>{item.label}</span></button>; })}<button title="Logout" onClick={onLogout} className="ml-auto flex min-w-16 shrink-0 flex-col items-center justify-center gap-1 rounded-2xl border border-[#d7e6f7] px-3 py-2 text-[11px] font-black text-[#315577] transition hover:bg-[#eef5ff] hover:text-[#005baa] sm:min-w-24 sm:flex-row sm:px-4 sm:text-sm"><Icons.logout className="h-5 w-5" /><span>Logout</span></button></div></nav>;
}

function LandingScreen({ onPublicMode, onLoginMode }) {
  return (
    <div className="min-h-screen bg-white px-5 py-5 text-[#102f52] sm:px-8 lg:px-12">
      <div className="mx-auto flex min-h-[calc(100vh-2.5rem)] max-w-7xl flex-col">
        <motion.nav
          initial={{ opacity: 0, y: -18, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto flex min-h-20 w-full max-w-6xl flex-wrap items-center justify-between gap-4 rounded-[1.75rem] border border-[#d7e6f7] bg-white px-5 py-4 shadow-[0_22px_70px_rgba(0,91,170,0.10)] sm:px-7 lg:px-9"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#005baa] text-[#ffd23f] shadow-sm">
              <Icons.graduation className="h-6 w-6" />
            </span>
            <div>
              <p className="text-2xl font-black tracking-tight sm:text-3xl">Universitas Terbuka</p>
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#005baa]">English Department</p>
            </div>
          </div>
          <div className="flex items-center rounded-full bg-[#eef5ff] p-1 text-sm font-black">
            <button type="button" onClick={onPublicMode} className="rounded-full bg-[#ffd23f] px-4 py-2 text-[#102f52] shadow-sm sm:px-5">Public Mode</button>
            <button type="button" onClick={onLoginMode} className="rounded-full px-5 py-2 text-[#315577] hover:bg-white sm:px-6">Login Mode</button>
          </div>
        </motion.nav>

        <main className="relative mx-auto grid w-full max-w-6xl flex-1 items-center gap-10 py-12 lg:grid-cols-[0.95fr_1.05fr] lg:py-16">
          <motion.section
            initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.7, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-3xl"
          >
            <p className="text-xs font-black uppercase tracking-[0.35em] text-[#005baa]">Lecturer Portal</p>
            <h1 className="mt-4 text-5xl font-black leading-[0.96] tracking-tight text-[#102f52] sm:text-6xl lg:text-7xl">
              UT English Dept.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[#4f6478]">
              Tutors can view their current profile by ID, while administrators can sign in to manage the department dashboard.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-start">
              <div className="flex flex-col gap-3">
                <Button onClick={onPublicMode} className="!rounded-2xl px-6 py-3 text-base"><Icons.eye className="h-5 w-5" />Public Mode</Button>
                <a href={TUTOR_DATA_FORM_URL} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#d7e6f7] bg-white px-4 py-2.5 text-sm font-semibold text-[#102f52] transition hover:bg-[#f4f9ff] !rounded-2xl px-6 py-3 text-base"><Icons.file className="h-5 w-5" />Tutor Data Form</a>
              </div>
              <Button variant="secondary" onClick={onLoginMode} className="!rounded-2xl px-6 py-3 text-base"><Icons.dashboard className="h-5 w-5" />Login Mode</Button>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 28, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.72, delay: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-[2rem] border border-[#d7e6f7] bg-[#f7fbff] p-5 shadow-[0_28px_90px_rgba(0,91,170,0.10)] sm:p-7"
          >
            <div className="grid gap-4">
              <div className="rounded-2xl bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <span className="rounded-xl bg-[#eef5ff] p-3 text-[#005baa]"><Icons.search /></span>
                  <div>
                    <p className="font-black text-[#102f52]">Public Mode</p>
                    <p className="mt-1 text-sm leading-6 text-[#4f6478]">Tutor ID profile lookup</p>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <span className="rounded-xl bg-[#fff0c2] p-3 text-[#71540f]"><Icons.dashboard /></span>
                  <div>
                    <p className="font-black text-[#102f52]">Login Mode</p>
                    <p className="mt-1 text-sm leading-6 text-[#4f6478]">Admin dashboard access</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.section>
        </main>
      </div>
    </div>
  );
}

function PublicLookupScreen({ lecturers, courses, terms, termPlottings, selectedTermCode, setSelectedTermCode, dbStatus, isHydrated, onBack, onLogin, onRefresh }) {
  const [idInput, setIdInput] = useState("");
  const [submittedId, setSubmittedId] = useState("");
  const activeTermCode = terms.find((term) => term.active)?.code || "";
  const effectiveTermCode = terms.some((term) => term.code === selectedTermCode) ? selectedTermCode : activeTermCode || terms[0]?.code || "";
  const validTermPlottings = useMemo(() => {
    const lecturerIds = new Set(lecturers.map((lecturer) => lecturer.id));
    return termPlottings.filter((row) => lecturerIds.has(row.lecturer_id));
  }, [lecturers, termPlottings]);
  const termScopedLecturers = useMemo(() => getTermScopedLecturers(lecturers, validTermPlottings, effectiveTermCode), [lecturers, validTermPlottings, effectiveTermCode]);
  const lecturer = findLecturerById(termScopedLecturers, submittedId);
  const submitted = Boolean(submittedId.trim());
  const publicDirectoryEmpty = USE_SUPABASE && isHydrated && lecturers.length === 0;
  const termSelectValue = terms.some((term) => term.code === effectiveTermCode) ? effectiveTermCode : "";
  const submit = (event) => {
    event.preventDefault();
    setSubmittedId(idInput);
  };
  const refreshPublicDirectory = async () => {
    setIdInput("");
    setSubmittedId("");
    await onRefresh?.();
  };

  return (
    <div className="min-h-screen bg-white px-5 py-5 text-[#102f52] sm:px-8 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <motion.nav
          initial={{ opacity: 0, y: -18, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto flex min-h-20 w-full max-w-6xl flex-wrap items-center justify-between gap-4 rounded-[1.75rem] border border-[#d7e6f7] bg-white px-5 py-4 shadow-[0_22px_70px_rgba(0,91,170,0.10)] sm:px-7 lg:px-9"
        >
          <button type="button" onClick={onBack} className="flex items-center gap-3 text-left">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#005baa] text-[#ffd23f] shadow-sm">
              <Icons.graduation className="h-6 w-6" />
            </span>
            <div>
              <p className="text-2xl font-black tracking-tight sm:text-3xl">Universitas Terbuka</p>
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#005baa]">English Department</p>
            </div>
          </button>
          <div className="flex flex-wrap items-center gap-2 rounded-full bg-[#eef5ff] p-1 text-sm font-black">
            <SupabaseStatusIcon connected={isHydrated} label={dbStatus} />
            <button type="button" onClick={refreshPublicDirectory} disabled={!USE_SUPABASE} className="rounded-full px-4 py-2 text-[#315577] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50 sm:px-5">Refresh</button>
            <button type="button" className="rounded-full bg-[#ffd23f] px-5 py-2 text-[#102f52] shadow-sm sm:px-6">Public Mode</button>
            <button type="button" onClick={onLogin} className="rounded-full px-5 py-2 text-[#315577] hover:bg-white sm:px-6">Login Mode</button>
          </div>
        </motion.nav>

        <main className="relative mx-auto grid w-full max-w-6xl gap-8 py-10 lg:grid-cols-[0.95fr_1.05fr] lg:py-14">
          <section>
            <p className="text-xs font-black uppercase tracking-[0.35em] text-[#005baa]">Lecturer Profile</p>
            <h1 className="mt-3 text-4xl font-black tracking-tight text-[#102f52] sm:text-5xl">Find tutor by ID</h1>
            <form onSubmit={submit} className="mt-7 space-y-4">
              <TextInput icon={Icons.search} value={idInput} onChange={setIdInput} placeholder="Enter tutor ID" />
              {terms.length > 0 && (
                <label className="block space-y-1.5">
                  <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#315577]">Term</span>
                  <div className="relative">
                    <select value={termSelectValue} onChange={(event) => setSelectedTermCode(event.target.value)} className="w-full appearance-none rounded-xl border border-[#d7e6f7] bg-white px-3 py-2.5 pr-9 text-sm font-normal text-[#102f52] outline-none focus:border-[#005baa]">
                      {terms.map((term) => <option key={term.code} value={term.code}>{term.name}</option>)}
                    </select>
                    <Icons.chevronDown className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-[#6f90af]" />
                  </div>
                </label>
              )}
              <Button type="submit" className="w-full !rounded-2xl py-3 text-base" disabled={!idInput.trim() || !isHydrated}>View Profile</Button>
            </form>
            {isHydrated && !publicDirectoryEmpty && (
              <p className="mt-4 text-sm leading-6 text-[#4f6478]">{termScopedLecturers.length} public {termScopedLecturers.length === 1 ? "profile" : "profiles"} loaded{effectiveTermCode ? " for the selected term" : ""}.</p>
            )}
          </section>

          <section>
            {!USE_SUPABASE && (
              <Card className="p-6">
                <p className="font-black text-[#102f52]">Supabase is not configured.</p>
                <p className="mt-2 text-sm leading-6 text-[#4f6478]">Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable public profile lookup.</p>
              </Card>
            )}
            {USE_SUPABASE && !isHydrated && (
              <Card className="p-6">
                <p className="font-black text-[#102f52]">{dbStatus}</p>
                <p className="mt-2 text-sm leading-6 text-[#4f6478]">Profile lookup will be available once the public directory is loaded.</p>
              </Card>
            )}
            {USE_SUPABASE && isHydrated && !submitted && !publicDirectoryEmpty && (
              <Card className="p-6">
                <p className="font-black text-[#102f52]">Ready</p>
                <p className="mt-2 text-sm leading-6 text-[#4f6478]">Enter a tutor ID to view the matching profile.</p>
              </Card>
            )}
            {publicDirectoryEmpty && (
              <Card className="p-6">
                <p className="font-black text-[#102f52]">No public profiles loaded</p>
                <p className="mt-2 text-sm leading-6 text-[#4f6478]">The public lookup can reach Supabase, but the public_lecturer_profiles view returned zero rows. Run the public profile views SQL, or sign in through Login Mode to confirm lecturer data exists.</p>
              </Card>
            )}
            {USE_SUPABASE && isHydrated && submitted && !lecturer && !publicDirectoryEmpty && (
              <Card className="p-6">
                <p className="font-black text-[#102f52]">No profile found</p>
                <p className="mt-2 text-sm leading-6 text-[#4f6478]">No tutor profile matches that ID. Check the full tutor ID and try again.</p>
              </Card>
            )}
            {USE_SUPABASE && isHydrated && lecturer && <LecturerInfoCard lecturer={lecturer} courses={courses} />}
          </section>
        </main>
      </div>
    </div>
  );
}

function Header({ active, terms, selectedTermCode, setSelectedTermCode }) {
  const titles = {
    dashboard: ["Overview", "Department Dashboard", "Live infographics of lecturer distribution, expertise, teaching load, and availability."],
    lecturers: ["Directory", "Lecturers", "Search, filter, sort, add, edit, or remove lecturer records."],
    plotting: ["Course Plotting", "Plan classes and assign lecturers", "Set class counts by course, assign lecturers by expertise, and export plotting rows."],
    courses: ["Catalog", "Courses", "The English Department course catalog used for term-based plotting."],
    terms: ["Academic Calendar", "Terms / Semesters", "Define academic terms and choose which one is active for plotting."],
  };
  const [eyebrow, title, desc] = titles[active];
  const showTermPicker = active !== "lecturers";
  const termSelectValue = terms.some((term) => term.code === selectedTermCode) ? selectedTermCode : terms[0]?.code || "";
  return <div className="mb-6"><p className="text-xs font-black uppercase tracking-[0.35em] text-[#005baa]">{eyebrow}</p><h1 className="mt-1 text-3xl font-black tracking-tight text-[#102f52] md:text-4xl">{title}</h1><p className="mt-2 flex max-w-3xl flex-wrap items-center gap-2 text-sm leading-6 text-[#4f6478]"><span>{desc}</span>{showTermPicker && (terms.length ? <select aria-label="Select term" value={termSelectValue} onChange={(event) => setSelectedTermCode(event.target.value)} className="rounded-lg border border-[#d7e6f7] bg-white px-2 py-1 text-sm font-bold text-[#102f52] outline-none focus:border-[#005baa]">{terms.map((term) => <option key={term.code} value={term.code}>{term.name}</option>)}</select> : <b className="text-[#102f52]">No active term selected.</b>)}</p></div>;
}

function Stat({ label, value, icon: Icon, tone = "blue", note }) {
  return <Card className={`p-5 ${tone === "amber" ? "border-[#f0d264] bg-[#fff9df]" : ""}`}><div className="flex items-start justify-between"><div><p className="text-xs font-medium uppercase tracking-[0.2em] text-[#315577]">{label}</p><p className="mt-3 text-4xl font-light text-[#102f52]">{value}</p>{note && <p className="mt-1 text-xs font-normal text-[#4f6478]">{note}</p>}</div><div className={`rounded-xl p-3 ${tone === "amber" ? "bg-[#ffd23f] text-[#102f52]" : "bg-[#eef5ff] text-[#005baa]"}`}><Icon /></div></div></Card>;
}

function SupabaseStatusIcon({ connected, label }) {
  return <span title={label} aria-label={label} role="status" className={`inline-flex h-9 w-9 items-center justify-center rounded-full border ${connected ? "border-[#c6e3d1] bg-[#dff3e6] text-[#315f45]" : "border-[#f3dda2] bg-[#fff0c2] text-[#71540f]"}`}>{connected ? <Icons.check className="h-4 w-4" /> : <Icons.chart className="h-4 w-4" />}</span>;
}

function Dashboard({ lecturers, courses }) {
  const [filters, setFilters] = useState({ degree: "All", expertise: "All", plotted: "All", available: "All" });
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [mobileFiltersVisible, setMobileFiltersVisible] = useState(true);
  const scrollTimerRef = useRef(null);
  const filtered = useMemo(() => lecturers.filter((lecturer) => (filters.degree === "All" || lecturer.degree === filters.degree) && (filters.expertise === "All" || lecturer.expertise.includes(filters.expertise)) && (filters.plotted === "All" || lecturer.plotted.some((code) => courseTitleByCode(courses, code) === filters.plotted)) && (filters.available === "All" || String(lecturer.available) === filters.available)), [lecturers, courses, filters]);
  const expertiseData = Object.entries(filtered.flatMap((lecturer) => lecturer.expertise).reduce((acc, item) => ({ ...acc, [item]: (acc[item] || 0) + 1 }), {})).map(([name, value]) => ({ name, value }));
  const degreeData = Object.entries(filtered.reduce((acc, lecturer) => ({ ...acc, [lecturer.degree]: (acc[lecturer.degree] || 0) + 1 }), {})).map(([name, value]) => ({ name, value }));
  const plottedCountData = getPlottedCountData(filtered);
  const availableData = filtered.map((lecturer) => ({ name: lecturer.name.split(" ")[0], available: lecturer.available, plotted: lecturer.plotted.length }));
  useEffect(() => {
    const handleScroll = () => {
      if (document.activeElement?.closest?.(".mobile-filter-fab, .mobile-search-modal")) return;
      setMobileFiltersOpen(false);
      setMobileFiltersVisible(false);
      window.clearTimeout(scrollTimerRef.current);
      scrollTimerRef.current = window.setTimeout(() => setMobileFiltersVisible(true), 220);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.clearTimeout(scrollTimerRef.current);
    };
  }, []);
  const filterControls = <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"><SelectBox label="Academic Degree" value={filters.degree} onChange={(value) => setFilters({ ...filters, degree: value })} options={uniq(lecturers.map((lecturer) => lecturer.degree))} /><SelectBox label="Course Expertise" value={filters.expertise} onChange={(value) => setFilters({ ...filters, expertise: value })} options={uniq(lecturers.flatMap((lecturer) => lecturer.expertise))} /><SelectBox label="Plotted Course" value={filters.plotted} onChange={(value) => setFilters({ ...filters, plotted: value })} options={courses.map((course) => course.title)} /><SelectBox label="Courses Available" value={filters.available} onChange={(value) => setFilters({ ...filters, available: value })} options={["0", "1", "2", "3", "4"]} /></div>;
  const mobileFilterRail = <div className="mobile-filter-fab__rail"><NativeFilterIconSelect label="Academic Degree" value={filters.degree} onChange={(value) => setFilters({ ...filters, degree: value })} options={uniq(lecturers.map((lecturer) => lecturer.degree))} icon={Icons.graduation} /><NativeFilterIconSelect label="Course Expertise" value={filters.expertise} onChange={(value) => setFilters({ ...filters, expertise: value })} options={uniq(lecturers.flatMap((lecturer) => lecturer.expertise))} icon={Icons.book} /></div>;
  return <div className="space-y-6"><Card className="dashboard-filter-card p-5"><p className="mb-4 text-xs font-medium uppercase tracking-[0.2em] text-[#005baa]">Filter Infographics</p>{filterControls}</Card><div className={`mobile-filter-fab ${mobileFiltersVisible ? "is-visible" : "is-hidden"} ${mobileFiltersOpen ? "is-open" : ""}`}><div className="mobile-filter-fab__panel">{mobileFilterRail}</div><button type="button" className="mobile-filter-fab__button" onClick={() => setMobileFiltersOpen((open) => !open)} aria-expanded={mobileFiltersOpen} aria-label="Toggle filter infographics"><Icons.chart className="h-5 w-5" /><span>Filters</span></button></div><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"><Stat label="Total Lecturers" value={filtered.length} icon={Icons.users} /><Stat label="Total Plotted Courses" value={filtered.reduce((sum, lecturer) => sum + lecturer.plotted.length, 0)} icon={Icons.book} note="Filtered result" /><Stat label="Total Available Slots" value={filtered.reduce((sum, lecturer) => sum + lecturer.available, 0)} icon={Icons.chart} /><Stat label="Avg. Plotted Course / Lecturer" value={filtered.length ? (filtered.reduce((sum, lecturer) => sum + lecturer.plotted.length, 0) / filtered.length).toFixed(1) : "0"} icon={Icons.check} tone="amber" note="Range 0–4" /></div><div className="grid gap-6 md:grid-cols-2"><Card className="p-5"><h3 className="font-medium text-[#102f52]">By Academic Degree</h3><div className="h-72"><ResponsiveContainer><RePieChart><Pie data={degreeData} dataKey="value" nameKey="name" innerRadius={65} outerRadius={95}>{degreeData.map((_, index) => <Cell key={index} fill={dashboardPalette[index % dashboardPalette.length]} />)}</Pie><Tooltip contentStyle={{ fontWeight: 300 }} /><Legend wrapperStyle={{ fontWeight: 300 }} /></RePieChart></ResponsiveContainer></div></Card><Card className="p-5"><h3 className="font-medium text-[#102f52]">By Number of Plotted Courses</h3><div className="h-72"><ResponsiveContainer><RePieChart><Pie data={plottedCountData} dataKey="value" nameKey="name" innerRadius={65} outerRadius={95}>{plottedCountData.map((_, index) => <Cell key={index} fill={dashboardPalette[index % dashboardPalette.length]} />)}</Pie><Tooltip contentStyle={{ fontWeight: 300 }} /><Legend wrapperStyle={{ fontWeight: 300 }} /></RePieChart></ResponsiveContainer></div></Card><Card className="p-5 md:col-span-2"><h3 className="font-medium text-[#102f52]">By Course Expertise</h3><div className="h-72"><ResponsiveContainer><BarChart data={expertiseData} layout="vertical"><CartesianGrid stroke="#d7e6f7" strokeDasharray="3 3" /><XAxis type="number" tick={{ fontSize: 11, fill: "#315577", fontWeight: 300 }} /><YAxis dataKey="name" type="category" width={155} tick={{ fontSize: 11, fill: "#315577", fontWeight: 300 }} /><Tooltip contentStyle={{ fontWeight: 300 }} /><Bar dataKey="value" fill="#005baa" radius={[0, 8, 8, 0]} /></BarChart></ResponsiveContainer></div></Card></div><Card className="p-5"><h3 className="font-medium text-[#102f52]">Lecturer Load and Availability</h3><div className="h-80"><ResponsiveContainer><BarChart data={availableData}><CartesianGrid stroke="#d7e6f7" strokeDasharray="3 3" /><XAxis dataKey="name" tick={{ fontSize: 11, fill: "#315577", fontWeight: 300 }} /><YAxis tick={{ fontSize: 11, fill: "#315577", fontWeight: 300 }} /><Tooltip contentStyle={{ fontWeight: 300 }} /><Legend wrapperStyle={{ fontWeight: 300 }} /><Bar dataKey="plotted" fill="#005baa" radius={[8, 8, 0, 0]} /><Bar dataKey="available" fill="#ffd23f" radius={[8, 8, 0, 0]} /></BarChart></ResponsiveContainer></div></Card></div>;
}

function LecturerForm({ initial, onSave, onClose }) {
  const degreeOptions = initial?.degreeOptions || DEFAULT_DEGREE_OPTIONS;
  const expertiseOptions = initial?.expertiseOptions || lecturerFormExpertiseOptions;
  const [form, setForm] = useState(() => {
    const base = initial || { id: String(Date.now()).slice(-8), degree: "M.A.", name: "", email: "", phone: "", plotted: [], available: 0, rating: 0, warning_note: "" };
    return { ...base, degree: degreeOptions.includes(base.degree) ? base.degree : degreeOptions[0], expertise: Array.isArray(base.expertise) ? base.expertise : splitList(base.expertiseText), rating: clampRating(base.rating), warning_note: String(base.warning_note || "") };
  });
  const save = () => {
    onSave({ id: form.id, degree: form.degree, name: form.name, email: form.email, phone: form.phone, available: Number(form.available ?? 0), rating: clampRating(form.rating), warning_note: String(form.warning_note || "").trim(), expertise: uniq(form.expertise), plotted: Array.isArray(form.plotted) ? form.plotted : [] });
  };
  return <div className="space-y-4"><FormGrid><PlainInput label="ID" value={form.id} onChange={(value) => setForm({ ...form, id: value })} /><PlainSelect label="Degree" value={form.degree} onChange={(value) => setForm({ ...form, degree: value })} options={degreeOptions} /></FormGrid><PlainInput label="Full name" value={form.name} onChange={(value) => setForm({ ...form, name: value })} /><FormGrid><PlainInput label="Email" value={form.email} onChange={(value) => setForm({ ...form, email: value })} /><PlainInput label="Phone" value={form.phone} onChange={(value) => setForm({ ...form, phone: value })} /></FormGrid><FormGrid><ExpertiseSelect label="Expertise" value={form.expertise} onChange={(value) => setForm({ ...form, expertise: value })} options={expertiseOptions} /><PlainInput label="Available slots (0-4)" type="number" value={form.available} onChange={(value) => setForm({ ...form, available: value })} /></FormGrid><FormGrid><PlainSelect label="Teaching performance rating" value={String(form.rating)} onChange={(value) => setForm({ ...form, rating: Number(value) })} options={["0", "1", "2", "3", "4", "5"]} /><div className="space-y-1.5"><span className="text-xs font-normal text-[#53616c]">Rating preview</span><div className="flex h-11 items-center rounded-xl border border-[#dce9e6] bg-[#fffffb] px-3"><RatingStars rating={form.rating} /></div></div></FormGrid><PlainTextarea label="Warning note" value={form.warning_note} onChange={(value) => setForm({ ...form, warning_note: value })} placeholder="Leave empty when there is no warning note." /><div className="flex justify-end gap-3"><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={save} disabled={!form.id}>Save lecturer</Button></div></div>;
}

function LecturerInfoCard({ lecturer, courses }) {
  const hasContact = Boolean(lecturer.email || lecturer.phone);
  return <div className="space-y-5"><div className="rounded-2xl bg-blue-50 p-5"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-xs font-medium uppercase tracking-[0.2em] text-blue-700">Lecturer Profile</p><h3 className="mt-2 text-2xl font-medium text-slate-950">{lecturer.name}</h3><p className="mt-1 text-sm font-normal text-slate-600">{lecturer.degree} · ID {lecturer.id}</p><div className="mt-3 flex flex-wrap items-center gap-2"><RatingStars rating={lecturer.rating} /> <WarningNotice note={lecturer.warning_note} /></div></div><Badge tone={availabilityTone(lecturer.available)}>{lecturer.available} available slots</Badge></div></div>{hasContact && <div className="grid gap-4 sm:grid-cols-2">{lecturer.email && <Card className="p-4"><p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Email</p><p className="mt-2 text-sm font-normal text-slate-800">{lecturer.email}</p></Card>}{lecturer.phone && <Card className="p-4"><p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Phone</p><p className="mt-2 text-sm font-normal text-slate-800">{lecturer.phone}</p></Card>}</div>}<Card className="p-4"><p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Expertise</p><div className="mt-3 flex flex-wrap gap-2">{lecturer.expertise.length ? lecturer.expertise.map((item) => <Badge key={item}>{item}</Badge>) : <span className="text-sm text-slate-500">No expertise listed</span>}</div></Card><Card className="p-4"><p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Plotted Courses</p><div className="mt-3 flex flex-wrap gap-2">{lecturer.plotted.length ? <PlottedCourseBadges plotted={lecturer.plotted} courses={courses} /> : <span className="text-sm text-slate-500">No plotted courses listed</span>}</div></Card></div>;
}

function Lecturers({ lecturers, directoryLecturers, setLecturers, setTermLecturers, courses, selectedTermCode, canSyncData = true, canSyncLecturerLabels = false }) {
  const importInputRef = useRef(null);
  const [query, setQuery] = useState("");
  const [degree, setDegree] = useState("All");
  const [expertise, setExpertise] = useState("All");
  const [available, setAvailable] = useState("All");
  const [plottedClasses, setPlottedClasses] = useState("All");
  const [sort, setSort] = useState("name");
  const [sortDirection, setSortDirection] = useState("asc");
  const [modal, setModal] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [importMessage, setImportMessage] = useState("");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [mobileFiltersVisible, setMobileFiltersVisible] = useState(true);
  const scrollTimerRef = useRef(null);
  const mobileSearchInputRef = useRef(null);
  const directoryById = useMemo(() => new Map(directoryLecturers.map((lecturer) => [lecturer.id, lecturer])), [directoryLecturers]);
  const expertiseOptions = useMemo(() => uniq([...directoryLecturers, ...lecturers].flatMap((lecturer) => lecturer.expertise)), [directoryLecturers, lecturers]);
  lecturerFormExpertiseOptions = expertiseOptions;
  const sortBy = (value) => {
    setSortDirection((current) => sort === value ? current === "asc" ? "desc" : "asc" : "asc");
    setSort(value);
  };
  const sortHeader = (label, value) => <button type="button" onClick={() => sortBy(value)} className="inline-flex items-center gap-1 font-medium uppercase tracking-[0.15em] text-slate-500 hover:text-blue-700">{label}{sort === value && <span>{sortDirection === "asc" ? "↑" : "↓"}</span>}</button>;
  const rows = useMemo(() => lecturers.filter((lecturer) => [lecturer.id, lecturer.name, lecturer.email, lecturer.phone, lecturer.degree, lecturer.rating, lecturer.warning_note, lecturer.expertise.join(" "), lecturer.plotted.join(" "), plottedCourseTitles(lecturer, courses).join(" ")].some((value) => includes(value, query))).filter((lecturer) => degree === "All" || lecturer.degree === degree).filter((lecturer) => expertise === "All" || lecturer.expertise.includes(expertise)).filter((lecturer) => available === "All" || String(lecturer.available) === available).filter((lecturer) => plottedClasses === "All" || String(lecturer.plotted.length) === plottedClasses).sort((a, b) => {
    const result = sort === "plotted" || sort === "available" || sort === "rating" ? Number(a[sort === "plotted" ? "plotted" : sort]?.length ?? a[sort] ?? 0) - Number(b[sort === "plotted" ? "plotted" : sort]?.length ?? b[sort] ?? 0) : String(a[sort] ?? "").localeCompare(String(b[sort] ?? ""));
    return sortDirection === "asc" ? result : -result;
  }), [lecturers, courses, query, degree, expertise, available, plottedClasses, sort, sortDirection]);
  const save = (item) => {
    const availableSlots = Math.max(0, Math.min(4, Number(item.available) || 0));
    setLecturers((prev) => prev.some((lecturer) => lecturer.id === item.id) ? prev.map((lecturer) => lecturer.id === item.id ? { ...lecturer, ...item, available: lecturer.available, plotted: lecturer.plotted } : lecturer) : [{ ...item, available: availableSlots, plotted: [] }, ...prev]);
    setTermLecturers((prev) => prev.some((lecturer) => lecturer.id === item.id) ? prev.map((lecturer) => lecturer.id === item.id ? { ...lecturer, ...item, available: availableSlots, plotted: lecturer.plotted } : lecturer) : [{ ...item, available: availableSlots, plotted: [] }, ...prev]);
    setModal(null);
  };
	  const importRows = async (items) => {
	    if (!selectedTermCode) throw new Error("Create or select a term before importing lecturer data.");
	    const uniqueItems = dedupeImportedLecturers(items);
	    const scopedById = new Map(lecturers.map((lecturer) => [lecturer.id, lecturer]));
	    const directoryRows = uniqueItems.map((item) => {
	      const existing = directoryById.get(item.id);
	      return mergeImportedLecturer(existing, item);
	    });
	    const plottingRows = uniqueItems.map((item) => {
	      const existing = scopedById.get(item.id);
	      return normalizeTermPlotting(buildTermPlottingRow(selectedTermCode, { ...item, plotted: existing?.plotted || item.plotted || [], available: item._hasImportedAvailable ? item.available : existing?.available ?? item.available }));
    });
    if (USE_SUPABASE && canSyncData) {
      await upsertRows("lecturers", serializeLecturersForDatabase(directoryRows, canSyncLecturerLabels), "id");
      await upsertRows("term_plottings", plottingRows, "id");
    }
    setLecturers((prev) => {
      const byId = new Map(prev.map((lecturer) => [lecturer.id, lecturer]));
      directoryRows.forEach((item) => byId.set(item.id, item));
      return Array.from(byId.values());
    });
	    setTermLecturers((prev) => {
	      const byId = new Map(prev.map((lecturer) => [lecturer.id, lecturer]));
	      uniqueItems.forEach((item) => byId.set(item.id, mergeImportedLecturer(byId.get(item.id), item)));
	      return Array.from(byId.values());
	    });
  };
  const handleImport = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setImportMessage("");
    try {
      const rawRows = file.name.toLowerCase().endsWith(".csv") ? rowsToObjects(parseCSV(await file.text())) : await parseXLSX(file);
      const imported = mapImportedLecturers(rawRows, courses);
      if (!imported.length) throw new Error("No valid lecturer rows found. Use the exported XLSX template columns.");
      await importRows(imported);
      setImportMessage(`Imported ${imported.length} lecturer ${imported.length === 1 ? "row" : "rows"}.`);
    } catch (error) {
      setImportMessage(error.message || "Import failed.");
    } finally {
      event.target.value = "";
    }
  };
  useEffect(() => {
    const handleScroll = () => {
      if (document.activeElement?.closest?.(".mobile-filter-fab")) return;
      setMobileFiltersOpen(false);
      setMobileSearchOpen(false);
      setMobileFiltersVisible(false);
      window.clearTimeout(scrollTimerRef.current);
      scrollTimerRef.current = window.setTimeout(() => setMobileFiltersVisible(true), 220);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.clearTimeout(scrollTimerRef.current);
    };
  }, []);
  useEffect(() => {
    if (!mobileSearchOpen) return;
    const focusTimer = window.setTimeout(() => mobileSearchInputRef.current?.focus(), 80);
    return () => window.clearTimeout(focusTimer);
  }, [mobileSearchOpen]);
  const lecturerFilterControls = <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-6"><SelectBox label="Degree" value={degree} onChange={setDegree} options={uniq(lecturers.map((lecturer) => lecturer.degree))} /><SelectBox label="Expertise" value={expertise} onChange={setExpertise} options={uniq(lecturers.flatMap((lecturer) => lecturer.expertise))} /><SelectBox label="Available" value={available} onChange={setAvailable} options={["0", "1", "2", "3", "4"]} /><SelectBox label="Plotted classes" value={plottedClasses} onChange={setPlottedClasses} options={["0", "1", "2", "3", "4"]} /><SelectBox label="Sort by" value={sort} onChange={(value) => { setSort(value); setSortDirection("asc"); }} options={["name", "id", "degree", "rating", "plotted", "available"]} /><Button variant="secondary" className="mt-5" onClick={() => { setQuery(""); setDegree("All"); setExpertise("All"); setAvailable("All"); setPlottedClasses("All"); setSort("name"); setSortDirection("asc"); }}>Reset</Button></div>;
  const mobileLecturerFilterRail = <div className="mobile-filter-fab__rail"><NativeFilterIconSelect label="Degree" value={degree} onChange={setDegree} options={uniq(lecturers.map((lecturer) => lecturer.degree))} icon={Icons.graduation} /><NativeFilterIconSelect label="Expertise" value={expertise} onChange={setExpertise} options={uniq(lecturers.flatMap((lecturer) => lecturer.expertise))} icon={Icons.book} /><NativeFilterIconSelect label="Sort By" value={sort} onChange={(value) => { setSort(value); setSortDirection("asc"); }} options={["name", "id", "degree", "rating", "plotted", "available"]} includeAll={false} icon={Icons.chart} /><button type="button" title="Reset" aria-label="Reset filters" onClick={() => { setQuery(""); setDegree("All"); setExpertise("All"); setAvailable("All"); setPlottedClasses("All"); setSort("name"); setSortDirection("asc"); }}><Icons.x className="h-4 w-4" /></button></div>;
  const openMobileSearch = () => {
    setMobileFiltersOpen(false);
    setMobileSearchOpen(true);
  };
  const remove = (id) => setLecturers((prev) => prev.filter((lecturer) => lecturer.id !== id));
  return <div className="space-y-5"><div className="flex flex-wrap justify-end gap-3"><input ref={importInputRef} type="file" accept=".xlsx,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" className="hidden" onChange={handleImport} /><Button variant="secondary"><Icons.download className="h-4 w-4" />Template</Button><Button variant="secondary" onClick={() => importInputRef.current?.click()}><Icons.download className="h-4 w-4" />Import CSV / XLSX</Button><Button variant="secondary" onClick={() => exportLecturersToXLSX(rows, courses)} disabled={rows.length === 0}><Icons.download className="h-4 w-4" />Export XLSX</Button><Button onClick={() => setModal({})}><Icons.plus className="h-4 w-4" />Add lecturer</Button></div>{importMessage && <p className={`rounded-xl px-3 py-2 text-sm font-normal ${importMessage.startsWith("Imported") ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>{importMessage}</p>}<Card className="lecturer-filter-card p-4"><TextInput icon={Icons.search} value={query} onChange={setQuery} placeholder="Search by ID, name, email, expertise, warning, rating, or course name..." />{lecturerFilterControls}</Card><div className={`mobile-filter-fab mobile-lecturer-fabs ${mobileFiltersVisible ? "is-visible" : "is-hidden"}`}><div className={`mobile-filter-fab__group ${mobileFiltersOpen ? "is-open" : ""}`}><div className="mobile-filter-fab__panel">{mobileLecturerFilterRail}</div><button type="button" className="mobile-filter-fab__button" onClick={() => setMobileFiltersOpen((open) => !open)} aria-expanded={mobileFiltersOpen} aria-label="Toggle lecturer filters and sort"><Icons.chart className="h-5 w-5" /><span>Filters</span></button></div><button type="button" className="mobile-filter-fab__button" onClick={openMobileSearch} aria-label="Search lecturers"><Icons.search className="h-5 w-5" /><span>Search</span></button></div>{mobileSearchOpen && <div className="mobile-search-modal" onClick={() => setMobileSearchOpen(false)}><form className="mobile-search-card" onClick={(event) => event.stopPropagation()} onSubmit={(event) => { event.preventDefault(); setMobileSearchOpen(false); }}><div className="mobile-search-card__header"><strong>Search</strong><button type="button" onClick={() => setMobileSearchOpen(false)} aria-label="Close search"><Icons.x className="h-4 w-4" /></button></div><label className="mobile-search-card__input"><Icons.search className="h-4 w-4" /><input ref={mobileSearchInputRef} value={query} onChange={(event) => setQuery(event.target.value)} type="search" placeholder="Search lecturers..." /></label><div className="mobile-search-card__actions">{query && <button type="button" onClick={() => setQuery("")}>Clear</button>}<button type="submit">Done</button></div></form></div>}<Card className="mobile-card-table overflow-hidden"><div className="overflow-x-auto"><table className="w-full min-w-[1080px] text-left text-sm"><thead className="bg-slate-50 text-[10px] uppercase tracking-[0.15em] text-slate-500"><tr><th className="px-4 py-4">{sortHeader("ID", "id")}</th><th className="px-4 py-4">{sortHeader("Degree", "degree")}</th><th className="px-4 py-4">{sortHeader("Full Name", "name")}</th><th className="px-4 py-4">{sortHeader("Rating", "rating")}</th><th className="px-4 py-4 font-medium">Notice</th><th className="px-4 py-4">{sortHeader("#Plotted", "plotted")}</th><th className="px-4 py-4">{sortHeader("Available", "available")}</th><th className="px-4 py-4 font-medium">Expertise</th><th className="px-4 py-4 font-medium">Plotted Courses</th><th className="px-4 py-4 font-medium">Actions</th></tr></thead><tbody>{rows.map((lecturer) => <tr key={lecturer.id} className="border-t border-slate-100"><td className="px-4 py-4 font-normal text-blue-700">{lecturer.id}</td><td className="px-4 py-4"><Badge tone="slate">{lecturer.degree}</Badge></td><td className="px-4 py-4 font-medium text-slate-900">{lecturer.name}</td><td className="px-4 py-4"><RatingStars rating={lecturer.rating} /></td><td className="px-4 py-4"><WarningNotice note={lecturer.warning_note} /></td><td className="px-4 py-4 font-normal">{lecturer.plotted.length}</td><td className="px-4 py-4"><Badge tone={availabilityTone(lecturer.available)}>{lecturer.available}</Badge></td><td className="px-4 py-4"><div className="flex flex-wrap gap-1">{lecturer.expertise.map((item) => <Badge key={item}>{item}</Badge>)}</div></td><td className="px-4 py-4 text-xs font-normal text-slate-600"><div className="flex max-w-md flex-wrap gap-1"><PlottedCourseBadges plotted={lecturer.plotted} courses={courses} /></div></td><td className="px-4 py-4"><div className="flex gap-3"><button title="View lecturer information" onClick={() => setViewing(lecturer)}><Icons.eye className="h-4 w-4 text-blue-700" /></button><button title="Edit lecturer" onClick={() => { const directoryLecturer = directoryById.get(lecturer.id) || lecturer; setModal({ ...directoryLecturer, available: lecturer.available, plotted: lecturer.plotted, expertiseText: directoryLecturer.expertise.join(", ") }); }}><Icons.edit className="h-4 w-4" /></button><button title="Delete lecturer" onClick={() => remove(lecturer.id)}><Icons.trash className="h-4 w-4 text-red-500" /></button></div></td></tr>)}</tbody></table></div>{rows.length === 0 && <p className="p-6 text-center text-sm text-slate-500">No lecturers match your search/filter.</p>}</Card>{viewing && <Modal title="Lecturer Information" onClose={() => setViewing(null)}><LecturerInfoCard lecturer={viewing} courses={courses} /></Modal>}{modal && <Modal title={modal.id ? "Edit lecturer" : "Add lecturer"} onClose={() => setModal(null)}><LecturerForm initial={modal.id ? modal : null} onSave={save} onClose={() => setModal(null)} /></Modal>}</div>;
}

function Plotting({ lecturers, setLecturers, courses, selectedTermCode, courseClassPlans, setCourseClassPlans }) {
  const importInputRef = useRef(null);
  const [plottingMode, setPlottingMode] = useState("course");
  const [query, setQuery] = useState("");
  const [lecturerSort, setLecturerSort] = useState("Default");
  const [lecturerHeaderSort, setLecturerHeaderSort] = useState("name");
  const [lecturerHeaderSortDirection, setLecturerHeaderSortDirection] = useState("asc");
  const [lecturerPlottedFilter, setLecturerPlottedFilter] = useState("All");
  const [importMessage, setImportMessage] = useState("");
  const [selectedCourseCode, setSelectedCourseCode] = useState("");
  const [selectedLecturerId, setSelectedLecturerId] = useState("");
  const plannedCounts = useMemo(() => getCourseClassPlan(courseClassPlans, selectedTermCode), [courseClassPlans, selectedTermCode]);
  const assignmentMap = useMemo(() => getCourseClassAssignmentPlan(courseClassPlans, selectedTermCode, lecturers, courses), [courseClassPlans, selectedTermCode, lecturers, courses]);
  const classCounts = useMemo(() => getCourseClassCounts(lecturers, courses, plannedCounts, assignmentMap), [lecturers, courses, plannedCounts, assignmentMap]);
  const plannedTotal = courses.reduce((sum, course) => sum + (classCounts[course.code] || 0), 0);
  const assignedTotal = courses.reduce((sum, course) => sum + (assignmentMap[course.code] || []).filter(Boolean).length, 0);
  const visibleCourses = courses.filter((course) => includes(course.code, query) || includes(course.title, query)).sort((a, b) => a.code.localeCompare(b.code));
  const sortLecturerHeader = (value) => {
    setLecturerHeaderSortDirection((current) => lecturerHeaderSort === value ? current === "asc" ? "desc" : "asc" : "asc");
    setLecturerHeaderSort(value);
    setLecturerSort("Default");
  };
  const lecturerSortHeader = (label, value) => <button type="button" onClick={() => sortLecturerHeader(value)} className="inline-flex items-center gap-1 font-medium uppercase tracking-[0.15em] text-[#6d7d86] hover:text-[#005baa]">{label}{lecturerHeaderSort === value && <span>{lecturerHeaderSortDirection === "asc" ? "↑" : "↓"}</span>}</button>;
  const visibleLecturers = lecturers.filter((lecturer) => [lecturer.id, lecturer.name, lecturer.degree, lecturer.expertise.join(" "), plottedCourseTitles(lecturer, courses).join(" ")].some((value) => includes(value, query))).filter((lecturer) => lecturerPlottedFilter === "All" || String(lecturer.plotted.length) === lecturerPlottedFilter).sort((a, b) => {
    if (lecturerSort === "Default" && lecturerHeaderSort) {
      const result = String(a[lecturerHeaderSort] ?? "").localeCompare(String(b[lecturerHeaderSort] ?? ""));
      return lecturerHeaderSortDirection === "asc" ? result : -result;
    }
    if (lecturerSort === "Not plotted first") {
      return Number(a.plotted.length > 0) - Number(b.plotted.length > 0) || a.name.localeCompare(b.name);
    }
    if (lecturerSort === "Most plotted first") {
      return b.plotted.length - a.plotted.length || a.name.localeCompare(b.name);
    }
    return a.name.localeCompare(b.name);
  });
  const selectedLecturer = lecturers.find((lecturer) => lecturer.id === selectedLecturerId);
  const selectedLecturerCourseCounts = useMemo(() => Object.fromEntries(getPlottedCourseCounts(selectedLecturer?.plotted || []).map(({ code, count }) => [code, count])), [selectedLecturer]);
  const updateCoursePlan = (code, value) => {
    const count = toClassCount(value);
    setCourseClassPlans((prev) => {
      const { counts, assignments } = getCoursePlanParts(prev, selectedTermCode);
      return { ...prev, [selectedTermCode]: { counts: { ...counts, [code]: count }, assignments: { ...assignments, [code]: assignments[code] || assignmentMap[code] || [] } } };
    });
  };
  const assignLecturer = (courseCode, classIndex, lecturerId) => {
    const count = classCounts[courseCode] || 0;
    const nextCourseAssignments = Array.from({ length: count }, (_, index) => assignmentMap[courseCode]?.[index] || "");
    const currentLecturerId = nextCourseAssignments[classIndex] || "";
    if (lecturerId && lecturerId !== currentLecturerId && countLecturerAssignments(assignmentMap, lecturerId) >= LECTURER_CLASS_LIMIT) return;
    nextCourseAssignments[classIndex] = lecturerId;
    const nextAssignmentMap = { ...assignmentMap, [courseCode]: nextCourseAssignments };
    setCourseClassPlans((prev) => {
      const { counts, assignments } = getCoursePlanParts(prev, selectedTermCode);
      return { ...prev, [selectedTermCode]: { counts: { ...counts, [courseCode]: Math.max(toClassCount(counts[courseCode]), count) }, assignments: { ...assignments, [courseCode]: nextCourseAssignments } } };
    });
    setLecturers((prev) => {
      return applyCourseAssignmentsToLecturers(prev, courses, nextAssignmentMap);
    });
  };
  const setLecturerCourseCount = (courseCode, value, lecturerId = selectedLecturer?.id) => {
    if (!lecturerId) return;
    const currentAssignments = assignmentMap[courseCode] || [];
    const currentCount = currentAssignments.filter((id) => id === lecturerId).length;
    const lecturerTotal = countLecturerAssignments(assignmentMap, lecturerId);
    const maxCountForCourse = currentCount + Math.max(0, LECTURER_CLASS_LIMIT - lecturerTotal);
    const requestedCount = Math.min(toClassCount(value), maxCountForCourse);
    if (requestedCount === currentCount) return;

    let nextCourseAssignments = [...currentAssignments];
    if (requestedCount > currentCount) {
      const additions = requestedCount - currentCount;
      let remaining = additions;
      nextCourseAssignments = nextCourseAssignments.map((id) => {
        if (remaining > 0 && !id) {
          remaining -= 1;
          return lecturerId;
        }
        return id;
      });
      while (remaining > 0) {
        nextCourseAssignments.push(lecturerId);
        remaining -= 1;
      }
    } else {
      let remaining = currentCount - requestedCount;
      for (let index = nextCourseAssignments.length - 1; index >= 0 && remaining > 0; index -= 1) {
        if (nextCourseAssignments[index] === lecturerId) {
          nextCourseAssignments[index] = "";
          remaining -= 1;
        }
      }
    }

    const nextAssignmentMap = { ...assignmentMap, [courseCode]: nextCourseAssignments };
    setCourseClassPlans((prev) => {
      const { counts, assignments } = getCoursePlanParts(prev, selectedTermCode);
      return { ...prev, [selectedTermCode]: { counts: { ...counts, [courseCode]: Math.max(toClassCount(counts[courseCode]), nextCourseAssignments.length) }, assignments: { ...assignments, [courseCode]: nextCourseAssignments } } };
    });
    setLecturers((prev) => applyCourseAssignmentsToLecturers(prev, courses, nextAssignmentMap));
  };
  const handleImport = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setImportMessage("");
    try {
      if (!selectedTermCode) throw new Error("Create or select a term before importing plotting data.");
      const rawRows = file.name.toLowerCase().endsWith(".csv") ? rowsToObjects(parseCSV(await file.text())) : await parseXLSX(file);
      const imported = mapImportedPlottingRows(rawRows, lecturers, courses);
      const importedClassCount = Object.values(imported.counts).reduce((sum, count) => sum + count, 0);
	      if (!importedClassCount) throw new Error("No valid plotting rows found. Use either ID + Course_Code, or columns Idtutor, Nama, Kelas, and Nama MK.");
      const nextAssignmentMap = mergeAssignmentMapWithLecturerLimit(assignmentMap, imported.assignments);
      setCourseClassPlans((prev) => {
        const { counts, assignments } = getCoursePlanParts(prev, selectedTermCode);
        return { ...prev, [selectedTermCode]: { counts: { ...counts, ...imported.counts }, assignments: { ...assignments, ...nextAssignmentMap } } };
      });
      setLecturers((prev) => applyCourseAssignmentsToLecturers(prev, courses, nextAssignmentMap));
      const warnings = [
        imported.ignoredCourses.length ? `${imported.ignoredCourses.length} unknown course(s)` : "",
        imported.ignoredLecturers.length ? `${imported.ignoredLecturers.length} unknown lecturer(s)` : "",
      ].filter(Boolean).join("; ");
      const firstImportedCourseCode = Object.keys(imported.counts)[0] || "";
      if (firstImportedCourseCode) setSelectedCourseCode(firstImportedCourseCode);
      setImportMessage(`Imported ${importedClassCount} plotting ${importedClassCount === 1 ? "row" : "rows"}${warnings ? `; skipped ${warnings}.` : "."}`);
    } catch (error) {
      setImportMessage(error.message || "Import failed.");
    } finally {
      event.target.value = "";
    }
  };
  const lecturerOptionsForCourse = (course) => [...lecturers].sort((a, b) => Number(expertiseMatchesCourse(b, course)) - Number(expertiseMatchesCourse(a, course)) || a.name.localeCompare(b.name));
  return (
    <div className="space-y-5">
      <Card className="p-4">
        <div className="grid gap-4 xl:grid-cols-[220px_minmax(280px,1fr)_auto] xl:items-end">
          <label className="space-y-1.5">
            <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#6d7d86]">Plotting mode</span>
            <div className="relative">
              <select value={plottingMode} onChange={(event) => { setPlottingMode(event.target.value); setQuery(""); }} className="h-12 w-full appearance-none rounded-xl border border-[#dce9e6] bg-[#fffffb] px-3 pr-9 text-sm font-normal text-[#3f4f58] outline-none">
                <option value="course">Plotting by course</option>
                <option value="lecturer">Plotting by lecturer</option>
              </select>
              <Icons.chevronDown className="pointer-events-none absolute right-3 top-4 h-4 w-4 text-[#8aa1ad]" />
            </div>
          </label>
          <label className="space-y-1.5">
            <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#6d7d86]">Search</span>
            <TextInput icon={Icons.search} value={query} onChange={setQuery} placeholder={plottingMode === "course" ? "Search courses by code or title..." : "Search lecturers by ID, name, expertise, or course..."} />
          </label>
          <div className="space-y-1.5">
            <span className="block text-[10px] font-medium uppercase tracking-[0.18em] text-transparent">Actions</span>
            <div className="flex flex-wrap gap-3">
              <input ref={importInputRef} type="file" accept=".xlsx,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" className="hidden" onChange={handleImport} />
              <Button variant="secondary" className="h-12 whitespace-nowrap px-4" onClick={() => importInputRef.current?.click()}><Icons.download className="h-4 w-4" />Import plotting</Button>
              <Button variant="secondary" className="h-12 whitespace-nowrap px-4" onClick={() => exportPlottingToXLSX(lecturers, courses, plannedCounts, assignmentMap)} disabled={!plannedTotal}><Icons.download className="h-4 w-4" />Export plotting XLSX</Button>
            </div>
          </div>
        </div>
      </Card>
      {importMessage && <p className={`rounded-xl px-3 py-2 text-sm font-normal ${importMessage.startsWith("Imported") ? "bg-[#dff3e6] text-[#315f45]" : "bg-[#fde2e2] text-[#8a3a3a]"}`}>{importMessage}</p>}
      <div className="grid gap-4 md:grid-cols-3">
        <Stat label="Planned Classes" value={plannedTotal} icon={Icons.file} />
        <Stat label="Assigned Classes" value={assignedTotal} icon={Icons.check} tone={assignedTotal === plannedTotal && plannedTotal ? "amber" : "blue"} />
        <Stat label="Unassigned Classes" value={Math.max(0, plannedTotal - assignedTotal)} icon={Icons.users} />
      </div>
      {plottingMode === "course" ? (
        <Card className="overflow-hidden">
          <div className="border-b border-[#dce9e6] p-5">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#6d7d86]">Courses</p>
            <p className="mt-1 text-sm text-[#61717b]">Open a course row to plan classes and assign lecturers.</p>
          </div>
          <div className="divide-y divide-[#edf3f1]">
            {visibleCourses.map((course) => {
              const planned = classCounts[course.code] || 0;
              const assigned = (assignmentMap[course.code] || []).filter(Boolean).length;
              const selected = selectedCourseCode === course.code;
              const lecturerOptions = selected ? lecturerOptionsForCourse(course) : [];
              return (
                <div key={course.code} className={selected ? "bg-[#fbfdf8]" : ""}>
                  <div className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between">
                    <button type="button" onClick={() => setSelectedCourseCode(selected ? "" : course.code)} className="min-w-0 flex-1 text-left">
                      <p className="text-sm font-normal text-[#315577]">{course.code}</p>
                      <p className="mt-1 font-medium text-[#26353f]">{course.title}</p>
                    </button>
                    <div className="flex flex-wrap items-center gap-3">
                      <Badge tone={assigned >= planned && planned ? "green" : planned ? "amber" : "slate"}>{assigned} / {planned}</Badge>
                      <Button variant="secondary" onClick={() => setSelectedCourseCode(selected ? "" : course.code)}>{selected ? "Close" : "Plot"}</Button>
                    </div>
                  </div>
                  {selected && (
                    <div className="px-4 pb-5">
                      <div className="rounded-xl border border-[#dce9e6] bg-[#fffffb] p-4">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div>
                            <p className="text-sm font-normal text-[#315577]">{course.code}</p>
                            <h3 className="text-xl font-medium text-[#26353f]">{course.title}</h3>
                            <p className="mt-1 text-sm text-[#61717b]">Plan classes, then assign one lecturer for each class in this course.</p>
                          </div>
                          <div className="flex flex-wrap items-end gap-3">
                            <label className="space-y-1.5">
                              <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#6d7d86]">Planned classes</span>
                              <input type="number" min="0" max={MAX_CLASS_ASSIGNMENTS_PER_COURSE} value={planned} onChange={(event) => updateCoursePlan(course.code, event.target.value)} className="w-28 rounded-lg border border-[#dce9e6] bg-[#fffffb] px-2 py-2 text-sm font-normal text-[#26353f] outline-none focus:border-[#9bbfe8]" />
                            </label>
                            <Badge tone={assigned >= planned && planned ? "green" : planned ? "amber" : "slate"}>{assigned} assigned</Badge>
                          </div>
                        </div>
                        <div className="mt-5 grid gap-3 md:grid-cols-2">
                          {Array.from({ length: planned }, (_, index) => {
                            const selectedId = assignmentMap[course.code]?.[index] || "";
                            const selectedClassLecturer = lecturers.find((lecturer) => lecturer.id === selectedId);
                            return (
                              <label key={`${course.code}-${index}`} className="space-y-1.5 rounded-xl border border-[#dce9e6] bg-[#fffffb] p-3">
                                <span className="flex items-center justify-between gap-2 text-xs font-medium uppercase tracking-[0.15em] text-[#6d7d86]">
                                  <span>{course.code}.{index + 1}</span>
                                  {selectedClassLecturer && expertiseMatchesCourse(selectedClassLecturer, course) && <Badge tone="green">Expertise match</Badge>}
                                </span>
                                <div className="relative">
                                  <select value={selectedId} onChange={(event) => assignLecturer(course.code, index, event.target.value)} className="w-full appearance-none rounded-lg border border-[#dce9e6] bg-[#fffffb] px-3 py-2.5 pr-9 text-sm font-normal text-[#3f4f58] outline-none focus:border-[#9bbfe8]">
                                    <option value="">Unassigned</option>
                                    {lecturerOptions.map((lecturer) => {
                                      const lecturerTotal = countLecturerAssignments(assignmentMap, lecturer.id);
                                      const isFull = lecturerTotal >= LECTURER_CLASS_LIMIT && selectedId !== lecturer.id;
                                      const labelPrefix = isFull ? "Full - " : expertiseMatchesCourse(lecturer, course) ? "Recommended - " : "";
                                      return <option key={lecturer.id} value={lecturer.id} disabled={isFull}>{labelPrefix}{lecturer.name} ({lecturer.id})</option>;
                                    })}
                                  </select>
                                  <Icons.chevronDown className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-[#8aa1ad]" />
                                </div>
                                {selectedClassLecturer && <p className="text-xs text-[#61717b]">{selectedClassLecturer.expertise.join(", ") || "No expertise listed"}</p>}
                              </label>
                            );
                          })}
                        </div>
                        {!planned && <div className="mt-5 rounded-xl border border-dashed border-[#dce9e6] bg-[#f7fbf6] p-6 text-center text-sm text-[#61717b]">Set planned classes for this course to begin assigning lecturers.</div>}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            {visibleCourses.length === 0 && <p className="p-6 text-center text-sm text-[#61717b]">No courses match your search.</p>}
          </div>
        </Card>
      ) : (
        <>
          <Card className="mobile-card-table overflow-hidden">
            <div className="flex flex-col gap-4 border-b border-[#dce9e6] p-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#6d7d86]">Lecturers</p>
                <p className="mt-1 text-sm text-[#61717b]">Review lecturers, then open a pop-up card to adjust plotted course counts.</p>
              </div>
              <div className="grid w-full gap-3 sm:grid-cols-2 lg:w-auto">
                <label className="space-y-1.5 lg:w-48">
                  <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#6d7d86]">Plotted courses</span>
                  <div className="relative">
                    <select value={lecturerPlottedFilter} onChange={(event) => setLecturerPlottedFilter(event.target.value)} className="h-12 w-full appearance-none rounded-xl border border-[#dce9e6] bg-[#fffffb] px-3 pr-9 text-sm font-normal text-[#3f4f58] outline-none">
                      <option>All</option>
                      <option>0</option>
                      <option>1</option>
                      <option>2</option>
                      <option>3</option>
                      <option>4</option>
                    </select>
                    <Icons.chevronDown className="pointer-events-none absolute right-3 top-4 h-4 w-4 text-[#8aa1ad]" />
                  </div>
                </label>
                <label className="space-y-1.5 lg:w-56">
                  <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#6d7d86]">Sort</span>
                  <div className="relative">
                    <select value={lecturerSort} onChange={(event) => setLecturerSort(event.target.value)} className="h-12 w-full appearance-none rounded-xl border border-[#dce9e6] bg-[#fffffb] px-3 pr-9 text-sm font-normal text-[#3f4f58] outline-none">
                      <option>Default</option>
                      <option>Not plotted first</option>
                      <option>Most plotted first</option>
                    </select>
                    <Icons.chevronDown className="pointer-events-none absolute right-3 top-4 h-4 w-4 text-[#8aa1ad]" />
                  </div>
                </label>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-left text-sm">
                <thead className="bg-[#f7fbf6] text-[10px] uppercase tracking-[0.15em] text-[#6d7d86]">
                  <tr>
                    <th className="px-4 py-4">{lecturerSortHeader("ID", "id")}</th>
                    <th className="px-4 py-4">{lecturerSortHeader("Degree", "degree")}</th>
                    <th className="px-4 py-4">{lecturerSortHeader("Full Name", "name")}</th>
                    <th className="px-4 py-4 font-medium">#Plotted</th>
                    <th className="px-4 py-4 font-medium">Available</th>
                    <th className="px-4 py-4 font-medium">Expertise</th>
                    <th className="px-4 py-4 font-medium">Plotted Courses</th>
                    <th className="px-4 py-4 font-medium">Plot</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleLecturers.map((lecturer) => {
                    const selected = selectedLecturerId === lecturer.id;
                    return (
                      <tr key={lecturer.id} className={`border-t border-[#edf3f1] ${selected ? "bg-[#fbfdf8]" : ""}`}>
                        <td className="px-4 py-4 font-normal text-[#315577]">{lecturer.id}</td>
                        <td className="px-4 py-4"><Badge tone="slate">{lecturer.degree}</Badge></td>
                        <td className="px-4 py-4 font-medium text-[#26353f]">{lecturer.name}</td>
                        <td className="px-4 py-4 font-normal text-[#3f4f58]">{lecturer.plotted.length}</td>
                        <td className="px-4 py-4"><Badge tone={availabilityTone(lecturer.available)}>{lecturer.available}</Badge></td>
                        <td className="px-4 py-4"><div className="flex max-w-sm flex-wrap gap-1">{lecturer.expertise.map((item) => <Badge key={item}>{item}</Badge>)}</div></td>
                        <td className="px-4 py-4"><div className="flex max-w-md flex-wrap gap-1"><PlottedCourseBadges plotted={lecturer.plotted} courses={courses} /></div></td>
                        <td className="px-4 py-4">
                          <Button variant="secondary" onClick={() => setSelectedLecturerId(lecturer.id)}>Plot</Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {visibleLecturers.length === 0 && <p className="p-6 text-center text-sm text-[#61717b]">No lecturers match your search.</p>}
          </Card>
          {selectedLecturer && (
            <Modal title="Plot lecturer" onClose={() => setSelectedLecturerId("")}>
              <div className="space-y-4">
                <div className="rounded-xl border border-[#dce9e6] bg-[#f7fbf6] p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-normal text-[#315577]">{selectedLecturer.id}</p>
                      <h3 className="text-xl font-medium text-[#26353f]">{selectedLecturer.name}</h3>
                      <p className="mt-1 text-sm font-normal text-[#61717b]">{selectedLecturer.expertise.join(", ") || "No expertise listed"}</p>
                    </div>
                    <Badge tone={selectedLecturer.plotted.length >= LECTURER_CLASS_LIMIT ? "amber" : selectedLecturer.plotted.length ? "blue" : "slate"}>{selectedLecturer.plotted.length} / {LECTURER_CLASS_LIMIT} assigned classes</Badge>
                  </div>
                </div>
                <div className="grid max-h-[56vh] gap-3 overflow-y-auto pr-1 md:grid-cols-2">
                  {courses.map((course) => {
                    const count = selectedLecturerCourseCounts[course.code] || 0;
                    const lecturerTotal = countLecturerAssignments(assignmentMap, selectedLecturer.id);
                    const maxCountForCourse = count + Math.max(0, LECTURER_CLASS_LIMIT - lecturerTotal);
                    const planned = classCounts[course.code] || 0;
                    const assigned = (assignmentMap[course.code] || []).filter(Boolean).length;
                    return (
                      <label key={`${selectedLecturer.id}-${course.code}`} className="grid grid-cols-[1fr_76px] items-center gap-3 rounded-xl border border-[#dce9e6] bg-[#fffffb] p-3">
                        <span>
                          <span className="block text-sm font-normal text-[#26353f]">{course.title}</span>
                          <span className="mt-1 block text-xs font-normal text-[#61717b]">{course.code} · {assigned} / {planned} assigned</span>
                        </span>
                        <input type="number" min="0" max={maxCountForCourse} value={count} onChange={(event) => setLecturerCourseCount(course.code, event.target.value, selectedLecturer.id)} className="w-full rounded-lg border border-[#dce9e6] bg-[#fffffb] px-2 py-2 text-sm font-normal text-[#26353f] outline-none focus:border-[#9bbfe8] disabled:opacity-50" title={maxCountForCourse === 0 ? "This lecturer already has 4 assigned classes." : undefined} disabled={maxCountForCourse === 0} />
                      </label>
                    );
                  })}
                </div>
                <div className="flex justify-end">
                  <Button variant="secondary" onClick={() => setSelectedLecturerId("")}>Done</Button>
                </div>
              </div>
            </Modal>
          )}
        </>
      )}
    </div>
  );
}

function CourseForm({ initial, onSave, onClose }) {
  const [form, setForm] = useState(initial || { code: "", title: "", credits: 3 });
  return <div className="space-y-4"><FormGrid><PlainInput label="Code" value={form.code} onChange={(value) => setForm({ ...form, code: value.toUpperCase() })} /><PlainInput label="Credits" type="number" value={form.credits} onChange={(value) => setForm({ ...form, credits: value })} /></FormGrid><PlainInput label="Course title" value={form.title} onChange={(value) => setForm({ ...form, title: value })} /><div className="flex justify-end gap-3"><Button variant="secondary" onClick={onClose}>Cancel</Button><Button disabled={!form.code || !form.title} onClick={() => onSave({ ...form, credits: Number(form.credits) })}>Save course</Button></div></div>;
}

function Courses({ courses, setCourses, setLecturers, setTermPlottings, setCourseClassPlans }) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("code");
  const [modal, setModal] = useState(null);
  const rows = useMemo(() => courses.filter((course) => includes(course.code, query) || includes(course.title, query) || includes(course.credits, query)).sort((a, b) => String(a[sort]).localeCompare(String(b[sort]))), [courses, query, sort]);
  const save = (item) => { setCourses((prev) => prev.some((course) => course.code === item.code) ? prev.map((course) => course.code === item.code ? item : course) : [item, ...prev]); setModal(null); };
  const remove = (code) => { setCourses((prev) => prev.filter((course) => course.code !== code)); setLecturers((prev) => prev.map((lecturer) => ({ ...lecturer, plotted: lecturer.plotted.filter((item) => item !== code) }))); setTermPlottings((prev) => prev.map((row) => ({ ...row, plotted: row.plotted.filter((item) => item !== code) }))); setCourseClassPlans((prev) => Object.fromEntries(Object.entries(prev).map(([termCode, plan]) => [termCode, Object.fromEntries(Object.entries(plan || {}).filter(([courseCode]) => courseCode !== code))]))); };
  return <div className="space-y-5"><div className="flex justify-end"><Button onClick={() => setModal({})}><Icons.plus className="h-4 w-4" />New course</Button></div><Card className="grid items-end gap-3 p-4 md:grid-cols-[1fr_220px]"><TextInput icon={Icons.search} value={query} onChange={setQuery} placeholder="Search by code, title, or credits..." /><SelectBox label="Sort by" value={sort} onChange={setSort} options={["code", "title", "credits"]} /></Card><Card className="divide-y divide-slate-100">{rows.map((course) => <div key={course.code} className="flex items-center justify-between gap-4 p-4"><div className="flex items-center gap-4"><div className="rounded-xl bg-blue-50 p-3 text-blue-700"><Icons.book /></div><div><p className="font-medium text-slate-950"><span className="font-normal text-blue-700">{course.code}</span> · {course.title}</p><p className="text-sm font-normal text-slate-500">{course.credits} credits</p></div></div><div className="flex gap-3"><button onClick={() => setModal(course)}><Icons.edit className="h-4 w-4" /></button><button onClick={() => remove(course.code)}><Icons.trash className="h-4 w-4 text-red-500" /></button></div></div>)}{rows.length === 0 && <p className="p-6 text-center text-sm text-slate-500">No courses match your search.</p>}</Card>{modal && <Modal title={modal.code ? "Edit course" : "New course"} onClose={() => setModal(null)}><CourseForm initial={modal.code ? modal : null} onSave={save} onClose={() => setModal(null)} /></Modal>}</div>;
}

function TermForm({ initial, onSave, onClose }) {
  const [form, setForm] = useState(initial || { name: "", code: "", ay: "2025/2026", semester: "Semester 1", active: false });
  return <div className="space-y-4"><PlainInput label="Term name" value={form.name} onChange={(value) => setForm({ ...form, name: value })} /><FormGrid><PlainInput label="Code" value={form.code} onChange={(value) => setForm({ ...form, code: value })} /><PlainInput label="Academic year" value={form.ay} onChange={(value) => setForm({ ...form, ay: value })} /></FormGrid><FormGrid><PlainInput label="Semester" value={form.semester} onChange={(value) => setForm({ ...form, semester: value })} /><label className="mt-7 flex items-center gap-2 text-sm font-normal text-slate-700"><input type="checkbox" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} /> Set as active term</label></FormGrid><div className="flex justify-end gap-3"><Button variant="secondary" onClick={onClose}>Cancel</Button><Button disabled={!form.name || !form.code} onClick={() => onSave(form)}>Save term</Button></div></div>;
}

function Terms({ terms, setTerms, onActiveTermChange }) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("name");
  const [modal, setModal] = useState(null);
  const rows = terms.filter((term) => [term.name, term.code, term.ay, term.semester, term.active ? "active" : "inactive"].some((value) => includes(value, query))).sort((a, b) => String(a[sort]).localeCompare(String(b[sort])));
  const save = (item) => { setTerms((prev) => { const next = prev.some((term) => term.code === item.code) ? prev.map((term) => term.code === item.code ? item : term) : [item, ...prev]; return item.active ? next.map((term) => ({ ...term, active: term.code === item.code })) : next; }); if (item.active) onActiveTermChange(item.code); setModal(null); };
  const remove = (code) => setTerms((prev) => prev.filter((term) => term.code !== code));
  return <div className="space-y-5"><div className="flex justify-end"><Button onClick={() => setModal({})}><Icons.plus className="h-4 w-4" />New term</Button></div><Card className="grid items-end gap-3 p-4 md:grid-cols-[1fr_220px]"><TextInput icon={Icons.search} value={query} onChange={setQuery} placeholder="Search term, code, year, semester, or status..." /><SelectBox label="Sort by" value={sort} onChange={setSort} options={["name", "code", "ay", "semester"]} /></Card>{rows.map((term) => <Card key={term.code} className="p-5"><div className="flex items-center justify-between gap-4"><div className="flex items-center gap-4"><Icons.check className={term.active ? "h-6 w-6 text-emerald-500" : "h-6 w-6 text-slate-300"} /><div><p className="text-lg font-medium text-slate-950">{term.name}</p><p className="text-sm font-normal text-slate-500">{term.code} · AY {term.ay} · {term.semester} · {term.active ? "active" : "inactive"}</p></div></div><div className="flex gap-3"><button onClick={() => setModal(term)}><Icons.edit className="h-4 w-4" /></button><button onClick={() => remove(term.code)}><Icons.trash className="h-4 w-4 text-red-500" /></button></div></div></Card>)}{rows.length === 0 && <p className="p-6 text-center text-sm text-slate-500">No terms match your search.</p>}{modal && <Modal title={modal.code ? "Edit term" : "New term"} onClose={() => setModal(null)}><TermForm initial={modal.code ? modal : null} onSave={save} onClose={() => setModal(null)} /></Modal>}</div>;
}

function LoginScreen({ onLogin, onBack, onDemoLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const isDemoCredentials = email.trim().toLowerCase() === DEMO_ACCOUNT.email && password === DEMO_ACCOUNT.password;
  const submit = async () => {
    setError("");
    if (isDemoCredentials) {
      onDemoLogin();
      return;
    }
    setBusy(true);
    try {
      const loggedInEmail = await signIn(email, password);
      onLogin(loggedInEmail);
    } catch (err) {
      setError(err.message || "Authentication failed.");
    } finally {
      setBusy(false);
    }
  };
  const useDemoAccount = () => {
    setEmail(DEMO_ACCOUNT.email);
    setPassword(DEMO_ACCOUNT.password);
    setError("");
    onDemoLogin();
  };
  return (
    <div className="min-h-screen bg-white px-5 py-5 text-[#102f52] sm:px-8 lg:px-12">
      <div className="mx-auto flex min-h-[calc(100vh-2.5rem)] max-w-7xl flex-col">
        <motion.nav
          initial={{ opacity: 0, y: -18, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto flex min-h-20 w-full max-w-6xl flex-wrap items-center justify-between gap-4 rounded-[1.75rem] border border-[#d7e6f7] bg-white px-5 py-4 shadow-[0_22px_70px_rgba(0,91,170,0.10)] sm:px-7 lg:px-9"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#005baa] text-[#ffd23f] shadow-sm">
              <Icons.graduation className="h-6 w-6" />
            </span>
            <div>
              <p className="text-2xl font-black tracking-tight sm:text-3xl">Universitas Terbuka</p>
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#005baa]">English Department</p>
            </div>
          </div>

          <div className="flex items-center rounded-full bg-[#eef5ff] p-1 text-sm font-black">
            <button type="button" onClick={onBack} className="rounded-full px-4 py-2 text-[#315577] hover:bg-white sm:px-5">
              Public Mode
            </button>
            <button type="button" className="rounded-full bg-[#ffd23f] px-5 py-2 text-[#102f52] shadow-sm sm:px-6">
              Login Mode
            </button>
          </div>
        </motion.nav>

        <main className="relative mx-auto grid w-full max-w-6xl flex-1 items-center gap-10 py-12 lg:grid-cols-[0.95fr_1.05fr] lg:py-16">
          <motion.div
            initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.7, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10"
          >
            <div className="mb-7 inline-flex rounded-full border border-[#d7e6f7] bg-white px-4 py-2 text-sm font-semibold text-[#005baa] shadow-sm">
              Lecturer Database
            </div>
            <h1 className="max-w-2xl text-5xl font-black leading-[0.96] tracking-tight text-[#102f52] sm:text-6xl lg:text-7xl">
              Manage lecturers, plot courses, see the big picture.
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-8 text-[#4f6478]">
              A single database for degrees, expertise, availability and teaching load across the department.
            </p>
            <p className="mt-10 hidden text-xs font-semibold text-[#7c8ea1] lg:block">© 2026 Universitas Terbuka — English Department</p>
          </motion.div>

          <div className="relative mx-auto w-full max-w-2xl lg:mx-0">
            <motion.div
              initial={{ opacity: 0, x: -20, rotate: -3 }}
              animate={{ opacity: 1, x: 0, rotate: -2 }}
              transition={{ duration: 0.65, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="absolute -left-8 top-8 hidden rounded-2xl border border-[#d7e6f7] bg-white px-5 py-4 shadow-[0_18px_50px_rgba(0,91,170,0.10)] lg:block"
            >
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#c99800]">Restricted access</p>
              <p className="mt-1 text-lg font-black text-[#102f52]">Department data</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -18, rotate: 4 }}
              animate={{ opacity: 1, x: 0, rotate: 3 }}
              transition={{ duration: 0.65, delay: 0.48, ease: [0.22, 1, 0.36, 1] }}
              className="absolute -bottom-7 left-8 hidden rounded-2xl border border-[#d7e6f7] bg-white px-5 py-4 shadow-[0_18px_50px_rgba(0,91,170,0.10)] lg:block"
            >
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#005baa]">Database</p>
              <p className="mt-1 text-lg font-black text-[#102f52]">{USE_SUPABASE ? "Configured" : "Not configured"}</p>
            </motion.div>

            <motion.section
              initial={{ opacity: 0, y: 28, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.72, delay: 0.24, ease: [0.22, 1, 0.36, 1] }}
              className="relative z-10 ml-auto w-full rounded-[2rem] border border-[#d7e6f7] bg-white p-5 shadow-[0_28px_90px_rgba(0,91,170,0.14)] sm:p-7 lg:max-w-md lg:p-8"
            >
              <p className="text-[10px] font-black uppercase tracking-[0.32em] text-[#005baa]">Restricted access</p>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-[#102f52] sm:text-4xl">Sign in</h2>
              <p className="mt-3 text-base leading-7 text-[#4f6478]">
                {USE_SUPABASE ? "Welcome back! Please sign in to your account." : "Supabase is not configured. Ask an administrator to set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY."}
              </p>

              <div className="mt-6 space-y-4">
                <label className="block">
                  <span className="mb-2 block text-sm font-black text-[#102f52]">Email</span>
                  <TextInput icon={Icons.users} value={email} onChange={setEmail} placeholder="Email address" />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-black text-[#102f52]">Password</span>
                  <TextInput icon={Icons.check} value={password} onChange={setPassword} placeholder="Password" type="password" />
                </label>
                {error && <p className="rounded-xl bg-[#fde2e2] px-3 py-2 text-sm font-semibold text-[#8a3a3a]">{error}</p>}
                <Button className="w-full !rounded-2xl !bg-[#005baa] py-3 text-base !text-white hover:!bg-[#004984]" onClick={submit} disabled={busy || !email || !password || (!USE_SUPABASE && !isDemoCredentials)}>
                  {busy ? "Processing..." : "Sign in"}
                </Button>
                <button type="button" onClick={useDemoAccount} className="w-full rounded-2xl border border-[#d7e6f7] bg-white px-4 py-3 text-base font-semibold text-[#102f52] transition hover:bg-[#f4f9ff]">
                  Use demo account
                </button>
                <p className="text-center text-xs font-semibold leading-5 text-[#6f8295]">
                  Demo account: {DEMO_ACCOUNT.email} / {DEMO_ACCOUNT.password}
                </p>
              </div>
            </motion.section>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  const [active, setActive] = useState("dashboard");
  const [session, setSession] = useState(() => {
    const initialEmail = getStoredUserEmail();
    return { userEmail: initialEmail, entryMode: initialEmail ? "admin" : "landing", isDemo: false };
  });
  const userEmail = session.userEmail;
  const entryMode = session.entryMode;
  const isDemoSession = Boolean(session.isDemo);
  const [lecturers, setLecturers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [terms, setTerms] = useState([]);
  const [termPlottings, setTermPlottings] = useState([]);
  const [courseClassPlans, setCourseClassPlans] = useState(getStoredCourseClassPlans);
  const [selectedTermCode, setSelectedTermCode] = useState("");
  const [dbStatus, setDbStatus] = useState(USE_SUPABASE ? "Signed out" : "Supabase not configured");
  const [isHydrated, setIsHydrated] = useState(false);
  const [canSyncLecturerLabels, setCanSyncLecturerLabels] = useState(false);
  const hydratedRef = useRef(false);
  const syncingRef = useRef(false);
  const setHydrated = useCallback((value) => {
    hydratedRef.current = value;
    setIsHydrated(value);
  }, []);
  const setUserEmail = useCallback((email) => {
    setSession((prev) => ({ ...prev, userEmail: typeof email === "function" ? email(prev.userEmail) : email }));
  }, []);
  const setEntryMode = useCallback((entryMode) => {
    setSession((prev) => ({ ...prev, entryMode }));
  }, []);
  const applyDatabaseSnapshot = useCallback((snapshot) => {
    setLecturers(snapshot.lecturers);
    setCourses(snapshot.courses);
    setTerms(snapshot.terms);
    setTermPlottings(snapshot.termPlottings);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadDatabase() {
      if (isDemoSession) {
        applyDatabaseSnapshot(cloneDemoSnapshot());
        setCourseClassPlans(cloneDemoCourseClassPlans());
        setSelectedTermCode("DEMO-2026-1");
        setCanSyncLecturerLabels(true);
        setHydrated(true);
        setDbStatus("Demo data loaded");
        return;
      }
      if (!USE_SUPABASE || !userEmail || !getAccessToken()) {
        setHydrated(false);
        if (userEmail) {
          signOut();
          setUserEmail("");
        }
        return;
      }
      try {
        setHydrated(false);
        setDbStatus("Loading database...");
        const [snapshot, lecturerLabelsSupported] = await Promise.all([fetchDatabaseSnapshot(), fetchLecturerLabelColumnSupport()]);
        if (cancelled) return;
        setCanSyncLecturerLabels(lecturerLabelsSupported);
        applyDatabaseSnapshot(snapshot);
        setHydrated(true);
        setDbStatus(lecturerLabelsSupported ? "Supabase connected" : "Supabase connected. Run lecturer labels SQL to save ratings and warning notes.");
      } catch (error) {
        setHydrated(false);
        if (error.status === 401 || error.status === 403) {
          signOut();
          setUserEmail("");
          setLecturers([]);
          setCourses([]);
          setTerms([]);
        setTermPlottings([]);
        setSelectedTermCode("");
        setCanSyncLecturerLabels(false);
        setDbStatus("Session expired. Please sign in again.");
          return;
        }
        setDbStatus(error.message || "Database load failed");
      }
    }
    loadDatabase();
    return () => { cancelled = true; };
  }, [applyDatabaseSnapshot, isDemoSession, setHydrated, setUserEmail, userEmail]);

  const loadPublicDirectory = useCallback(async () => {
    if (!USE_SUPABASE) {
      setHydrated(false);
      setDbStatus("Supabase not configured");
      return;
    }
    try {
      setHydrated(false);
      setDbStatus("Loading public directory...");
      const snapshot = await fetchPublicDatabaseSnapshot();
      applyDatabaseSnapshot(snapshot);
      setHydrated(true);
      setDbStatus("Public directory ready");
    } catch (error) {
      setHydrated(false);
      setDbStatus(error.message || "Public directory load failed");
    }
  }, [applyDatabaseSnapshot, setHydrated]);

  useEffect(() => {
    if (entryMode === "public") loadPublicDirectory();
  }, [entryMode, loadPublicDirectory]);

  useEffect(() => {
    if (!userEmail && entryMode === "admin") setEntryMode("login");
  }, [entryMode, setEntryMode, userEmail]);

  useEffect(() => {
    if (typeof localStorage === "undefined") return;
    if (isDemoSession) return;
    localStorage.setItem(COURSE_CLASS_PLANS_STORAGE_KEY, JSON.stringify(courseClassPlans));
  }, [courseClassPlans, isDemoSession]);

  const activeTermCode = terms.find((term) => term.active)?.code || "";
  const effectiveSelectedTermCode = terms.some((term) => term.code === selectedTermCode) ? selectedTermCode : activeTermCode || terms[0]?.code || "";
  const validTermPlottings = useMemo(() => {
    const lecturerIds = new Set(lecturers.map((lecturer) => lecturer.id));
    return termPlottings.filter((row) => lecturerIds.has(row.lecturer_id));
  }, [lecturers, termPlottings]);

  useEffect(() => {
    if (isDemoSession || !USE_SUPABASE || !userEmail || !hydratedRef.current || syncingRef.current) return;
    const timer = window.setTimeout(async () => {
      try {
        syncingRef.current = true;
        setDbStatus("Saving...");
        await Promise.all([
          syncTable("lecturers", serializeLecturersForDatabase(lecturers, canSyncLecturerLabels), "id"),
          syncTable("courses", courses, "code"),
          syncTable("academic_terms", terms, "code"),
          syncTable("term_plottings", validTermPlottings, "id"),
        ]);
        setDbStatus("Supabase connected");
      } catch (error) {
        setDbStatus(error.message || "Database sync failed");
      } finally {
        syncingRef.current = false;
      }
    }, 500);
    return () => window.clearTimeout(timer);
  }, [lecturers, courses, terms, validTermPlottings, userEmail, isDemoSession, canSyncLecturerLabels]);

  const handleLogin = (email) => {
    setHydrated(false);
    setSession({ userEmail: email, entryMode: "admin", isDemo: false });
  };

  const handleDemoLogin = () => {
    signOut();
    setActive("dashboard");
    setHydrated(false);
    setSession({ userEmail: DEMO_ACCOUNT.email, entryMode: "admin", isDemo: true });
  };

  const handleLogout = () => {
    signOut();
    setHydrated(false);
    setSession({ userEmail: "", entryMode: "landing", isDemo: false });
    setLecturers([]);
    setCourses([]);
    setTerms([]);
    setTermPlottings([]);
    setCourseClassPlans(getStoredCourseClassPlans());
    setCanSyncLecturerLabels(false);
    setSelectedTermCode("");
    setDbStatus(USE_SUPABASE ? "Signed out" : "Supabase not configured");
  };

  const Page = { dashboard: Dashboard, lecturers: Lecturers, plotting: Plotting, courses: Courses, terms: Terms }[active];
  const termScopedLecturers = useMemo(() => getTermScopedLecturers(lecturers, validTermPlottings, effectiveSelectedTermCode), [lecturers, validTermPlottings, effectiveSelectedTermCode]);
  const setTermScopedLecturers = useCallback((updater) => {
    if (!effectiveSelectedTermCode) return;
    setTermPlottings((prev) => {
      const scoped = getTermScopedLecturers(lecturers, prev, effectiveSelectedTermCode);
      const nextScoped = typeof updater === "function" ? updater(scoped) : updater;
      const nextRows = nextScoped.map((lecturer) => buildTermPlottingRow(effectiveSelectedTermCode, lecturer));
      return prev.filter((row) => row.term_code !== effectiveSelectedTermCode).concat(nextRows);
    });
  }, [lecturers, effectiveSelectedTermCode]);
  const pageLecturers = active === "dashboard" || active === "lecturers" || active === "plotting" ? termScopedLecturers : lecturers;
  const pageSetLecturers = active === "plotting" ? setTermScopedLecturers : setLecturers;
  const props = { lecturers: pageLecturers, directoryLecturers: lecturers, setLecturers: pageSetLecturers, setTermLecturers: setTermScopedLecturers, courses, setCourses, terms, setTerms, setTermPlottings, selectedTermCode: effectiveSelectedTermCode, courseClassPlans, setCourseClassPlans, onActiveTermChange: setSelectedTermCode, canSyncData: !isDemoSession, canSyncLecturerLabels };

  if (entryMode === "landing") return <LandingScreen onPublicMode={() => setEntryMode("public")} onLoginMode={() => setEntryMode("login")} />;
  if (entryMode === "public") return <PublicLookupScreen lecturers={lecturers} courses={courses} terms={terms} termPlottings={termPlottings} selectedTermCode={effectiveSelectedTermCode} setSelectedTermCode={setSelectedTermCode} dbStatus={dbStatus} isHydrated={isHydrated} onBack={() => setEntryMode("landing")} onLogin={() => setEntryMode("login")} onRefresh={loadPublicDirectory} />;
  if (!userEmail) return <LoginScreen onLogin={handleLogin} onDemoLogin={handleDemoLogin} onBack={() => setEntryMode("landing")} />;

  return <div className="min-h-screen bg-white pb-48 text-[#102f52] sm:pb-32"><main className="min-w-0 p-3 sm:p-6 lg:p-10"><div className="mx-auto max-w-7xl"><div className="mb-4 flex flex-wrap items-center justify-end gap-3"><SupabaseStatusIcon connected={isHydrated} label={dbStatus} /><Badge tone="slate">{userEmail}</Badge></div><Header active={active} terms={terms} selectedTermCode={effectiveSelectedTermCode} setSelectedTermCode={setSelectedTermCode} /><motion.div key={`${active}-${effectiveSelectedTermCode}`} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}><Page {...props} /></motion.div></div></main><FloatingBottomNav active={active} setActive={setActive} onLogout={handleLogout} /></div>;
}
