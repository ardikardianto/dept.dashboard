const isBlankRow = (row) =>
  !row ||
  Object.values(row).every((value) => String(value ?? "").trim() === "");

export async function readImportFile(
  file,
  { parseCSV, rowsToObjects, parseXLSX },
) {
  return file.name.toLowerCase().endsWith(".csv")
    ? rowsToObjects(parseCSV(await file.text()))
    : parseXLSX(file);
}

export function buildLecturerImportReview(rawRows, imported) {
  const nonBlankRows = rawRows.filter((row) => !isBlankRow(row));
  const duplicateIds = Object.entries(
    imported.reduce(
      (counts, item) => ({
        ...counts,
        [item.id]: (counts[item.id] || 0) + 1,
      }),
      {},
    ),
  )
    .filter(([, count]) => count > 1)
    .map(([id]) => id);
  const missingNames = imported
    .filter((item) => !item.name)
    .map((item) => item.id);
  const rejectedCount = Math.max(0, nonBlankRows.length - imported.length);
  const issues = [
    rejectedCount
      ? `${rejectedCount} nonblank row(s) were rejected because a lecturer ID was missing.`
      : "",
    duplicateIds.length
      ? `Duplicate lecturer IDs will be merged: ${duplicateIds.join(", ")}.`
      : "",
    missingNames.length
      ? `${missingNames.length} accepted row(s) have no lecturer name: ${missingNames.slice(0, 10).join(", ")}.`
      : "",
  ].filter(Boolean);

  return {
    imported,
    summary: [
      { label: "Source rows", value: nonBlankRows.length },
      { label: "Valid rows", value: imported.length },
      {
        label: "Warnings",
        value: issues.length,
        tone: issues.length ? "warn" : "success",
      },
    ],
    issues,
    previewRows: imported.map((item) => ({
      ID: item.id,
      Name: item.name,
      Degree: item.degree,
      Rating: item.rating,
      Available: item.available,
      Expertise: item.expertise,
    })),
  };
}

export function buildPlottingImportReview(
  rawRows,
  imported,
  lecturers,
  courses,
) {
  const importedClassCount = Object.values(imported.counts).reduce(
    (sum, count) => sum + count,
    0,
  );
  const issues = [
    imported.ignoredCourses.length
      ? `Unknown courses will be skipped: ${imported.ignoredCourses.join(", ")}.`
      : "",
    imported.ignoredLecturers.length
      ? `Unknown lecturers will remain unassigned: ${imported.ignoredLecturers.join(", ")}.`
      : "",
  ].filter(Boolean);
  const lecturerById = new Map(
    lecturers.map((lecturer) => [lecturer.id, lecturer]),
  );
  const courseByCode = new Map(courses.map((course) => [course.code, course]));
  const previewRows = Object.entries(imported.assignments).flatMap(
    ([courseCode, ids]) =>
      ids.map((lecturerId, index) => ({
        Class: `${courseCode}.${index + 1}`,
        Course: courseByCode.get(courseCode)?.title || courseCode,
        Lecturer:
          lecturerById.get(lecturerId)?.name || lecturerId || "Unassigned",
      })),
  );

  return {
    imported,
    importedClassCount,
    summary: [
      {
        label: "Source rows",
        value: rawRows.filter((row) => !isBlankRow(row)).length,
      },
      { label: "Valid classes", value: importedClassCount },
      {
        label: "Warnings",
        value: issues.length,
        tone: issues.length ? "warn" : "success",
      },
    ],
    issues,
    previewRows,
  };
}

