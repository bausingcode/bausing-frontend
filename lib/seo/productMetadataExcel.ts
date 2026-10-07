import ExcelJS from "exceljs";
import type { ProductMetadataRow } from "@/lib/seo/productMetadataRows";

const SHEET_NAME = "Metadatos SEO - Productos";
const HEADERS = ["id", "nombre", "sku", "meta_title", "meta_description"];

/** Genera y descarga un .xlsx en el browser con los metadatos efectivos de los productos dados. */
export async function buildProductMetadataWorkbook(rows: ProductMetadataRow[]): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(SHEET_NAME);

  sheet.addRow(HEADERS);
  sheet.getRow(1).font = { bold: true };
  sheet.columns = [
    { width: 38 },
    { width: 40 },
    { width: 16 },
    { width: 50 },
    { width: 65 },
  ];

  for (const row of rows) {
    sheet.addRow([row.id, row.name, row.sku || "", row.effectiveTitle, row.effectiveDescription]);
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const today = new Date().toISOString().slice(0, 10);
  link.href = url;
  link.download = `metadatos-seo-productos-${today}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export interface ParsedProductMetadataRow {
  id: string;
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
export async function parseProductMetadataWorkbook(file: File): Promise<ParsedProductMetadataRow[]> {
  const buffer = await file.arrayBuffer();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const sheet = workbook.worksheets[0];
  if (!sheet) return [];

  const results: ParsedProductMetadataRow[] = [];
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const id = cellText(row.getCell(1).value);
    if (!id) return;
    results.push({
      id,
      meta_title: cellText(row.getCell(4).value),
      meta_description: cellText(row.getCell(5).value),
    });
  });
  return results;
}
