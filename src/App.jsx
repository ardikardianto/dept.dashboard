import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { createAuthScreens } from "./features/AuthScreens.jsx";
import { createCatalogFeatures } from "./features/CatalogFeatures.jsx";
import { createDirectoryFeatures } from "./features/DirectoryFeatures.jsx";
import { createPlottingComponent } from "./features/Plotting.jsx";
import {
  LECTURER_CLASS_LIMIT,
  buildAutoPilotPlotting,
  calculatePlottingHealth,
  expertiseMatchesCourse,
  getLecturerRatingClassLimit,
} from "./lib/autoPilot.js";
import {
  USE_SUPABASE,
  clearPendingSync,
  createDatabaseSnapshotTools,
  getAccessToken,
  getStoredPendingSync,
  getStoredUserEmail,
  signIn,
  signOut,
  storePendingSync,
  syncTable,
  upsertRows,
} from "./lib/database.js";
import { createImportExportTools } from "./lib/importExport.js";
import { runSelfTests } from "./lib/selfTests.js";

function IconBase({ children, className = "h-5 w-5", ...props }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

const Icons = {
  book: (p) => (
    <IconBase {...p}>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5z" />
    </IconBase>
  ),
  calendar: (p) => (
    <IconBase {...p}>
      <path d="M8 2v4M16 2v4M3 10h18" />
      <rect x="3" y="4" width="18" height="18" rx="2" />
    </IconBase>
  ),
  chevronDown: (p) => (
    <IconBase {...p}>
      <path d="m6 9 6 6 6-6" />
    </IconBase>
  ),
  download: (p) => (
    <IconBase {...p}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="M7 10l5 5 5-5" />
      <path d="M12 15V3" />
    </IconBase>
  ),
  edit: (p) => (
    <IconBase {...p}>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </IconBase>
  ),
  eye: (p) => (
    <IconBase {...p}>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </IconBase>
  ),
  file: (p) => (
    <IconBase {...p}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
      <path d="M14 2v6h6" />
      <path d="M8 13h8M8 17h8" />
    </IconBase>
  ),
  graduation: (p) => (
    <IconBase {...p}>
      <path d="m22 10-10-5-10 5 10 5 10-5Z" />
      <path d="M6 12v5c3 2 9 2 12 0v-5" />
      <path d="M22 10v6" />
    </IconBase>
  ),
  dashboard: (p) => (
    <IconBase {...p}>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
    </IconBase>
  ),
  logout: (p) => (
    <IconBase {...p}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5" />
      <path d="M21 12H9" />
    </IconBase>
  ),
  menu: (p) => (
    <IconBase {...p}>
      <path d="M4 6h16M4 12h16M4 18h16" />
    </IconBase>
  ),
  plus: (p) => (
    <IconBase {...p}>
      <path d="M12 5v14M5 12h14" />
    </IconBase>
  ),
  search: (p) => (
    <IconBase {...p}>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </IconBase>
  ),
  star: (p) => (
    <IconBase {...p}>
      <path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8-6.2-3.3-6.2 3.3 1.2-6.8-5-4.9 6.9-1L12 2Z" />
    </IconBase>
  ),
  trash: (p) => (
    <IconBase {...p}>
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6M14 11v6" />
    </IconBase>
  ),
  users: (p) => (
    <IconBase {...p}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </IconBase>
  ),
  warning: (p) => (
    <IconBase {...p}>
      <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9v4M12 17h.01" />
    </IconBase>
  ),
  x: (p) => (
    <IconBase {...p}>
      <path d="M18 6 6 18M6 6l12 12" />
    </IconBase>
  ),
  chart: (p) => (
    <IconBase {...p}>
      <path d="M3 3v18h18" />
      <rect x="7" y="12" width="3" height="5" />
      <rect x="12" y="8" width="3" height="9" />
      <rect x="17" y="5" width="3" height="12" />
    </IconBase>
  ),
  check: (p) => (
    <IconBase {...p}>
      <circle cx="12" cy="12" r="10" />
      <path d="m9 12 2 2 4-5" />
    </IconBase>
  ),
};

const department = {
  name: "UT English Dept.",
  email: "sastra.inggris@ecampus.ut.ac.id",
  subtitle: "Lecturer Admin",
};
const TUTOR_DATA_FORM_URL = "https://sl.ut.ac.id/kepakaran_sasing";
const DEMO_ACCOUNT = { email: "demo@englishdept.test", password: "Demo@12345" };

const nav = [
  { id: "dashboard", label: "Dashboard", icon: Icons.dashboard },
  { id: "lecturers", label: "Lecturers", icon: Icons.users },
  { id: "plotting", label: "Plotting", icon: Icons.file },
  { id: "courses", label: "Courses", icon: Icons.book },
  { id: "terms", label: "Terms", icon: Icons.calendar },
];
const dashboardPalette = [
  "#005baa",
  "#ffd23f",
  "#3d8bd6",
  "#f4b000",
  "#8fbbe8",
];
const DEFAULT_DEGREE_OPTIONS = ["M.A.", "M.Ed.", "Ph.D."];
const DEFAULT_EXPERTISE_OPTIONS = [];

const uniq = (items) => [...new Set(items.filter(Boolean))];
const includes = (value, query) =>
  String(value || "")
    .toLowerCase()
    .includes(String(query || "").toLowerCase());
const lookupKey = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();
const compactLookupKey = (value) => lookupKey(value).replace(/[\s_-]+/g, "");
const findLecturerById = (lecturers, id) => {
  const normalizedId = lookupKey(id);
  const compactId = compactLookupKey(id);
  if (!normalizedId) return null;
  return (
    lecturers.find(
      (lecturer) =>
        lookupKey(lecturer.id) === normalizedId ||
        compactLookupKey(lecturer.id) === compactId,
    ) || null
  );
};
const courseTitleByCode = (courses, code) =>
  courses.find((course) => course.code === code)?.title || code;
const plottedCourseTitles = (lecturer, courses) =>
  lecturer.plotted.map((code) => courseTitleByCode(courses, code));
const plottedCourseCountLabel = (count) =>
  `${count} plotted ${count === 1 ? "course" : "courses"}`;
const termPlottingId = (termCode, lecturerId) => `${termCode}::${lecturerId}`;
const MAX_CLASS_ASSIGNMENTS_PER_COURSE = 99;
const COURSE_CLASS_PLANS_STORAGE_KEY = "ut_course_class_plans";
const SYNC_RETRY_INITIAL_DELAY = 2_000;
const SYNC_RETRY_MAX_DELAY = 60_000;

const DEMO_COURSES = [
  { code: "BING4110", title: "Basic Reading", credits: 3 },
  { code: "BING4211", title: "Intermediate Writing", credits: 3 },
  { code: "BING4312", title: "English Linguistics", credits: 3 },
  { code: "BING4413", title: "Translation Studies", credits: 3 },
  { code: "BING4514", title: "Indonesian Linguistics", credits: 3 },
  { code: "BING4615", title: "Literary Studies", credits: 3 },
];
const DEMO_LECTURERS = [
  {
    id: "D001",
    degree: "Ph.D.",
    name: "Alya Prameswari",
    email: "alya.demo@example.com",
    phone: "0812-0000-1001",
    expertise: ["English Linguistics", "English Language Teaching"],
    plotted: [],
    available: 4,
    rating: 5,
    warning_note: "",
  },
  {
    id: "D002",
    degree: "M.Ed.",
    name: "Bagus Santoso",
    email: "bagus.demo@example.com",
    phone: "0812-0000-1002",
    expertise: ["English Language Teaching"],
    plotted: ["BING4110"],
    available: 3,
    rating: 4,
    warning_note: "",
  },
  {
    id: "D003",
    degree: "M.A.",
    name: "Citra Dewi",
    email: "citra.demo@example.com",
    phone: "0812-0000-1003",
    expertise: ["Translation Studies", "English Linguistics"],
    plotted: ["BING4413", "BING4211"],
    available: 2,
    rating: 4,
    warning_note: "",
  },
  {
    id: "D004",
    degree: "Ph.D.",
    name: "Damar Nugroho",
    email: "damar.demo@example.com",
    phone: "0812-0000-1004",
    expertise: ["Literary Studies"],
    plotted: ["BING4615"],
    available: 3,
    rating: 5,
    warning_note: "",
  },
  {
    id: "D005",
    degree: "M.Ed.",
    name: "Eka Rahmawati",
    email: "eka.demo@example.com",
    phone: "0812-0000-1005",
    expertise: ["English Language Teaching", "Literary Studies"],
    plotted: ["BING4110", "BING4211", "BING4312"],
    available: 1,
    rating: 3,
    warning_note: "Needs coordination follow-up before extra classes.",
  },
  {
    id: "D006",
    degree: "M.A.",
    name: "Farhan Wijaya",
    email: "farhan.demo@example.com",
    phone: "0812-0000-1006",
    expertise: ["Indonesian Linguistics", "Translation Studies"],
    plotted: [],
    available: 4,
    rating: 0,
    warning_note: "",
  },
  {
    id: "D007",
    degree: "Ph.D.",
    name: "Gita Larasati",
    email: "gita.demo@example.com",
    phone: "0812-0000-1007",
    expertise: ["Indonesian Linguistics", "English Linguistics"],
    plotted: ["BING4514", "BING4312", "BING4413", "BING4615"],
    available: 0,
    rating: 5,
    warning_note: "",
  },
  {
    id: "D008",
    degree: "M.Ed.",
    name: "Hendra Saputra",
    email: "hendra.demo@example.com",
    phone: "0812-0000-1008",
    expertise: ["English Language Teaching", "Translation Studies"],
    plotted: ["BING4110", "BING4211"],
    available: 2,
    rating: 4,
    warning_note: "",
  },
];
const DEMO_TERMS = [
  {
    code: "DEMO-2026-1",
    name: "Demo Term 2026 - Semester 1",
    ay: "2026/2027",
    semester: "Semester 1",
    active: true,
  },
  {
    code: "DEMO-2025-2",
    name: "Demo Term 2025 - Semester 2",
    ay: "2025/2026",
    semester: "Semester 2",
    active: false,
  },
];
const DEMO_TERM_PLOTTINGS = DEMO_LECTURERS.map((lecturer) =>
  buildDemoTermPlotting("DEMO-2026-1", lecturer),
).concat([
  buildDemoTermPlotting("DEMO-2025-2", {
    ...DEMO_LECTURERS[0],
    plotted: ["BING4110", "BING4312"],
    available: 2,
  }),
  buildDemoTermPlotting("DEMO-2025-2", {
    ...DEMO_LECTURERS[2],
    plotted: ["BING4413"],
    available: 3,
  }),
  buildDemoTermPlotting("DEMO-2025-2", {
    ...DEMO_LECTURERS[4],
    plotted: ["BING4211", "BING4615"],
    available: 2,
  }),
]);
const DEMO_COURSE_CLASS_PLANS = {
  "DEMO-2026-1": {
    counts: {
      BING4110: 3,
      BING4211: 3,
      BING4312: 2,
      BING4413: 2,
      BING4514: 1,
      BING4615: 2,
    },
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
    assignments: {
      BING4110: ["D001"],
      BING4211: ["D005"],
      BING4312: ["D001"],
      BING4413: ["D003"],
      BING4615: ["D005"],
    },
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
  return Math.min(
    MAX_CLASS_ASSIGNMENTS_PER_COURSE,
    Math.max(0, Math.floor(count)),
  );
}

function getPlottedCourseCounts(plotted = []) {
  return Object.entries(
    plotted.reduce((acc, code) => {
      acc[code] = (acc[code] || 0) + 1;
      return acc;
    }, {}),
  ).map(([code, count]) => ({ code, count }));
}

function PlottedCourseBadges({ plotted, courses }) {
  return getPlottedCourseCounts(plotted).map(({ code, count }) => (
    <Badge key={code} tone="slate">
      {courseTitleByCode(courses, code)}
      {count > 1 ? ` x${count}` : ""}
    </Badge>
  ));
}

function getStoredCourseClassPlans() {
  if (typeof localStorage === "undefined") return {};
  try {
    const parsed = JSON.parse(
      localStorage.getItem(COURSE_CLASS_PLANS_STORAGE_KEY) || "{}",
    );
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function normalizeCourseClassPlans(rows = []) {
  return Object.fromEntries(
    rows
      .map((row) => [
        String(row.term_code || ""),
        {
          counts:
            row.counts && typeof row.counts === "object" ? row.counts : {},
          assignments:
            row.assignments && typeof row.assignments === "object"
              ? row.assignments
              : {},
        },
      ])
      .filter(([termCode]) => termCode),
  );
}

function serializeCourseClassPlans(courseClassPlans = {}, terms = []) {
  const termCodes = new Set(terms.map((term) => term.code));
  return Object.entries(courseClassPlans)
    .filter(([termCode]) => termCode && termCodes.has(termCode))
    .map(([termCode, plan]) => {
      const { counts, assignments } = getCoursePlanParts(
        { [termCode]: plan },
        termCode,
      );
      return { term_code: termCode, counts, assignments };
    });
}

function getCourseClassPlan(courseClassPlans, termCode) {
  const plan = courseClassPlans?.[termCode] || {};
  const counts =
    plan.counts && typeof plan.counts === "object" ? plan.counts : plan;
  return Object.fromEntries(
    Object.entries(counts)
      .filter(([code]) => code !== "assignments")
      .map(([code, count]) => [code, toClassCount(count)]),
  );
}

function getCoursePlanParts(courseClassPlans, termCode) {
  const current = courseClassPlans?.[termCode] || {};
  return {
    counts:
      current.counts && typeof current.counts === "object"
        ? current.counts
        : Object.fromEntries(
            Object.entries(current).filter(([key]) => key !== "assignments"),
          ),
    assignments:
      current.assignments && typeof current.assignments === "object"
        ? current.assignments
        : {},
  };
}

function countAssignmentsByCourse(lecturers, courses) {
  const courseCodes = new Set(courses.map((course) => course.code));
  return lecturers.reduce((acc, lecturer) => {
    lecturer.plotted
      .filter((code) => courseCodes.has(code))
      .forEach((code) => {
        acc[code] = (acc[code] || 0) + 1;
      });
    return acc;
  }, {});
}

function getCourseClassCounts(
  lecturers,
  courses,
  plannedCounts = {},
  assignmentMap = null,
) {
  const assignedCounts = countAssignmentsByCourse(lecturers, courses);
  return Object.fromEntries(
    courses.map((course) => [
      course.code,
      Math.max(
        toClassCount(plannedCounts[course.code]),
        assignedCounts[course.code] || 0,
        assignmentMap?.[course.code]?.length || 0,
      ),
    ]),
  );
}

function getCourseAssignmentMap(lecturers, courses) {
  const assignments = Object.fromEntries(
    courses.map((course) => [course.code, []]),
  );
  lecturers.forEach((lecturer) => {
    lecturer.plotted.forEach((code) => {
      if (assignments[code]) assignments[code].push(lecturer.id);
    });
  });
  return assignments;
}

function countLecturerAssignments(assignmentMap = {}, lecturerId) {
  if (!lecturerId) return 0;
  return Object.values(assignmentMap).reduce(
    (sum, ids) =>
      sum +
      (Array.isArray(ids) ? ids.filter((id) => id === lecturerId).length : 0),
    0,
  );
}

function getLecturerClassLimitLookup(lecturers = []) {
  return new Map(
    lecturers.map((lecturer) => [
      lecturer.id,
      getLecturerRatingClassLimit(lecturer),
    ]),
  );
}

function limitAssignmentMapByLecturer(assignmentMap = {}, lecturers = []) {
  const lecturerClassLimits = getLecturerClassLimitLookup(lecturers);
  const lecturerCounts = {};
  return Object.fromEntries(
    Object.entries(assignmentMap).map(([courseCode, ids]) => [
      courseCode,
      (Array.isArray(ids) ? ids : []).map((lecturerId) => {
        if (!lecturerId) return "";
        lecturerCounts[lecturerId] = lecturerCounts[lecturerId] || 0;
        if (
          lecturerCounts[lecturerId] >=
          (lecturerClassLimits.get(lecturerId) || LECTURER_CLASS_LIMIT)
        )
          return "";
        lecturerCounts[lecturerId] += 1;
        return lecturerId;
      }),
    ]),
  );
}

function mergeAssignmentMapWithLecturerLimit(
  baseAssignmentMap = {},
  incomingAssignmentMap = {},
  lecturers = [],
) {
  const incomingCourseCodes = new Set(Object.keys(incomingAssignmentMap));
  const lecturerClassLimits = getLecturerClassLimitLookup(lecturers);
  const lecturerCounts = {};
  Object.entries(baseAssignmentMap).forEach(([courseCode, ids]) => {
    if (incomingCourseCodes.has(courseCode)) return;
    (Array.isArray(ids) ? ids : []).forEach((lecturerId) => {
      if (lecturerId)
        lecturerCounts[lecturerId] = (lecturerCounts[lecturerId] || 0) + 1;
    });
  });
  const limitedIncoming = Object.fromEntries(
    Object.entries(incomingAssignmentMap).map(([courseCode, ids]) => [
      courseCode,
      (Array.isArray(ids) ? ids : []).map((lecturerId) => {
        if (!lecturerId) return "";
        lecturerCounts[lecturerId] = lecturerCounts[lecturerId] || 0;
        if (
          lecturerCounts[lecturerId] >=
          (lecturerClassLimits.get(lecturerId) || LECTURER_CLASS_LIMIT)
        )
          return "";
        lecturerCounts[lecturerId] += 1;
        return lecturerId;
      }),
    ]),
  );
  return { ...baseAssignmentMap, ...limitedIncoming };
}

function getCourseClassAssignmentPlan(
  courseClassPlans,
  termCode,
  lecturers,
  courses,
) {
  const plan = courseClassPlans?.[termCode] || {};
  const storedAssignments =
    plan.assignments && typeof plan.assignments === "object"
      ? plan.assignments
      : {};
  const fallbackAssignments = getCourseAssignmentMap(lecturers, courses);
  const lecturerIds = new Set(lecturers.map((lecturer) => lecturer.id));
  return Object.fromEntries(
    courses.map((course) => {
      const stored = Array.isArray(storedAssignments[course.code])
        ? storedAssignments[course.code]
            .map((id) => String(id || ""))
            .filter((id) => !id || lecturerIds.has(id))
        : null;
      return [
        course.code,
        stored?.some(Boolean)
          ? stored
          : fallbackAssignments[course.code] || stored || [],
      ];
    }),
  );
}

function applyCourseAssignmentsToLecturers(lecturers, courses, assignmentMap) {
  const courseCodes = new Set(courses.map((course) => course.code));
  const plottedByLecturer = new Map(
    lecturers.map((lecturer) => [
      lecturer.id,
      lecturer.plotted.filter((code) => !courseCodes.has(code)),
    ]),
  );
  courses.forEach((course) => {
    (assignmentMap[course.code] || []).forEach((lecturerId) => {
      if (!lecturerId || !plottedByLecturer.has(lecturerId)) return;
      plottedByLecturer.get(lecturerId).push(course.code);
    });
  });
  return lecturers.map((lecturer) => ({
    ...lecturer,
    plotted: plottedByLecturer.get(lecturer.id) || [],
  }));
}

function buildPlottingExportRows(
  lecturers,
  courses,
  plannedCounts = {},
  assignmentMap = null,
) {
  const assignments =
    assignmentMap || getCourseAssignmentMap(lecturers, courses);
  const counts = getCourseClassCounts(
    lecturers,
    courses,
    plannedCounts,
    assignments,
  );
  const lecturersById = new Map(
    lecturers.map((lecturer) => [lecturer.id, lecturer]),
  );
  return courses.flatMap((course) =>
    Array.from({ length: counts[course.code] || 0 }, (_, index) => {
      const lecturer = lecturersById.get(assignments[course.code]?.[index]);
      return {
        "": "",
        Idtutor: lecturer?.id || "",
        Nama: lecturer?.name || "",
        Kelas: `${course.code}.${index + 1}`,
        "Nama MK": course.title,
      };
    }),
  );
}

function getCourseCodeFromClass(value) {
  return String(value || "")
    .trim()
    .split(".")[0];
}

function mapImportedPlottingRows(rows, lecturers, courses) {
  const lecturerIds = new Set(lecturers.map((lecturer) => lecturer.id));
  const lecturersByName = new Map(
    lecturers.map((lecturer) => [lecturer.name.toLowerCase(), lecturer]),
  );
  const coursesByCode = new Map(courses.map((course) => [course.code, course]));
  const coursesByTitle = new Map(
    courses.map((course) => [course.title.toLowerCase(), course]),
  );
  const assignments = {};
  const counts = {};
  const ignored = { courses: new Set(), lecturers: new Set() };

  rows
    .filter((row) => !isImportRowBlank(row))
    .forEach((row) => {
      const className = String(
        getImportedValue(row, ["Kelas", "Class"]),
      ).trim();
      const importedCourseCode = String(
        getImportedValue(row, [
          "Course_Code",
          "Course Code",
          "CourseCode",
          "Code",
          "Course",
        ]),
      ).trim();
      const courseName = String(
        getImportedValue(row, [
          "Nama MK",
          "Course Name",
          "Course Title",
          "Course",
        ]),
      ).trim();
      const importedLecturerId = String(
        getImportedValue(row, ["Idtutor", "Lecturer_ID", "Lecturer ID", "ID"]),
      ).trim();
      const lecturerName = String(
        getImportedValue(row, ["Nama", "Name", "Full Name"]),
      ).trim();
      const lecturerId = lecturerIds.has(importedLecturerId)
        ? importedLecturerId
        : lecturersByName.get(lecturerName.toLowerCase())?.id ||
          importedLecturerId;
      const courseCode =
        getCourseCodeFromClass(className) || importedCourseCode;
      const course =
        coursesByCode.get(courseCode) ||
        coursesByCode.get(courseName) ||
        coursesByTitle.get(courseName.toLowerCase());
      if (!course) {
        ignored.courses.add(courseCode || courseName || "blank course");
        return;
      }
      if (lecturerId && !lecturerIds.has(lecturerId)) {
        ignored.lecturers.add(lecturerId);
        return;
      }
      const classNumber = Number(className.split(".")[1]);
      const index =
        Number.isFinite(classNumber) && classNumber > 0
          ? Math.floor(classNumber) - 1
          : (assignments[course.code] || []).length;
      assignments[course.code] = assignments[course.code] || [];
      assignments[course.code][index] = lecturerId;
      counts[course.code] = Math.max(counts[course.code] || 0, index + 1);
    });

  return {
    assignments: Object.fromEntries(
      Object.entries(assignments).map(([code, ids]) => [
        code,
        Array.from(
          { length: counts[code] || ids.length },
          (_, index) => ids[index] || "",
        ),
      ]),
    ),
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
    expertise: imported.expertise?.length
      ? imported.expertise
      : existing.expertise,
    plotted: imported.plotted?.length ? imported.plotted : existing.plotted,
    available: imported._hasImportedAvailable
      ? imported.available
      : (existing.available ?? imported.available),
    rating: imported._hasImportedRating
      ? imported.rating
      : (existing.rating ?? imported.rating),
    warning_note: imported._hasImportedWarningNote
      ? imported.warning_note
      : (existing.warning_note ?? imported.warning_note),
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
      expertise: uniq([
        ...(existing.expertise || []),
        ...(item.expertise || []),
      ]),
      plotted: uniq([...(existing.plotted || []), ...(item.plotted || [])]),
      available: item._hasImportedAvailable
        ? item.available
        : existing.available,
      rating: item._hasImportedRating ? item.rating : existing.rating,
      warning_note: item._hasImportedWarningNote
        ? item.warning_note
        : existing.warning_note,
    });
    byId.set(item.id, {
      ...merged,
      _hasImportedAvailable:
        existing._hasImportedAvailable || item._hasImportedAvailable,
      _hasImportedRating:
        existing._hasImportedRating || item._hasImportedRating,
      _hasImportedWarningNote:
        existing._hasImportedWarningNote || item._hasImportedWarningNote,
    });
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
  const rows = new Map(
    termPlottings
      .filter((row) => row.term_code === termCode)
      .map((row) => [row.lecturer_id, row]),
  );
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

const LECTURER_EXPORT_COLUMNS = [
  "Lecturer_ID",
  "Name",
  "Degree",
  "Email",
  "Phone",
  "Rating",
  "Warning_Note",
  "Expertise",
  "Plotted_Course_Codes",
  "Plotted_Course_Names",
  "Available_Slots",
];

function buildLecturerTemplateRows() {
  return [
    Object.fromEntries(LECTURER_EXPORT_COLUMNS.map((column) => [column, ""])),
  ];
}

const {
  exportLecturersToXLSX,
  exportLecturerTemplateToXLSX,
  exportPlottingToXLSX,
  parseCSV,
  rowsToObjects,
  parseXLSX,
  splitList,
  getImportedValue,
  isImportRowBlank,
  mapImportedLecturers,
} = createImportExportTools({
  buildLecturerExportRows,
  buildLecturerTemplateRows,
  buildPlottingExportRows,
  normalizeLecturer,
});

const {
  fetchDatabaseSnapshot,
  fetchPublicDatabaseSnapshot,
  fetchLecturerLabelColumnSupport,
} = createDatabaseSnapshotTools({
  normalizeCourseClassPlans,
  normalizeLecturer,
  normalizeTermPlotting,
});

runSelfTests({
  LECTURER_CLASS_LIMIT,
  LECTURER_EXPORT_COLUMNS,
  USE_SUPABASE,
  availabilityTone,
  buildAutoPilotPlotting,
  buildLecturerExportRows,
  buildLecturerTemplateRows,
  buildPlottingExportRows,
  buildTermPlottingRow,
  calculatePlottingHealth,
  cloneDemoSnapshot,
  countLecturerAssignments,
  dedupeImportedLecturers,
  expertiseMatchesCourse,
  findLecturerById,
  getCourseAssignmentMap,
  getCourseClassCounts,
  getPlottedCountData,
  getTermScopedLecturers,
  limitAssignmentMapByLecturer,
  mapImportedPlottingRows,
  mergeImportedLecturer,
  normalizeCourseClassPlans,
  plottedCourseCountLabel,
  plottedCourseTitles,
  serializeCourseClassPlans,
  serializeLecturersForDatabase,
});

function getPlottedCountData(lecturers) {
  return Object.entries(
    lecturers.reduce((acc, lecturer) => {
      const label = plottedCourseCountLabel(lecturer.plotted.length);
      acc[label] = (acc[label] || 0) + 1;
      return acc;
    }, {}),
  ).map(([name, value]) => ({ name, value }));
}

function Button({ children, variant = "primary", className = "", ...props }) {
  const styles = {
    primary: "bg-[#005baa] text-white hover:bg-[#004984] shadow-sm",
    secondary:
      "bg-white text-[#102f52] border border-[#d7e6f7] hover:bg-[#f4f9ff]",
    ghost: "bg-transparent text-[#315577] hover:bg-[#eef5ff]",
    danger:
      "bg-[#fffafa] text-[#8a3a3a] border border-[#f3caca] hover:bg-[#fdeaea]",
  };
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${styles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
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
  return (
    <span
      className={`inline-flex items-center rounded-lg border px-2 py-1 text-xs font-normal ${tones[tone] || tones.blue}`}
    >
      {children}
    </span>
  );
}

function RatingStars({ rating = 0, showEmpty = true, onChange }) {
  const value = clampRating(rating);
  if (!showEmpty && value === 0) return null;
  const stars = Array.from({ length: 5 }, (_, index) => {
    const starValue = index + 1;
    const selected = index < value;
    const star = (
      <svg
        viewBox="0 0 24 24"
        className={`h-4 w-4 ${selected ? "text-[#f4b000]" : "text-[#d7e0ea]"}`}
        aria-hidden="true"
      >
        <path
          fill="currentColor"
          d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8-6.2-3.3-6.2 3.3 1.2-6.8-5-4.9 6.9-1L12 2Z"
        />
      </svg>
    );
    if (!onChange) return <span key={starValue}>{star}</span>;
    const nextValue = value === starValue ? 0 : starValue;
    return (
      <button
        key={starValue}
        type="button"
        onClick={() => onChange(nextValue)}
        className="rounded p-0.5 transition hover:bg-[#fff0c2] focus:outline-none focus:ring-2 focus:ring-[#ffd23f]"
        aria-label={
          value === starValue
            ? "Clear rating"
            : `Set rating to ${starValue} of 5`
        }
        title={
          value === starValue ? "Clear rating" : `Set rating to ${starValue}`
        }
      >
        {star}
      </button>
    );
  });
  return (
    <span
      className="rating-stars inline-flex items-center gap-1"
      aria-label={`${value} of 5 rating`}
    >
      {stars}
    </span>
  );
}

function WarningNotice({ note }) {
  if (!String(note || "").trim()) return null;
  return (
    <span
      className="inline-flex max-w-xs items-center gap-1 rounded-lg border border-[#f3caca] bg-[#fde2e2] px-2 py-1 text-xs font-semibold text-[#8a3a3a]"
      title={note}
    >
      <Icons.warning className="h-3.5 w-3.5 shrink-0" />
      <span className="truncate">{note}</span>
    </span>
  );
}

function Card({ children, className = "" }) {
  return (
    <div
      className={`rounded-2xl border border-[#d7e6f7] bg-white shadow-sm shadow-[#005baa]/5 ${className}`}
    >
      {children}
    </div>
  );
}

function TextInput({
  icon: Icon,
  value = "",
  onChange,
  placeholder,
  type = "text",
}) {
  return (
    <div className="flex h-12 items-center gap-3 rounded-xl border border-[#d7e6f7] bg-white px-3">
      {Icon && <Icon className="h-4 w-4 text-[#6f90af]" />}
      <input
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
        type={type}
        className="w-full bg-transparent text-sm text-[#102f52] outline-none placeholder:text-[#8aa0b6]"
        placeholder={placeholder}
      />
    </div>
  );
}

function SelectBox({ label, value, onChange, options = [] }) {
  return (
    <label className="space-y-1.5">
      <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#315577]">
        {label}
      </span>
      <div className="relative">
        <select
          value={value}
          onChange={(event) => onChange?.(event.target.value)}
          className="w-full appearance-none rounded-xl border border-[#d7e6f7] bg-white px-3 py-2.5 pr-9 text-sm font-normal text-[#102f52] outline-none"
        >
          <option value="All">All</option>
          {options
            .filter((option) => option !== "All")
            .map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
        </select>
        <Icons.chevronDown className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-[#6f90af]" />
      </div>
    </label>
  );
}

const filterOptionLabel = (option) =>
  String(option) === "id"
    ? "ID"
    : String(option).replace(/\b\w/g, (char) => char.toUpperCase());

function NativeFilterIconSelect({
  label,
  value,
  onChange,
  options = [],
  includeAll = true,
  icon: Icon,
}) {
  const items = uniq([...(includeAll ? ["All"] : []), ...options]);
  return (
    <span
      className={`mobile-native-filter-select ${String(value) !== "All" ? "is-active" : ""}`}
      title={label}
      aria-label={label}
    >
      {Icon && <Icon className="h-4 w-4" />}
      <select
        aria-label={label}
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
      >
        {items.map((option) => (
          <option key={option} value={option}>
            {filterOptionLabel(option)}
          </option>
        ))}
      </select>
    </span>
  );
}

function Modal({ title, children, onClose }) {
  return (
    <div
      className="mobile-modal fixed inset-0 z-50 flex items-center justify-center bg-[#24333f]/35 p-4"
      onClick={onClose}
    >
      <motion.div
        onClick={(event) => event.stopPropagation()}
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="mobile-modal__panel max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[#dce9e6] bg-[#fffffb] p-5 shadow-2xl shadow-[#9fb8b1]/30"
      >
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2 className="text-xl font-black text-[#26353f]">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-xl p-2 hover:bg-[#eef6f2]"
          >
            <Icons.x />
          </button>
        </div>
        {children}
      </motion.div>
    </div>
  );
}

function DeleteConfirmation({
  itemType,
  itemLabel,
  detail,
  onConfirm,
  onClose,
}) {
  return (
    <Modal title={`Delete ${itemType}?`} onClose={onClose}>
      <div className="space-y-5">
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="font-medium text-red-900">{itemLabel}</p>
          <p className="mt-1 text-sm leading-6 text-red-700">
            {detail ||
              "This action removes the record and its connected plotting data."}
          </p>
        </div>
        <p className="text-sm leading-6 text-slate-600">
          This action is synchronized to Supabase and cannot be undone from this
          screen.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm}>
            <Icons.trash className="h-4 w-4" />
            Delete {itemType}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function ImportReviewModal({
  title,
  summary,
  issues = [],
  previewRows = [],
  onApply,
  onClose,
  busy = false,
}) {
  return (
    <Modal title={title} onClose={busy ? () => {} : onClose}>
      <div className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-3">
          {summary.map((item) => (
            <div
              key={item.label}
              className={`rounded-xl border p-4 ${item.tone === "error" ? "border-red-200 bg-red-50" : item.tone === "warn" ? "border-amber-200 bg-amber-50" : "border-emerald-200 bg-emerald-50"}`}
            >
              <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-slate-500">
                {item.label}
              </p>
              <p className="mt-2 text-2xl font-medium text-slate-900">
                {item.value}
              </p>
            </div>
          ))}
        </div>
        {issues.length > 0 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-amber-800">
              Validation details
            </p>
            <ul className="mt-3 max-h-48 space-y-2 overflow-y-auto text-sm leading-6 text-amber-900">
              {issues.map((issue, index) => (
                <li
                  key={`${issue}-${index}`}
                  className="rounded-lg bg-white/70 px-3 py-2"
                >
                  {issue}
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="overflow-hidden rounded-xl border border-slate-200">
          <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
              Rows ready to apply
            </p>
          </div>
          <div className="max-h-56 overflow-auto">
            <table className="w-full min-w-[560px] text-left text-xs">
              <thead className="sticky top-0 bg-white text-slate-500">
                <tr>
                  {Object.keys(previewRows[0] || {}).map((key) => (
                    <th key={key} className="px-3 py-2 font-medium">
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {previewRows.slice(0, 20).map((row, index) => (
                  <tr key={index} className="border-t border-slate-100">
                    {Object.values(row).map((value, cellIndex) => (
                      <td
                        key={cellIndex}
                        className="max-w-56 truncate px-3 py-2 text-slate-700"
                      >
                        {Array.isArray(value)
                          ? value.join(", ")
                          : String(value ?? "")}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {!previewRows.length && (
              <p className="p-4 text-sm text-slate-500">
                No valid rows are available to apply.
              </p>
            )}
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={onApply} disabled={busy || !previewRows.length}>
            {busy ? "Applying..." : "Apply validated rows"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function PlainInput({
  label,
  value = "",
  onChange,
  placeholder,
  type = "text",
}) {
  return (
    <label className="space-y-1.5">
      <span className="text-xs font-normal text-[#53616c]">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        type={type}
        placeholder={placeholder}
        className="w-full rounded-xl border border-[#dce9e6] bg-[#fffffb] px-3 py-2.5 text-sm font-normal text-[#26353f] outline-none focus:border-[#9bbfe8]"
      />
    </label>
  );
}

function PlainTextarea({ label, value = "", onChange, placeholder }) {
  return (
    <label className="space-y-1.5">
      <span className="text-xs font-normal text-[#53616c]">{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={3}
        className="w-full resize-y rounded-xl border border-[#dce9e6] bg-[#fffffb] px-3 py-2.5 text-sm font-normal text-[#26353f] outline-none focus:border-[#9bbfe8]"
      />
    </label>
  );
}

function PlainSelect({ label, value = "", onChange, options = [] }) {
  const items = uniq(options);
  return (
    <label className="space-y-1.5">
      <span className="text-xs font-normal text-[#53616c]">{label}</span>
      <div className="relative">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full appearance-none rounded-xl border border-[#dce9e6] bg-[#fffffb] px-3 py-2.5 pr-9 text-sm font-normal text-[#26353f] outline-none focus:border-[#9bbfe8]"
        >
          {items.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <Icons.chevronDown className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-[#6f90af]" />
      </div>
    </label>
  );
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
  const removeExpertise = (item) =>
    onChange(selected.filter((option) => option !== item));
  return (
    <div className="space-y-2">
      <label className="space-y-1.5">
        <span className="text-xs font-normal text-[#53616c]">{label}</span>
        <div className="relative">
          <select
            value=""
            onChange={(event) => addExpertise(event.target.value)}
            className="w-full appearance-none rounded-xl border border-[#dce9e6] bg-[#fffffb] px-3 py-2.5 pr-9 text-sm font-normal text-[#26353f] outline-none focus:border-[#9bbfe8]"
          >
            <option value="" disabled>
              {remaining.length ? "Select expertise" : "All expertise selected"}
            </option>
            {remaining.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <Icons.chevronDown className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-[#6f90af]" />
        </div>
      </label>
      <div className="flex min-h-9 flex-wrap gap-2">
        {selected.length ? (
          selected.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => removeExpertise(item)}
              className="inline-flex items-center gap-1 rounded-lg border border-[#c7dbf2] bg-[#dcecff] px-2 py-1 text-xs font-normal text-[#315577]"
            >
              {item}
              <Icons.x className="h-3 w-3" />
            </button>
          ))
        ) : (
          <span className="text-xs text-[#8aa0b6]">No expertise selected</span>
        )}
      </div>
    </div>
  );
}

function FormGrid({ children }) {
  return <div className="grid gap-3 sm:grid-cols-2">{children}</div>;
}

function FloatingBottomNav({ active, setActive, onLogout }) {
  return (
    <nav className="mobile-bottom-nav fixed inset-x-0 bottom-4 z-40 px-3 sm:bottom-6 sm:px-6">
      <div className="mx-auto flex max-w-5xl items-center gap-2 overflow-x-auto rounded-[1.75rem] border border-[#d7e6f7] bg-white/95 p-2 shadow-[0_18px_60px_rgba(0,91,170,0.14)] backdrop-blur-xl">
        <div className="hidden shrink-0 items-center gap-3 border-r border-[#d7e6f7] px-3 pr-4 md:flex">
          <img
            src="/logo.png"
            alt="Universitas Terbuka logo"
            className="h-10 w-10 object-contain"
          />
          <div>
            <p className="text-sm font-black text-[#102f52]">
              {department.name}
            </p>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#005baa]">
              {department.subtitle}
            </p>
          </div>
        </div>
        {nav.map((item) => {
          const Icon = item.icon;
          const selected = active === item.id;
          return (
            <button
              key={item.id}
              title={item.label}
              onClick={() => setActive(item.id)}
              className={`flex min-w-16 shrink-0 flex-col items-center justify-center gap-1 rounded-2xl px-3 py-2 text-[11px] font-black transition sm:min-w-24 sm:flex-row sm:px-4 sm:text-sm ${selected ? "bg-[#ffd23f] text-[#102f52] shadow-sm" : "text-[#315577] hover:bg-[#eef5ff] hover:text-[#005baa]"}`}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </button>
          );
        })}
        <button
          title="Logout"
          onClick={onLogout}
          className="ml-auto flex min-w-16 shrink-0 flex-col items-center justify-center gap-1 rounded-2xl border border-[#d7e6f7] px-3 py-2 text-[11px] font-black text-[#315577] transition hover:bg-[#eef5ff] hover:text-[#005baa] sm:min-w-24 sm:flex-row sm:px-4 sm:text-sm"
        >
          <Icons.logout className="h-5 w-5" />
          <span>Logout</span>
        </button>
      </div>
    </nav>
  );
}

function Header({ active, terms, selectedTermCode, setSelectedTermCode }) {
  const titles = {
    dashboard: [
      "Overview",
      "Department Dashboard",
      "Live infographics of lecturer distribution, expertise, teaching load, and availability.",
    ],
    lecturers: [
      "Directory",
      "Lecturers",
      "Search, filter, sort, add, edit, or remove lecturer records.",
    ],
    plotting: [
      "Course Plotting",
      "Plan classes and assign lecturers",
      "Set class counts by course, assign lecturers by expertise, and export plotting rows.",
    ],
    courses: [
      "Catalog",
      "Courses",
      "The English Department course catalog used for term-based plotting.",
    ],
    terms: [
      "Academic Calendar",
      "Terms / Semesters",
      "Define academic terms and choose which one is active for plotting.",
    ],
  };
  const [eyebrow, title, desc] = titles[active];
  const showTermPicker = active !== "lecturers";
  const termSelectValue = terms.some((term) => term.code === selectedTermCode)
    ? selectedTermCode
    : terms[0]?.code || "";
  return (
    <div className="mb-6">
      <p className="text-xs font-black uppercase tracking-[0.35em] text-[#005baa]">
        {eyebrow}
      </p>
      <h1 className="mt-1 text-3xl font-black tracking-tight text-[#102f52] md:text-4xl">
        {title}
      </h1>
      <p className="mt-2 flex max-w-3xl flex-wrap items-center gap-2 text-sm leading-6 text-[#4f6478]">
        <span>{desc}</span>
        {showTermPicker &&
          (terms.length ? (
            <select
              aria-label="Select term"
              value={termSelectValue}
              onChange={(event) => setSelectedTermCode(event.target.value)}
              className="rounded-lg border border-[#d7e6f7] bg-white px-2 py-1 text-sm font-bold text-[#102f52] outline-none focus:border-[#005baa]"
            >
              {terms.map((term) => (
                <option key={term.code} value={term.code}>
                  {term.name}
                </option>
              ))}
            </select>
          ) : (
            <b className="text-[#102f52]">No active term selected.</b>
          ))}
      </p>
    </div>
  );
}

function Stat({ label, value, icon: Icon, tone = "blue", note }) {
  return (
    <Card
      className={`p-5 ${tone === "amber" ? "border-[#f0d264] bg-[#fff9df]" : ""}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#315577]">
            {label}
          </p>
          <p className="mt-3 text-4xl font-light text-[#102f52]">{value}</p>
          {note && (
            <p className="mt-1 text-xs font-normal text-[#4f6478]">{note}</p>
          )}
        </div>
        <div
          className={`rounded-xl p-3 ${tone === "amber" ? "bg-[#ffd23f] text-[#102f52]" : "bg-[#eef5ff] text-[#005baa]"}`}
        >
          <Icon />
        </div>
      </div>
    </Card>
  );
}

function SupabaseStatusIcon({ state = "idle", label }) {
  const isSaved = state === "saved";
  const isError = state === "error" || state === "offline";
  const className = isSaved
    ? "border-[#c6e3d1] bg-[#dff3e6] text-[#315f45]"
    : isError
      ? "border-[#e8c4b8] bg-[#f8eae4] text-[#a8431f]"
      : "border-[#f3dda2] bg-[#fff0c2] text-[#71540f]";
  const Icon = isSaved ? Icons.check : isError ? Icons.warning : Icons.chart;
  return (
    <span
      title={label}
      aria-label={label}
      role="status"
      className={`inline-flex h-9 w-9 items-center justify-center rounded-full border ${className}`}
    >
      <Icon className="h-4 w-4" />
    </span>
  );
}

const { LandingScreen, PublicLookupScreen, LoginScreen } = createAuthScreens({
  DEMO_ACCOUNT,
  Icons,
  RatingStars,
  TUTOR_DATA_FORM_URL,
  USE_SUPABASE,
  courseTitleByCode,
  findLecturerById,
  getPlottedCourseCounts,
  getTermScopedLecturers,
  signIn,
});

const { Dashboard, Lecturers } = createDirectoryFeatures({
  Badge,
  Button,
  Card,
  DEFAULT_DEGREE_OPTIONS,
  DEFAULT_EXPERTISE_OPTIONS,
  DeleteConfirmation,
  ExpertiseSelect,
  FormGrid,
  Icons,
  ImportReviewModal,
  Modal,
  NativeFilterIconSelect,
  PlainInput,
  PlainSelect,
  PlainTextarea,
  PlottedCourseBadges,
  RatingStars,
  SelectBox,
  Stat,
  TextInput,
  USE_SUPABASE,
  WarningNotice,
  availabilityTone,
  buildTermPlottingRow,
  clampRating,
  courseTitleByCode,
  dashboardPalette,
  dedupeImportedLecturers,
  exportLecturerTemplateToXLSX,
  exportLecturersToXLSX,
  getPlottedCountData,
  getPlottedCourseCounts,
  includes,
  mapImportedLecturers,
  mergeImportedLecturer,
  normalizeTermPlotting,
  parseCSV,
  parseXLSX,
  plottedCourseTitles,
  rowsToObjects,
  serializeLecturersForDatabase,
  splitList,
  uniq,
  upsertRows,
});

const Plotting = createPlottingComponent({
  Badge,
  Button,
  Card,
  Icons,
  ImportReviewModal,
  LECTURER_CLASS_LIMIT,
  MAX_CLASS_ASSIGNMENTS_PER_COURSE,
  Modal,
  PlottedCourseBadges,
  Stat,
  TextInput,
  applyCourseAssignmentsToLecturers,
  availabilityTone,
  buildAutoPilotPlotting,
  calculatePlottingHealth,
  countLecturerAssignments,
  expertiseMatchesCourse,
  exportPlottingToXLSX,
  getCourseClassAssignmentPlan,
  getCourseClassCounts,
  getCourseClassPlan,
  getCoursePlanParts,
  getLecturerRatingClassLimit,
  getPlottedCourseCounts,
  includes,
  mapImportedPlottingRows,
  mergeAssignmentMapWithLecturerLimit,
  parseCSV,
  parseXLSX,
  plottedCourseTitles,
  rowsToObjects,
  toClassCount,
});

const { Courses, Terms } = createCatalogFeatures({
  Button,
  Card,
  DeleteConfirmation,
  FormGrid,
  Icons,
  Modal,
  PlainInput,
  SelectBox,
  TextInput,
  includes,
});

export default function App() {
  const [active, setActive] = useState("dashboard");
  const [session, setSession] = useState(() => {
    const initialEmail = getStoredUserEmail();
    return {
      userEmail: initialEmail,
      entryMode: initialEmail ? "admin" : "landing",
      isDemo: false,
    };
  });
  const userEmail = session.userEmail;
  const entryMode = session.entryMode;
  const isDemoSession = Boolean(session.isDemo);
  const [lecturers, setLecturers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [terms, setTerms] = useState([]);
  const [termPlottings, setTermPlottings] = useState([]);
  const [courseClassPlans, setCourseClassPlans] = useState(
    getStoredCourseClassPlans,
  );
  const [selectedTermCode, setSelectedTermCode] = useState("");
  const [dbStatus, setDbStatus] = useState(
    USE_SUPABASE ? "Signed out" : "Supabase not configured",
  );
  const [syncState, setSyncState] = useState("idle");
  const [isHydrated, setIsHydrated] = useState(false);
  const [canSyncLecturerLabels, setCanSyncLecturerLabels] = useState(false);
  const [canSyncCourseClassPlans, setCanSyncCourseClassPlans] = useState(false);
  const [syncWakeSignal, setSyncWakeSignal] = useState(0);
  const hydratedRef = useRef(false);
  const syncingRef = useRef(false);
  const syncPayloadRef = useRef(null);
  const syncRevisionRef = useRef(0);
  const syncedRevisionRef = useRef(0);
  const syncTimerRef = useRef(null);
  const syncRetryDelayRef = useRef(SYNC_RETRY_INITIAL_DELAY);
  const setHydrated = useCallback((value) => {
    hydratedRef.current = value;
    setIsHydrated(value);
  }, []);
  const setUserEmail = useCallback((email) => {
    setSession((prev) => ({
      ...prev,
      userEmail: typeof email === "function" ? email(prev.userEmail) : email,
    }));
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
        setCanSyncCourseClassPlans(true);
        setHydrated(true);
        setSyncState("saved");
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
        setSyncState("loading");
        setDbStatus("Loading database...");
        const [snapshot, lecturerLabelsSupported] = await Promise.all([
          fetchDatabaseSnapshot(),
          fetchLecturerLabelColumnSupport(),
        ]);
        if (cancelled) return;
        setCanSyncLecturerLabels(lecturerLabelsSupported);
        setCanSyncCourseClassPlans(snapshot.courseClassPlansSupported);
        const pendingSync = getStoredPendingSync(userEmail);
        if (pendingSync?.payload) {
          applyDatabaseSnapshot(pendingSync.payload);
          setCourseClassPlans(
            pendingSync.payload.courseClassPlans || getStoredCourseClassPlans(),
          );
        } else {
          applyDatabaseSnapshot(snapshot);
          setCourseClassPlans({
            ...getStoredCourseClassPlans(),
            ...snapshot.courseClassPlans,
          });
        }
        setHydrated(true);
        setSyncState(pendingSync ? "pending" : "saved");
        const setupNotes = [
          !lecturerLabelsSupported
            ? "Run lecturer labels SQL to save ratings and warning notes."
            : "",
          !snapshot.courseClassPlansSupported
            ? "Run course class plans SQL to sync plotting plans."
            : "",
        ].filter(Boolean);
        setDbStatus(
          pendingSync
            ? "Unsaved changes restored. Saving..."
            : setupNotes.length
              ? `Supabase connected. ${setupNotes.join(" ")}`
              : "All changes saved",
        );
      } catch (error) {
        setHydrated(false);
        setSyncState("error");
        if (error.status === 401 || error.status === 403) {
          signOut();
          setUserEmail("");
          setLecturers([]);
          setCourses([]);
          setTerms([]);
          setTermPlottings([]);
          setSelectedTermCode("");
          setCanSyncLecturerLabels(false);
          setCanSyncCourseClassPlans(false);
          setDbStatus("Session expired. Please sign in again.");
          return;
        }
        setDbStatus(error.message || "Database load failed");
      }
    }
    loadDatabase();
    return () => {
      cancelled = true;
    };
  }, [
    applyDatabaseSnapshot,
    isDemoSession,
    setHydrated,
    setUserEmail,
    userEmail,
  ]);

  const loadPublicDirectory = useCallback(async () => {
    if (!USE_SUPABASE) {
      setHydrated(false);
      setDbStatus("Supabase not configured");
      return;
    }
    try {
      setHydrated(false);
      setSyncState("loading");
      setDbStatus("Loading public directory...");
      const snapshot = await fetchPublicDatabaseSnapshot();
      applyDatabaseSnapshot(snapshot);
      setHydrated(true);
      setSyncState("saved");
      setDbStatus("Public directory ready");
    } catch (error) {
      setHydrated(false);
      setSyncState("error");
      setDbStatus(error.message || "Public directory load failed");
    }
  }, [applyDatabaseSnapshot, setHydrated]);

  useEffect(() => {
    if (entryMode !== "public") return undefined;
    const timer = window.setTimeout(() => {
      loadPublicDirectory();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [entryMode, loadPublicDirectory]);

  useEffect(() => {
    if (userEmail || entryMode !== "admin") return undefined;
    const timer = window.setTimeout(() => {
      setEntryMode("login");
    }, 0);
    return () => window.clearTimeout(timer);
  }, [entryMode, setEntryMode, userEmail]);

  useEffect(() => {
    if (typeof localStorage === "undefined") return;
    if (isDemoSession) return;
    localStorage.setItem(
      COURSE_CLASS_PLANS_STORAGE_KEY,
      JSON.stringify(courseClassPlans),
    );
  }, [courseClassPlans, isDemoSession]);

  useEffect(() => {
    const wakeSync = () => {
      syncRetryDelayRef.current = SYNC_RETRY_INITIAL_DELAY;
      setSyncWakeSignal((value) => value + 1);
    };
    window.addEventListener("online", wakeSync);
    return () => window.removeEventListener("online", wakeSync);
  }, []);

  const activeTermCode = terms.find((term) => term.active)?.code || "";
  const effectiveSelectedTermCode = terms.some(
    (term) => term.code === selectedTermCode,
  )
    ? selectedTermCode
    : activeTermCode || terms[0]?.code || "";
  const validTermPlottings = useMemo(() => {
    const lecturerIds = new Set(lecturers.map((lecturer) => lecturer.id));
    return termPlottings.filter((row) => lecturerIds.has(row.lecturer_id));
  }, [lecturers, termPlottings]);

  useEffect(() => {
    if (isDemoSession || !USE_SUPABASE || !userEmail || !hydratedRef.current)
      return undefined;

    syncRevisionRef.current += 1;
    syncPayloadRef.current = {
      lecturers,
      courses,
      terms,
      termPlottings: validTermPlottings,
      courseClassPlans,
      canSyncLecturerLabels,
      canSyncCourseClassPlans,
    };
    storePendingSync(userEmail, syncPayloadRef.current);
    setSyncState(navigator.onLine ? "pending" : "offline");
    setDbStatus(
      navigator.onLine
        ? "Unsaved changes queued"
        : "Offline. Changes are safely queued on this device.",
    );
    const scheduledRevision = syncRevisionRef.current;

    const runSync = async () => {
      if (syncingRef.current) return;
      const payload = syncPayloadRef.current;
      const startedRevision = syncRevisionRef.current;
      if (!payload || startedRevision <= syncedRevisionRef.current) return;
      if (!navigator.onLine) {
        setSyncState("offline");
        setDbStatus("Offline. Changes are safely queued on this device.");
        window.clearTimeout(syncTimerRef.current);
        syncTimerRef.current = window.setTimeout(
          runSync,
          syncRetryDelayRef.current,
        );
        syncRetryDelayRef.current = Math.min(
          syncRetryDelayRef.current * 2,
          SYNC_RETRY_MAX_DELAY,
        );
        return;
      }

      let failed = false;
      try {
        syncingRef.current = true;
        setSyncState("saving");
        setDbStatus("Saving changes...");
        await Promise.all([
          syncTable(
            "lecturers",
            serializeLecturersForDatabase(
              payload.lecturers,
              payload.canSyncLecturerLabels,
            ),
            "id",
          ),
          syncTable("courses", payload.courses, "code"),
          syncTable("academic_terms", payload.terms, "code"),
        ]);
        const dependentSyncOperations = [
          syncTable("term_plottings", payload.termPlottings, "id"),
        ];
        if (payload.canSyncCourseClassPlans) {
          dependentSyncOperations.push(
            syncTable(
              "course_class_plans",
              serializeCourseClassPlans(
                payload.courseClassPlans,
                payload.terms,
              ),
              "term_code",
            ),
          );
        }
        await Promise.all(dependentSyncOperations);
        syncedRevisionRef.current = startedRevision;
        syncRetryDelayRef.current = SYNC_RETRY_INITIAL_DELAY;
        if (syncRevisionRef.current === startedRevision) {
          const allDataTypesSupported =
            payload.canSyncLecturerLabels && payload.canSyncCourseClassPlans;
          if (allDataTypesSupported) clearPendingSync(userEmail);
          setSyncState(allDataTypesSupported ? "saved" : "pending");
          setDbStatus(
            allDataTypesSupported
              ? "All changes saved"
              : "Core data saved; unsupported fields remain queued until the required Supabase SQL is installed.",
          );
        }
      } catch (error) {
        failed = true;
        setSyncState(navigator.onLine ? "error" : "offline");
        setDbStatus(
          navigator.onLine
            ? `${error.message || "Database sync failed"}. Retrying automatically...`
            : "Offline. Changes are safely queued on this device.",
        );
      } finally {
        syncingRef.current = false;
        if (failed) {
          window.clearTimeout(syncTimerRef.current);
          syncTimerRef.current = window.setTimeout(
            runSync,
            syncRetryDelayRef.current,
          );
          syncRetryDelayRef.current = Math.min(
            syncRetryDelayRef.current * 2,
            SYNC_RETRY_MAX_DELAY,
          );
        } else if (syncRevisionRef.current > syncedRevisionRef.current) {
          window.clearTimeout(syncTimerRef.current);
          syncTimerRef.current = window.setTimeout(runSync, 0);
        }
      }
    };

    window.clearTimeout(syncTimerRef.current);
    syncTimerRef.current = window.setTimeout(runSync, 500);
    return () => {
      if (syncRevisionRef.current === scheduledRevision)
        window.clearTimeout(syncTimerRef.current);
    };
  }, [
    lecturers,
    courses,
    terms,
    validTermPlottings,
    courseClassPlans,
    userEmail,
    isDemoSession,
    canSyncLecturerLabels,
    canSyncCourseClassPlans,
    syncWakeSignal,
  ]);

  const handleLogin = (email) => {
    setHydrated(false);
    setSession({ userEmail: email, entryMode: "admin", isDemo: false });
  };

  const handleDemoLogin = () => {
    signOut();
    setActive("dashboard");
    setHydrated(false);
    setSession({
      userEmail: DEMO_ACCOUNT.email,
      entryMode: "admin",
      isDemo: true,
    });
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
    setCanSyncCourseClassPlans(false);
    setSelectedTermCode("");
    setSyncState("idle");
    setDbStatus(USE_SUPABASE ? "Signed out" : "Supabase not configured");
  };

  const Page = {
    dashboard: Dashboard,
    lecturers: Lecturers,
    plotting: Plotting,
    courses: Courses,
    terms: Terms,
  }[active];
  const termScopedLecturers = useMemo(
    () =>
      getTermScopedLecturers(
        lecturers,
        validTermPlottings,
        effectiveSelectedTermCode,
      ),
    [lecturers, validTermPlottings, effectiveSelectedTermCode],
  );
  const setTermScopedLecturers = useCallback(
    (updater) => {
      if (!effectiveSelectedTermCode) return;
      setTermPlottings((prev) => {
        const scoped = getTermScopedLecturers(
          lecturers,
          prev,
          effectiveSelectedTermCode,
        );
        const nextScoped =
          typeof updater === "function" ? updater(scoped) : updater;
        const nextRows = nextScoped.map((lecturer) =>
          buildTermPlottingRow(effectiveSelectedTermCode, lecturer),
        );
        return prev
          .filter((row) => row.term_code !== effectiveSelectedTermCode)
          .concat(nextRows);
      });
    },
    [lecturers, effectiveSelectedTermCode],
  );
  const pageLecturers =
    active === "dashboard" || active === "lecturers" || active === "plotting"
      ? termScopedLecturers
      : lecturers;
  const pageSetLecturers =
    active === "plotting" ? setTermScopedLecturers : setLecturers;
  const props = {
    lecturers: pageLecturers,
    directoryLecturers: lecturers,
    setLecturers: pageSetLecturers,
    setTermLecturers: setTermScopedLecturers,
    courses,
    setCourses,
    terms,
    setTerms,
    setTermPlottings,
    selectedTermCode: effectiveSelectedTermCode,
    courseClassPlans,
    setCourseClassPlans,
    onActiveTermChange: setSelectedTermCode,
    canSyncData: !isDemoSession,
    canSyncLecturerLabels,
  };

  if (entryMode === "landing")
    return (
      <LandingScreen
        onPublicMode={() => setEntryMode("public")}
        onLoginMode={() => setEntryMode("login")}
      />
    );
  if (entryMode === "public")
    return (
      <PublicLookupScreen
        lecturers={lecturers}
        courses={courses}
        terms={terms}
        termPlottings={termPlottings}
        selectedTermCode={effectiveSelectedTermCode}
        setSelectedTermCode={setSelectedTermCode}
        dbStatus={dbStatus}
        isHydrated={isHydrated}
        onBack={() => setEntryMode("landing")}
        onLogin={() => setEntryMode("login")}
        onRefresh={loadPublicDirectory}
      />
    );
  if (!userEmail)
    return (
      <LoginScreen
        onLogin={handleLogin}
        onDemoLogin={handleDemoLogin}
        onBack={() => setEntryMode("landing")}
      />
    );

  return (
    <div className="min-h-screen bg-white pb-48 text-[#102f52] sm:pb-32">
      <main className="min-w-0 p-3 sm:p-6 lg:p-10">
        <div className="mx-auto max-w-7xl">
          <div className="mb-4 flex flex-wrap items-center justify-end gap-3">
            <SupabaseStatusIcon state={syncState} label={dbStatus} />
            <span
              className="max-w-xs truncate text-xs font-medium text-[#4f6478]"
              title={dbStatus}
            >
              {dbStatus}
            </span>
            <Badge tone="slate">{userEmail}</Badge>
          </div>
          <Header
            active={active}
            terms={terms}
            selectedTermCode={effectiveSelectedTermCode}
            setSelectedTermCode={setSelectedTermCode}
          />
          <motion.div
            key={`${active}-${effectiveSelectedTermCode}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            <Page {...props} />
          </motion.div>
        </div>
      </main>
      <FloatingBottomNav
        active={active}
        setActive={setActive}
        onLogout={handleLogout}
      />
    </div>
  );
}