export function createImportExportTools(deps) {
  const {
    buildLecturerExportRows,
    buildLecturerTemplateRows,
    buildPlottingExportRows,
    normalizeLecturer,
  } = deps;

  async function writeBlobWithFileSystemAccess(filename, blob, type) {
    if (
      typeof window === "undefined" ||
      !window.showSaveFilePicker ||
      !window.isSecureContext
    )
      return false;
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: filename,
        types: [{ description: "Spreadsheet", accept: { [type]: [".xlsx"] } }],
      });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      return true;
    } catch (error) {
      if (error?.name === "AbortError") return true;
      return false;
    }
  }

  function triggerAnchorDownload(filename, blob) {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.rel = "noopener";
    anchor.style.display = "none";
    document.body.appendChild(anchor);
    anchor.dispatchEvent(
      new MouseEvent("click", {
        bubbles: true,
        cancelable: true,
        view: window,
      }),
    );
    window.setTimeout(() => {
      anchor.remove();
      URL.revokeObjectURL(url);
    }, 60_000);
  }

  async function downloadBlob(filename, content, type) {
    const blob =
      content instanceof Blob ? content : new Blob([content], { type });
    if (await writeBlobWithFileSystemAccess(filename, blob, type)) return;
    triggerAnchorDownload(filename, blob);
  }

  const xlsxContentType =
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

  function xmlEscape(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
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
      for (let i = 0; i < 8; i += 1)
        crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
    return (crc ^ -1) >>> 0;
  }

  function writeUint16(target, value) {
    target.push(value & 255, (value >>> 8) & 255);
  }

  function writeUint32(target, value) {
    target.push(
      value & 255,
      (value >>> 8) & 255,
      (value >>> 16) & 255,
      (value >>> 24) & 255,
    );
  }

  function createZip(files) {
    const encoder = new TextEncoder();
    const output = [];
    const centralDirectory = [];
    let offset = 0;
    const now = new Date();
    const dosTime =
      (now.getHours() << 11) |
      (now.getMinutes() << 5) |
      Math.floor(now.getSeconds() / 2);
    const dosDate =
      ((now.getFullYear() - 1980) << 9) |
      ((now.getMonth() + 1) << 5) |
      now.getDate();

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
    const sheetRows = [headers].concat(
      rows.map((row) => headers.map((header) => row[header])),
    );
    const sheetData = sheetRows
      .map(
        (row, rowIndex) =>
          `<row r="${rowIndex + 1}">${row
            .map((value, columnIndex) => {
              const cellRef = `${columnName(columnIndex)}${rowIndex + 1}`;
              return typeof value === "number" && Number.isFinite(value)
                ? `<c r="${cellRef}"><v>${value}</v></c>`
                : `<c r="${cellRef}" t="inlineStr"><is><t>${xmlEscape(value)}</t></is></c>`;
            })
            .join("")}</row>`,
      )
      .join("");
    const worksheet = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${sheetData}</sheetData></worksheet>`;
    return createZip([
      {
        name: "[Content_Types].xml",
        content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`,
      },
      {
        name: "_rels/.rels",
        content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
      },
      {
        name: "xl/workbook.xml",
        content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="${xmlEscape(sheetName)}" sheetId="1" r:id="rId1"/></sheets></workbook>`,
      },
      {
        name: "xl/_rels/workbook.xml.rels",
        content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`,
      },
      {
        name: "xl/styles.xml",
        content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="1"><font><sz val="11"/><name val="Calibri"/></font></fonts><fills count="1"><fill><patternFill patternType="none"/></fill></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/></cellXfs></styleSheet>`,
      },
      { name: "xl/worksheets/sheet1.xml", content: worksheet },
    ]);
  }

  function exportLecturersToXLSX(lecturers, courses) {
    const rows = buildLecturerExportRows(lecturers, courses);
    if (!rows.length) return;
    const filenameDate = new Date().toISOString().slice(0, 10);
    if (
      typeof window !== "undefined" &&
      window.XLSX?.utils &&
      window.XLSX?.writeFile
    ) {
      const worksheet = window.XLSX.utils.json_to_sheet(rows);
      const workbook = window.XLSX.utils.book_new();
      window.XLSX.utils.book_append_sheet(workbook, worksheet, "Lecturers");
      window.XLSX.writeFile(
        workbook,
        `UT_English_Lecturers_${filenameDate}.xlsx`,
      );
      return;
    }
    downloadBlob(
      `UT_English_Lecturers_${filenameDate}.xlsx`,
      createXLSX(rows),
      xlsxContentType,
    );
  }

  function exportLecturerTemplateToXLSX() {
    const filenameDate = new Date().toISOString().slice(0, 10);
    downloadBlob(
      `UT_English_Lecturers_Template_${filenameDate}.xlsx`,
      createXLSX(buildLecturerTemplateRows()),
      xlsxContentType,
    );
  }

  function exportPlottingToXLSX(
    lecturers,
    courses,
    plannedCounts,
    assignmentMap,
  ) {
    const rows = buildPlottingExportRows(
      lecturers,
      courses,
      plannedCounts,
      assignmentMap,
    );
    if (!rows.length) return;
    const filenameDate = new Date().toISOString().slice(0, 10);
    if (
      typeof window !== "undefined" &&
      window.XLSX?.utils &&
      window.XLSX?.writeFile
    ) {
      const worksheet = window.XLSX.utils.json_to_sheet(rows);
      const workbook = window.XLSX.utils.book_new();
      window.XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
      window.XLSX.writeFile(workbook, `Plotting_${filenameDate}.xlsx`);
      return;
    }
    downloadBlob(
      `Plotting_${filenameDate}.xlsx`,
      createXLSX(rows, "Sheet1"),
      xlsxContentType,
    );
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
    return body.map((row) =>
      headers.reduce(
        (acc, header, index) => ({
          ...acc,
          [String(header || "").trim()]: row[index] ?? "",
        }),
        {},
      ),
    );
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
        const stream = new Blob([bytes])
          .stream()
          .pipeThrough(new DecompressionStream(format));
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
      if (getUint32(view, centralOffset) !== 0x02014b50)
        throw new Error("Invalid XLSX directory.");
      const method = getUint16(view, centralOffset + 10);
      const compressedSize = getUint32(view, centralOffset + 20);
      const nameLength = getUint16(view, centralOffset + 28);
      const extraLength = getUint16(view, centralOffset + 30);
      const commentLength = getUint16(view, centralOffset + 32);
      const localOffset = getUint32(view, centralOffset + 42);
      const name = decoder.decode(
        bytes.slice(centralOffset + 46, centralOffset + 46 + nameLength),
      );
      const localNameLength = getUint16(view, localOffset + 26);
      const localExtraLength = getUint16(view, localOffset + 28);
      const dataOffset = localOffset + 30 + localNameLength + localExtraLength;
      const compressed = bytes.slice(dataOffset, dataOffset + compressedSize);
      const data =
        method === 0
          ? compressed
          : method === 8
            ? await inflateZipEntry(compressed)
            : null;
      if (!data) throw new Error("Unsupported XLSX compression method.");
      entries[name] = decoder.decode(data);
      centralOffset += 46 + nameLength + extraLength + commentLength;
    }
    return entries;
  }

  function parseSharedStrings(xml) {
    if (!xml) return [];
    const doc = new DOMParser().parseFromString(xml, "application/xml");
    return Array.from(doc.querySelectorAll("si")).map((item) =>
      Array.from(item.querySelectorAll("t"))
        .map((node) => node.textContent || "")
        .join(""),
    );
  }

  function parseWorksheet(xml, sharedStrings) {
    const doc = new DOMParser().parseFromString(xml, "application/xml");
    return Array.from(doc.querySelectorAll("sheetData row")).map((row) => {
      const cells = [];
      Array.from(row.querySelectorAll("c")).forEach((cell) => {
        const ref = cell.getAttribute("r") || "";
        const column =
          ref
            .replace(/\d/g, "")
            .split("")
            .reduce((sum, char) => sum * 26 + char.charCodeAt(0) - 64, 0) - 1;
        const type = cell.getAttribute("t");
        const valueNode = cell.querySelector("v");
        const inlineNode = cell.querySelector("is t");
        const rawValue =
          valueNode?.textContent || inlineNode?.textContent || "";
        cells[column] =
          type === "s" ? sharedStrings[Number(rawValue)] || "" : rawValue;
      });
      return cells.map((value) => value ?? "");
    });
  }

  async function parseXLSX(file) {
    const entries = await readZipEntries(await file.arrayBuffer());
    const worksheetName = entries["xl/worksheets/sheet1.xml"]
      ? "xl/worksheets/sheet1.xml"
      : Object.keys(entries).find(
          (name) => name.startsWith("xl/worksheets/") && name.endsWith(".xml"),
        );
    if (!worksheetName)
      throw new Error("No worksheet found in this XLSX file.");
    return rowsToObjects(
      parseWorksheet(
        entries[worksheetName],
        parseSharedStrings(entries["xl/sharedStrings.xml"]),
      ),
    );
  }

  function splitList(value) {
    return String(value || "")
      .split(/[;,]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  function getImportedValue(row, names) {
    const entries = Object.entries(row);
    const match = entries.find(([key]) =>
      names.some((name) => key.trim().toLowerCase() === name.toLowerCase()),
    );
    return match?.[1] ?? "";
  }

  function hasImportedValue(row, names) {
    return String(getImportedValue(row, names)).trim() !== "";
  }

  function isImportRowBlank(row) {
    return Object.values(row).every(
      (value) => String(value ?? "").trim() === "",
    );
  }

  function mapImportedLecturers(rows, courses) {
    return rows
      .filter((row) => !isImportRowBlank(row))
      .map((row, index) => {
        const plotted = splitList(
          getImportedValue(row, [
            "Plotted_Course_Codes",
            "Plotted Course Codes",
            "Plotted Courses",
            "Plotted",
            "Courses",
          ]),
        );
        const knownPlotted = plotted.filter(
          (code) =>
            !courses.length || courses.some((course) => course.code === code),
        );
        const importedId = String(
          getImportedValue(row, ["Lecturer_ID", "Lecturer ID", "ID"]),
        ).trim();
        const availableKeys = [
          "Available_Slots",
          "Available Slots",
          "Available",
        ];
        const importedAvailable = Number(getImportedValue(row, availableKeys));
        const ratingKeys = [
          "Rating",
          "Teaching_Rating",
          "Teaching Rating",
          "Performance Rating",
        ];
        const importedRating = Number(getImportedValue(row, ratingKeys));
        const warningNoteKeys = [
          "Warning_Note",
          "Warning Note",
          "Warning",
          "Notice",
        ];
        return {
          ...normalizeLecturer({
            id: importedId || `imported-${Date.now()}-${index + 1}`,
            degree: String(getImportedValue(row, ["Degree"])).trim(),
            name: String(getImportedValue(row, ["Name", "Full Name"])).trim(),
            email: String(getImportedValue(row, ["Email"])).trim(),
            phone: String(getImportedValue(row, ["Phone"])).trim(),
            expertise: splitList(getImportedValue(row, ["Expertise"])),
            plotted: knownPlotted,
            available: Number.isFinite(importedAvailable)
              ? importedAvailable
              : 0,
            rating: Number.isFinite(importedRating) ? importedRating : 0,
            warning_note: String(getImportedValue(row, warningNoteKeys)).trim(),
          }),
          _hasImportedAvailable: hasImportedValue(row, availableKeys),
          _hasImportedRating: hasImportedValue(row, ratingKeys),
          _hasImportedWarningNote: hasImportedValue(row, warningNoteKeys),
        };
      });
  }

  return {
    exportLecturersToXLSX,
    exportLecturerTemplateToXLSX,
    exportPlottingToXLSX,
    parseCSV,
    rowsToObjects,
    parseXLSX,
    splitList,
    getImportedValue,
    hasImportedValue,
    isImportRowBlank,
    mapImportedLecturers,
  };
}
