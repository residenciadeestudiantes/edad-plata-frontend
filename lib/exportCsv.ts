// Convierte un array de objetos a string CSV con cabecera
export function arrayToCsv(headers: string[], rows: (string | number)[][]): string {
  const escape = (val: string | number) => {
    const str = String(val);
    return str.includes(",") || str.includes('"') || str.includes("\n")
      ? `"${str.replace(/"/g, '""')}"`
      : str;
  };
  const lines = [headers.map(escape).join(",")];
  rows.forEach((row) => lines.push(row.map(escape).join(",")));
  return lines.join("\n");
}

// Dispara la descarga de un fichero CSV en el navegador
export function downloadCsv(filename: string, csvContent: string): void {
  const BOM = "﻿"; // BOM UTF-8 para que Excel lo abra bien con tildes
  const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Fecha actual en formato YYYYMMDD, para nombres de fichero.
export function fechaActualParaArchivo(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}${mm}${dd}`;
}

// Normaliza un término para usarlo en un nombre de fichero: minúsculas, sin
// tildes, espacios y caracteres no alfanuméricos sustituidos por "_".
export function slugificarParaArchivo(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/(^_|_$)/g, "");
}
