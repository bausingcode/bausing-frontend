import ExcelJS from "exceljs";
import type { PageMetadataRow } from "@/lib/seo/pageMetadataRows";

const SHEET_NAME = "Metadatos SEO";
const HEADERS = ["path", "etiqueta", "tipo", "meta_title", "meta_description"];

/** Genera y descarga un .xlsx en el browser con los metadatos efectivos de las filas dadas. */
export async function buildPageMetadataWorkbook(rows: PageMetadataRow[]): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(SHEET_NAME);

  sheet.addRow(HEADERS);
  sheet.getRow(1).font = { bold: true };
  sheet.columns = [
    { width: 45 },
    { width: 32 },
    { width: 14 },
    { width: 50 },
    { width: 65 },
  ];

  for (const row of rows) {
    sheet.addRow([row.path, row.label, row.page_type, row.effectiveTitle, row.effectiveDescription]);
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const today = new Date().toISOString().slice(0, 10);
  link.href = url;
  link.download = `metadatos-seo-${today}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export interface ParsedPageMetadataRow {
  path: string;
  meta_title: string;
  meta_description: string;
}

function cellText(value: ExcelJS.CellValue): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "object" && "richText" in value) {
    return value.richText.map((part) => part.text).join("");
  }
  return String(value).trim();
}

/** Lee un .xlsx subido por el usuario y devuelve las filas (sin la cabecera). */
export async function parsePageMetadataWorkbook(file: File): Promise<ParsedPageMetadataRow[]> {
  const buffer = await file.arrayBuffer();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const sheet = workbook.worksheets[0];
  if (!sheet) return [];

  const results: ParsedPageMetadataRow[] = [];
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const path = cellText(row.getCell(1).value);
    if (!path) return;
    results.push({
      path,
      meta_title: cellText(row.getCell(4).value),
      meta_description: cellText(row.getCell(5).value),
    });
  });
  return results;
}
