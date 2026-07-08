import { useMemo, useState } from "react";
import { motion } from "framer-motion";

export function createAuthScreens(deps) {
  const {
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
  } = deps;

  function LandingScreen({ onPublicMode, onLoginMode }) {
    const ease = [0.22, 1, 0.36, 1];
    return (
      <div className="min-h-screen bg-[#f7f4ec] px-5 text-[#1f2a3d] sm:px-8 lg:px-10">
        <div className="mx-auto flex min-h-screen max-w-5xl flex-col">
          <motion.header
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease }}
            className="sticky top-0 z-20 -mx-5 flex flex-wrap items-center justify-between gap-4 border-b border-[#e7e0d0] bg-[#f7f4ec]/85 px-5 py-4 backdrop-blur-md sm:-mx-8 sm:px-8 lg:-mx-10 lg:px-10"
          >
            <div className="flex items-center gap-2.5">
              <img
                src="/logo.png"
                alt="Universitas Terbuka logo"
                className="h-10 w-10 rounded-[11px] object-contain"
              />
              <div className="leading-tight">
                <p className="font-serif text-lg font-semibold tracking-tight text-[#16243a]">
                  Universitas Terbuka
                </p>
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#5b6678]">
                  English Department
                </p>
              </div>
            </div>
            <nav className="flex items-center gap-1">
              <button
                type="button"
                onClick={onPublicMode}
                className="hidden rounded-lg px-3 py-2 text-sm font-medium text-[#5b6678] transition hover:bg-[#fcfaf4] hover:text-[#1f2a3d] sm:inline-flex"
              >
                Tutor search
              </button>
              <button
                type="button"
                onClick={onLoginMode}
                className="rounded-lg bg-[#2b62a5] px-3.5 py-2 text-sm font-medium text-white transition hover:bg-[#244f86] sm:px-4"
              >
                Sign in
              </button>
            </nav>
          </motion.header>

          <main className="grid flex-1 items-start gap-8 py-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-16 lg:py-4">
            <motion.section
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.08, ease }}
            >
              <span className="inline-flex items-center gap-2 rounded-full border border-[#d7e6f7] bg-white px-3 py-1 text-xs font-medium text-[#6f8aa3]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#f4b000]" />
                Lecturer portal
              </span>
              <h1 className="mt-5 font-serif text-[2rem] font-medium leading-[1.1] tracking-[-0.02em] text-[#102f52] sm:mt-6 sm:text-5xl sm:leading-[1.05] lg:text-6xl">
                The people and classes behind the English Department.
              </h1>
              <p className="mt-4 max-w-md text-[15px] leading-7 text-[#44607a] sm:mt-6 sm:text-base">
                Tutors can view their profile by ID, while administrators sign
                in to manage lecturers, courses, and term plotting from one
                dashboard.
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-3 sm:mt-9">
                <button
                  type="button"
                  onClick={onPublicMode}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#005baa] px-5 py-3.5 text-sm font-medium text-white shadow-sm transition hover:bg-[#004984] sm:w-auto sm:py-3"
                >
                  <Icons.search className="h-4 w-4" />
                  Look up a tutor
                </button>
              </div>
              <a
                href={TUTOR_DATA_FORM_URL}
                target="_blank"
                rel="noreferrer"
                className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-[#6f8aa3] underline-offset-4 transition hover:text-[#102f52] hover:underline sm:mt-6"
              >
                <Icons.file className="h-4 w-4" />
                New tutor? Fill in the data form
              </a>
            </motion.section>

            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease }}
              className="relative"
            >
              <div className="rounded-2xl border border-[#d7e6f7] bg-white p-2 shadow-[0_1px_2px_rgba(20,20,19,0.04),0_18px_40px_-20px_rgba(20,20,19,0.22)]">
                <div className="rounded-xl border border-[#e3edf8] bg-[#eff5fc] p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium uppercase tracking-[0.14em] text-[#93a7bc]">
                      Tutor profile
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#3F8A5E]">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#3F8A5E]" />
                      Available
                    </span>
                  </div>
                  <div className="mt-4 flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#d7e6f7] text-sm font-semibold text-[#44607a]">
                      AP
                    </span>
                    <div>
                      <p className="font-semibold text-[#102f52]">
                        Alya Prameswari
                      </p>
                      <p className="text-sm text-[#6f8aa3]">
                        Ph.D. · English Linguistics
                      </p>
                    </div>
                  </div>
                  <dl className="mt-5 space-y-3 text-sm">
                    <div className="flex items-center justify-between border-t border-[#e3edf8] pt-3">
                      <dt className="text-[#6f8aa3]">Tutor ID</dt>
                      <dd className="font-mono text-[#2f4a63]">D001</dd>
                    </div>
                    <div className="flex items-center justify-between">
                      <dt className="text-[#6f8aa3]">Plotted courses</dt>
                      <dd className="text-[#2f4a63]">2</dd>
                    </div>
                    <div className="flex items-center justify-between">
                      <dt className="text-[#6f8aa3]">Open slots</dt>
                      <dd className="text-[#2f4a63]">4 of 4</dd>
                    </div>
                  </dl>
                  <div className="mt-5 flex flex-wrap gap-2">
                    <span className="rounded-md bg-[#e6eff9] px-2.5 py-1 text-xs text-[#44607a]">
                      English Linguistics
                    </span>
                    <span className="rounded-md bg-[#e6eff9] px-2.5 py-1 text-xs text-[#44607a]">
                      Language Teaching
                    </span>
                  </div>
                </div>
              </div>
              <p className="mt-3 text-center text-xs text-[#93a7bc]">
                An example public lookup result
              </p>
            </motion.section>
          </main>

          <footer className="border-t border-[#e7e0d0] py-6 text-center text-xs text-[#8a93a3]">
            © 2026 Universitas Terbuka — English Department
            <span className="mx-1">·</span>
            Developed by{" "}
            <a
              href="https://ardikardianto.github.io/resume"
              target="_blank"
              rel="noreferrer"
              className="font-medium text-[#2b62a5] underline-offset-2 hover:underline"
            >
              Ardik Ardianto
            </a>
          </footer>
        </div>
      </div>
    );
  }

  function PublicLookupScreen({
    lecturers,
    courses,
    terms,
    termPlottings,
    selectedTermCode,
    setSelectedTermCode,
    dbStatus,
    isHydrated,
    onBack,
    onLogin,
    onRefresh,
  }) {
    const [idInput, setIdInput] = useState("");
    const [submittedId, setSubmittedId] = useState("");
    const activeTermCode = terms.find((term) => term.active)?.code || "";
    const effectiveTermCode = terms.some(
      (term) => term.code === selectedTermCode,
    )
      ? selectedTermCode
      : activeTermCode || terms[0]?.code || "";
    const validTermPlottings = useMemo(() => {
      const lecturerIds = new Set(lecturers.map((lecturer) => lecturer.id));
      return termPlottings.filter((row) => lecturerIds.has(row.lecturer_id));
    }, [lecturers, termPlottings]);
    const termScopedLecturers = useMemo(
      () =>
        getTermScopedLecturers(
          lecturers,
          validTermPlottings,
          effectiveTermCode,
        ),
      [lecturers, validTermPlottings, effectiveTermCode],
    );
    const lecturer = findLecturerById(termScopedLecturers, submittedId);
    const submitted = Boolean(submittedId.trim());
    const publicDirectoryEmpty =
      USE_SUPABASE && isHydrated && lecturers.length === 0;
    const termSelectValue = terms.some(
      (term) => term.code === effectiveTermCode,
    )
      ? effectiveTermCode
      : "";
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
      <div className="min-h-screen bg-[#f7f4ec] px-5 text-[#1f2a3d] sm:px-8 lg:px-10">
        <div className="mx-auto flex min-h-screen max-w-5xl flex-col">
          <motion.header
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="sticky top-0 z-20 -mx-5 flex flex-col items-center gap-3 border-b border-[#e7e0d0] bg-[#f7f4ec]/85 px-5 py-3.5 backdrop-blur-md sm:-mx-8 sm:flex-row sm:justify-between sm:gap-4 sm:px-8 sm:py-4 lg:-mx-10 lg:px-10"
          >
            <button
              type="button"
              onClick={onBack}
              className="flex items-center gap-2.5 text-left"
            >
              <img
                src="/logo.png"
                alt="Universitas Terbuka logo"
                className="h-10 w-10 rounded-[11px] object-contain"
              />
              <div className="leading-tight">
                <p className="font-serif text-lg font-semibold tracking-tight text-[#16243a]">
                  Universitas Terbuka
                </p>
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#5b6678]">
                  English Department
                </p>
              </div>
            </button>
            <nav className="flex flex-wrap items-center justify-center gap-1.5">
              <span
                title={dbStatus}
                role="status"
                className={`hidden items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium sm:inline-flex ${isHydrated ? "border-[#CBE0CF] bg-[#EAF3EC] text-[#3F8A5E]" : "border-[#E8DDC0] bg-[#F6EFD9] text-[#8A6D2F]"}`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${isHydrated ? "bg-[#3F8A5E]" : "bg-[#C79A3A]"}`}
                />
                {isHydrated ? "Connected" : "Connecting"}
              </span>
              <button
                type="button"
                onClick={refreshPublicDirectory}
                disabled={!USE_SUPABASE}
                className="rounded-lg px-3 py-2 text-sm font-medium text-[#5b6678] transition hover:bg-[#fcfaf4] hover:text-[#1f2a3d] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Refresh
              </button>
              <button
                type="button"
                onClick={onLogin}
                className="rounded-lg bg-[#2b62a5] px-3.5 py-2 text-sm font-medium text-white transition hover:bg-[#244f86] sm:px-4"
              >
                Sign in
              </button>
            </nav>
          </motion.header>

          <main className="grid flex-1 items-start gap-8 py-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16 lg:py-10">
            <motion.section
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.6,
                delay: 0.08,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <span className="inline-flex items-center gap-2 rounded-full border border-[#d7e6f7] bg-white px-3 py-1 text-xs font-medium text-[#6f8aa3]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#f4b000]" />
                Lecturer profile
              </span>
              <h1 className="mt-5 font-serif text-[1.9rem] font-medium leading-[1.08] tracking-[-0.02em] text-[#102f52] sm:mt-6 sm:text-4xl">
                Find a tutor by ID.
              </h1>
              <p className="mt-3 max-w-sm text-[15px] leading-7 text-[#44607a] sm:mt-4 sm:text-base">
                Enter a tutor's ID to see their public profile, expertise, and
                current teaching availability.
              </p>
              <form onSubmit={submit} className="mt-6 space-y-4 sm:mt-8">
                <label className="block space-y-1.5">
                  <span className="text-xs font-medium text-[#6f8aa3]">
                    Tutor ID
                  </span>
                  <div className="flex h-12 items-center gap-2.5 rounded-xl border border-[#ccdcef] bg-white px-3.5 transition focus-within:border-[#005baa]">
                    <Icons.search className="h-4 w-4 text-[#93a7bc]" />
                    <input
                      value={idInput}
                      onChange={(event) => setIdInput(event.target.value)}
                      placeholder="e.g. D001"
                      className="w-full bg-transparent text-sm text-[#102f52] outline-none placeholder:text-[#9db1c6]"
                    />
                  </div>
                </label>
                {terms.length > 0 && (
                  <label className="block space-y-1.5">
                    <span className="text-xs font-medium text-[#6f8aa3]">
                      Term
                    </span>
                    <div className="relative">
                      <select
                        value={termSelectValue}
                        onChange={(event) =>
                          setSelectedTermCode(event.target.value)
                        }
                        className="w-full appearance-none rounded-xl border border-[#ccdcef] bg-white px-3.5 py-2.5 pr-9 text-sm text-[#102f52] outline-none transition focus:border-[#005baa]"
                      >
                        {terms.map((term) => (
                          <option key={term.code} value={term.code}>
                            {term.name}
                          </option>
                        ))}
                      </select>
                      <Icons.chevronDown className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-[#93a7bc]" />
                    </div>
                  </label>
                )}
                <button
                  type="submit"
                  disabled={!idInput.trim() || !isHydrated}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#005baa] px-5 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-[#004984] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  View profile
                </button>
              </form>
              {isHydrated && !publicDirectoryEmpty && (
                <p className="mt-4 text-sm text-[#6f8aa3]">
                  {termScopedLecturers.length} public{" "}
                  {termScopedLecturers.length === 1 ? "profile" : "profiles"}{" "}
                  loaded{effectiveTermCode ? " for the selected term" : ""}.
                </p>
              )}
            </motion.section>

            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.6,
                delay: 0.2,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              {!USE_SUPABASE && (
                <PublicNotice title="Supabase is not configured" tone="error">
                  Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable
                  public profile lookup.
                </PublicNotice>
              )}
              {USE_SUPABASE && !isHydrated && (
                <PublicNotice title={dbStatus} tone="warn">
                  Profile lookup will be available once the public directory is
                  loaded.
                </PublicNotice>
              )}
              {USE_SUPABASE &&
                isHydrated &&
                !submitted &&
                !publicDirectoryEmpty && (
                  <PublicNotice title="Ready when you are">
                    Enter a tutor ID to view the matching profile.
                  </PublicNotice>
                )}
              {publicDirectoryEmpty && (
                <PublicNotice title="No public profiles loaded" tone="warn">
                  The public lookup can reach Supabase, but the
                  public_lecturer_profiles view returned zero rows. Run the
                  public profile views SQL, or sign in to confirm lecturer data
                  exists.
                </PublicNotice>
              )}
              {USE_SUPABASE &&
                isHydrated &&
                submitted &&
                !lecturer &&
                !publicDirectoryEmpty && (
                  <PublicNotice title="No profile found" tone="error">
                    No tutor profile matches that ID. Check the full tutor ID
                    and try again.
                  </PublicNotice>
                )}
              {USE_SUPABASE && isHydrated && lecturer && (
                <PublicProfileCard lecturer={lecturer} courses={courses} />
              )}
            </motion.section>
          </main>

          <footer className="border-t border-[#e7e0d0] py-6 text-center text-xs text-[#8a93a3]">
            © 2026 Universitas Terbuka — English Department
            <span className="mx-1">·</span>
            Developed by{" "}
            <a
              href="https://ardikardianto.github.io/resume"
              target="_blank"
              rel="noreferrer"
              className="font-medium text-[#2b62a5] underline-offset-2 hover:underline"
            >
              Ardik Ardianto
            </a>
          </footer>
        </div>
      </div>
    );
  }

  function PublicNotice({ title, children, tone = "muted" }) {
    const dot =
      { muted: "#93a7bc", warn: "#C79A3A", error: "#B0492E" }[tone] ||
      "#93a7bc";
    return (
      <div className="rounded-2xl border border-[#d7e6f7] bg-white p-6">
        <div className="flex items-center gap-2">
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ background: dot }}
          />
          <p className="font-medium text-[#102f52]">{title}</p>
        </div>
        <p className="mt-2 text-sm leading-6 text-[#44607a]">{children}</p>
      </div>
    );
  }

  const CHIP_TONES = [
    { bg: "#e3edfb", text: "#1d4e89", border: "#cadcf4" }, // blue
    { bg: "#fbeccb", text: "#86610f", border: "#f0dca6" }, // gold
    { bg: "#d9f0e3", text: "#1f6b4c", border: "#bfe5d0" }, // green
    { bg: "#ece7fb", text: "#4a3da0", border: "#dad2f3" }, // indigo
    { bg: "#fce0e7", text: "#9f3454", border: "#f6cbd6" }, // rose
    { bg: "#d6eef5", text: "#1a6982", border: "#bfe2ec" }, // cyan
    { bg: "#fbe5d6", text: "#9a4a1f", border: "#f3d2bd" }, // terracotta
  ];
  const EXPERTISE_TONE_INDEX = {
    "english linguistics": 0,
    "english language teaching": 2,
    "translation studies": 1,
    "indonesian linguistics": 5,
    "literary studies": 4,
    philosophy: 3,
  };
  function chipTone(label) {
    const key = String(label || "")
      .trim()
      .toLowerCase();
    if (key in EXPERTISE_TONE_INDEX)
      return CHIP_TONES[EXPERTISE_TONE_INDEX[key]];
    let hash = 0;
    for (let i = 0; i < key.length; i += 1)
      hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
    return CHIP_TONES[hash % CHIP_TONES.length];
  }

  function PublicProfileCard({ lecturer, courses }) {
    const available = Number(lecturer.available ?? 0);
    const availColor = available > 0 ? "#3F8A5E" : "#B0492E";
    const initials =
      lecturer.name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((word) => word[0])
        .join("")
        .toUpperCase() || "—";
    const hasContact = Boolean(lecturer.email || lecturer.phone);
    const warning = String(lecturer.warning_note || "").trim();
    return (
      <div className="rounded-2xl border border-[#d7e6f7] bg-white p-2 shadow-[0_1px_2px_rgba(20,20,19,0.04),0_18px_40px_-20px_rgba(20,20,19,0.22)]">
        <div className="rounded-xl border border-[#e3edf8] bg-[#eff5fc] p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-[0.14em] text-[#93a7bc]">
              Tutor profile
            </span>
            <span
              className="inline-flex items-center gap-1.5 text-xs font-medium"
              style={{ color: availColor }}
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: availColor }}
              />
              {available} {available === 1 ? "open slot" : "open slots"}
            </span>
          </div>
          <div className="mt-4 flex items-center gap-3.5">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#d7e6f7] text-sm font-semibold text-[#44607a]">
              {initials}
            </span>
            <div className="min-w-0">
              <p className="truncate font-serif text-xl font-medium text-[#102f52]">
                {lecturer.name}
              </p>
              <p className="text-sm text-[#6f8aa3]">
                {lecturer.degree} · ID{" "}
                <span className="font-mono">{lecturer.id}</span>
              </p>
            </div>
          </div>
          {(lecturer.rating > 0 || warning) && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {lecturer.rating > 0 && <RatingStars rating={lecturer.rating} />}
              {warning && (
                <span
                  className="inline-flex items-center gap-1.5 rounded-md border border-[#E7C9A3] bg-[#FBF1E3] px-2.5 py-1 text-xs font-medium text-[#9A6A2B]"
                  title={warning}
                >
                  <Icons.warning className="h-3.5 w-3.5 shrink-0" />
                  <span className="max-w-[14rem] truncate">{warning}</span>
                </span>
              )}
            </div>
          )}
          {hasContact && (
            <dl className="mt-5 space-y-3 border-t border-[#e3edf8] pt-4 text-sm">
              {lecturer.email && (
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-[#6f8aa3]">Email</dt>
                  <dd className="truncate text-[#2f4a63]">{lecturer.email}</dd>
                </div>
              )}
              {lecturer.phone && (
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-[#6f8aa3]">Phone</dt>
                  <dd className="text-[#2f4a63]">{lecturer.phone}</dd>
                </div>
              )}
            </dl>
          )}
          <div className="mt-5 border-t border-[#e3edf8] pt-4">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-[#93a7bc]">
              Expertise
            </p>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {lecturer.expertise.length ? (
                lecturer.expertise.map((item) => {
                  const tone = chipTone(item);
                  return (
                    <span
                      key={item}
                      style={{
                        backgroundColor: tone.bg,
                        color: tone.text,
                        borderColor: tone.border,
                      }}
                      className="rounded-md border px-2.5 py-1 text-xs font-medium"
                    >
                      {item}
                    </span>
                  );
                })
              ) : (
                <span className="text-sm text-[#93a7bc]">
                  No expertise listed
                </span>
              )}
            </div>
          </div>
          <div className="mt-4 border-t border-[#e3edf8] pt-4">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-[#93a7bc]">
              Plotted courses
            </p>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {lecturer.plotted.length ? (
                getPlottedCourseCounts(lecturer.plotted).map(
                  ({ code, count }, index) => {
                    const tone = CHIP_TONES[index % CHIP_TONES.length];
                    return (
                      <span
                        key={code}
                        style={{
                          backgroundColor: tone.bg,
                          color: tone.text,
                          borderColor: tone.border,
                        }}
                        className="rounded-md border px-2.5 py-1 text-xs font-medium"
                      >
                        {courseTitleByCode(courses, code)}
                        {count > 1 ? ` ×${count}` : ""}
                      </span>
                    );
                  },
                )
              ) : (
                <span className="text-sm text-[#93a7bc]">
                  No plotted courses
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  function LoginScreen({ onLogin, onBack, onDemoLogin }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);
    const isDemoCredentials =
      email.trim().toLowerCase() === DEMO_ACCOUNT.email &&
      password === DEMO_ACCOUNT.password;
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
      <div className="min-h-screen bg-[#f7f4ec] px-5 text-[#1f2a3d] sm:px-8 lg:px-10">
        <div className="mx-auto flex min-h-screen max-w-5xl flex-col">
          <motion.header
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="sticky top-0 z-20 -mx-5 flex flex-wrap items-center justify-between gap-4 border-b border-[#e7e0d0] bg-[#f7f4ec]/85 px-5 py-4 backdrop-blur-md sm:-mx-8 sm:px-8 lg:-mx-10 lg:px-10"
          >
            <button
              type="button"
              onClick={onBack}
              className="flex items-center gap-2.5 text-left"
            >
              <img
                src="/logo.png"
                alt="Universitas Terbuka logo"
                className="h-10 w-10 rounded-[11px] object-contain"
              />
              <div className="leading-tight">
                <p className="font-serif text-lg font-semibold tracking-tight text-[#16243a]">
                  Universitas Terbuka
                </p>
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#5b6678]">
                  English Department
                </p>
              </div>
            </button>
            <nav className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={onBack}
                className="rounded-lg px-3 py-2 text-sm font-medium text-[#5b6678] transition hover:bg-[#fcfaf4] hover:text-[#1f2a3d]"
              >
                Tutor search
              </button>
              <span className="hidden rounded-lg bg-[#e5eef8] px-3 py-2 text-sm font-medium text-[#102f52] sm:inline-block">
                Sign in
              </span>
            </nav>
          </motion.header>

          <main className="grid flex-1 items-start gap-8 py-8 lg:grid-cols-[1fr_0.85fr] lg:items-center lg:gap-16 lg:py-10">
            <motion.section
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.6,
                delay: 0.08,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <span className="inline-flex items-center gap-2 rounded-full border border-[#d7e6f7] bg-white px-3 py-1 text-xs font-medium text-[#6f8aa3]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#f4b000]" />
                Administrator access
              </span>
              <h1 className="mt-5 font-serif text-[1.95rem] font-medium leading-[1.08] tracking-[-0.02em] text-[#102f52] sm:mt-6 sm:text-5xl sm:leading-[1.06]">
                Manage the department from one place.
              </h1>
              <p className="mt-4 max-w-md text-[15px] leading-7 text-[#44607a] sm:mt-6 sm:text-base">
                Sign in to manage lecturers, courses, term plotting, and
                teaching availability across the English Department.
              </p>
              <ul className="mt-7 hidden space-y-3 text-sm text-[#44607a] sm:mt-8 sm:block">
                {[
                  "Lecturer directory, expertise & ratings",
                  "Course plotting by academic term",
                  "Availability and teaching-load overview",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#e5effa] text-[#005baa]">
                      <svg
                        viewBox="0 0 24 24"
                        className="h-3 w-3"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </motion.section>

            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.6,
                delay: 0.2,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="w-full rounded-2xl border border-[#d7e6f7] bg-white p-6 shadow-[0_1px_2px_rgba(20,20,19,0.04),0_18px_40px_-20px_rgba(20,20,19,0.22)] sm:p-8 lg:ml-auto lg:max-w-md"
            >
              <span className="text-xs font-medium uppercase tracking-[0.14em] text-[#93a7bc]">
                Restricted access
              </span>
              <h2 className="mt-2 font-serif text-3xl font-medium tracking-[-0.01em] text-[#102f52]">
                Sign in
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#44607a]">
                {USE_SUPABASE
                  ? "Welcome back. Sign in to manage the department."
                  : "Supabase is not configured. Ask an administrator to set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY."}
              </p>

              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  if (
                    !busy &&
                    email &&
                    password &&
                    (USE_SUPABASE || isDemoCredentials)
                  )
                    submit();
                }}
                className="mt-6 space-y-4"
              >
                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium text-[#6f8aa3]">
                    Email
                  </span>
                  <div className="flex h-12 items-center gap-2.5 rounded-xl border border-[#ccdcef] bg-white px-3.5 transition focus-within:border-[#005baa]">
                    <Icons.users className="h-4 w-4 text-[#93a7bc]" />
                    <input
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      type="email"
                      autoComplete="email"
                      placeholder="you@ecampus.ut.ac.id"
                      className="w-full bg-transparent text-sm text-[#102f52] outline-none placeholder:text-[#9db1c6]"
                    />
                  </div>
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium text-[#6f8aa3]">
                    Password
                  </span>
                  <div className="flex h-12 items-center gap-2.5 rounded-xl border border-[#ccdcef] bg-white px-3.5 transition focus-within:border-[#005baa]">
                    <svg
                      viewBox="0 0 24 24"
                      className="h-4 w-4 text-[#93a7bc]"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <rect x="3" y="11" width="18" height="11" rx="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    <input
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      type="password"
                      autoComplete="current-password"
                      placeholder="Password"
                      className="w-full bg-transparent text-sm text-[#102f52] outline-none placeholder:text-[#9db1c6]"
                    />
                  </div>
                </label>
                {error && (
                  <p className="rounded-xl border border-[#E8C4B8] bg-[#F8EAE4] px-3 py-2.5 text-sm font-medium text-[#A8431F]">
                    {error}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={
                    busy ||
                    !email ||
                    !password ||
                    (!USE_SUPABASE && !isDemoCredentials)
                  }
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#005baa] px-5 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-[#004984] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {busy ? "Signing in…" : "Sign in"}
                </button>
                <button
                  type="button"
                  onClick={useDemoAccount}
                  className="inline-flex w-full items-center justify-center rounded-xl border border-[#ccdcef] bg-white px-5 py-3 text-sm font-medium text-[#102f52] transition hover:bg-[#eaf2fb]"
                >
                  Use demo account
                </button>
              </form>
              <p className="mt-4 text-center text-xs leading-5 text-[#93a7bc]">
                Demo account: {DEMO_ACCOUNT.email} / {DEMO_ACCOUNT.password}
              </p>
            </motion.section>
          </main>

          <footer className="border-t border-[#e7e0d0] py-6 text-center text-xs text-[#8a93a3]">
            © 2026 Universitas Terbuka — English Department
            <span className="mx-1">·</span>
            Developed by{" "}
            <a
              href="https://ardikardianto.github.io/resume"
              target="_blank"
              rel="noreferrer"
              className="font-medium text-[#2b62a5] underline-offset-2 hover:underline"
            >
              Ardik Ardianto
            </a>
          </footer>
        </div>
      </div>
    );
  }

  return { LandingScreen, PublicLookupScreen, LoginScreen };
}
