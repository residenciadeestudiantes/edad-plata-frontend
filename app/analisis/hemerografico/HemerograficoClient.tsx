"use client";

import { useEffect, useState } from "react";
import type { Data } from "plotly.js";
import { PlotlyChart } from "@/components/PlotlyChart";
import { getPublicacionesLineaTiempo, type Publication } from "@/lib/api";

type Status = "loading" | "success" | "error";

const ALTURA_POR_REVISTA = 28;
const ALTURA_MINIMA = 400;

export function HemerograficoClient() {
  const [status, setStatus] = useState<Status>("loading");
  const [publicaciones, setPublicaciones] = useState<Publication[]>([]);

  useEffect(() => {
    getPublicacionesLineaTiempo()
      .then((data) => {
        setPublicaciones(data);
        setStatus("success");
      })
      .catch((error) => {
        console.error("Error al cargar la línea de tiempo de revistas", error);
        setStatus("error");
      });
  }, []);

  if (status === "loading") {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-12 text-center text-sm font-light text-zinc-500">
        <p>Cargando la línea de tiempo…</p>
        <div className="h-1.5 w-full max-w-md overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
          <div className="h-full w-1/3 animate-pulse rounded-full bg-azul dark:bg-azul-claro" />
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <p className="text-sm text-red-600 dark:text-red-400">
        No se ha podido cargar la línea de tiempo. Inténtalo de nuevo más tarde.
      </p>
    );
  }

  if (publicaciones.length === 0) {
    return <p className="text-zinc-500">No hay revistas con fechas registradas.</p>;
  }

  // Ya vienen ordenadas por año_inicio ascendente desde la API; con
  // autorange "reversed" en el eje Y, la más antigua queda arriba.
  const inicios = publicaciones.map((p) => p.año_inicio ?? 0);
  const duraciones = publicaciones.map(
    (p) => (p.año_fin ?? p.año_inicio ?? 0) - (p.año_inicio ?? 0) + 1
  );
  const etiquetas = publicaciones.map((p) => {
    const fin = p.año_fin ?? p.año_inicio;
    return p.año_inicio === fin
      ? `${p.titulo}: ${p.año_inicio}`
      : `${p.titulo}: ${p.año_inicio}–${fin}`;
  });

  const altura = Math.max(ALTURA_MINIMA, publicaciones.length * ALTURA_POR_REVISTA);

  return (
    <div className="flex flex-col gap-4">
      <p className="max-w-3xl font-light text-zinc-600 dark:text-zinc-400">
        Cada barra muestra el periodo de publicación de una revista, desde su
        primer hasta su último número conocido, según los años registrados en
        su ficha.
      </p>
      <div
        className="w-full rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800"
        style={{ height: altura }}
      >
        <PlotlyChart
          data={[
            // `base` desplaza el origen de cada barra horizontal al año de
            // inicio (la técnica habitual de Plotly para diagramas de Gantt);
            // @types/plotly.js no la declara aunque sí existe en tiempo de
            // ejecución, de ahí el `as Data`.
            {
              type: "bar",
              orientation: "h",
              base: inicios,
              x: duraciones,
              y: publicaciones.map((p) => p.titulo),
              hovertext: etiquetas,
              hovertemplate: "%{hovertext}<extra></extra>",
              marker: { color: "#3838BD" },
            } as Data,
          ]}
          layout={{
            xaxis: { title: { text: "Año" }, showgrid: true, gridcolor: "#F5F5F0" },
            yaxis: { autorange: "reversed", automargin: true },
            margin: { l: 180, r: 20, t: 20, b: 40 },
          }}
        />
      </div>
    </div>
  );
}
