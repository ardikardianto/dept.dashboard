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
  trash: (p) => <IconBase {...p}><path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /></IconBase>,
  users: (p) => <IconBase {...p}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></IconBase>,
  x: (p) => <IconBase {...p}><path d="M18 6 6 18M6 6l12 12" /></IconBase>,
  chart: (p) => <IconBase {...p}><path d="M3 3v18h18" /><rect x="7" y="12" width="3" height="5" /><rect x="12" y="8" width="3" height="9" /><rect x="17" y="5" width="3" height="12" /></IconBase>,
  check: (p) => <IconBase {...p}><circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-5" /></IconBase>,
};

const department = { name: "UT English Dept.", email: "sastra.inggris@ecampus.ut.ac.id", subtitle: "Lecturer Admin" };
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
const USE_SUPABASE = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

const nav = [
  { id: "dashboard", label: "Dashboard", icon: Icons.dashboard }, { id: "lecturers", label: "Lecturers", icon: Icons.users },
  { id: "plotting", label: "Plotting", icon: Icons.file }, { id: "courses", label: "Courses", icon: Icons.book },
  { id: "terms", label: "Terms", icon: Icons.calendar },
];

const uniq = (items) => [...new Set(items.filter(Boolean))];
const includes = (value, query) => String(value || "").toLowerCase().includes(String(query || "").toLowerCase());
const courseTitleByCode = (courses, code) => courses.find((course) => course.code === code)?.title || code;
const plottedCourseTitles = (lecturer, courses) => lecturer.plotted.map((code) => courseTitleByCode(courses, code));
const plottedCourseCountLabel = (count) => `${count} plotted ${count === 1 ? "course" : "courses"}`;
const termPlottingId = (termCode, lecturerId) => `${termCode}::${lecturerId}`;

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

