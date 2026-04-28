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
const MAX_CLASS_ASSIGNMENTS_PER_COURSE = 99;

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

function buildPlottedFromCounts(counts) {
  return Object.entries(counts).flatMap(([code, count]) => Array.from({ length: toClassCount(count) }, () => code));
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
  };
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

function createXLSX(rows) {
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
    { name: "xl/workbook.xml", content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Lecturers" sheetId="1" r:id="rId1"/></sheets></workbook>` },
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

function isImportRowBlank(row) {
  return Object.values(row).every((value) => String(value ?? "").trim() === "");
}

function mapImportedLecturers(rows, courses) {
  return rows.filter((row) => !isImportRowBlank(row)).map((row, index) => {
    const plotted = splitList(getImportedValue(row, ["Plotted_Course_Codes", "Plotted Course Codes", "Plotted Courses", "Plotted", "Courses"]));
    const knownPlotted = plotted.filter((code) => !courses.length || courses.some((course) => course.code === code));
    const importedId = String(getImportedValue(row, ["Lecturer_ID", "Lecturer ID", "ID"])).trim();
    return normalizeLecturer({
      id: importedId || `imported-${Date.now()}-${index + 1}`,
      degree: String(getImportedValue(row, ["Degree"])).trim(),
      name: String(getImportedValue(row, ["Name", "Full Name"])).trim(),
      email: String(getImportedValue(row, ["Email"])).trim(),
      phone: String(getImportedValue(row, ["Phone"])).trim(),
      expertise: splitList(getImportedValue(row, ["Expertise"])),
      plotted: knownPlotted,
      available: Number(getImportedValue(row, ["Available_Slots", "Available Slots", "Available"])) || 0,
    });
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

function FloatingBottomNav({ active, setActive, onLogout }) {
  return <nav className="fixed inset-x-0 bottom-4 z-40 px-3 sm:bottom-6 sm:px-6"><div className="mx-auto flex max-w-5xl items-center gap-2 overflow-x-auto rounded-[1.75rem] border border-slate-200 bg-white/95 p-2 shadow-[0_18px_60px_rgba(15,23,42,0.16)] backdrop-blur-xl"><div className="hidden shrink-0 items-center gap-3 border-r border-slate-200 px-3 pr-4 md:flex"><div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-700 text-white"><Icons.graduation className="h-5 w-5" /></div><div><p className="text-sm font-black text-slate-950">{department.name}</p><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">{department.subtitle}</p></div></div>{nav.map((item) => { const Icon = item.icon; const selected = active === item.id; return <button key={item.id} title={item.label} onClick={() => setActive(item.id)} className={`flex min-w-16 shrink-0 flex-col items-center justify-center gap-1 rounded-2xl px-3 py-2 text-[11px] font-black transition sm:min-w-24 sm:flex-row sm:px-4 sm:text-sm ${selected ? "bg-blue-700 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"}`}><Icon className="h-5 w-5" /><span>{item.label}</span></button>; })}<button title="Logout" onClick={onLogout} className="ml-auto flex min-w-16 shrink-0 flex-col items-center justify-center gap-1 rounded-2xl border border-slate-200 px-3 py-2 text-[11px] font-black text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 sm:min-w-24 sm:flex-row sm:px-4 sm:text-sm"><Icons.logout className="h-5 w-5" /><span>Logout</span></button></div></nav>;
}

function Header({ active, terms, selectedTermCode, setSelectedTermCode }) {
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
  return <div className="mb-6"><p className="text-xs font-black uppercase tracking-[0.35em] text-slate-500">{eyebrow}</p><h1 className="mt-1 text-3xl font-black tracking-tight text-slate-950 md:text-4xl">{title}</h1><p className="mt-2 flex max-w-3xl flex-wrap items-center gap-2 text-sm leading-6 text-slate-500"><span>{desc}</span>{showTermPicker && (terms.length ? <select aria-label="Select term" value={termSelectValue} onChange={(event) => setSelectedTermCode(event.target.value)} className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm font-bold text-slate-700 outline-none focus:border-blue-500">{terms.map((term) => <option key={term.code} value={term.code}>{term.name}</option>)}</select> : <b className="text-slate-700">No active term selected.</b>)}</p></div>;
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

function LecturerForm({ initial, onSave, onClose }) {
  const [form, setForm] = useState(() => initial || { id: String(Date.now()).slice(-8), degree: "M.A.", name: "", email: "", phone: "", expertiseText: "", plotted: [], available: 0 });
  const save = () => {
    const expertiseText = form.expertiseText ?? form.expertise?.join(", ") ?? "";
    onSave({ id: form.id, degree: form.degree, name: form.name, email: form.email, phone: form.phone, available: Number(form.available ?? 0), expertise: uniq(expertiseText.split(",").map((item) => item.trim())), plotted: Array.isArray(form.plotted) ? form.plotted : [] });
  };
  return <div className="space-y-4"><FormGrid><PlainInput label="ID" value={form.id} onChange={(value) => setForm({ ...form, id: value })} /><PlainInput label="Degree" value={form.degree} onChange={(value) => setForm({ ...form, degree: value })} /></FormGrid><PlainInput label="Full name" value={form.name} onChange={(value) => setForm({ ...form, name: value })} /><FormGrid><PlainInput label="Email" value={form.email} onChange={(value) => setForm({ ...form, email: value })} /><PlainInput label="Phone" value={form.phone} onChange={(value) => setForm({ ...form, phone: value })} /></FormGrid><FormGrid><PlainInput label="Expertise, separated by comma" value={form.expertiseText ?? form.expertise?.join(", ") ?? ""} onChange={(value) => setForm({ ...form, expertiseText: value })} /><PlainInput label="Available slots (0-4)" type="number" value={form.available} onChange={(value) => setForm({ ...form, available: value })} /></FormGrid><div className="flex justify-end gap-3"><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={save} disabled={!form.id}>Save lecturer</Button></div></div>;
}

function LecturerInfoCard({ lecturer, courses }) {
  return <div className="space-y-5"><div className="rounded-2xl bg-blue-50 p-5"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-xs font-black uppercase tracking-[0.25em] text-blue-700">Lecturer Profile</p><h3 className="mt-2 text-2xl font-black text-slate-950">{lecturer.name}</h3><p className="mt-1 text-sm text-slate-600">{lecturer.degree} · ID {lecturer.id}</p></div><Badge tone={availabilityTone(lecturer.available)}>{lecturer.available} available slots</Badge></div></div><div className="grid gap-4 sm:grid-cols-2"><Card className="p-4"><p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Email</p><p className="mt-2 text-sm font-bold text-slate-800">{lecturer.email}</p></Card><Card className="p-4"><p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Phone</p><p className="mt-2 text-sm font-bold text-slate-800">{lecturer.phone}</p></Card></div><Card className="p-4"><p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Expertise</p><div className="mt-3 flex flex-wrap gap-2">{lecturer.expertise.map((item) => <Badge key={item}>{item}</Badge>)}</div></Card><Card className="p-4"><p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Plotted Courses</p><div className="mt-3 flex flex-wrap gap-2"><PlottedCourseBadges plotted={lecturer.plotted} courses={courses} /></div></Card></div>;
}

function Lecturers({ lecturers, directoryLecturers, setLecturers, setTermLecturers, courses, selectedTermCode }) {
  const importInputRef = useRef(null);
  const [query, setQuery] = useState("");
  const [degree, setDegree] = useState("All");
  const [expertise, setExpertise] = useState("All");
  const [available, setAvailable] = useState("All");
  const [sort, setSort] = useState("name");
  const [sortDirection, setSortDirection] = useState("asc");
  const [modal, setModal] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [importMessage, setImportMessage] = useState("");
  const directoryById = useMemo(() => new Map(directoryLecturers.map((lecturer) => [lecturer.id, lecturer])), [directoryLecturers]);
  const sortBy = (value) => {
    setSortDirection((current) => sort === value ? current === "asc" ? "desc" : "asc" : "asc");
    setSort(value);
  };
  const sortHeader = (label, value) => <button type="button" onClick={() => sortBy(value)} className="inline-flex items-center gap-1 font-black uppercase tracking-[0.15em] text-slate-500 hover:text-blue-700">{label}{sort === value && <span>{sortDirection === "asc" ? "↑" : "↓"}</span>}</button>;
  const rows = useMemo(() => lecturers.filter((lecturer) => [lecturer.id, lecturer.name, lecturer.email, lecturer.phone, lecturer.degree, lecturer.expertise.join(" "), lecturer.plotted.join(" "), plottedCourseTitles(lecturer, courses).join(" ")].some((value) => includes(value, query))).filter((lecturer) => degree === "All" || lecturer.degree === degree).filter((lecturer) => expertise === "All" || lecturer.expertise.includes(expertise)).filter((lecturer) => available === "All" || String(lecturer.available) === available).sort((a, b) => {
    const result = sort === "plotted" || sort === "available" ? Number(a[sort === "plotted" ? "plotted" : "available"]?.length ?? a[sort] ?? 0) - Number(b[sort === "plotted" ? "plotted" : "available"]?.length ?? b[sort] ?? 0) : String(a[sort] ?? "").localeCompare(String(b[sort] ?? ""));
    return sortDirection === "asc" ? result : -result;
  }), [lecturers, courses, query, degree, expertise, available, sort, sortDirection]);
  const save = (item) => {
    const availableSlots = Math.max(0, Math.min(4, Number(item.available) || 0));
    setLecturers((prev) => prev.some((lecturer) => lecturer.id === item.id) ? prev.map((lecturer) => lecturer.id === item.id ? { ...lecturer, ...item, available: lecturer.available, plotted: lecturer.plotted } : lecturer) : [{ ...item, available: availableSlots, plotted: [] }, ...prev]);
    setTermLecturers((prev) => prev.some((lecturer) => lecturer.id === item.id) ? prev.map((lecturer) => lecturer.id === item.id ? { ...lecturer, ...item, available: availableSlots, plotted: lecturer.plotted } : lecturer) : [{ ...item, available: availableSlots, plotted: [] }, ...prev]);
    setModal(null);
  };
  const importRows = async (items) => {
    if (!selectedTermCode) throw new Error("Create or select a term before importing lecturer data.");
    const directoryRows = items.map((item) => {
      const existing = directoryById.get(item.id);
      return normalizeLecturer({ ...existing, ...item, plotted: existing?.plotted || [], available: existing?.available ?? item.available });
    });
    const plottingRows = items.map((item) => normalizeTermPlotting(buildTermPlottingRow(selectedTermCode, item)));
    if (USE_SUPABASE) {
      await upsertRows("lecturers", directoryRows, "id");
      await upsertRows("term_plottings", plottingRows, "id");
    }
    setLecturers((prev) => {
      const byId = new Map(prev.map((lecturer) => [lecturer.id, lecturer]));
      directoryRows.forEach((item) => byId.set(item.id, item));
      return Array.from(byId.values());
    });
    setTermLecturers((prev) => {
      const byId = new Map(prev.map((lecturer) => [lecturer.id, lecturer]));
      items.forEach((item) => byId.set(item.id, { ...(byId.get(item.id) || item), ...item }));
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
  const remove = (id) => setLecturers((prev) => prev.filter((lecturer) => lecturer.id !== id));
  return <div className="space-y-5"><div className="flex flex-wrap justify-end gap-3"><input ref={importInputRef} type="file" accept=".xlsx,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" className="hidden" onChange={handleImport} /><Button variant="secondary"><Icons.download className="h-4 w-4" />Template</Button><Button variant="secondary" onClick={() => importInputRef.current?.click()}><Icons.download className="h-4 w-4" />Import CSV / XLSX</Button><Button variant="secondary" onClick={() => exportLecturersToXLSX(rows, courses)} disabled={rows.length === 0}><Icons.download className="h-4 w-4" />Export XLSX</Button><Button onClick={() => setModal({})}><Icons.plus className="h-4 w-4" />Add lecturer</Button></div>{importMessage && <p className={`rounded-xl px-3 py-2 text-sm font-semibold ${importMessage.startsWith("Imported") ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>{importMessage}</p>}<Card className="p-4"><TextInput icon={Icons.search} value={query} onChange={setQuery} placeholder="Search by ID, name, email, expertise, or course name..." /><div className="mt-4 grid gap-3 md:grid-cols-5"><SelectBox label="Degree" value={degree} onChange={setDegree} options={uniq(lecturers.map((lecturer) => lecturer.degree))} /><SelectBox label="Expertise" value={expertise} onChange={setExpertise} options={uniq(lecturers.flatMap((lecturer) => lecturer.expertise))} /><SelectBox label="Available" value={available} onChange={setAvailable} options={["0", "1", "2", "3", "4"]} /><SelectBox label="Sort by" value={sort} onChange={(value) => { setSort(value); setSortDirection("asc"); }} options={["name", "id", "degree", "plotted", "available"]} /><Button variant="secondary" className="mt-5" onClick={() => { setQuery(""); setDegree("All"); setExpertise("All"); setAvailable("All"); setSort("name"); setSortDirection("asc"); }}>Reset</Button></div></Card><Card className="overflow-hidden"><div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm"><thead className="bg-slate-50 text-[10px] uppercase tracking-[0.15em] text-slate-500"><tr><th className="px-4 py-4">{sortHeader("ID", "id")}</th><th className="px-4 py-4">{sortHeader("Degree", "degree")}</th><th className="px-4 py-4">{sortHeader("Full Name", "name")}</th><th className="px-4 py-4">{sortHeader("#Plotted", "plotted")}</th><th className="px-4 py-4">{sortHeader("Available", "available")}</th><th className="px-4 py-4 font-black">Expertise</th><th className="px-4 py-4 font-black">Plotted Courses</th><th className="px-4 py-4 font-black">Actions</th></tr></thead><tbody>{rows.map((lecturer) => <tr key={lecturer.id} className="border-t border-slate-100"><td className="px-4 py-4 font-bold text-blue-700">{lecturer.id}</td><td className="px-4 py-4"><Badge tone="slate">{lecturer.degree}</Badge></td><td className="px-4 py-4 font-black text-slate-900">{lecturer.name}</td><td className="px-4 py-4 font-bold">{lecturer.plotted.length}</td><td className="px-4 py-4"><Badge tone={availabilityTone(lecturer.available)}>{lecturer.available}</Badge></td><td className="px-4 py-4"><div className="flex flex-wrap gap-1">{lecturer.expertise.map((item) => <Badge key={item}>{item}</Badge>)}</div></td><td className="px-4 py-4 text-xs text-slate-600"><div className="flex max-w-md flex-wrap gap-1"><PlottedCourseBadges plotted={lecturer.plotted} courses={courses} /></div></td><td className="px-4 py-4"><div className="flex gap-3"><button title="View lecturer information" onClick={() => setViewing(lecturer)}><Icons.eye className="h-4 w-4 text-blue-700" /></button><button title="Edit lecturer" onClick={() => { const directoryLecturer = directoryById.get(lecturer.id) || lecturer; setModal({ ...directoryLecturer, available: lecturer.available, plotted: lecturer.plotted, expertiseText: directoryLecturer.expertise.join(", ") }); }}><Icons.edit className="h-4 w-4" /></button><button title="Delete lecturer" onClick={() => remove(lecturer.id)}><Icons.trash className="h-4 w-4 text-red-500" /></button></div></td></tr>)}</tbody></table></div>{rows.length === 0 && <p className="p-6 text-center text-sm text-slate-500">No lecturers match your search/filter.</p>}</Card>{viewing && <Modal title="Lecturer Information" onClose={() => setViewing(null)}><LecturerInfoCard lecturer={viewing} courses={courses} /></Modal>}{modal && <Modal title={modal.id ? "Edit lecturer" : "Add lecturer"} onClose={() => setModal(null)}><LecturerForm initial={modal.id ? modal : null} onSave={save} onClose={() => setModal(null)} /></Modal>}</div>;
}

function Plotting({ lecturers, setLecturers, courses }) {
  const [query, setQuery] = useState("");
  const [plotOrder, setPlotOrder] = useState("Default");
  const [editing, setEditing] = useState(null);
  const matchingRows = lecturers.filter((lecturer) => [lecturer.id, lecturer.name, lecturer.email, lecturer.expertise.join(" "), lecturer.plotted.join(" "), plottedCourseTitles(lecturer, courses).join(" ")].some((value) => includes(value, query)));
  const rows = [...matchingRows].sort((a, b) => {
    if (plotOrder === "Not plotted first") {
      const plottedResult = Number(a.plotted.length > 0) - Number(b.plotted.length > 0);
      return plottedResult || a.name.localeCompare(b.name);
    }
    if (plotOrder === "Most plotted first") return b.plotted.length - a.plotted.length || a.name.localeCompare(b.name);
    return 0;
  });
  const startEditing = (lecturer) => setEditing({ ...lecturer, plotCounts: Object.fromEntries(getPlottedCourseCounts(lecturer.plotted).map(({ code, count }) => [code, count])) });
  const setPlotCount = (code, value) => setEditing((current) => ({ ...current, plotCounts: { ...(current.plotCounts || {}), [code]: toClassCount(value) } }));
  const savePlot = () => {
    const { plotCounts, ...editingLecturer } = editing;
    const item = { ...editingLecturer, plotted: buildPlottedFromCounts(plotCounts || {}), available: Number(editing.available) };
    setLecturers((prev) => prev.map((lecturer) => lecturer.id === editing.id ? item : lecturer));
    setEditing(null);
  };
  return <div className="space-y-5"><Card className="p-4"><div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]"><TextInput icon={Icons.search} value={query} onChange={setQuery} placeholder="Search lecturer by ID, name, email, expertise, or course name..." /><label className="space-y-1.5"><span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Assignment order</span><div className="relative"><select value={plotOrder} onChange={(event) => setPlotOrder(event.target.value)} className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 pr-9 text-sm text-slate-700 outline-none"><option>Default</option><option>Not plotted first</option><option>Most plotted first</option></select><Icons.chevronDown className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-slate-400" /></div></label></div></Card>{rows.map((lecturer) => <Card key={lecturer.id} className="p-5"><div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div><div className="flex flex-wrap items-center gap-2"><span className="text-sm font-black text-blue-700">{lecturer.id}</span><Badge tone="slate">{lecturer.degree}</Badge><h3 className="text-lg font-black text-slate-950">{lecturer.name}</h3></div><p className="text-sm text-slate-500">{lecturer.email}</p><div className="mt-3 flex flex-wrap gap-2">{lecturer.expertise.map((item) => <Badge key={item}>{item}</Badge>)}</div><div className="mt-3 flex flex-wrap gap-2"><PlottedCourseBadges plotted={lecturer.plotted} courses={courses} /></div></div><div className="flex items-center gap-4"><div className="text-center"><p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Available</p><Badge tone={availabilityTone(lecturer.available)}>{lecturer.available}</Badge></div><Button variant="secondary" onClick={() => startEditing(lecturer)}>Edit assignments</Button></div></div></Card>)}{editing && <Modal title={`Edit assignments - ${editing.name}`} onClose={() => setEditing(null)}><div className="space-y-3"><p className="text-sm text-slate-500">Set the number of classes for each course.</p><div className="grid max-h-72 gap-2 overflow-y-auto rounded-xl border border-slate-200 p-3 sm:grid-cols-2">{courses.map((course) => <label key={course.code} className="grid grid-cols-[1fr_76px] items-center gap-3 text-sm"><span>{course.title} <b className="text-xs text-slate-400">({course.code})</b></span><input type="number" min="0" value={editing.plotCounts?.[course.code] ?? 0} onChange={(event) => setPlotCount(course.code, event.target.value)} className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm font-bold text-slate-900 outline-none focus:border-blue-500" /></label>)}</div><PlainInput label="Available slots" type="number" value={editing.available} onChange={(value) => setEditing({ ...editing, available: value })} /><div className="flex justify-end gap-3"><Button variant="secondary" onClick={() => setEditing(null)}>Cancel</Button><Button onClick={savePlot}>Save assignments</Button></div></div></Modal>}</div>;
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
  return (
    <div className="min-h-screen bg-white px-5 py-5 text-slate-950 sm:px-8 lg:px-12">
      <div className="mx-auto flex min-h-[calc(100vh-2.5rem)] max-w-7xl flex-col">
        <motion.nav
          initial={{ opacity: 0, y: -18, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto flex min-h-20 w-full max-w-6xl flex-wrap items-center justify-between gap-4 rounded-[1.75rem] border border-slate-100 bg-white px-5 py-4 shadow-[0_22px_70px_rgba(15,23,42,0.08)] sm:px-7 lg:px-9"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-700 text-white shadow-sm">
              <Icons.graduation className="h-6 w-6" />
            </span>
            <div>
              <p className="text-2xl font-black tracking-tight sm:text-3xl">Universitas Terbuka</p>
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-blue-700">English Department</p>
            </div>
          </div>

          <div className="flex items-center rounded-full bg-slate-100 p-1 text-sm font-black">
            <button type="button" className="rounded-full px-4 py-2 text-slate-700 sm:px-5">
              Lecturer Database
            </button>
            <button type="button" className="rounded-full bg-blue-700 px-5 py-2 text-white shadow-sm sm:px-6">
              Login
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
            <div className="mb-7 inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm">
              Lecturer Database
            </div>
            <h1 className="max-w-2xl text-5xl font-black leading-[0.96] tracking-tight text-slate-950 sm:text-6xl lg:text-7xl">
              Manage lecturers, plot courses, see the big picture.
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-8 text-slate-600">
              A single database for degrees, expertise, availability and teaching load across the department.
            </p>
            <p className="mt-10 hidden text-xs font-semibold text-slate-400 lg:block">© 2026 Universitas Terbuka — English Department</p>
          </motion.div>

          <div className="relative mx-auto w-full max-w-2xl lg:mx-0">
            <motion.div
              initial={{ opacity: 0, x: -20, rotate: -3 }}
              animate={{ opacity: 1, x: 0, rotate: -2 }}
              transition={{ duration: 0.65, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="absolute -left-8 top-8 hidden rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-[0_18px_50px_rgba(15,23,42,0.08)] lg:block"
            >
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-yellow-500">Restricted access</p>
              <p className="mt-1 text-lg font-black text-slate-950">Department data</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -18, rotate: 4 }}
              animate={{ opacity: 1, x: 0, rotate: 3 }}
              transition={{ duration: 0.65, delay: 0.48, ease: [0.22, 1, 0.36, 1] }}
              className="absolute -bottom-7 left-8 hidden rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-[0_18px_50px_rgba(15,23,42,0.08)] lg:block"
            >
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-blue-700">Database</p>
              <p className="mt-1 text-lg font-black text-slate-950">{USE_SUPABASE ? "Configured" : "Not configured"}</p>
            </motion.div>

            <motion.section
              initial={{ opacity: 0, y: 28, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.72, delay: 0.24, ease: [0.22, 1, 0.36, 1] }}
              className="relative z-10 ml-auto w-full rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_28px_90px_rgba(15,23,42,0.1)] sm:p-7 lg:max-w-md lg:p-8"
            >
              <p className="text-[10px] font-black uppercase tracking-[0.32em] text-slate-500">Restricted access</p>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Sign in</h2>
              <p className="mt-3 text-base leading-7 text-slate-500">
                {USE_SUPABASE ? "Welcome back! Please sign in to your account." : "Supabase is not configured. Ask an administrator to set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY."}
              </p>

              <div className="mt-6 space-y-4">
                <label className="block">
                  <span className="mb-2 block text-sm font-black text-slate-950">Email</span>
                  <TextInput icon={Icons.users} value={email} onChange={setEmail} placeholder="Email address" />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-black text-slate-950">Password</span>
                  <TextInput icon={Icons.check} value={password} onChange={setPassword} placeholder="Password" type="password" />
                </label>
                {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-600">{error}</p>}
                <Button className="w-full !rounded-2xl !bg-blue-700 py-3 text-base hover:!bg-blue-800" onClick={submit} disabled={!USE_SUPABASE || busy || !email || !password}>
                  {busy ? "Processing..." : "Sign in"}
                </Button>
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
        setLecturers(Array.isArray(lecturerRows) ? lecturerRows.map(normalizeLecturer) : []);
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
  const pageLecturers = active === "dashboard" || active === "lecturers" || active === "plotting" ? termScopedLecturers : lecturers;
  const pageSetLecturers = active === "plotting" ? setTermScopedLecturers : setLecturers;
  const props = { lecturers: pageLecturers, directoryLecturers: lecturers, setLecturers: pageSetLecturers, setTermLecturers: setTermScopedLecturers, courses, setCourses, terms, setTerms, setTermPlottings, selectedTermCode: effectiveSelectedTermCode, onActiveTermChange: setSelectedTermCode };

  if (!userEmail) return <LoginScreen onLogin={handleLogin} />;

  return <div className="min-h-screen bg-slate-50 pb-32 text-slate-900"><main className="min-w-0 p-4 sm:p-6 lg:p-10"><div className="mx-auto max-w-7xl"><div className="mb-4 flex flex-wrap items-center justify-end gap-3"><Badge tone={isHydrated ? "green" : "amber"}>{dbStatus}</Badge><Badge tone="slate">{userEmail}</Badge></div><Header active={active} terms={terms} selectedTermCode={effectiveSelectedTermCode} setSelectedTermCode={setSelectedTermCode} /><motion.div key={`${active}-${effectiveSelectedTermCode}`} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}><Page {...props} /></motion.div></div></main><FloatingBottomNav active={active} setActive={setActive} onLogout={handleLogout} /></div>;
}
