/**
 * Client-side export helpers. Only business information is exported —
 * never passwords, tokens or any security data.
 * When a backend is added, these can be swapped for a file download endpoint.
 */
export type ExportFormat = "csv" | "xlsx" | "pdf";

export interface ExportColumn<T> {
  header: string;
  value: (row: T) => string;
}

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function toMatrix<T>(rows: T[], columns: ExportColumn<T>[]) {
  return [columns.map((c) => c.header), ...rows.map((r) => columns.map((c) => c.value(r)))];
}

function exportCsv<T>(rows: T[], columns: ExportColumn<T>[], filename: string) {
  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const csv = toMatrix(rows, columns)
    .map((line) => line.map(escape).join(","))
    .join("\r\n");
  download(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" }), `${filename}.csv`);
}

async function exportXlsx<T>(rows: T[], columns: ExportColumn<T>[], filename: string) {
  const XLSX = await import("xlsx");
  const sheet = XLSX.utils.aoa_to_sheet(toMatrix(rows, columns));
  sheet["!cols"] = columns.map((c) => ({ wch: Math.max(14, c.header.length + 4) }));
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, "Data");
  const out = XLSX.write(book, { bookType: "xlsx", type: "array" }) as ArrayBuffer;
  download(
    new Blob([out], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    `${filename}.xlsx`,
  );
}

async function exportPdf<T>(
  rows: T[],
  columns: ExportColumn<T>[],
  filename: string,
  title: string,
) {
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  doc.setFontSize(14);
  doc.text(title, 40, 40);
  doc.setFontSize(9);
  doc.text(`Generated ${new Date().toLocaleString()} · ${rows.length} records`, 40, 56);
  autoTable(doc, {
    startY: 72,
    head: [columns.map((c) => c.header)],
    body: rows.map((r) => columns.map((c) => c.value(r))),
    styles: { fontSize: 8, cellPadding: 4 },
    headStyles: { fillColor: [40, 90, 88], textColor: 255 },
    alternateRowStyles: { fillColor: [245, 248, 247] },
  });
  doc.save(`${filename}.pdf`);
}

export async function exportRows<T>({
  format,
  rows,
  columns,
  filename,
  title,
}: {
  format: ExportFormat;
  rows: T[];
  columns: ExportColumn<T>[];
  filename: string;
  title: string;
}) {
  if (format === "csv") return exportCsv(rows, columns, filename);
  if (format === "xlsx") return exportXlsx(rows, columns, filename);
  return exportPdf(rows, columns, filename, title);
}
