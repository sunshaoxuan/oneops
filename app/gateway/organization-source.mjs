import { readdir } from "node:fs/promises";
import { basename, dirname, resolve } from "node:path";
import ExcelJS from "exceljs";
import { normalizeSourceMaintenance } from "./organization.mjs";

function wildcardPattern(value) {
  const escaped = value.replace(/[.+^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`^${escaped.replaceAll("*", ".*").replaceAll("?", ".")}$`, "i");
}

function cellText(cell) {
  return String(cell?.text ?? cell?.value ?? "").trim();
}

function normalizeHeader(value) {
  return String(value ?? "")
    .replace(/[\s\u3000]+/g, "")
    .toLocaleLowerCase();
}

function aliasesFor(columns, field) {
  return (columns[field] ?? []).map(normalizeHeader);
}

export async function resolveSourceFiles(pathPattern) {
  const directory = dirname(pathPattern);
  const filePattern = wildcardPattern(basename(pathPattern));
  const entries = await readdir(directory, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && filePattern.test(entry.name))
    .map((entry) => resolve(directory, entry.name))
    .sort((left, right) => left.localeCompare(right, "ja"));
}

export function findOrganizationHeader(worksheet, source) {
  const requiredFields = ["code", "name"];
  const allFields = [
    "classification",
    "code",
    "name",
    "shortName",
    "maintenanceStatus",
  ];
  const searchRows = Number(source.headerSearchRows ?? 50);

  for (
    let rowNumber = 1;
    rowNumber <= Math.min(searchRows, worksheet.rowCount);
    rowNumber += 1
  ) {
    const row = worksheet.getRow(rowNumber);
    const headers = new Map();
    row.eachCell({ includeEmpty: false }, (cell, columnNumber) => {
      headers.set(normalizeHeader(cellText(cell)), columnNumber);
    });
    const fieldColumns = {};
    for (const field of allFields) {
      const aliases = aliasesFor(source.columns, field);
      const matchingHeader = aliases.find((alias) => headers.has(alias));
      if (matchingHeader) {
        fieldColumns[field] = headers.get(matchingHeader);
      }
    }
    if (requiredFields.every((field) => fieldColumns[field])) {
      return { rowNumber, fieldColumns };
    }
  }
  return null;
}

export function readOrganizationRows(worksheet, source, header) {
  const records = [];
  for (
    let rowNumber = header.rowNumber + 1;
    rowNumber <= worksheet.rowCount;
    rowNumber += 1
  ) {
    const row = worksheet.getRow(rowNumber);
    const read = (field) => {
      const column = header.fieldColumns[field];
      return column ? cellText(row.getCell(column)) : "";
    };
    const code = read("code");
    const name = read("name");
    if (!code && !name) {
      continue;
    }
    if (!code || !name) {
      continue;
    }
    const maintenance = normalizeSourceMaintenance(
      read("maintenanceStatus"),
    );
    records.push({
      classification: read("classification"),
      code,
      name,
      shortName: read("shortName"),
      maintenanceStatus: maintenance.maintenanceStatus,
      remarks: maintenance.remarks,
      sourceRow: rowNumber,
    });
  }
  return records;
}

export async function loadXlsxOrganizationSource(source) {
  const files = await resolveSourceFiles(source.pathPattern);
  const batches = [];
  for (const file of files) {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(file);
    const worksheets = source.sheetName
      ? [workbook.getWorksheet(source.sheetName)].filter(Boolean)
      : workbook.worksheets;
    let matched = false;
    for (const worksheet of worksheets) {
      const header = findOrganizationHeader(worksheet, source);
      if (!header) {
        continue;
      }
      matched = true;
      batches.push({
        sourceId: source.id,
        file,
        sheetName: worksheet.name,
        records: readOrganizationRows(worksheet, source, header),
      });
    }
    if (!matched) {
      throw new Error(`Required organization headers were not found in ${file}`);
    }
  }
  if (!files.length) {
    throw new Error(`No files matched organization source ${source.id}`);
  }
  return batches;
}
