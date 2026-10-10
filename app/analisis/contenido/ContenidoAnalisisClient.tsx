"use client";

import { useEffect, useState } from "react";
import type { Data } from "plotly.js";
import { LoaderAnalisis } from "@/components/LoaderAnalisis";
import { PlotlyChart } from "@/components/PlotlyChart";
import { getPersonasMencionadasConMenciones } from "@/lib/api";
import { useProgresoSimulado } from "@/lib/useProgresoSimulado";

const TOP_N = 40;
const COLOR = "#3838BD";
const ALTURA_POR_PERSONA = 24;
const ALTURA_MINIMA = 400;

type Status = "loading" | "success" | "error";

interface Punto {
  persona: string;
  año: number;
  count: number;
  articulos: string[];
}

export function ContenidoAnalisisClient() {
  const [status, setStatus] = useState<Status>("loading");
  const [puntos, setPuntos] = useState<Punto[]>([]);
  const [personasOrdenadas, setPersonasOrdenadas] = useState<string[]>([]);
  const progreso = useProgresoSimulado(status === "loading");

  useEffect(() => {
    getPersonasMencionadasConMenciones()
      .then((personas) => {
        // Para cada persona, agrupar sus artículos por año y contar.
        const porPersonaAño = new Map<string, Map<number, { count: number; articulos: string[] }>>();
        const totalPorPersona = new Map<string, number>();

        for (const p of personas) {
          const mapaAños = new Map<number, { count: number; articulos: string[] }>();
          for (const art of p.articles ?? []) {
            const año = art.issue?.año;
            if (!año) continue;
            const entry = mapaAños.get(año) ?? { count: 0, articulos: [] };
            entry.count += 1;
            entry.articulos.push(art.titulo);
            mapaAños.set(año, entry);
          }
          if (mapaAños.size === 0) continue;
          porPersonaAño.set(p.nombre, mapaAños);
          const total = [...mapaAños.values()].reduce((s, e) => s + e.count, 0);
          totalPorPersona.set(p.nombre, total);
        }

        // Top N personas por nº total de menciones, de más a menos.
        const orden = [...totalPorPersona.entries()]
          .sort((a, b) => b[1] - a[1])
          .slice(0, TOP_N)
          .map(([nombre]) => nombre);

        const puntosCalc: Punto[] = [];
        for (const nombre of orden) {
          const mapaAños = porPersonaAño.get(nombre)!;
          for (const [año, { count, articulos }] of mapaAños) {
            puntosCalc.push({ persona: nombre, año, count, articulos });
          }
        }

        setPersonasOrdenadas(orden);
        setPuntos(puntosCalc);
        setStatus("success");
      })
      .catch(() => setStatus("error"));
  }, []);

  const maxCount = Math.max(...puntos.map((p) => p.count), 1);
  const altura = Math.max(ALTURA_MINIMA, personasOrdenadas.length * ALTURA_POR_PERSONA + 100);

  return (
    <section className="flex flex-col gap-4">
      <p className="max-w-3xl font-light text-zinc-600 dark:text-zinc-400">
        Personas reales mencionadas en el texto de los artículos (no sus
        autores), extraídas automáticamente. El tamaño de cada punto indica
        cuántos artículos distintos la mencionan ese año; pasa el cursor por
        un punto para ver de qué artículos se trata.
      </p>

      {status === "loading" && <LoaderAnalisis progreso={progreso} />}
      {status === "error" && (
        <p className="text-sm text-red-600 dark:text-red-400">
          No se han podido cargar los datos. Inténtalo de nuevo más tarde.
        </p>
      )}
      {status === "success" && puntos.length === 0 && (
        <p className="text-zinc-500">Todavía no hay datos de este análisis.</p>
      )}
      {status === "success" && puntos.length > 0 && (
        <div
          className="w-full rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800"
          style={{ height: altura }}
        >
          <PlotlyChart
            data={[
              {
                type: "scatter",
                mode: "markers",
                x: puntos.map((p) => p.año),
                y: puntos.map((p) => p.persona),
                text: puntos.map((p) => {
                  const lista = p.articulos.slice(0, 12);
                  const resto = p.articulos.length - lista.length;
                  return (
                    `${p.persona} — ${p.año}: ${p.count} artículo${p.count !== 1 ? "s" : ""}<br>` +
                    lista.map((t) => `· ${t}`).join("<br>") +
                    (resto > 0 ? `<br>… y ${resto} más` : "")
                  );
                }),
                hovertemplate: "%{text}<extra></extra>",
                marker: {
                  size: puntos.map((p) => 8 + (p.count / maxCount) * 32),
                  color: COLOR,
                  opacity: 0.75,
                },
              } as unknown as Data,
            ]}
            layout={{
              xaxis: {
                title: { text: "Año" },
                dtick: 1,
                showgrid: true,
                gridcolor: "#F5F5F0",
              },
              yaxis: { autorange: "reversed", automargin: true },
              margin: { l: 200, r: 20, t: 20, b: 40 },
            }}
          />
        </div>
      )}
    </section>
  );
}
