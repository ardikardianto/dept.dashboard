import { useMemo, useRef, useState } from "react";
import {
  buildPlottingImportReview,
  readImportFile,
} from "../lib/importExport.js";

export function createPlottingComponent(deps) {
  const {
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
  } = deps;

  function Plotting({
    lecturers,
    setLecturers,
    courses,
    selectedTermCode,
    courseClassPlans,
    setCourseClassPlans,
  }) {
    const importInputRef = useRef(null);
    const [plottingMode, setPlottingMode] = useState("course");
    const [query, setQuery] = useState("");
    const [lecturerSort, setLecturerSort] = useState("Default");
    const [lecturerHeaderSort, setLecturerHeaderSort] = useState("name");
    const [lecturerHeaderSortDirection, setLecturerHeaderSortDirection] =
      useState("asc");
    const [lecturerPlottedFilter, setLecturerPlottedFilter] = useState("All");
    const [importMessage, setImportMessage] = useState("");
    const [importReview, setImportReview] = useState(null);
    const [autoPilotReview, setAutoPilotReview] = useState(null);
    const [autoPilotPreview, setAutoPilotPreview] = useState(null);
    const [autoPilotUndo, setAutoPilotUndo] = useState(null);
    const [selectedCourseCode, setSelectedCourseCode] = useState("");
    const [selectedLecturerId, setSelectedLecturerId] = useState("");
    const plannedCounts = useMemo(
      () => getCourseClassPlan(courseClassPlans, selectedTermCode),
      [courseClassPlans, selectedTermCode],
    );
    const assignmentMap = useMemo(
      () =>
        getCourseClassAssignmentPlan(
          courseClassPlans,
          selectedTermCode,
          lecturers,
          courses,
        ),
      [courseClassPlans, selectedTermCode, lecturers, courses],
    );
    const classCounts = useMemo(
      () =>
        getCourseClassCounts(lecturers, courses, plannedCounts, assignmentMap),
      [lecturers, courses, plannedCounts, assignmentMap],
    );
    const plannedTotal = courses.reduce(
      (sum, course) => sum + (classCounts[course.code] || 0),
      0,
    );
    const assignedTotal = courses.reduce(
      (sum, course) =>
        sum + (assignmentMap[course.code] || []).filter(Boolean).length,
      0,
    );
    const plottingHealth = useMemo(
      () =>
        calculatePlottingHealth(lecturers, courses, classCounts, assignmentMap),
      [lecturers, courses, classCounts, assignmentMap],
    );
    const visibleCourses = courses
      .filter(
        (course) =>
          includes(course.code, query) || includes(course.title, query),
      )
      .sort((a, b) => a.code.localeCompare(b.code));
    const sortLecturerHeader = (value) => {
      setLecturerHeaderSortDirection((current) =>
        lecturerHeaderSort === value
          ? current === "asc"
            ? "desc"
            : "asc"
          : "asc",
      );
      setLecturerHeaderSort(value);
      setLecturerSort("Default");
    };
    const lecturerSortHeader = (label, value) => (
      <button
        type="button"
        onClick={() => sortLecturerHeader(value)}
        className="inline-flex items-center gap-1 font-medium uppercase tracking-[0.15em] text-[#6d7d86] hover:text-[#005baa]"
      >
        {label}
        {lecturerHeaderSort === value && (
          <span>{lecturerHeaderSortDirection === "asc" ? "↑" : "↓"}</span>
        )}
      </button>
    );
    const visibleLecturers = lecturers
      .filter((lecturer) =>
        [
          lecturer.id,
          lecturer.name,
          lecturer.degree,
          lecturer.expertise.join(" "),
          plottedCourseTitles(lecturer, courses).join(" "),
        ].some((value) => includes(value, query)),
      )
      .filter(
        (lecturer) =>
          lecturerPlottedFilter === "All" ||
          String(lecturer.plotted.length) === lecturerPlottedFilter,
      )
      .sort((a, b) => {
        if (lecturerSort === "Default" && lecturerHeaderSort) {
          const result = String(a[lecturerHeaderSort] ?? "").localeCompare(
            String(b[lecturerHeaderSort] ?? ""),
          );
          return lecturerHeaderSortDirection === "asc" ? result : -result;
        }
        if (lecturerSort === "Not plotted first") {
          return (
            Number(a.plotted.length > 0) - Number(b.plotted.length > 0) ||
            a.name.localeCompare(b.name)
          );
        }
        if (lecturerSort === "Most plotted first") {
          return (
            b.plotted.length - a.plotted.length || a.name.localeCompare(b.name)
          );
        }
        return a.name.localeCompare(b.name);
      });
    const selectedLecturer = lecturers.find(
      (lecturer) => lecturer.id === selectedLecturerId,
    );
    const selectedLecturerCourseCounts = useMemo(
      () =>
        Object.fromEntries(
          getPlottedCourseCounts(selectedLecturer?.plotted || []).map(
            ({ code, count }) => [code, count],
          ),
        ),
      [selectedLecturer],
    );
    const updateCoursePlan = (code, value) => {
      const count = toClassCount(value);
      setAutoPilotReview(null);
      setCourseClassPlans((prev) => {
        const { counts, assignments } = getCoursePlanParts(
          prev,
          selectedTermCode,
        );
        return {
          ...prev,
          [selectedTermCode]: {
            counts: { ...counts, [code]: count },
            assignments: {
              ...assignments,
              [code]: assignments[code] || assignmentMap[code] || [],
            },
          },
        };
      });
    };
    const assignLecturer = (courseCode, classIndex, lecturerId) => {
      const count = classCounts[courseCode] || 0;
      const nextCourseAssignments = Array.from(
        { length: count },
        (_, index) => assignmentMap[courseCode]?.[index] || "",
      );
      const currentLecturerId = nextCourseAssignments[classIndex] || "";
      const lecturer = lecturers.find((item) => item.id === lecturerId);
      const lecturerLimit = lecturer
        ? getLecturerRatingClassLimit(lecturer)
        : LECTURER_CLASS_LIMIT;
      if (
        lecturerId &&
        lecturerId !== currentLecturerId &&
        countLecturerAssignments(assignmentMap, lecturerId) >= lecturerLimit
      )
        return;
      nextCourseAssignments[classIndex] = lecturerId;
      const nextAssignmentMap = {
        ...assignmentMap,
        [courseCode]: nextCourseAssignments,
      };
      setAutoPilotReview(null);
      setCourseClassPlans((prev) => {
        const { counts, assignments } = getCoursePlanParts(
          prev,
          selectedTermCode,
        );
        return {
          ...prev,
          [selectedTermCode]: {
            counts: {
              ...counts,
              [courseCode]: Math.max(toClassCount(counts[courseCode]), count),
            },
            assignments: {
              ...assignments,
              [courseCode]: nextCourseAssignments,
            },
          },
        };
      });
      setLecturers((prev) => {
        return applyCourseAssignmentsToLecturers(
          prev,
          courses,
          nextAssignmentMap,
        );
      });
    };
    const clearCourseAssignments = (courseCode) => {
      const count = classCounts[courseCode] || 0;
      const nextCourseAssignments = Array.from({ length: count }, () => "");
      const nextAssignmentMap = {
        ...assignmentMap,
        [courseCode]: nextCourseAssignments,
      };
      setAutoPilotReview(null);
      setImportMessage("");
      setCourseClassPlans((prev) => {
        const { counts, assignments } = getCoursePlanParts(
          prev,
          selectedTermCode,
        );
        return {
          ...prev,
          [selectedTermCode]: {
            counts: {
              ...counts,
              [courseCode]: Math.max(toClassCount(counts[courseCode]), count),
            },
            assignments: {
              ...assignments,
              [courseCode]: nextCourseAssignments,
            },
          },
        };
      });
      setLecturers((prev) =>
        applyCourseAssignmentsToLecturers(prev, courses, nextAssignmentMap),
      );
    };
    const setLecturerCourseCount = (
      courseCode,
      value,
      lecturerId = selectedLecturer?.id,
    ) => {
      if (!lecturerId) return;
      const currentAssignments = assignmentMap[courseCode] || [];
      const currentCount = currentAssignments.filter(
        (id) => id === lecturerId,
      ).length;
      const lecturerTotal = countLecturerAssignments(assignmentMap, lecturerId);
      const lecturer = lecturers.find((item) => item.id === lecturerId);
      const lecturerLimit = lecturer
        ? getLecturerRatingClassLimit(lecturer)
        : LECTURER_CLASS_LIMIT;
      const maxCountForCourse =
        currentCount + Math.max(0, lecturerLimit - lecturerTotal);
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
        for (
          let index = nextCourseAssignments.length - 1;
          index >= 0 && remaining > 0;
          index -= 1
        ) {
          if (nextCourseAssignments[index] === lecturerId) {
            nextCourseAssignments[index] = "";
            remaining -= 1;
          }
        }
      }

      const nextAssignmentMap = {
        ...assignmentMap,
        [courseCode]: nextCourseAssignments,
      };
      setAutoPilotReview(null);
      setCourseClassPlans((prev) => {
        const { counts, assignments } = getCoursePlanParts(
          prev,
          selectedTermCode,
        );
        return {
          ...prev,
          [selectedTermCode]: {
            counts: {
              ...counts,
              [courseCode]: Math.max(
                toClassCount(counts[courseCode]),
                nextCourseAssignments.length,
              ),
            },
            assignments: {
              ...assignments,
              [courseCode]: nextCourseAssignments,
            },
          },
        };
      });
      setLecturers((prev) =>
        applyCourseAssignmentsToLecturers(prev, courses, nextAssignmentMap),
      );
    };
    const handleImport = async (event) => {
      const file = event.target.files?.[0];
      if (!file) return;
      setImportMessage("");
      setAutoPilotReview(null);
      try {
        if (!selectedTermCode)
          throw new Error(
            "Create or select a term before importing plotting data.",
          );
        const rawRows = await readImportFile(file, {
          parseCSV,
          rowsToObjects,
          parseXLSX,
        });
        const imported = mapImportedPlottingRows(rawRows, lecturers, courses);
        const importedClassCount = Object.values(imported.counts).reduce(
          (sum, count) => sum + count,
          0,
        );
        if (!importedClassCount)
          throw new Error(
            "No valid plotting rows found. Use either ID + Course_Code, or columns Idtutor, Nama, Kelas, and Nama MK.",
          );
        setImportReview(
          buildPlottingImportReview(rawRows, imported, lecturers, courses),
        );
      } catch (error) {
        setImportMessage(error.message || "Import failed.");
      } finally {
        event.target.value = "";
      }
    };
    const applyImportReview = () => {
      if (!importReview) return;
      const nextAssignmentMap = mergeAssignmentMapWithLecturerLimit(
        assignmentMap,
        importReview.imported.assignments,
        lecturers,
      );
      setCourseClassPlans((prev) => {
        const { counts, assignments } = getCoursePlanParts(
          prev,
          selectedTermCode,
        );
        return {
          ...prev,
          [selectedTermCode]: {
            counts: { ...counts, ...importReview.imported.counts },
            assignments: { ...assignments, ...nextAssignmentMap },
          },
        };
      });
      setLecturers((prev) =>
        applyCourseAssignmentsToLecturers(prev, courses, nextAssignmentMap),
      );
      const firstImportedCourseCode =
        Object.keys(importReview.imported.counts)[0] || "";
      if (firstImportedCourseCode)
        setSelectedCourseCode(firstImportedCourseCode);
      setImportMessage(
        `Imported ${importReview.importedClassCount} plotting ${importReview.importedClassCount === 1 ? "row" : "rows"}.`,
      );
      setImportReview(null);
    };
    const runAutoPilot = () => {
      if (!selectedTermCode) {
        setAutoPilotReview({
          notes: [
            "Create or select a term before running auto-pilot plotting.",
          ],
          warnings: [],
          explanations: [],
          metrics: null,
        });
        return;
      }
      const result = buildAutoPilotPlotting(
        lecturers,
        courses,
        classCounts,
        assignmentMap,
      );
      const nextCounts = Object.fromEntries(
        courses.map((course) => [course.code, classCounts[course.code] || 0]),
      );
      setAutoPilotPreview({ result, nextCounts });
      setImportMessage("");
    };
    const applyAutoPilot = () => {
      if (!autoPilotPreview) return;
      const { result, nextCounts } = autoPilotPreview;
      setAutoPilotUndo({
        assignmentMap: JSON.parse(JSON.stringify(assignmentMap)),
        counts: { ...plannedCounts },
      });
      setCourseClassPlans((prev) => {
        const { counts } = getCoursePlanParts(prev, selectedTermCode);
        return {
          ...prev,
          [selectedTermCode]: {
            counts: { ...counts, ...nextCounts },
            assignments: result.assignmentMap,
          },
        };
      });
      setLecturers((prev) =>
        applyCourseAssignmentsToLecturers(prev, courses, result.assignmentMap),
      );
      setAutoPilotReview({
        notes: result.reviewNotes,
        warnings: result.conflictWarnings,
        explanations: result.assignmentExplanations,
        metrics: result.metrics,
      });
      const firstAssignedCourseCode =
        courses.find((course) =>
          result.assignmentMap[course.code]?.some(Boolean),
        )?.code || "";
      if (firstAssignedCourseCode)
        setSelectedCourseCode(firstAssignedCourseCode);
      setAutoPilotPreview(null);
    };
    const undoAutoPilot = () => {
      if (!autoPilotUndo) return;
      setCourseClassPlans((prev) => {
        const { counts } = getCoursePlanParts(prev, selectedTermCode);
        return {
          ...prev,
          [selectedTermCode]: {
            counts: { ...counts, ...autoPilotUndo.counts },
            assignments: autoPilotUndo.assignmentMap,
          },
        };
      });
      setLecturers((prev) =>
        applyCourseAssignmentsToLecturers(
          prev,
          courses,
          autoPilotUndo.assignmentMap,
        ),
      );
      setAutoPilotReview(null);
      setAutoPilotUndo(null);
    };
    const lecturerOptionsForCourse = (course) =>
      [...lecturers].sort(
        (a, b) =>
          Number(expertiseMatchesCourse(b, course)) -
            Number(expertiseMatchesCourse(a, course)) ||
          a.name.localeCompare(b.name),
      );
    const autoPilotNotes = autoPilotReview?.notes || [];
    const autoPilotWarnings = autoPilotReview?.warnings || [];
    const autoPilotExplanations = autoPilotReview?.explanations || [];
    const autoPilotMetrics = autoPilotReview?.metrics;
    return (
      <div className="space-y-5">
        <Card className="p-4">
          <div className="grid gap-4 xl:grid-cols-[220px_minmax(280px,1fr)_auto] xl:items-end">
            <label className="space-y-1.5">
              <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#6d7d86]">
                Plotting mode
              </span>
              <div className="relative">
                <select
                  value={plottingMode}
                  onChange={(event) => {
                    setPlottingMode(event.target.value);
                    setQuery("");
                  }}
                  className="h-12 w-full appearance-none rounded-xl border border-[#dce9e6] bg-[#fffffb] px-3 pr-9 text-sm font-normal text-[#3f4f58] outline-none"
                >
                  <option value="course">Plotting by course</option>
                  <option value="lecturer">Plotting by lecturer</option>
                </select>
                <Icons.chevronDown className="pointer-events-none absolute right-3 top-4 h-4 w-4 text-[#8aa1ad]" />
              </div>
            </label>
            <label className="space-y-1.5">
              <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#6d7d86]">
                Search
              </span>
              <TextInput
                icon={Icons.search}
                value={query}
                onChange={setQuery}
                placeholder={
                  plottingMode === "course"
                    ? "Search courses by code or title..."
                    : "Search lecturers by ID, name, expertise, or course..."
                }
              />
            </label>
            <div className="space-y-1.5">
              <span className="block text-[10px] font-medium uppercase tracking-[0.18em] text-transparent">
                Actions
              </span>
              <div className="flex flex-wrap gap-3">
                <input
                  ref={importInputRef}
                  type="file"
                  accept=".xlsx,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  className="hidden"
                  onChange={handleImport}
                />
                <Button
                  className="h-12 whitespace-nowrap px-4"
                  onClick={runAutoPilot}
                  disabled={!plannedTotal}
                >
                  <Icons.check className="h-4 w-4" />
                  Run auto-pilot
                </Button>
                {autoPilotUndo && (
                  <Button
                    variant="secondary"
                    className="h-12 whitespace-nowrap px-4"
                    onClick={undoAutoPilot}
                  >
                    Undo auto-pilot
                  </Button>
                )}
                <Button
                  variant="secondary"
                  className="h-12 whitespace-nowrap px-4"
                  onClick={() => importInputRef.current?.click()}
                >
                  <Icons.download className="h-4 w-4" />
                  Import plotting
                </Button>
                <Button
                  variant="secondary"
                  className="h-12 whitespace-nowrap px-4"
                  onClick={() =>
                    exportPlottingToXLSX(
                      lecturers,
                      courses,
                      plannedCounts,
                      assignmentMap,
                    )
                  }
                  disabled={!plannedTotal}
                >
                  <Icons.download className="h-4 w-4" />
                  Export plotting XLSX
                </Button>
              </div>
            </div>
          </div>
        </Card>
        {importMessage && (
          <p
            className={`rounded-xl px-3 py-2 text-sm font-normal ${importMessage.startsWith("Imported") ? "bg-[#dff3e6] text-[#315f45]" : "bg-[#fde2e2] text-[#8a3a3a]"}`}
          >
            {importMessage}
          </p>
        )}
        <div className="grid gap-4 md:grid-cols-3">
          <Stat
            label="Planned Classes"
            value={plannedTotal}
            icon={Icons.file}
          />
          <Stat
            label="Assigned Classes"
            value={assignedTotal}
            icon={Icons.check}
            tone={
              assignedTotal === plannedTotal && plannedTotal ? "amber" : "blue"
            }
          />
          <Stat
            label="Unassigned Classes"
            value={Math.max(0, plannedTotal - assignedTotal)}
            icon={Icons.users}
          />
        </div>
        <Card className="p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#005baa]">
                Plotting health
              </p>
              <h3 className="mt-1 text-lg font-medium text-[#26353f]">
                Live rule and assignment checks
              </h3>
            </div>
            <Badge tone={plottingHealth.isHealthy ? "green" : "amber"}>
              {plottingHealth.isHealthy ? "Healthy" : "Review needed"}
            </Badge>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {[
              ["Unassigned", plottingHealth.unassignedClasses.length],
              [
                "Expertise mismatches",
                plottingHealth.expertiseMismatches.length,
              ],
              ["Overloaded", plottingHealth.overloadedLecturers.length],
              ["Unrated", plottingHealth.unratedLecturers.length],
              ["Rule exceptions", plottingHealth.ruleExceptions.length],
            ].map(([label, value]) => (
              <div
                key={label}
                className={`rounded-xl border p-3 ${value ? "border-amber-200 bg-amber-50" : "border-emerald-200 bg-emerald-50"}`}
              >
                <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-slate-500">
                  {label}
                </p>
                <p className="mt-1 text-2xl font-medium text-slate-900">
                  {value}
                </p>
              </div>
            ))}
          </div>
          {!plottingHealth.isHealthy && (
            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
                  Assignment issues
                </p>
                <ul className="mt-3 max-h-40 space-y-2 overflow-y-auto text-sm text-slate-700">
                  {plottingHealth.unassignedClasses.slice(0, 8).map((item) => (
                    <li key={item.className}>
                      {item.className} is unassigned.
                    </li>
                  ))}
                  {plottingHealth.expertiseMismatches
                    .slice(0, 8)
                    .map((item) => (
                      <li key={item.className}>
                        {item.className}: {item.lecturerName} has no listed
                        expertise match.
                      </li>
                    ))}
                </ul>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
                  Lecturer and rule issues
                </p>
                <ul className="mt-3 max-h-40 space-y-2 overflow-y-auto text-sm text-slate-700">
                  {plottingHealth.overloadedLecturers.map((item) => (
                    <li key={item.id}>
                      {item.name}: {item.assigned}/{item.limit} classes.
                    </li>
                  ))}
                  {plottingHealth.unratedLecturers.map((item) => (
                    <li key={item.id}>
                      {item.name} is unrated with {item.assigned} assigned
                      class(es).
                    </li>
                  ))}
                  {plottingHealth.ruleExceptions.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </Card>
        {autoPilotNotes.length > 0 && (
          <Card className="p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#005baa]">
                  Auto-pilot review
                </p>
                <h3 className="mt-1 text-lg font-medium text-[#26353f]">
                  Admin notes for this plotting run
                </h3>
              </div>
              <Badge
                tone={
                  assignedTotal === plannedTotal && plannedTotal
                    ? "green"
                    : "amber"
                }
              >
                {assignedTotal} / {plannedTotal} assigned
              </Badge>
            </div>
            <ul className="mt-4 space-y-2 text-sm leading-6 text-[#4f6478]">
              {autoPilotNotes.map((note) => (
                <li
                  key={note}
                  className="rounded-xl border border-[#dce9e6] bg-[#f7fbf6] px-3 py-2"
                >
                  {note}
                </li>
              ))}
            </ul>
            {autoPilotMetrics && (
              <div className="mt-5 space-y-4">
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-xl border border-[#dce9e6] bg-[#fffffb] p-4">
                    <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#6d7d86]">
                      Filled open slots
                    </p>
                    <p className="mt-2 text-2xl font-medium text-[#102f52]">
                      {autoPilotMetrics.newlyAssignedCount}
                    </p>
                    <p className="mt-1 text-xs text-[#61717b]">
                      {autoPilotMetrics.preservedCount} preserved
                    </p>
                  </div>
                  <div className="rounded-xl border border-[#dce9e6] bg-[#fffffb] p-4">
                    <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#6d7d86]">
                      Expertise match
                    </p>
                    <p className="mt-2 text-2xl font-medium text-[#102f52]">
                      {autoPilotMetrics.expertiseMatchRate}%
                    </p>
                    <p className="mt-1 text-xs text-[#61717b]">
                      {autoPilotMetrics.expertiseMatchCount} matched assignments
                    </p>
                  </div>
                  <div className="rounded-xl border border-[#dce9e6] bg-[#fffffb] p-4">
                    <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#6d7d86]">
                      Low-rating assignments
                    </p>
                    <p className="mt-2 text-2xl font-medium text-[#102f52]">
                      {autoPilotMetrics.lowRatingAssignmentCount}
                    </p>
                    <p className="mt-1 text-xs text-[#61717b]">
                      {autoPilotMetrics.warningAssignmentCount} with notes,{" "}
                      {autoPilotMetrics.unratedAssignmentCount} unrated
                    </p>
                  </div>
                  <div className="rounded-xl border border-[#dce9e6] bg-[#fffffb] p-4">
                    <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#6d7d86]">
                      Balance spread
                    </p>
                    <p className="mt-2 text-2xl font-medium text-[#102f52]">
                      {autoPilotMetrics.loadSpread}
                    </p>
                    <p className="mt-1 text-xs text-[#61717b]">
                      Avg. {autoPilotMetrics.averageLoad.toFixed(1)} classes
                    </p>
                  </div>
                </div>
                <div className="rounded-xl border border-[#dce9e6] bg-[#fffffb] p-4">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#315577]">
                      Workload distribution
                    </p>
                    <p className="text-xs text-[#61717b]">
                      Lecturers grouped by assigned classes after auto-pilot
                    </p>
                  </div>
                  <div className="mt-4 grid gap-2 sm:grid-cols-5">
                    {autoPilotMetrics.loadDistribution.map((item) => (
                      <div
                        key={item.load}
                        className="rounded-lg bg-[#f7fbf6] p-3"
                      >
                        <div className="flex items-center justify-between gap-2 text-xs text-[#61717b]">
                          <span>
                            {item.load} class{item.load === 1 ? "" : "es"}
                          </span>
                          <strong className="text-[#102f52]">
                            {item.count}
                          </strong>
                        </div>
                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#dce9e6]">
                          <div
                            className="h-full rounded-full bg-[#005baa]"
                            style={{
                              width: `${Math.min(100, item.count * 18)}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div className="mt-5 grid gap-4 lg:grid-cols-[0.95fr_1.35fr]">
              <div className="rounded-xl border border-[#f3dda2] bg-[#fff9df] p-4">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#71540f]">
                  Conflict warnings
                </p>
                {autoPilotWarnings.length ? (
                  <ul className="mt-3 space-y-2 text-sm leading-6 text-[#71540f]">
                    {autoPilotWarnings.map((warning) => (
                      <li
                        key={warning}
                        className="rounded-lg bg-white/70 px-3 py-2"
                      >
                        {warning}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 rounded-lg bg-white/70 px-3 py-2 text-sm leading-6 text-[#315f45]">
                    No conflict warnings detected for this auto-pilot run.
                  </p>
                )}
              </div>
              <div className="rounded-xl border border-[#dce9e6] bg-[#fffffb] p-4">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#315577]">
                  Assignment explanations
                </p>
                {autoPilotExplanations.length ? (
                  <div className="mt-3 grid max-h-96 gap-3 overflow-y-auto pr-1">
                    {autoPilotExplanations.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-xl border border-[#dce9e6] bg-[#f7fbf6] p-3"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="font-medium text-[#26353f]">
                            {item.className} - {item.courseTitle}
                          </p>
                          <Badge
                            tone={item.warnings.length ? "amber" : "green"}
                          >
                            {item.lecturerName} ({item.lecturerId})
                          </Badge>
                        </div>
                        <ul className="mt-2 space-y-1 text-xs leading-5 text-[#4f6478]">
                          {item.reasons.map((reason) => (
                            <li key={reason}>{reason}</li>
                          ))}
                        </ul>
                        {item.warnings.length > 0 && (
                          <p className="mt-2 rounded-lg bg-[#fff0c2] px-2 py-1 text-xs leading-5 text-[#71540f]">
                            {item.warnings.join("; ")}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 rounded-lg bg-[#f7fbf6] px-3 py-2 text-sm leading-6 text-[#4f6478]">
                    No assignments were generated to explain.
                  </p>
                )}
              </div>
            </div>
          </Card>
        )}
        {plottingMode === "course" ? (
          <Card className="overflow-hidden">
            <div className="border-b border-[#dce9e6] p-5">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#6d7d86]">
                Courses
              </p>
              <p className="mt-1 text-sm text-[#61717b]">
                Open a course row to plan classes and assign lecturers.
              </p>
            </div>
            <div className="divide-y divide-[#edf3f1]">
              {visibleCourses.map((course) => {
                const planned = classCounts[course.code] || 0;
                const assigned = (assignmentMap[course.code] || []).filter(
                  Boolean,
                ).length;
                const selected = selectedCourseCode === course.code;
                const lecturerOptions = selected
                  ? lecturerOptionsForCourse(course)
                  : [];
                return (
                  <div
                    key={course.code}
                    className={selected ? "bg-[#fbfdf8]" : ""}
                  >
                    <div className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between">
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedCourseCode(selected ? "" : course.code)
                        }
                        className="min-w-0 flex-1 text-left"
                      >
                        <p className="text-sm font-normal text-[#315577]">
                          {course.code}
                        </p>
                        <p className="mt-1 font-medium text-[#26353f]">
                          {course.title}
                        </p>
                      </button>
                      <div className="flex flex-wrap items-center gap-3">
                        <Badge
                          tone={
                            assigned >= planned && planned
                              ? "green"
                              : planned
                                ? "amber"
                                : "slate"
                          }
                        >
                          {assigned} / {planned}
                        </Badge>
                        <Button
                          variant="danger"
                          onClick={() => clearCourseAssignments(course.code)}
                          disabled={!assigned}
                        >
                          Clear
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={() =>
                            setSelectedCourseCode(selected ? "" : course.code)
                          }
                        >
                          {selected ? "Close" : "Plot"}
                        </Button>
                      </div>
                    </div>
                    {selected && (
                      <div className="px-4 pb-5">
                        <div className="rounded-xl border border-[#dce9e6] bg-[#fffffb] p-4">
                          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                            <div>
                              <p className="text-sm font-normal text-[#315577]">
                                {course.code}
                              </p>
                              <h3 className="text-xl font-medium text-[#26353f]">
                                {course.title}
                              </h3>
                              <p className="mt-1 text-sm text-[#61717b]">
                                Plan classes, then assign one lecturer for each
                                class in this course.
                              </p>
                            </div>
                            <div className="flex flex-wrap items-end gap-3">
                              <label className="space-y-1.5">
                                <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#6d7d86]">
                                  Planned classes
                                </span>
                                <input
                                  type="number"
                                  min="0"
                                  max={MAX_CLASS_ASSIGNMENTS_PER_COURSE}
                                  value={planned}
                                  onChange={(event) =>
                                    updateCoursePlan(
                                      course.code,
                                      event.target.value,
                                    )
                                  }
                                  className="w-28 rounded-lg border border-[#dce9e6] bg-[#fffffb] px-2 py-2 text-sm font-normal text-[#26353f] outline-none focus:border-[#9bbfe8]"
                                />
                              </label>
                              <Badge
                                tone={
                                  assigned >= planned && planned
                                    ? "green"
                                    : planned
                                      ? "amber"
                                      : "slate"
                                }
                              >
                                {assigned} assigned
                              </Badge>
                            </div>
                          </div>
                          <div className="mt-5 grid gap-3 md:grid-cols-2">
                            {Array.from({ length: planned }, (_, index) => {
                              const selectedId =
                                assignmentMap[course.code]?.[index] || "";
                              const selectedClassLecturer = lecturers.find(
                                (lecturer) => lecturer.id === selectedId,
                              );
                              return (
                                <label
                                  key={`${course.code}-${index}`}
                                  className="space-y-1.5 rounded-xl border border-[#dce9e6] bg-[#fffffb] p-3"
                                >
                                  <span className="flex items-center justify-between gap-2 text-xs font-medium uppercase tracking-[0.15em] text-[#6d7d86]">
                                    <span>
                                      {course.code}.{index + 1}
                                    </span>
                                    {selectedClassLecturer &&
                                      expertiseMatchesCourse(
                                        selectedClassLecturer,
                                        course,
                                      ) && (
                                        <Badge tone="green">
                                          Expertise match
                                        </Badge>
                                      )}
                                  </span>
                                  <div className="relative">
                                    <select
                                      value={selectedId}
                                      onChange={(event) =>
                                        assignLecturer(
                                          course.code,
                                          index,
                                          event.target.value,
                                        )
                                      }
                                      className="w-full appearance-none rounded-lg border border-[#dce9e6] bg-[#fffffb] px-3 py-2.5 pr-9 text-sm font-normal text-[#3f4f58] outline-none focus:border-[#9bbfe8]"
                                    >
                                      <option value="">Unassigned</option>
                                      {lecturerOptions.map((lecturer) => {
                                        const lecturerTotal =
                                          countLecturerAssignments(
                                            assignmentMap,
                                            lecturer.id,
                                          );
                                        const lecturerLimit =
                                          getLecturerRatingClassLimit(lecturer);
                                        const isFull =
                                          lecturerTotal >= lecturerLimit &&
                                          selectedId !== lecturer.id;
                                        const labelPrefix = isFull
                                          ? "Full - "
                                          : expertiseMatchesCourse(
                                                lecturer,
                                                course,
                                              )
                                            ? "Recommended - "
                                            : "";
                                        return (
                                          <option
                                            key={lecturer.id}
                                            value={lecturer.id}
                                            disabled={isFull}
                                          >
                                            {labelPrefix}
                                            {lecturer.name} ({lecturer.id})
                                          </option>
                                        );
                                      })}
                                    </select>
                                    <Icons.chevronDown className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-[#8aa1ad]" />
                                  </div>
                                  {selectedClassLecturer && (
                                    <p className="text-xs text-[#61717b]">
                                      {selectedClassLecturer.expertise.join(
                                        ", ",
                                      ) || "No expertise listed"}
                                    </p>
                                  )}
                                </label>
                              );
                            })}
                          </div>
                          {!planned && (
                            <div className="mt-5 rounded-xl border border-dashed border-[#dce9e6] bg-[#f7fbf6] p-6 text-center text-sm text-[#61717b]">
                              Set planned classes for this course to begin
                              assigning lecturers.
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              {visibleCourses.length === 0 && (
                <p className="p-6 text-center text-sm text-[#61717b]">
                  No courses match your search.
                </p>
              )}
            </div>
          </Card>
        ) : (
          <>
            <Card className="mobile-card-table plotting-lecturer-table overflow-hidden">
              <div className="flex flex-col gap-4 border-b border-[#dce9e6] p-5 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#6d7d86]">
                    Lecturers
                  </p>
                  <p className="mt-1 text-sm text-[#61717b]">
                    Review lecturers, then open a pop-up card to adjust plotted
                    course counts.
                  </p>
                </div>
                <div className="grid w-full gap-3 sm:grid-cols-2 lg:w-auto">
                  <label className="space-y-1.5 lg:w-48">
                    <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#6d7d86]">
                      Plotted courses
                    </span>
                    <div className="relative">
                      <select
                        value={lecturerPlottedFilter}
                        onChange={(event) =>
                          setLecturerPlottedFilter(event.target.value)
                        }
                        className="h-12 w-full appearance-none rounded-xl border border-[#dce9e6] bg-[#fffffb] px-3 pr-9 text-sm font-normal text-[#3f4f58] outline-none"
                      >
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
                    <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#6d7d86]">
                      Sort
                    </span>
                    <div className="relative">
                      <select
                        value={lecturerSort}
                        onChange={(event) =>
                          setLecturerSort(event.target.value)
                        }
                        className="h-12 w-full appearance-none rounded-xl border border-[#dce9e6] bg-[#fffffb] px-3 pr-9 text-sm font-normal text-[#3f4f58] outline-none"
                      >
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
                      <th className="px-4 py-4">
                        {lecturerSortHeader("ID", "id")}
                      </th>
                      <th className="px-4 py-4">
                        {lecturerSortHeader("Degree", "degree")}
                      </th>
                      <th className="px-4 py-4">
                        {lecturerSortHeader("Full Name", "name")}
                      </th>
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
                        <tr
                          key={lecturer.id}
                          className={`border-t border-[#edf3f1] ${selected ? "bg-[#fbfdf8]" : ""}`}
                        >
                          <td className="px-4 py-4 font-normal text-[#315577]">
                            {lecturer.id}
                          </td>
                          <td className="px-4 py-4">
                            <Badge tone="slate">{lecturer.degree}</Badge>
                          </td>
                          <td className="px-4 py-4 font-medium text-[#26353f]">
                            {lecturer.name}
                          </td>
                          <td className="px-4 py-4 font-normal text-[#3f4f58]">
                            {lecturer.plotted.length}
                          </td>
                          <td className="px-4 py-4">
                            <Badge tone={availabilityTone(lecturer.available)}>
                              {lecturer.available}
                            </Badge>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex max-w-sm flex-wrap gap-1">
                              {lecturer.expertise.map((item) => (
                                <Badge key={item}>{item}</Badge>
                              ))}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex max-w-md flex-wrap gap-1">
                              <PlottedCourseBadges
                                plotted={lecturer.plotted}
                                courses={courses}
                              />
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <Button
                              variant="secondary"
                              onClick={() => setSelectedLecturerId(lecturer.id)}
                            >
                              Plot
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {visibleLecturers.length === 0 && (
                <p className="p-6 text-center text-sm text-[#61717b]">
                  No lecturers match your search.
                </p>
              )}
            </Card>
            {selectedLecturer && (
              <Modal
                title="Plot lecturer"
                onClose={() => setSelectedLecturerId("")}
              >
                <div className="space-y-4">
                  <div className="rounded-xl border border-[#dce9e6] bg-[#f7fbf6] p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-sm font-normal text-[#315577]">
                          {selectedLecturer.id}
                        </p>
                        <h3 className="text-xl font-medium text-[#26353f]">
                          {selectedLecturer.name}
                        </h3>
                        <p className="mt-1 text-sm font-normal text-[#61717b]">
                          {selectedLecturer.expertise.join(", ") ||
                            "No expertise listed"}
                        </p>
                      </div>
                      <Badge
                        tone={
                          selectedLecturer.plotted.length >=
                          getLecturerRatingClassLimit(selectedLecturer)
                            ? "amber"
                            : selectedLecturer.plotted.length
                              ? "blue"
                              : "slate"
                        }
                      >
                        {selectedLecturer.plotted.length} /{" "}
                        {getLecturerRatingClassLimit(selectedLecturer)} assigned
                        classes
                      </Badge>
                    </div>
                  </div>
                  <div className="grid max-h-[56vh] gap-3 overflow-y-auto pr-1 md:grid-cols-2">
                    {courses.map((course) => {
                      const count =
                        selectedLecturerCourseCounts[course.code] || 0;
                      const lecturerTotal = countLecturerAssignments(
                        assignmentMap,
                        selectedLecturer.id,
                      );
                      const lecturerLimit =
                        getLecturerRatingClassLimit(selectedLecturer);
                      const maxCountForCourse =
                        count + Math.max(0, lecturerLimit - lecturerTotal);
                      const planned = classCounts[course.code] || 0;
                      const assigned = (
                        assignmentMap[course.code] || []
                      ).filter(Boolean).length;
                      return (
                        <label
                          key={`${selectedLecturer.id}-${course.code}`}
                          className="grid grid-cols-[1fr_76px] items-center gap-3 rounded-xl border border-[#dce9e6] bg-[#fffffb] p-3"
                        >
                          <span>
                            <span className="block text-sm font-normal text-[#26353f]">
                              {course.title}
                            </span>
                            <span className="mt-1 block text-xs font-normal text-[#61717b]">
                              {course.code} · {assigned} / {planned} assigned
                            </span>
                          </span>
                          <input
                            type="number"
                            min="0"
                            max={maxCountForCourse}
                            value={count}
                            onChange={(event) =>
                              setLecturerCourseCount(
                                course.code,
                                event.target.value,
                                selectedLecturer.id,
                              )
                            }
                            className="w-full rounded-lg border border-[#dce9e6] bg-[#fffffb] px-2 py-2 text-sm font-normal text-[#26353f] outline-none focus:border-[#9bbfe8] disabled:opacity-50"
                            title={
                              maxCountForCourse === 0
                                ? `This lecturer already has ${lecturerLimit} assigned ${lecturerLimit === 1 ? "class" : "classes"} for their rating.`
                                : undefined
                            }
                            disabled={maxCountForCourse === 0}
                          />
                        </label>
                      );
                    })}
                  </div>
                  <div className="flex justify-end">
                    <Button
                      variant="secondary"
                      onClick={() => setSelectedLecturerId("")}
                    >
                      Done
                    </Button>
                  </div>
                </div>
              </Modal>
            )}
          </>
        )}
        {importReview && (
          <ImportReviewModal
            title="Review plotting import"
            summary={importReview.summary}
            issues={importReview.issues}
            previewRows={importReview.previewRows}
            onApply={applyImportReview}
            onClose={() => setImportReview(null)}
          />
        )}
        {autoPilotPreview && (
          <Modal
            title="Review auto-pilot proposal"
            onClose={() => setAutoPilotPreview(null)}
          >
            <div className="space-y-5">
              <div className="grid gap-3 sm:grid-cols-3">
                <Stat
                  label="Planned"
                  value={autoPilotPreview.result.plannedCount}
                  icon={Icons.file}
                />
                <Stat
                  label="Assigned"
                  value={autoPilotPreview.result.assignedCount}
                  icon={Icons.check}
                />
                <Stat
                  label="Warnings"
                  value={autoPilotPreview.result.conflictWarnings.length}
                  icon={Icons.warning}
                />
              </div>
              <div className="rounded-xl border border-[#dce9e6] bg-[#f7fbf6] p-4">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-[#315577]">
                  Nothing has been changed yet
                </p>
                <ul className="mt-3 max-h-52 space-y-2 overflow-y-auto text-sm leading-6 text-[#4f6478]">
                  {autoPilotPreview.result.reviewNotes.map((note) => (
                    <li key={note}>{note}</li>
                  ))}
                  {autoPilotPreview.result.conflictWarnings.map((warning) => (
                    <li key={warning} className="text-[#8a5a14]">
                      {warning}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex justify-end gap-3">
                <Button
                  variant="secondary"
                  onClick={() => setAutoPilotPreview(null)}
                >
                  Cancel
                </Button>
                <Button onClick={applyAutoPilot}>Apply proposal</Button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    );
  }

  return Plotting;
}
