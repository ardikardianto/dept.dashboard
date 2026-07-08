import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart as RePieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  buildLecturerImportReview,
  readImportFile,
} from "../lib/importExport.js";

export function createDirectoryFeatures(deps) {
  const {
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
    includes,
    mapImportedLecturers,
    mergeImportedLecturer,
    normalizeTermPlotting,
    plottedCourseTitles,
    rowsToObjects,
    parseCSV,
    parseXLSX,
    serializeLecturersForDatabase,
    splitList,
    uniq,
    upsertRows,
  } = deps;

  function Dashboard({ lecturers, courses }) {
    const [filters, setFilters] = useState({
      degree: "All",
      expertise: "All",
      plotted: "All",
      available: "All",
    });
    const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
    const [mobileFiltersVisible, setMobileFiltersVisible] = useState(true);
    const scrollTimerRef = useRef(null);
    const filtered = useMemo(
      () =>
        lecturers.filter(
          (lecturer) =>
            (filters.degree === "All" || lecturer.degree === filters.degree) &&
            (filters.expertise === "All" ||
              lecturer.expertise.includes(filters.expertise)) &&
            (filters.plotted === "All" ||
              lecturer.plotted.some(
                (code) => courseTitleByCode(courses, code) === filters.plotted,
              )) &&
            (filters.available === "All" ||
              String(lecturer.available) === filters.available),
        ),
      [lecturers, courses, filters],
    );
    const expertiseData = Object.entries(
      filtered
        .flatMap((lecturer) => lecturer.expertise)
        .reduce((acc, item) => ({ ...acc, [item]: (acc[item] || 0) + 1 }), {}),
    ).map(([name, value]) => ({ name, value }));
    const degreeData = Object.entries(
      filtered.reduce(
        (acc, lecturer) => ({
          ...acc,
          [lecturer.degree]: (acc[lecturer.degree] || 0) + 1,
        }),
        {},
      ),
    ).map(([name, value]) => ({ name, value }));
    const plottedCountData = getPlottedCountData(filtered);
    const availableData = filtered.map((lecturer) => ({
      name: lecturer.name.split(" ")[0],
      available: lecturer.available,
      plotted: lecturer.plotted.length,
    }));
    useEffect(() => {
      const handleScroll = () => {
        if (
          document.activeElement?.closest?.(
            ".mobile-filter-fab, .mobile-search-modal",
          )
        )
          return;
        setMobileFiltersOpen(false);
        setMobileFiltersVisible(false);
        window.clearTimeout(scrollTimerRef.current);
        scrollTimerRef.current = window.setTimeout(
          () => setMobileFiltersVisible(true),
          220,
        );
      };
      window.addEventListener("scroll", handleScroll, { passive: true });
      return () => {
        window.removeEventListener("scroll", handleScroll);
        window.clearTimeout(scrollTimerRef.current);
      };
    }, []);
    const filterControls = (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SelectBox
          label="Academic Degree"
          value={filters.degree}
          onChange={(value) => setFilters({ ...filters, degree: value })}
          options={uniq(lecturers.map((lecturer) => lecturer.degree))}
        />
        <SelectBox
          label="Course Expertise"
          value={filters.expertise}
          onChange={(value) => setFilters({ ...filters, expertise: value })}
          options={uniq(lecturers.flatMap((lecturer) => lecturer.expertise))}
        />
        <SelectBox
          label="Plotted Course"
          value={filters.plotted}
          onChange={(value) => setFilters({ ...filters, plotted: value })}
          options={courses.map((course) => course.title)}
        />
        <SelectBox
          label="Courses Available"
          value={filters.available}
          onChange={(value) => setFilters({ ...filters, available: value })}
          options={["0", "1", "2", "3", "4"]}
        />
      </div>
    );
    const mobileFilterRail = (
      <div className="mobile-filter-fab__rail">
        <NativeFilterIconSelect
          label="Academic Degree"
          value={filters.degree}
          onChange={(value) => setFilters({ ...filters, degree: value })}
          options={uniq(lecturers.map((lecturer) => lecturer.degree))}
          icon={Icons.graduation}
        />
        <NativeFilterIconSelect
          label="Course Expertise"
          value={filters.expertise}
          onChange={(value) => setFilters({ ...filters, expertise: value })}
          options={uniq(lecturers.flatMap((lecturer) => lecturer.expertise))}
          icon={Icons.book}
        />
      </div>
    );
    return (
      <div className="space-y-6">
        <Card className="dashboard-filter-card p-5">
          <p className="mb-4 text-xs font-medium uppercase tracking-[0.2em] text-[#005baa]">
            Filter Infographics
          </p>
          {filterControls}
        </Card>
        <div
          className={`mobile-filter-fab ${mobileFiltersVisible ? "is-visible" : "is-hidden"} ${mobileFiltersOpen ? "is-open" : ""}`}
        >
          <div className="mobile-filter-fab__panel">{mobileFilterRail}</div>
          <button
            type="button"
            className="mobile-filter-fab__button"
            onClick={() => setMobileFiltersOpen((open) => !open)}
            aria-expanded={mobileFiltersOpen}
            aria-label="Toggle filter infographics"
          >
            <Icons.chart className="h-5 w-5" />
            <span>Filters</span>
          </button>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Stat
            label="Total Lecturers"
            value={filtered.length}
            icon={Icons.users}
          />
          <Stat
            label="Total Plotted Courses"
            value={filtered.reduce(
              (sum, lecturer) => sum + lecturer.plotted.length,
              0,
            )}
            icon={Icons.book}
            note="Filtered result"
          />
          <Stat
            label="Total Available Slots"
            value={filtered.reduce(
              (sum, lecturer) => sum + lecturer.available,
              0,
            )}
            icon={Icons.chart}
          />
          <Stat
            label="Avg. Plotted Course / Lecturer"
            value={
              filtered.length
                ? (
                    filtered.reduce(
                      (sum, lecturer) => sum + lecturer.plotted.length,
                      0,
                    ) / filtered.length
                  ).toFixed(1)
                : "0"
            }
            icon={Icons.check}
            tone="amber"
            note="Range 0–4"
          />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="p-5">
            <h3 className="font-medium text-[#102f52]">By Academic Degree</h3>
            <div className="h-72">
              <ResponsiveContainer>
                <RePieChart>
                  <Pie
                    data={degreeData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={65}
                    outerRadius={95}
                  >
                    {degreeData.map((_, index) => (
                      <Cell
                        key={index}
                        fill={dashboardPalette[index % dashboardPalette.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ fontWeight: 300 }} />
                  <Legend wrapperStyle={{ fontWeight: 300 }} />
                </RePieChart>
              </ResponsiveContainer>
            </div>
          </Card>
          <Card className="p-5">
            <h3 className="font-medium text-[#102f52]">
              By Number of Plotted Courses
            </h3>
            <div className="h-72">
              <ResponsiveContainer>
                <RePieChart>
                  <Pie
                    data={plottedCountData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={65}
                    outerRadius={95}
                  >
                    {plottedCountData.map((_, index) => (
                      <Cell
                        key={index}
                        fill={dashboardPalette[index % dashboardPalette.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ fontWeight: 300 }} />
                  <Legend wrapperStyle={{ fontWeight: 300 }} />
                </RePieChart>
              </ResponsiveContainer>
            </div>
          </Card>
          <Card className="p-5 md:col-span-2">
            <h3 className="font-medium text-[#102f52]">By Course Expertise</h3>
            <div className="h-72">
              <ResponsiveContainer>
                <BarChart data={expertiseData} layout="vertical">
                  <CartesianGrid stroke="#d7e6f7" strokeDasharray="3 3" />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11, fill: "#315577", fontWeight: 300 }}
                  />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={155}
                    tick={{ fontSize: 11, fill: "#315577", fontWeight: 300 }}
                  />
                  <Tooltip contentStyle={{ fontWeight: 300 }} />
                  <Bar dataKey="value" fill="#005baa" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
        <Card className="p-5">
          <h3 className="font-medium text-[#102f52]">
            Lecturer Load and Availability
          </h3>
          <div className="h-80">
            <ResponsiveContainer>
              <BarChart data={availableData}>
                <CartesianGrid stroke="#d7e6f7" strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: "#315577", fontWeight: 300 }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#315577", fontWeight: 300 }}
                />
                <Tooltip contentStyle={{ fontWeight: 300 }} />
                <Legend wrapperStyle={{ fontWeight: 300 }} />
                <Bar dataKey="plotted" fill="#005baa" radius={[8, 8, 0, 0]} />
                <Bar dataKey="available" fill="#ffd23f" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    );
  }

  function LecturerForm({
    initial,
    onSave,
    onClose,
    expertiseOptions = DEFAULT_EXPERTISE_OPTIONS,
  }) {
    const degreeOptions = initial?.degreeOptions || DEFAULT_DEGREE_OPTIONS;
    const [form, setForm] = useState(() => {
      const base = initial || {
        id: String(Date.now()).slice(-8),
        degree: "M.A.",
        name: "",
        email: "",
        phone: "",
        plotted: [],
        available: 0,
        rating: 0,
        warning_note: "",
      };
      return {
        ...base,
        degree: degreeOptions.includes(base.degree)
          ? base.degree
          : degreeOptions[0],
        expertise: Array.isArray(base.expertise)
          ? base.expertise
          : splitList(base.expertiseText),
        rating: clampRating(base.rating),
        warning_note: String(base.warning_note || ""),
      };
    });
    const save = () => {
      onSave({
        id: form.id,
        degree: form.degree,
        name: form.name,
        email: form.email,
        phone: form.phone,
        available: Number(form.available ?? 0),
        rating: clampRating(form.rating),
        warning_note: String(form.warning_note || "").trim(),
        expertise: uniq(form.expertise),
        plotted: Array.isArray(form.plotted) ? form.plotted : [],
      });
    };
    return (
      <div className="space-y-4">
        <FormGrid>
          <PlainInput
            label="ID"
            value={form.id}
            onChange={(value) => setForm({ ...form, id: value })}
          />
          <PlainSelect
            label="Degree"
            value={form.degree}
            onChange={(value) => setForm({ ...form, degree: value })}
            options={degreeOptions}
          />
        </FormGrid>
        <PlainInput
          label="Full name"
          value={form.name}
          onChange={(value) => setForm({ ...form, name: value })}
        />
        <FormGrid>
          <PlainInput
            label="Email"
            value={form.email}
            onChange={(value) => setForm({ ...form, email: value })}
          />
          <PlainInput
            label="Phone"
            value={form.phone}
            onChange={(value) => setForm({ ...form, phone: value })}
          />
        </FormGrid>
        <FormGrid>
          <ExpertiseSelect
            label="Expertise"
            value={form.expertise}
            onChange={(value) => setForm({ ...form, expertise: value })}
            options={expertiseOptions}
          />
          <PlainInput
            label="Available slots (0-4)"
            type="number"
            value={form.available}
            onChange={(value) => setForm({ ...form, available: value })}
          />
        </FormGrid>
        <FormGrid>
          <PlainSelect
            label="Teaching performance rating"
            value={String(form.rating)}
            onChange={(value) => setForm({ ...form, rating: Number(value) })}
            options={["0", "1", "2", "3", "4", "5"]}
          />
          <div className="space-y-1.5">
            <span className="text-xs font-normal text-[#53616c]">
              Rating preview
            </span>
            <div className="flex h-11 items-center rounded-xl border border-[#dce9e6] bg-[#fffffb] px-3">
              <RatingStars
                rating={form.rating}
                onChange={(value) => setForm({ ...form, rating: value })}
              />
            </div>
          </div>
        </FormGrid>
        <PlainTextarea
          label="Warning note"
          value={form.warning_note}
          onChange={(value) => setForm({ ...form, warning_note: value })}
          placeholder="Leave empty when there is no warning note."
        />
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save} disabled={!form.id}>
            Save lecturer
          </Button>
        </div>
      </div>
    );
  }

  function LecturerInfoCard({ lecturer, courses, onRatingChange }) {
    const hasContact = Boolean(lecturer.email || lecturer.phone);
    return (
      <div className="space-y-5">
        <div className="rounded-2xl bg-blue-50 p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-blue-700">
                Lecturer Profile
              </p>
              <h3 className="mt-2 text-2xl font-medium text-slate-950">
                {lecturer.name}
              </h3>
              <p className="mt-1 text-sm font-normal text-slate-600">
                {lecturer.degree} · ID {lecturer.id}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <RatingStars
                  rating={lecturer.rating}
                  onChange={onRatingChange}
                />{" "}
                <WarningNotice note={lecturer.warning_note} />
              </div>
            </div>
            <Badge tone={availabilityTone(lecturer.available)}>
              {lecturer.available} available slots
            </Badge>
          </div>
        </div>
        {hasContact && (
          <div className="grid gap-4 sm:grid-cols-2">
            {lecturer.email && (
              <Card className="p-4">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                  Email
                </p>
                <p className="mt-2 text-sm font-normal text-slate-800">
                  {lecturer.email}
                </p>
              </Card>
            )}
            {lecturer.phone && (
              <Card className="p-4">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                  Phone
                </p>
                <p className="mt-2 text-sm font-normal text-slate-800">
                  {lecturer.phone}
                </p>
              </Card>
            )}
          </div>
        )}
        <Card className="p-4">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
            Expertise
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {lecturer.expertise.length ? (
              lecturer.expertise.map((item) => <Badge key={item}>{item}</Badge>)
            ) : (
              <span className="text-sm text-slate-500">
                No expertise listed
              </span>
            )}
          </div>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
            Plotted Courses
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {lecturer.plotted.length ? (
              <PlottedCourseBadges
                plotted={lecturer.plotted}
                courses={courses}
              />
            ) : (
              <span className="text-sm text-slate-500">
                No plotted courses listed
              </span>
            )}
          </div>
        </Card>
      </div>
    );
  }

  function Lecturers({
    lecturers,
    directoryLecturers,
    setLecturers,
    setTermLecturers,
    courses,
    selectedTermCode,
    canSyncData = true,
    canSyncLecturerLabels = false,
  }) {
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
    const [importReview, setImportReview] = useState(null);
    const [importBusy, setImportBusy] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
    const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
    const [mobileFiltersVisible, setMobileFiltersVisible] = useState(true);
    const scrollTimerRef = useRef(null);
    const mobileSearchInputRef = useRef(null);
    const directoryById = useMemo(
      () =>
        new Map(directoryLecturers.map((lecturer) => [lecturer.id, lecturer])),
      [directoryLecturers],
    );
    const expertiseOptions = useMemo(
      () =>
        uniq(
          [...directoryLecturers, ...lecturers].flatMap(
            (lecturer) => lecturer.expertise,
          ),
        ),
      [directoryLecturers, lecturers],
    );
    const sortBy = (value) => {
      setSortDirection((current) =>
        sort === value ? (current === "asc" ? "desc" : "asc") : "asc",
      );
      setSort(value);
    };
    const sortHeader = (label, value) => (
      <button
        type="button"
        onClick={() => sortBy(value)}
        className="inline-flex items-center gap-1 font-medium uppercase tracking-[0.15em] text-slate-500 hover:text-blue-700"
      >
        {label}
        {sort === value && <span>{sortDirection === "asc" ? "↑" : "↓"}</span>}
      </button>
    );
    const rows = useMemo(
      () =>
        lecturers
          .filter((lecturer) =>
            [
              lecturer.id,
              lecturer.name,
              lecturer.email,
              lecturer.phone,
              lecturer.degree,
              lecturer.rating,
              lecturer.warning_note,
              lecturer.expertise.join(" "),
              lecturer.plotted.join(" "),
              plottedCourseTitles(lecturer, courses).join(" "),
            ].some((value) => includes(value, query)),
          )
          .filter((lecturer) => degree === "All" || lecturer.degree === degree)
          .filter(
            (lecturer) =>
              expertise === "All" || lecturer.expertise.includes(expertise),
          )
          .filter(
            (lecturer) =>
              available === "All" || String(lecturer.available) === available,
          )
          .filter(
            (lecturer) =>
              plottedClasses === "All" ||
              String(lecturer.plotted.length) === plottedClasses,
          )
          .sort((a, b) => {
            const result =
              sort === "plotted" || sort === "available" || sort === "rating"
                ? Number(
                    a[sort === "plotted" ? "plotted" : sort]?.length ??
                      a[sort] ??
                      0,
                  ) -
                  Number(
                    b[sort === "plotted" ? "plotted" : sort]?.length ??
                      b[sort] ??
                      0,
                  )
                : String(a[sort] ?? "").localeCompare(String(b[sort] ?? ""));
            return sortDirection === "asc" ? result : -result;
          }),
      [
        lecturers,
        courses,
        query,
        degree,
        expertise,
        available,
        plottedClasses,
        sort,
        sortDirection,
      ],
    );
    const save = (item) => {
      const availableSlots = Math.max(
        0,
        Math.min(4, Number(item.available) || 0),
      );
      setLecturers((prev) =>
        prev.some((lecturer) => lecturer.id === item.id)
          ? prev.map((lecturer) =>
              lecturer.id === item.id
                ? {
                    ...lecturer,
                    ...item,
                    available: lecturer.available,
                    plotted: lecturer.plotted,
                  }
                : lecturer,
            )
          : [{ ...item, available: availableSlots, plotted: [] }, ...prev],
      );
      setTermLecturers((prev) =>
        prev.some((lecturer) => lecturer.id === item.id)
          ? prev.map((lecturer) =>
              lecturer.id === item.id
                ? {
                    ...lecturer,
                    ...item,
                    available: availableSlots,
                    plotted: lecturer.plotted,
                  }
                : lecturer,
            )
          : [{ ...item, available: availableSlots, plotted: [] }, ...prev],
      );
      setModal(null);
    };
    const rateLecturer = (id, rating) => {
      const nextRating = clampRating(rating);
      setLecturers((prev) =>
        prev.map((lecturer) =>
          lecturer.id === id ? { ...lecturer, rating: nextRating } : lecturer,
        ),
      );
      setViewing((prev) =>
        prev?.id === id ? { ...prev, rating: nextRating } : prev,
      );
    };
    const importRows = async (items) => {
      if (!selectedTermCode)
        throw new Error(
          "Create or select a term before importing lecturer data.",
        );
      const uniqueItems = dedupeImportedLecturers(items);
      const scopedById = new Map(
        lecturers.map((lecturer) => [lecturer.id, lecturer]),
      );
      const directoryRows = uniqueItems.map((item) => {
        const existing = directoryById.get(item.id);
        return mergeImportedLecturer(existing, item);
      });
      const plottingRows = uniqueItems.map((item) => {
        const existing = scopedById.get(item.id);
        return normalizeTermPlotting(
          buildTermPlottingRow(selectedTermCode, {
            ...item,
            plotted: existing?.plotted || item.plotted || [],
            available: item._hasImportedAvailable
              ? item.available
              : (existing?.available ?? item.available),
          }),
        );
      });
      if (USE_SUPABASE && canSyncData) {
        await upsertRows(
          "lecturers",
          serializeLecturersForDatabase(directoryRows, canSyncLecturerLabels),
          "id",
        );
        await upsertRows("term_plottings", plottingRows, "id");
      }
      setLecturers((prev) => {
        const byId = new Map(prev.map((lecturer) => [lecturer.id, lecturer]));
        directoryRows.forEach((item) => byId.set(item.id, item));
        return Array.from(byId.values());
      });
      setTermLecturers((prev) => {
        const byId = new Map(prev.map((lecturer) => [lecturer.id, lecturer]));
        uniqueItems.forEach((item) =>
          byId.set(item.id, mergeImportedLecturer(byId.get(item.id), item)),
        );
        return Array.from(byId.values());
      });
    };
    const handleImport = async (event) => {
      const file = event.target.files?.[0];
      if (!file) return;
      setImportMessage("");
      try {
        const rawRows = await readImportFile(file, {
          parseCSV,
          rowsToObjects,
          parseXLSX,
        });
        const imported = mapImportedLecturers(rawRows, courses);
        if (!imported.length)
          throw new Error(
            "No valid lecturer rows found. Use the exported XLSX template columns.",
          );
        setImportReview(buildLecturerImportReview(rawRows, imported));
      } catch (error) {
        setImportMessage(error.message || "Import failed.");
      } finally {
        event.target.value = "";
      }
    };
    const applyImportReview = async () => {
      if (!importReview) return;
      setImportBusy(true);
      try {
        await importRows(importReview.imported);
        setImportMessage(
          `Imported ${importReview.imported.length} lecturer ${importReview.imported.length === 1 ? "row" : "rows"}.`,
        );
        setImportReview(null);
      } catch (error) {
        setImportMessage(error.message || "Import failed.");
      } finally {
        setImportBusy(false);
      }
    };
    useEffect(() => {
      const handleScroll = () => {
        const activeElement = document.activeElement;
        if (
          activeElement?.closest?.(".mobile-filter-fab, .mobile-search-modal")
        )
          return;
        if (
          ["INPUT", "TEXTAREA", "SELECT"].includes(
            activeElement?.tagName || "",
          ) ||
          activeElement?.isContentEditable
        )
          return;
        setMobileFiltersOpen(false);
        setMobileSearchOpen(false);
        setMobileFiltersVisible(false);
        window.clearTimeout(scrollTimerRef.current);
        scrollTimerRef.current = window.setTimeout(
          () => setMobileFiltersVisible(true),
          220,
        );
      };
      window.addEventListener("scroll", handleScroll, { passive: true });
      return () => {
        window.removeEventListener("scroll", handleScroll);
        window.clearTimeout(scrollTimerRef.current);
      };
    }, []);
    useEffect(() => {
      if (!mobileSearchOpen) return;
      const focusTimer = window.setTimeout(
        () => mobileSearchInputRef.current?.focus(),
        80,
      );
      return () => window.clearTimeout(focusTimer);
    }, [mobileSearchOpen]);
    const lecturerFilterControls = (
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-6">
        <SelectBox
          label="Degree"
          value={degree}
          onChange={setDegree}
          options={uniq(lecturers.map((lecturer) => lecturer.degree))}
        />
        <SelectBox
          label="Expertise"
          value={expertise}
          onChange={setExpertise}
          options={uniq(lecturers.flatMap((lecturer) => lecturer.expertise))}
        />
        <SelectBox
          label="Available"
          value={available}
          onChange={setAvailable}
          options={["0", "1", "2", "3", "4"]}
        />
        <SelectBox
          label="Plotted classes"
          value={plottedClasses}
          onChange={setPlottedClasses}
          options={["0", "1", "2", "3", "4"]}
        />
        <SelectBox
          label="Sort by"
          value={sort}
          onChange={(value) => {
            setSort(value);
            setSortDirection("asc");
          }}
          options={["name", "id", "degree", "rating", "plotted", "available"]}
        />
        <Button
          variant="secondary"
          className="mt-5"
          onClick={() => {
            setQuery("");
            setDegree("All");
            setExpertise("All");
            setAvailable("All");
            setPlottedClasses("All");
            setSort("name");
            setSortDirection("asc");
          }}
        >
          Reset
        </Button>
      </div>
    );
    const mobileLecturerFilterRail = (
      <div className="mobile-filter-fab__rail">
        <NativeFilterIconSelect
          label="Degree"
          value={degree}
          onChange={setDegree}
          options={uniq(lecturers.map((lecturer) => lecturer.degree))}
          icon={Icons.graduation}
        />
        <NativeFilterIconSelect
          label="Expertise"
          value={expertise}
          onChange={setExpertise}
          options={uniq(lecturers.flatMap((lecturer) => lecturer.expertise))}
          icon={Icons.book}
        />
        <NativeFilterIconSelect
          label="Sort By"
          value={sort}
          onChange={(value) => {
            setSort(value);
            setSortDirection("asc");
          }}
          options={["name", "id", "degree", "rating", "plotted", "available"]}
          includeAll={false}
          icon={Icons.chart}
        />
        <button
          type="button"
          title="Reset"
          aria-label="Reset filters"
          onClick={() => {
            setQuery("");
            setDegree("All");
            setExpertise("All");
            setAvailable("All");
            setPlottedClasses("All");
            setSort("name");
            setSortDirection("asc");
          }}
        >
          <Icons.x className="h-4 w-4" />
        </button>
      </div>
    );
    const openMobileSearch = () => {
      setMobileFiltersOpen(false);
      setMobileSearchOpen(true);
    };
    const remove = (id) => {
      setLecturers((prev) => prev.filter((lecturer) => lecturer.id !== id));
      setTermLecturers((prev) => prev.filter((lecturer) => lecturer.id !== id));
      setDeleteTarget(null);
    };
    return (
      <div className="space-y-5">
        <div className="flex flex-wrap justify-end gap-3">
          <input
            ref={importInputRef}
            type="file"
            accept=".xlsx,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            className="hidden"
            onChange={handleImport}
          />
          <Button variant="secondary" onClick={exportLecturerTemplateToXLSX}>
            <Icons.download className="h-4 w-4" />
            Template
          </Button>
          <Button
            variant="secondary"
            onClick={() => importInputRef.current?.click()}
          >
            <Icons.download className="h-4 w-4" />
            Import CSV / XLSX
          </Button>
          <Button
            variant="secondary"
            onClick={() => exportLecturersToXLSX(rows, courses)}
            disabled={rows.length === 0}
          >
            <Icons.download className="h-4 w-4" />
            Export XLSX
          </Button>
          <Button onClick={() => setModal({})}>
            <Icons.plus className="h-4 w-4" />
            Add lecturer
          </Button>
        </div>
        {importMessage && (
          <p
            className={`rounded-xl px-3 py-2 text-sm font-normal ${importMessage.startsWith("Imported") ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}
          >
            {importMessage}
          </p>
        )}
        <Card className="lecturer-filter-card p-4">
          <TextInput
            icon={Icons.search}
            value={query}
            onChange={setQuery}
            placeholder="Search by ID, name, email, expertise, warning, rating, or course name..."
          />
          {lecturerFilterControls}
        </Card>
        <div
          className={`mobile-filter-fab mobile-lecturer-fabs ${mobileFiltersVisible ? "is-visible" : "is-hidden"}`}
        >
          <div
            className={`mobile-filter-fab__group ${mobileFiltersOpen ? "is-open" : ""}`}
          >
            <div className="mobile-filter-fab__panel">
              {mobileLecturerFilterRail}
            </div>
            <button
              type="button"
              className="mobile-filter-fab__button"
              onClick={() => setMobileFiltersOpen((open) => !open)}
              aria-expanded={mobileFiltersOpen}
              aria-label="Toggle lecturer filters and sort"
            >
              <Icons.chart className="h-5 w-5" />
              <span>Filters</span>
            </button>
          </div>
          <button
            type="button"
            className="mobile-filter-fab__button"
            onClick={openMobileSearch}
            aria-label="Search lecturers"
          >
            <Icons.search className="h-5 w-5" />
            <span>Search</span>
          </button>
        </div>
        {mobileSearchOpen && (
          <div
            className="mobile-search-modal"
            onClick={() => setMobileSearchOpen(false)}
          >
            <form
              className="mobile-search-card"
              onClick={(event) => event.stopPropagation()}
              onSubmit={(event) => {
                event.preventDefault();
                setMobileSearchOpen(false);
              }}
            >
              <div className="mobile-search-card__header">
                <strong>Search</strong>
                <button
                  type="button"
                  onClick={() => setMobileSearchOpen(false)}
                  aria-label="Close search"
                >
                  <Icons.x className="h-4 w-4" />
                </button>
              </div>
              <label className="mobile-search-card__input">
                <Icons.search className="h-4 w-4" />
                <input
                  ref={mobileSearchInputRef}
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  type="search"
                  placeholder="Search lecturers..."
                />
              </label>
              <div className="mobile-search-card__actions">
                {query && (
                  <button type="button" onClick={() => setQuery("")}>
                    Clear
                  </button>
                )}
                <button type="submit">Done</button>
              </div>
            </form>
          </div>
        )}
        <Card className="mobile-card-table lecturer-directory-table overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1080px] text-left text-sm">
              <thead className="bg-slate-50 text-[10px] uppercase tracking-[0.15em] text-slate-500">
                <tr>
                  <th className="px-4 py-4">{sortHeader("ID", "id")}</th>
                  <th className="px-4 py-4">
                    {sortHeader("Degree", "degree")}
                  </th>
                  <th className="px-4 py-4">
                    {sortHeader("Full Name", "name")}
                  </th>
                  <th className="px-4 py-4">
                    {sortHeader("Rating", "rating")}
                  </th>
                  <th className="px-4 py-4 font-medium">Notice</th>
                  <th className="px-4 py-4">
                    {sortHeader("#Plotted", "plotted")}
                  </th>
                  <th className="px-4 py-4">
                    {sortHeader("Available", "available")}
                  </th>
                  <th className="px-4 py-4 font-medium">Expertise</th>
                  <th className="px-4 py-4 font-medium">Plotted Courses</th>
                  <th className="px-4 py-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((lecturer) => (
                  <tr key={lecturer.id} className="border-t border-slate-100">
                    <td className="px-4 py-4 font-normal text-blue-700">
                      {lecturer.id}
                    </td>
                    <td className="px-4 py-4">
                      <Badge tone="slate">{lecturer.degree}</Badge>
                    </td>
                    <td className="px-4 py-4 font-medium text-slate-900">
                      {lecturer.name}
                    </td>
                    <td className="px-4 py-4">
                      <RatingStars
                        rating={lecturer.rating}
                        onChange={(rating) => rateLecturer(lecturer.id, rating)}
                      />
                    </td>
                    <td className="px-4 py-4">
                      <WarningNotice note={lecturer.warning_note} />
                    </td>
                    <td className="px-4 py-4 font-normal">
                      {lecturer.plotted.length}
                    </td>
                    <td className="px-4 py-4">
                      <Badge tone={availabilityTone(lecturer.available)}>
                        {lecturer.available}
                      </Badge>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-1">
                        {lecturer.expertise.map((item) => (
                          <Badge key={item}>{item}</Badge>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-xs font-normal text-slate-600">
                      <div className="flex max-w-md flex-wrap gap-1">
                        <PlottedCourseBadges
                          plotted={lecturer.plotted}
                          courses={courses}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex gap-3">
                        <button
                          title="View lecturer information"
                          onClick={() => setViewing(lecturer)}
                        >
                          <Icons.eye className="h-4 w-4 text-blue-700" />
                        </button>
                        <button
                          title="Edit lecturer"
                          onClick={() => {
                            const directoryLecturer =
                              directoryById.get(lecturer.id) || lecturer;
                            setModal({
                              ...directoryLecturer,
                              available: lecturer.available,
                              plotted: lecturer.plotted,
                              expertiseText:
                                directoryLecturer.expertise.join(", "),
                            });
                          }}
                        >
                          <Icons.edit className="h-4 w-4" />
                        </button>
                        <button
                          title="Delete lecturer"
                          onClick={() => setDeleteTarget(lecturer)}
                        >
                          <Icons.trash className="h-4 w-4 text-red-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {rows.length === 0 && (
            <p className="p-6 text-center text-sm text-slate-500">
              No lecturers match your search/filter.
            </p>
          )}
        </Card>
        {viewing && (
          <Modal title="Lecturer Information" onClose={() => setViewing(null)}>
            <LecturerInfoCard
              lecturer={viewing}
              courses={courses}
              onRatingChange={(rating) => rateLecturer(viewing.id, rating)}
            />
          </Modal>
        )}
        {modal && (
          <Modal
            title={modal.id ? "Edit lecturer" : "Add lecturer"}
            onClose={() => setModal(null)}
          >
            <LecturerForm
              initial={modal.id ? modal : null}
              expertiseOptions={expertiseOptions}
              onSave={save}
              onClose={() => setModal(null)}
            />
          </Modal>
        )}
        {importReview && (
          <ImportReviewModal
            title="Review lecturer import"
            summary={importReview.summary}
            issues={importReview.issues}
            previewRows={importReview.previewRows}
            onApply={applyImportReview}
            onClose={() => setImportReview(null)}
            busy={importBusy}
          />
        )}
        {deleteTarget && (
          <DeleteConfirmation
            itemType="lecturer"
            itemLabel={`${deleteTarget.name} (${deleteTarget.id})`}
            detail={`This removes the lecturer from the directory and from ${selectedTermCode || "the selected term"} plotting.`}
            onConfirm={() => remove(deleteTarget.id)}
            onClose={() => setDeleteTarget(null)}
          />
        )}
      </div>
    );
  }

  return { Dashboard, Lecturers };
}
