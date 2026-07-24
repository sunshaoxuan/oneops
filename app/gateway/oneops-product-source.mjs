import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { basename } from "node:path";
import ExcelJS from "exceljs";

function text(value) {
  return String(value ?? "").trim();
}

function compact(value) {
  return text(value).normalize("NFKC").replace(/[\s\u3000]+/g, "");
}

function cellText(cell) {
  return text(cell?.text ?? cell?.value);
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function normalizeOrganizationCode(value) {
  const normalized = compact(value);
  return /^\d+$/.test(normalized)
    ? normalized.padStart(4, "0")
    : normalized;
}

export function classifyProductCandidateValue(value) {
  const normalized = compact(value);
  if (!normalized) {
    return "EMPTY";
  }
  if (normalized.startsWith("◎")) {
    return "AFFIRMATIVE";
  }
  if (
    normalized === "－" ||
    normalized === "-" ||
    normalized.includes("利用停止") ||
    normalized.includes("廃止")
  ) {
    return "INACTIVE";
  }
  if (
    normalized.startsWith("▲") ||
    normalized.includes("提案") ||
    normalized.includes("導入中") ||
    normalized.includes("版数上")
  ) {
    return "REVIEW";
  }
  return "REVIEW";
}

function findHeader(worksheet) {
  for (
    let rowNumber = 1;
    rowNumber <= Math.min(50, worksheet.rowCount);
    rowNumber += 1
  ) {
    const row = worksheet.getRow(rowNumber);
    const columns = new Map();
    row.eachCell({ includeEmpty: false }, (cell, columnNumber) => {
      columns.set(compact(cellText(cell)), columnNumber);
    });
    const codeColumn =
      columns.get("機関Code") ?? columns.get("機関コード");
    const nameColumn = columns.get("機関名");
    const versionColumn = columns.get("バージョンV6/V7");
    const firstProductColumn = columns.get("U-PDS人事");
    const lastProductColumn = columns.get("SmartGov");
    if (
      codeColumn &&
      nameColumn &&
      versionColumn &&
      firstProductColumn &&
      lastProductColumn
    ) {
      return {
        rowNumber,
        codeColumn,
        nameColumn,
        versionColumn,
        firstProductColumn,
        lastProductColumn,
      };
    }
  }
  return null;
}

export async function readOneOpsProductCandidates(
  workbookPath,
  sheetName,
) {
  const buffer = await readFile(workbookPath);
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const worksheet = workbook.getWorksheet(sheetName);
  if (!worksheet) {
    throw new Error(`OneOps product source sheet "${sheetName}" was not found.`);
  }
  const header = findHeader(worksheet);
  if (!header) {
    throw new Error("OneOps product source headers were not found.");
  }

  const productColumns = [];
  const headerRow = worksheet.getRow(header.rowNumber);
  for (
    let column = header.firstProductColumn;
    column <= header.lastProductColumn;
    column += 1
  ) {
    const name = cellText(headerRow.getCell(column));
    if (name) {
      productColumns.push({ column, name });
    }
  }

  const records = [];
  for (
    let rowNumber = header.rowNumber + 1;
    rowNumber <= worksheet.rowCount;
    rowNumber += 1
  ) {
    const row = worksheet.getRow(rowNumber);
    const organizationCode = normalizeOrganizationCode(
      cellText(row.getCell(header.codeColumn)),
    );
    const organizationName = cellText(row.getCell(header.nameColumn));
    if (!organizationCode || !organizationName) {
      continue;
    }
    const productCandidates = productColumns
      .map(({ column, name }) => {
        const value = cellText(row.getCell(column));
        return {
          name,
          value,
          classification: classifyProductCandidateValue(value),
        };
      })
      .filter((candidate) => candidate.classification !== "EMPTY");
    records.push({
      sourceRowNumber: rowNumber,
      organizationCode,
      organizationName,
      versionCandidate: cellText(row.getCell(header.versionColumn)),
      productCandidates,
    });
  }

  return {
    sourceSystem: "ONEOPS_ORGANIZATION_PRODUCT_SOURCE",
    fileName: basename(workbookPath),
    fileSha256: sha256(buffer),
    sheetName,
    records,
  };
}