function buildLecturerExportRows(lecturers, courses) {
  return lecturers.map((lecturer) => ({
    Lecturer_ID: lecturer.id,
    Name: lecturer.name,
    Degree: lecturer.degree,
    Email: lecturer.email,
    Phone: lecturer.phone,
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
    { id: "LECT001", degree: "M.A.", name: "Test Lecturer", email: "lecturer@example.com", phone: "0800000000", expertise: ["Reading"], plotted: ["COURSE101"], available: 1 },
    { id: "LECT002", degree: "Ph.D.", name: "Second Lecturer", email: "second@example.com", phone: "0800000001", expertise: ["Writing"], plotted: ["COURSE101", "COURSE102"], available: 4 },
  ];
  const testTerms = [
    { code: "TERM001", name: "Active Term", ay: "2025/2026", semester: "Semester 2", active: true },
    { code: "TERM002", name: "Previous Term", ay: "2025/2026", semester: "Semester 1", active: false },
  ];
  console.assert(testCourses.length > 0, "Courses should not be empty");
  console.assert(testLecturers.length > 0, "Lecturers should not be empty");
  console.assert(testTerms.filter((term) => term.active).length === 1, "Exactly one term should be active");
  const courseCodes = new Set(testCourses.map((course) => course.code));
  const missingCodes = testLecturers.flatMap((lecturer) => lecturer.plotted.filter((code) => !courseCodes.has(code)));
  console.assert(missingCodes.length === 0, `Missing course codes: ${missingCodes.join(", ")}`);
  const exportRows = buildLecturerExportRows(testLecturers, testCourses);
  console.assert(exportRows.length === testLecturers.length, "Export row count should match lecturer count");
  console.assert(exportRows[0].Plotted_Course_Names.includes("Basic Reading"), "Export should include plotted course names");
  console.assert(plottedCourseTitles(testLecturers[0], testCourses).includes("Basic Reading"), "Lecturer display should resolve plotted course names");
  console.assert(plottedCourseCountLabel(1) === "1 plotted course", "Singular label should work");
  console.assert(plottedCourseCountLabel(2) === "2 plotted courses", "Plural label should work");
  console.assert(getPlottedCountData(testLecturers).some((item) => item.name === "1 plotted course"), "Dashboard data should include 1 plotted course");
  const scopedLecturers = getTermScopedLecturers(testLecturers, [buildTermPlottingRow("TERM002", { ...testLecturers[0], plotted: ["COURSE102"], available: 3 })], "TERM002");
  console.assert(scopedLecturers[0].plotted.includes("COURSE102"), "Term plotting should override lecturer plotting");
  console.assert(scopedLecturers[1].plotted.length === 0, "Missing term plotting should stay empty for a new term");
  console.assert(availabilityTone(0) === "red", "0 available should be red");
  console.assert(availabilityTone(1) === "orange", "1 available should be orange");
  console.assert(availabilityTone(2) === "amber", "2 available should be yellow/amber");
  console.assert(availabilityTone(3) === "blue", "3 available should be blue");
  console.assert(availabilityTone(4) === "green", "4 available should be green");
  console.assert(typeof USE_SUPABASE === "boolean", "Supabase config flag should be boolean");
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
  const headers = Object.keys(rows[0]);
  const csv = [headers.join(",")].concat(rows.map((row) => headers.map((header) => `"${String(row[header] ?? "").replace(/"/g, '""')}"`).join(","))).join("\n");
  downloadBlob(`UT_English_Lecturers_${filenameDate}.csv`, csv, "text/csv;charset=utf-8;");
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
    primary: "bg-blue-700 text-white hover:bg-blue-800 shadow-sm",
    secondary: "bg-white text-slate-800 border border-slate-200 hover:bg-slate-50",
    ghost: "bg-transparent text-slate-600 hover:bg-slate-100",
    danger: "bg-white text-red-600 border border-red-100 hover:bg-red-50",
  };
  return <button className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${styles[variant]} ${className}`} {...props}>{children}</button>;
}

function Badge({ children, tone = "blue" }) {
  const tones = {
    red: "bg-red-50 text-red-700 border-red-100",
    orange: "bg-orange-50 text-orange-700 border-orange-100",
    amber: "bg-amber-50 text-amber-700 border-amber-100",
    blue: "bg-blue-50 text-blue-700 border-blue-100",
    green: "bg-emerald-50 text-emerald-700 border-emerald-100",
    slate: "bg-slate-100 text-slate-700 border-slate-200",
  };
  return <span className={`inline-flex items-center rounded-lg border px-2 py-1 text-xs font-bold ${tones[tone] || tones.blue}`}>{children}</span>;
}

function Card({ children, className = "" }) {
  return <div className={`rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`}>{children}</div>;
}

function TextInput({ icon: Icon, value = "", onChange, placeholder, type = "text" }) {
  return <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5">{Icon && <Icon className="h-4 w-4 text-slate-400" />}<input value={value} onChange={(event) => onChange?.(event.target.value)} type={type} className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400" placeholder={placeholder} /></div>;
}

function SelectBox({ label, value, onChange, options = [] }) {
  return <label className="space-y-1.5"><span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">{label}</span><div className="relative"><select value={value} onChange={(event) => onChange?.(event.target.value)} className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 pr-9 text-sm text-slate-700 outline-none"><option value="All">All</option>{options.filter((option) => option !== "All").map((option) => <option key={option} value={option}>{option}</option>)}</select><Icons.chevronDown className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-slate-400" /></div></label>;
}

function Modal({ title, children, onClose }) {
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4" onClick={onClose}><motion.div onClick={(event) => event.stopPropagation()} initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl"><div className="mb-5 flex items-center justify-between"><h2 className="text-xl font-black text-slate-950">{title}</h2><button onClick={onClose} className="rounded-xl p-2 hover:bg-slate-100"><Icons.x /></button></div>{children}</motion.div></div>;
}

function PlainInput({ label, value = "", onChange, placeholder, type = "text" }) {
  return <label className="space-y-1.5"><span className="text-xs font-bold text-slate-600">{label}</span><input value={value} onChange={(event) => onChange(event.target.value)} type={type} placeholder={placeholder} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500" /></label>;
}

function FormGrid({ children }) {
  return <div className="grid gap-3 sm:grid-cols-2">{children}</div>;
}

function Sidebar({ active, setActive, open, setOpen, collapsed, setCollapsed, onLogout }) {
  return <aside className={`fixed inset-y-0 left-0 z-40 min-h-screen border-r border-slate-200 bg-white transition-all duration-300 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${collapsed ? "lg:w-24" : "lg:w-72"} ${open ? "translate-x-0 w-72" : "-translate-x-full w-72"}`}><div className={`flex h-full min-h-screen flex-col p-4 lg:min-h-0 ${collapsed ? "lg:items-center" : ""}`}><div className={`mb-7 flex w-full items-center ${collapsed ? "lg:justify-center" : "justify-between"}`}><div className="flex items-center gap-3"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-700 text-white"><Icons.graduation className="h-6 w-6" /></div>{!collapsed && <div><p className="font-black text-slate-950">{department.name}</p><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">{department.subtitle}</p></div>}</div><button className="lg:hidden" onClick={() => setOpen(false)}><Icons.x /></button></div><button onClick={() => setCollapsed(!collapsed)} title={collapsed ? "Expand sidebar" : "Collapse sidebar"} className={`mb-5 hidden h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm hover:bg-slate-50 lg:flex ${collapsed ? "" : "ml-auto"}`}><svg viewBox="0 0 24 24" className={`h-5 w-5 text-slate-600 transition-transform duration-300 ${collapsed ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg></button><nav className="w-full space-y-2">{nav.map((item) => { const Icon = item.icon; return <button key={item.id} title={item.label} onClick={() => { setActive(item.id); setOpen(false); }} className={`flex w-full items-center rounded-xl py-3 text-sm font-bold transition ${collapsed ? "lg:justify-center lg:px-0" : "gap-3 px-4"} ${active === item.id ? "bg-blue-700 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"}`}><Icon />{!collapsed && <span>{item.label}</span>}</button>; })}</nav><div className={`mt-auto w-full space-y-3 ${collapsed ? "lg:flex lg:flex-col lg:items-center" : ""}`}>{!collapsed && <div><p className="text-xs font-bold text-slate-700">{department.email}</p><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Admin</p></div>}<Button variant="secondary" onClick={onLogout} className={collapsed ? "lg:w-11 lg:px-0" : "w-full justify-start"}><Icons.logout className="h-4 w-4" />{!collapsed && <span>Logout</span>}</Button></div></div></aside>;
}

function Header({ active, setOpen, terms, selectedTermCode, setSelectedTermCode }) {
  const titles = {
    dashboard: ["Overview", "Department Dashboard", "Live infographics of lecturer distribution, expertise, teaching load, and availability."],
    lecturers: ["Directory", "Lecturers", "Search, filter, sort, add, edit, or remove lecturer records."],
    plotting: ["Course Plotting", "Plot lecturers to courses", "Assign which courses each lecturer will teach for the selected term."],
    courses: ["Catalog", "Courses", "The English Department course catalog used for term-based plotting."],
    terms: ["Academic Calendar", "Terms / Semesters", "Define academic terms and choose which one is active for plotting."],
  };
  const [eyebrow, title, desc] = titles[active];
  const showTermPicker = active !== "lecturers";
  const termSelectValue = terms.some((term) => term.code === selectedTermCode) ? selectedTermCode : terms[0]?.code || "";
  return <div className="mb-6 flex gap-3"><button onClick={() => setOpen(true)} className="mt-1 rounded-xl border border-slate-200 bg-white p-2 lg:hidden"><Icons.menu /></button><div><p className="text-xs font-black uppercase tracking-[0.35em] text-slate-500">{eyebrow}</p><h1 className="mt-1 text-3xl font-black tracking-tight text-slate-950 md:text-4xl">{title}</h1><p className="mt-2 flex max-w-3xl flex-wrap items-center gap-2 text-sm leading-6 text-slate-500"><span>{desc}</span>{showTermPicker && (terms.length ? <select aria-label="Select term" value={termSelectValue} onChange={(event) => setSelectedTermCode(event.target.value)} className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm font-bold text-slate-700 outline-none focus:border-blue-500">{terms.map((term) => <option key={term.code} value={term.code}>{term.name}</option>)}</select> : <b className="text-slate-700">No active term selected.</b>)}</p></div></div>;
}

function Stat({ label, value, icon: Icon, tone = "blue", note }) {
  return <Card className={`p-5 ${tone === "amber" ? "border-amber-200 bg-amber-50/40" : ""}`}><div className="flex items-start justify-between"><div><p className="text-xs font-black uppercase tracking-[0.25em] text-slate-500">{label}</p><p className="mt-3 text-4xl font-black text-slate-950">{value}</p>{note && <p className="mt-1 text-xs text-slate-500">{note}</p>}</div><div className={`rounded-xl p-3 ${tone === "amber" ? "bg-amber-300 text-slate-900" : "bg-blue-50 text-blue-700"}`}><Icon /></div></div></Card>;
}

function Dashboard({ lecturers, courses }) {
  const [filters, setFilters] = useState({ degree: "All", expertise: "All", plotted: "All", available: "All" });
  const filtered = useMemo(() => lecturers.filter((lecturer) => (filters.degree === "All" || lecturer.degree === filters.degree) && (filters.expertise === "All" || lecturer.expertise.includes(filters.expertise)) && (filters.plotted === "All" || lecturer.plotted.some((code) => courseTitleByCode(courses, code) === filters.plotted)) && (filters.available === "All" || String(lecturer.available) === filters.available)), [lecturers, courses, filters]);
  const expertiseData = Object.entries(filtered.flatMap((lecturer) => lecturer.expertise).reduce((acc, item) => ({ ...acc, [item]: (acc[item] || 0) + 1 }), {})).map(([name, value]) => ({ name, value }));
  const degreeData = Object.entries(filtered.reduce((acc, lecturer) => ({ ...acc, [lecturer.degree]: (acc[lecturer.degree] || 0) + 1 }), {})).map(([name, value]) => ({ name, value }));
  const plottedCountData = getPlottedCountData(filtered);
  const availableData = filtered.map((lecturer) => ({ name: lecturer.name.split(" ")[0], available: lecturer.available, plotted: lecturer.plotted.length }));
  return <div className="space-y-6"><Card className="p-5"><p className="mb-4 text-xs font-black uppercase tracking-[0.25em] text-slate-500">Filter Infographics</p><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"><SelectBox label="Academic Degree" value={filters.degree} onChange={(value) => setFilters({ ...filters, degree: value })} options={uniq(lecturers.map((lecturer) => lecturer.degree))} /><SelectBox label="Course Expertise" value={filters.expertise} onChange={(value) => setFilters({ ...filters, expertise: value })} options={uniq(lecturers.flatMap((lecturer) => lecturer.expertise))} /><SelectBox label="Plotted Course" value={filters.plotted} onChange={(value) => setFilters({ ...filters, plotted: value })} options={courses.map((course) => course.title)} /><SelectBox label="Courses Available" value={filters.available} onChange={(value) => setFilters({ ...filters, available: value })} options={["0", "1", "2", "3", "4"]} /></div></Card><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"><Stat label="Total Lecturers" value={filtered.length} icon={Icons.users} /><Stat label="Total Plotted Courses" value={filtered.reduce((sum, lecturer) => sum + lecturer.plotted.length, 0)} icon={Icons.book} note="Filtered result" /><Stat label="Total Available Slots" value={filtered.reduce((sum, lecturer) => sum + lecturer.available, 0)} icon={Icons.chart} /><Stat label="Avg. Available / Lecturer" value={filtered.length ? (filtered.reduce((sum, lecturer) => sum + lecturer.available, 0) / filtered.length).toFixed(1) : "0"} icon={Icons.check} tone="amber" note="Range 0–4" /></div><div className="grid gap-6 md:grid-cols-2"><Card className="p-5"><h3 className="font-black text-slate-950">By Academic Degree</h3><div className="h-72"><ResponsiveContainer><RePieChart><Pie data={degreeData} dataKey="value" nameKey="name" innerRadius={65} outerRadius={95}>{degreeData.map((_, index) => <Cell key={index} fill={["#1d4ed8", "#60a5fa", "#facc15", "#14b8a6"][index % 4]} />)}</Pie><Tooltip /><Legend /></RePieChart></ResponsiveContainer></div></Card><Card className="p-5"><h3 className="font-black text-slate-950">By Number of Plotted Courses</h3><div className="h-72"><ResponsiveContainer><RePieChart><Pie data={plottedCountData} dataKey="value" nameKey="name" innerRadius={65} outerRadius={95}>{plottedCountData.map((_, index) => <Cell key={index} fill={["#1d4ed8", "#60a5fa", "#facc15", "#14b8a6", "#94a3b8"][index % 5]} />)}</Pie><Tooltip /><Legend /></RePieChart></ResponsiveContainer></div></Card><Card className="p-5 md:col-span-2"><h3 className="font-black text-slate-950">By Course Expertise</h3><div className="h-72"><ResponsiveContainer><BarChart data={expertiseData} layout="vertical"><CartesianGrid strokeDasharray="3 3" /><XAxis type="number" /><YAxis dataKey="name" type="category" width={155} tick={{ fontSize: 11 }} /><Tooltip /><Bar dataKey="value" fill="#1d4ed8" radius={[0, 8, 8, 0]} /></BarChart></ResponsiveContainer></div></Card></div><Card className="p-5"><h3 className="font-black text-slate-950">Lecturer Load and Availability</h3><div className="h-80"><ResponsiveContainer><BarChart data={availableData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip /><Legend /><Bar dataKey="plotted" fill="#1d4ed8" radius={[8, 8, 0, 0]} /><Bar dataKey="available" fill="#facc15" radius={[8, 8, 0, 0]} /></BarChart></ResponsiveContainer></div></Card></div>;
}

function LecturerForm({ initial, courses, onSave, onClose }) {
  const [form, setForm] = useState(() => initial || { id: String(Date.now()).slice(-8), degree: "M.A.", name: "", email: "", phone: "", expertiseText: "", plottedText: "", available: 0 });
  const save = () => {
    const expertiseText = form.expertiseText ?? form.expertise?.join(", ") ?? "";
    const plottedText = form.plottedText ?? form.plotted?.join(", ") ?? "";
    onSave({ id: form.id, degree: form.degree, name: form.name, email: form.email, phone: form.phone, available: Number(form.available), expertise: uniq(expertiseText.split(",").map((item) => item.trim())), plotted: uniq(plottedText.split(",").map((item) => item.trim()).filter((code) => courses.some((course) => course.code === code))) });
  };
  return <div className="space-y-4"><FormGrid><PlainInput label="ID" value={form.id} onChange={(value) => setForm({ ...form, id: value })} /><PlainInput label="Degree" value={form.degree} onChange={(value) => setForm({ ...form, degree: value })} /></FormGrid><PlainInput label="Full name" value={form.name} onChange={(value) => setForm({ ...form, name: value })} /><FormGrid><PlainInput label="Email" value={form.email} onChange={(value) => setForm({ ...form, email: value })} /><PlainInput label="Phone" value={form.phone} onChange={(value) => setForm({ ...form, phone: value })} /></FormGrid><PlainInput label="Expertise, separated by comma" value={form.expertiseText ?? form.expertise?.join(", ") ?? ""} onChange={(value) => setForm({ ...form, expertiseText: value })} /><PlainInput label="Plotted course codes, separated by comma" value={form.plottedText ?? form.plotted?.join(", ") ?? ""} onChange={(value) => setForm({ ...form, plottedText: value })} /><PlainInput label="Available slots (0–4)" type="number" value={form.available} onChange={(value) => setForm({ ...form, available: value })} /><div className="flex justify-end gap-3"><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={save} disabled={!form.name || !form.email}>Save lecturer</Button></div></div>;
}

function LecturerInfoCard({ lecturer, courses }) {
  return <div className="space-y-5"><div className="rounded-2xl bg-blue-50 p-5"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-xs font-black uppercase tracking-[0.25em] text-blue-700">Lecturer Profile</p><h3 className="mt-2 text-2xl font-black text-slate-950">{lecturer.name}</h3><p className="mt-1 text-sm text-slate-600">{lecturer.degree} · ID {lecturer.id}</p></div><Badge tone={availabilityTone(lecturer.available)}>{lecturer.available} available slots</Badge></div></div><div className="grid gap-4 sm:grid-cols-2"><Card className="p-4"><p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Email</p><p className="mt-2 text-sm font-bold text-slate-800">{lecturer.email}</p></Card><Card className="p-4"><p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Phone</p><p className="mt-2 text-sm font-bold text-slate-800">{lecturer.phone}</p></Card></div><Card className="p-4"><p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Expertise</p><div className="mt-3 flex flex-wrap gap-2">{lecturer.expertise.map((item) => <Badge key={item}>{item}</Badge>)}</div></Card><Card className="p-4"><p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Plotted Courses</p><div className="mt-3 space-y-2">{lecturer.plotted.map((code) => <div key={code} className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm"><b className="text-blue-700">{courseTitleByCode(courses, code)}</b><span className="ml-2 text-xs text-slate-500">({code})</span></div>)}</div></Card></div>;
}

function Lecturers({ lecturers, setLecturers, courses }) {
  const [query, setQuery] = useState("");
  const [degree, setDegree] = useState("All");
  const [expertise, setExpertise] = useState("All");
  const [available, setAvailable] = useState("All");
  const [sort, setSort] = useState("name");
  const [modal, setModal] = useState(null);
  const [viewing, setViewing] = useState(null);
  const rows = useMemo(() => lecturers.filter((lecturer) => [lecturer.id, lecturer.name, lecturer.email, lecturer.phone, lecturer.degree, lecturer.expertise.join(" "), lecturer.plotted.join(" "), plottedCourseTitles(lecturer, courses).join(" ")].some((value) => includes(value, query))).filter((lecturer) => degree === "All" || lecturer.degree === degree).filter((lecturer) => expertise === "All" || lecturer.expertise.includes(expertise)).filter((lecturer) => available === "All" || String(lecturer.available) === available).sort((a, b) => String(a[sort] ?? "").localeCompare(String(b[sort] ?? ""))), [lecturers, courses, query, degree, expertise, available, sort]);
  const save = (item) => { setLecturers((prev) => prev.some((lecturer) => lecturer.id === item.id) ? prev.map((lecturer) => lecturer.id === item.id ? item : lecturer) : [item, ...prev]); setModal(null); };
  const remove = (id) => setLecturers((prev) => prev.filter((lecturer) => lecturer.id !== id));
  return <div className="space-y-5"><div className="flex flex-wrap justify-end gap-3"><Button variant="secondary"><Icons.download className="h-4 w-4" />Template</Button><Button variant="secondary"><Icons.download className="h-4 w-4" />Import CSV / XLSX</Button><Button variant="secondary" onClick={() => exportLecturersToXLSX(rows, courses)} disabled={rows.length === 0}><Icons.download className="h-4 w-4" />Export XLSX</Button><Button onClick={() => setModal({})}><Icons.plus className="h-4 w-4" />Add lecturer</Button></div><Card className="p-4"><TextInput icon={Icons.search} value={query} onChange={setQuery} placeholder="Search by ID, name, email, expertise, or course name..." /><div className="mt-4 grid gap-3 md:grid-cols-5"><SelectBox label="Degree" value={degree} onChange={setDegree} options={uniq(lecturers.map((lecturer) => lecturer.degree))} /><SelectBox label="Expertise" value={expertise} onChange={setExpertise} options={uniq(lecturers.flatMap((lecturer) => lecturer.expertise))} /><SelectBox label="Available" value={available} onChange={setAvailable} options={["0", "1", "2", "3", "4"]} /><SelectBox label="Sort by" value={sort} onChange={setSort} options={["name", "id", "degree", "email", "available"]} /><Button variant="secondary" className="mt-5" onClick={() => { setQuery(""); setDegree("All"); setExpertise("All"); setAvailable("All"); setSort("name"); }}>Reset</Button></div></Card><Card className="overflow-hidden"><div className="overflow-x-auto"><table className="w-full min-w-[1100px] text-left text-sm"><thead className="bg-slate-50 text-[10px] uppercase tracking-[0.15em] text-slate-500"><tr>{["ID", "Degree", "Full Name", "#Plotted", "Available", "Email", "Phone", "Expertise", "Plotted Courses", "Actions"].map((header) => <th key={header} className="px-4 py-4 font-black">{header}</th>)}</tr></thead><tbody>{rows.map((lecturer) => <tr key={lecturer.id} className="border-t border-slate-100"><td className="px-4 py-4 font-bold text-blue-700">{lecturer.id}</td><td className="px-4 py-4"><Badge tone="slate">{lecturer.degree}</Badge></td><td className="px-4 py-4 font-black text-slate-900">{lecturer.name}</td><td className="px-4 py-4 font-bold">{lecturer.plotted.length}</td><td className="px-4 py-4"><Badge tone={availabilityTone(lecturer.available)}>{lecturer.available}</Badge></td><td className="px-4 py-4 text-slate-600">{lecturer.email}</td><td className="px-4 py-4 text-slate-600">{lecturer.phone}</td><td className="px-4 py-4"><div className="flex flex-wrap gap-1">{lecturer.expertise.map((item) => <Badge key={item}>{item}</Badge>)}</div></td><td className="px-4 py-4 text-xs text-slate-600"><div className="flex max-w-md flex-wrap gap-1">{lecturer.plotted.map((code) => <Badge key={code} tone="slate">{courseTitleByCode(courses, code)}</Badge>)}</div></td><td className="px-4 py-4"><div className="flex gap-3"><button title="View lecturer information" onClick={() => setViewing(lecturer)}><Icons.eye className="h-4 w-4 text-blue-700" /></button><button title="Edit lecturer" onClick={() => setModal({ ...lecturer, expertiseText: lecturer.expertise.join(", "), plottedText: lecturer.plotted.join(", ") })}><Icons.edit className="h-4 w-4" /></button><button title="Delete lecturer" onClick={() => remove(lecturer.id)}><Icons.trash className="h-4 w-4 text-red-500" /></button></div></td></tr>)}</tbody></table></div>{rows.length === 0 && <p className="p-6 text-center text-sm text-slate-500">No lecturers match your search/filter.</p>}</Card>{viewing && <Modal title="Lecturer Information" onClose={() => setViewing(null)}><LecturerInfoCard lecturer={viewing} courses={courses} /></Modal>}{modal && <Modal title={modal.id ? "Edit lecturer" : "Add lecturer"} onClose={() => setModal(null)}><LecturerForm initial={modal.id ? modal : null} courses={courses} onSave={save} onClose={() => setModal(null)} /></Modal>}</div>;
}

function Plotting({ lecturers, setLecturers, courses }) {
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState(null);
  const rows = lecturers.filter((lecturer) => [lecturer.id, lecturer.name, lecturer.email, lecturer.plotted.join(" "), plottedCourseTitles(lecturer, courses).join(" ")].some((value) => includes(value, query)));
  const savePlot = () => { const item = { ...editing, plotted: editing.plotted, available: Number(editing.available) }; setLecturers((prev) => prev.map((lecturer) => lecturer.id === editing.id ? item : lecturer)); setEditing(null); };
  return <div className="space-y-5"><Card className="p-4"><TextInput icon={Icons.search} value={query} onChange={setQuery} placeholder="Search lecturer by ID, name, email, or course name..." /></Card>{rows.map((lecturer) => <Card key={lecturer.id} className="p-5"><div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div><div className="flex flex-wrap items-center gap-2"><span className="text-sm font-black text-blue-700">{lecturer.id}</span><Badge tone="slate">{lecturer.degree}</Badge><h3 className="text-lg font-black text-slate-950">{lecturer.name}</h3></div><p className="text-sm text-slate-500">{lecturer.email}</p><div className="mt-3 flex flex-wrap gap-2">{lecturer.plotted.map((code) => <Badge key={code}>{courseTitleByCode(courses, code)}</Badge>)}</div></div><div className="flex items-center gap-4"><div className="text-center"><p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Available</p><Badge tone={availabilityTone(lecturer.available)}>{lecturer.available}</Badge></div><Button variant="secondary" onClick={() => setEditing({ ...lecturer })}>Edit assignments</Button></div></div></Card>)}{editing && <Modal title={`Edit assignments — ${editing.name}`} onClose={() => setEditing(null)}><div className="space-y-3"><p className="text-sm text-slate-500">Select course names for this lecturer.</p><div className="grid max-h-72 gap-2 overflow-y-auto rounded-xl border border-slate-200 p-3 sm:grid-cols-2">{courses.map((course) => <label key={course.code} className="flex gap-2 text-sm"><input type="checkbox" checked={editing.plotted.includes(course.code)} onChange={(event) => setEditing({ ...editing, plotted: event.target.checked ? [...editing.plotted, course.code] : editing.plotted.filter((code) => code !== course.code) })} /><span>{course.title} <b className="text-xs text-slate-400">({course.code})</b></span></label>)}</div><PlainInput label="Available slots" type="number" value={editing.available} onChange={(value) => setEditing({ ...editing, available: value })} /><div className="flex justify-end gap-3"><Button variant="secondary" onClick={() => setEditing(null)}>Cancel</Button><Button onClick={savePlot}>Save assignments</Button></div></div></Modal>}</div>;
}

function CourseForm({ initial, onSave, onClose }) {
  const [form, setForm] = useState(initial || { code: "", title: "", credits: 3 });
  return <div className="space-y-4"><FormGrid><PlainInput label="Code" value={form.code} onChange={(value) => setForm({ ...form, code: value.toUpperCase() })} /><PlainInput label="Credits" type="number" value={form.credits} onChange={(value) => setForm({ ...form, credits: value })} /></FormGrid><PlainInput label="Course title" value={form.title} onChange={(value) => setForm({ ...form, title: value })} /><div className="flex justify-end gap-3"><Button variant="secondary" onClick={onClose}>Cancel</Button><Button disabled={!form.code || !form.title} onClick={() => onSave({ ...form, credits: Number(form.credits) })}>Save course</Button></div></div>;
}

function Courses({ courses, setCourses, setLecturers, setTermPlottings }) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("code");
  const [modal, setModal] = useState(null);
  const rows = useMemo(() => courses.filter((course) => includes(course.code, query) || includes(course.title, query) || includes(course.credits, query)).sort((a, b) => String(a[sort]).localeCompare(String(b[sort]))), [courses, query, sort]);
  const save = (item) => { setCourses((prev) => prev.some((course) => course.code === item.code) ? prev.map((course) => course.code === item.code ? item : course) : [item, ...prev]); setModal(null); };
  const remove = (code) => { setCourses((prev) => prev.filter((course) => course.code !== code)); setLecturers((prev) => prev.map((lecturer) => ({ ...lecturer, plotted: lecturer.plotted.filter((item) => item !== code) }))); setTermPlottings((prev) => prev.map((row) => ({ ...row, plotted: row.plotted.filter((item) => item !== code) }))); };
  return <div className="space-y-5"><div className="flex justify-end"><Button onClick={() => setModal({})}><Icons.plus className="h-4 w-4" />New course</Button></div><Card className="grid gap-3 p-4 md:grid-cols-[1fr_220px]"><TextInput icon={Icons.search} value={query} onChange={setQuery} placeholder="Search by code, title, or credits..." /><SelectBox label="Sort by" value={sort} onChange={setSort} options={["code", "title", "credits"]} /></Card><Card className="divide-y divide-slate-100">{rows.map((course) => <div key={course.code} className="flex items-center justify-between gap-4 p-4"><div className="flex items-center gap-4"><div className="rounded-xl bg-blue-50 p-3 text-blue-700"><Icons.book /></div><div><p className="font-black text-slate-950"><span className="text-blue-700">{course.code}</span> · {course.title}</p><p className="text-sm text-slate-500">{course.credits} credits</p></div></div><div className="flex gap-3"><button onClick={() => setModal(course)}><Icons.edit className="h-4 w-4" /></button><button onClick={() => remove(course.code)}><Icons.trash className="h-4 w-4 text-red-500" /></button></div></div>)}{rows.length === 0 && <p className="p-6 text-center text-sm text-slate-500">No courses match your search.</p>}</Card>{modal && <Modal title={modal.code ? "Edit course" : "New course"} onClose={() => setModal(null)}><CourseForm initial={modal.code ? modal : null} onSave={save} onClose={() => setModal(null)} /></Modal>}</div>;
}

function TermForm({ initial, onSave, onClose }) {
  const [form, setForm] = useState(initial || { name: "", code: "", ay: "2025/2026", semester: "Semester 1", active: false });
  return <div className="space-y-4"><PlainInput label="Term name" value={form.name} onChange={(value) => setForm({ ...form, name: value })} /><FormGrid><PlainInput label="Code" value={form.code} onChange={(value) => setForm({ ...form, code: value })} /><PlainInput label="Academic year" value={form.ay} onChange={(value) => setForm({ ...form, ay: value })} /></FormGrid><FormGrid><PlainInput label="Semester" value={form.semester} onChange={(value) => setForm({ ...form, semester: value })} /><label className="mt-7 flex items-center gap-2 text-sm font-bold text-slate-700"><input type="checkbox" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} /> Set as active term</label></FormGrid><div className="flex justify-end gap-3"><Button variant="secondary" onClick={onClose}>Cancel</Button><Button disabled={!form.name || !form.code} onClick={() => onSave(form)}>Save term</Button></div></div>;
}

function Terms({ terms, setTerms, onActiveTermChange }) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("name");
  const [modal, setModal] = useState(null);
  const rows = terms.filter((term) => [term.name, term.code, term.ay, term.semester, term.active ? "active" : "inactive"].some((value) => includes(value, query))).sort((a, b) => String(a[sort]).localeCompare(String(b[sort])));
  const save = (item) => { setTerms((prev) => { const next = prev.some((term) => term.code === item.code) ? prev.map((term) => term.code === item.code ? item : term) : [item, ...prev]; return item.active ? next.map((term) => ({ ...term, active: term.code === item.code })) : next; }); if (item.active) onActiveTermChange(item.code); setModal(null); };
  const remove = (code) => setTerms((prev) => prev.filter((term) => term.code !== code));
  return <div className="space-y-5"><div className="flex justify-end"><Button onClick={() => setModal({})}><Icons.plus className="h-4 w-4" />New term</Button></div><Card className="grid gap-3 p-4 md:grid-cols-[1fr_220px]"><TextInput icon={Icons.search} value={query} onChange={setQuery} placeholder="Search term, code, year, semester, or status..." /><SelectBox label="Sort by" value={sort} onChange={setSort} options={["name", "code", "ay", "semester"]} /></Card>{rows.map((term) => <Card key={term.code} className="p-5"><div className="flex items-center justify-between gap-4"><div className="flex items-center gap-4"><Icons.check className={term.active ? "h-6 w-6 text-emerald-500" : "h-6 w-6 text-slate-300"} /><div><p className="text-lg font-black text-slate-950">{term.name}</p><p className="text-sm text-slate-500">{term.code} · AY {term.ay} · {term.semester} · {term.active ? "active" : "inactive"}</p></div></div><div className="flex gap-3"><button onClick={() => setModal(term)}><Icons.edit className="h-4 w-4" /></button><button onClick={() => remove(term.code)}><Icons.trash className="h-4 w-4 text-red-500" /></button></div></div></Card>)}{rows.length === 0 && <p className="p-6 text-center text-sm text-slate-500">No terms match your search.</p>}{modal && <Modal title={modal.code ? "Edit term" : "New term"} onClose={() => setModal(null)}><TermForm initial={modal.code ? modal : null} onSave={save} onClose={() => setModal(null)} /></Modal>}</div>;
}

