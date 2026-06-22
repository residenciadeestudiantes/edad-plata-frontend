"use client";

import { useState } from "react";
import { BotonDescargaCsv } from "@/components/BotonDescargaCsv";
import { getAuthors } from "@/lib/api";
import { arrayToCsv, downloadCsv, fechaActualParaArchivo } from "@/lib/exportCsv";

// Exporta TODOS los autores que cumplen los filtros actuales (no solo la
// página visible): vuelve a pedir la lista con el mismo query/letra/revista
// pero pageSize = total, en una sola petición.
export function ExportarAutoresCsv({
  query,
  letter,
  publicationSlug,
  total,
}: {
  query?: string;
  letter?: string;
  publicationSlug?: string;
  total: number;
}) {
  const [descargando, setDescargando] = useState(false);

  async function handleDescargar() {
    setDescargando(true);
    try {
      const { data: authors } = await getAuthors(
        1,
        Math.max(total, 1),
        query,
        letter,
        publicationSlug
      );

      const csv = arrayToCsv(
        ["Nombre", "Slug"],
        authors.map((author) => [author.nombre, author.slug])
      );

      const fecha = fechaActualParaArchivo();
      downloadCsv(`autores_${fecha}.csv`, csv);
    } catch (error) {
      console.error("Error al exportar autores a CSV", error);
    } finally {
      setDescargando(false);
    }
  }

  return (
    <BotonDescargaCsv
      onDescargar={handleDescargar}
      etiqueta={descargando ? "Exportando…" : "Exportar CSV"}
    />
  );
}
