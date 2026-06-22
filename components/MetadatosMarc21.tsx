"use client";

import { BotonDescargaCsv } from "@/components/BotonDescargaCsv";
import { arrayToCsv, downloadCsv, fechaActualParaArchivo } from "@/lib/exportCsv";
import { parseMarc21 } from "@/lib/marc21";

export function MetadatosMarc21({
  texto,
  slug,
}: {
  texto: string;
  slug: string;
}) {
  const campos = parseMarc21(texto);

  function handleDescargar() {
    const csv = arrayToCsv(
      ["Etiqueta", "Contenido"],
      campos.map((campo) => [campo.etiqueta, campo.contenido])
    );
    downloadCsv(`marc21_${slug}_${fechaActualParaArchivo()}.csv`, csv);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-titulo text-lg font-semibold text-azul dark:text-azul-claro">
          Metadatos MARC21
        </h3>
        <BotonDescargaCsv
          onDescargar={handleDescargar}
          etiqueta="Descargar CSV"
          variant="secondary-azul"
        />
      </div>
      <pre className="overflow-x-auto rounded-md border border-zinc-200 bg-gris-claro p-4 text-xs leading-relaxed text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
        {texto}
      </pre>
    </div>
  );
}
