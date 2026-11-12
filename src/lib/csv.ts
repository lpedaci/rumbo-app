/**
 * CSV for the exports (F16): a header row and every value quoted, so commas, quotes and line
 * breaks in the data are safe. The file starts with a BOM so spreadsheet apps read the accents.
 */
export function toCsv(header: string[], rows: (string | number)[][]): string {
  const quote = (value: string | number) => `"${String(value).replaceAll('"', '""')}"`;
  return [header, ...rows].map((row) => row.map(quote).join(',')).join('\r\n');
}

export function downloadCsv(fileName: string, csv: string): void {
  const url = URL.createObjectURL(new Blob([String.fromCharCode(0xfeff) + csv], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}