function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async () => { setError(""); setBusy(true); try { const loggedInEmail = await signIn(email, password); onLogin(loggedInEmail); } catch (err) { setError(err.message || "Authentication failed."); } finally { setBusy(false); } };
  return <div className="min-h-screen bg-slate-50 lg:grid lg:grid-cols-[1.05fr_.95fr]"><section className="relative flex min-h-[34vh] overflow-hidden bg-blue-950 px-5 py-6 text-white sm:min-h-[38vh] sm:px-8 lg:min-h-screen lg:px-10 lg:py-10"><div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(250,204,21,.22),_transparent_34%),linear-gradient(rgba(15,64,140,.82),rgba(12,46,98,.94))]" /><div className="relative flex w-full flex-col justify-between gap-8"><div className="flex items-center gap-3"><div className="rounded-xl bg-white/15 p-2.5"><Icons.graduation className="h-5 w-5" /></div><div><p className="text-sm font-black sm:text-base">Universitas Terbuka</p><p className="text-[10px] uppercase tracking-[0.28em] text-blue-100">English Department</p></div></div><div className="max-w-xl"><p className="mb-3 text-[10px] font-black uppercase tracking-[0.32em] text-yellow-300">Lecturer Database</p><h2 className="text-3xl font-black leading-tight sm:text-4xl lg:text-5xl">Manage lecturers, plot courses, see the big picture.</h2><p className="mt-4 max-w-md text-sm leading-6 text-blue-100 sm:text-base">A single database for degrees, expertise, availability and teaching load across the department.</p></div><p className="hidden text-xs text-blue-100/70 lg:block">© 2026 Universitas Terbuka — English Department</p></div></section><section className="flex items-center justify-center px-5 py-8 sm:px-8 lg:px-10"><Card className="w-full max-w-sm border-slate-200 p-5 shadow-sm sm:max-w-md sm:p-6 lg:p-7"><p className="text-[10px] font-black uppercase tracking-[0.32em] text-slate-500">Restricted access</p><h1 className="mt-2 text-2xl font-black text-slate-950 sm:text-3xl">Sign in</h1><p className="mt-2 text-sm leading-6 text-slate-500">{USE_SUPABASE ? "Use your existing Supabase account to access department data." : "Supabase is not configured. Ask an administrator to set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY."}</p><div className="mt-6 space-y-3"><TextInput icon={Icons.users} value={email} onChange={setEmail} placeholder="Email address" /><TextInput icon={Icons.check} value={password} onChange={setPassword} placeholder="Password" type="password" />{error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-600">{error}</p>}<Button className="w-full py-2.5" onClick={submit} disabled={!USE_SUPABASE || busy || !email || !password}>{busy ? "Processing..." : "Sign in"}</Button></div></Card></section></div>;
}

export default function App() {
  const [active, setActive] = useState("dashboard");
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [userEmail, setUserEmail] = useState(getStoredUserEmail);
  const [lecturers, setLecturers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [terms, setTerms] = useState([]);
  const [termPlottings, setTermPlottings] = useState([]);
  const [selectedTermCode, setSelectedTermCode] = useState("");
  const [dbStatus, setDbStatus] = useState(USE_SUPABASE ? "Signed out" : "Supabase not configured");
  const [isHydrated, setIsHydrated] = useState(false);
  const hydratedRef = useRef(false);
  const syncingRef = useRef(false);
  const setHydrated = useCallback((value) => {
    hydratedRef.current = value;
    setIsHydrated(value);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadDatabase() {
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
        const [lecturerRows, courseRows, termRows, plottingRows] = await Promise.all([
          fetchTable("lecturers", "name"),
          fetchTable("courses", "code"),
          fetchTable("academic_terms", "code"),
          fetchTable("term_plottings", "id"),
        ]);
        if (cancelled) return;
        setLecturers(Array.isArray(lecturerRows) ? lecturerRows : []);
        setCourses(Array.isArray(courseRows) ? courseRows : []);
        setTerms(Array.isArray(termRows) ? termRows : []);
        setTermPlottings(Array.isArray(plottingRows) ? plottingRows.map(normalizeTermPlotting) : []);
        setHydrated(true);
        setDbStatus("Supabase connected");
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
          setDbStatus("Session expired. Please sign in again.");
          return;
        }
        setDbStatus(error.message || "Database load failed");
      }
    }
    loadDatabase();
    return () => { cancelled = true; };
  }, [setHydrated, userEmail]);

  const activeTermCode = terms.find((term) => term.active)?.code || "";
  const effectiveSelectedTermCode = terms.some((term) => term.code === selectedTermCode) ? selectedTermCode : activeTermCode || terms[0]?.code || "";
  const validTermPlottings = useMemo(() => {
    const lecturerIds = new Set(lecturers.map((lecturer) => lecturer.id));
    return termPlottings.filter((row) => lecturerIds.has(row.lecturer_id));
  }, [lecturers, termPlottings]);

  useEffect(() => {
    if (!USE_SUPABASE || !userEmail || !hydratedRef.current || syncingRef.current) return;
    const timer = window.setTimeout(async () => {
      try {
        syncingRef.current = true;
        setDbStatus("Saving...");
        await Promise.all([
          syncTable("lecturers", lecturers, "id"),
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
  }, [lecturers, courses, terms, validTermPlottings, userEmail]);

  const handleLogin = (email) => {
    setHydrated(false);
    setUserEmail(email);
  };

  const handleLogout = () => {
    signOut();
    setHydrated(false);
    setUserEmail("");
    setLecturers([]);
    setCourses([]);
    setTerms([]);
    setTermPlottings([]);
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
  const pageLecturers = active === "dashboard" || active === "plotting" ? termScopedLecturers : lecturers;
  const pageSetLecturers = active === "plotting" ? setTermScopedLecturers : setLecturers;
  const props = { lecturers: pageLecturers, setLecturers: pageSetLecturers, courses, setCourses, terms, setTerms, setTermPlottings, onActiveTermChange: setSelectedTermCode };

  if (!userEmail) return <LoginScreen onLogin={handleLogin} />;

  return <div className="min-h-screen bg-slate-50 text-slate-900"><div className="flex min-h-screen items-stretch"><Sidebar active={active} setActive={setActive} open={open} setOpen={setOpen} collapsed={collapsed} setCollapsed={setCollapsed} onLogout={handleLogout} /><main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-10"><div className="mx-auto max-w-7xl"><div className="mb-4 flex flex-wrap items-center justify-end gap-3"><Badge tone={isHydrated ? "green" : "amber"}>{dbStatus}</Badge><Badge tone="slate">{userEmail}</Badge></div><Header active={active} setOpen={setOpen} terms={terms} selectedTermCode={effectiveSelectedTermCode} setSelectedTermCode={setSelectedTermCode} /><motion.div key={`${active}-${effectiveSelectedTermCode}`} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}><Page {...props} /></motion.div></div></main></div></div>;
}
