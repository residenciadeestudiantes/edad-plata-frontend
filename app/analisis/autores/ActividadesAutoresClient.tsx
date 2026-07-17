"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import type { Data, PlotMouseEvent } from "plotly.js";
import { Badge } from "@/components/Badge";
import { LoaderAnalisis } from "@/components/LoaderAnalisis";
import { PlotlyChart } from "@/components/PlotlyChart";
import {
  getActividadesConConteo,
  getAuthorsByActividad,
  type ActividadConConteo,
  type Author,
} from "@/lib/api";
import { useProgresoSimulado } from "@/lib/useProgresoSimulado";

const PASO = 25;
const ALTURA_POR_BARRA = 26;
const ALTURA_MINIMA = 320;
const COLOR_BARRA = "#008867"; // mismo verde que el badge de actividad en la ficha de autor
// Espacio en blanco añadido tras el nombre de la actividad para separarlo
// visualmente del arranque de la barra (Plotly no tiene una propiedad
// directa para ese hueco en un eje de categorías).
const SEPARADOR_ETIQUETA = "    ";

type Status = "loading" | "success" | "error";
type AutoresStatus = "idle" | "loading" | "success" | "error";

export function ActividadesAutoresClient() {
  const [status, setStatus] = useState<Status>("loading");
  const [actividades, setActividades] = useState<ActividadConConteo[]>([]);
  const [visibles, setVisibles] = useState(PASO);
  const progreso = useProgresoSimulado(status === "loading");

  const [seleccionada, setSeleccionada] = useState<ActividadConConteo | null>(null);
  const [autoresStatus, setAutoresStatus] = useState<AutoresStatus>("idle");
  const [autores, setAutores] = useState<Pick<Author, "id" | "documentId" | "nombre" | "slug">[]>([]);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getActividadesConConteo()
      .then((data) => {
        setActividades(data.filter((a) => a.autoresCount > 0));
        setStatus("success");
      })
      .catch(() => setStatus("error"));
  }, []);

  // Al seleccionar una actividad, el panel de autores aparece debajo del
  // gráfico (que puede ser alto con muchas barras visibles); bajamos la
  // vista hasta él para que se note que ha pasado algo.
  useEffect(() => {
    if (seleccionada) panelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [seleccionada]);

  const top = actividades.slice(0, visibles);
  const altura = Math.max(ALTURA_MINIMA, top.length * ALTURA_POR_BARRA + 80);

  function handleClick(event: Readonly<PlotMouseEvent>) {
    const punto = event.points[0];
    if (!punto || punto.pointIndex === undefined) return;
    const actividad = top[punto.pointIndex];
    if (!actividad) return;

    if (seleccionada?.slug === actividad.slug) {
      setSeleccionada(null);
      return;
    }

    setSeleccionada(actividad);
    setAutoresStatus("loading");
    setAutores([]);
    getAuthorsByActividad(actividad.slug)
      .then((data) => {
        setAutores(data);
        setAutoresStatus("success");
      })
      .catch(() => setAutoresStatus("error"));
  }

  return (
    <section className="flex flex-col gap-4">
      <p className="max-w-3xl font-light text-zinc-600 dark:text-zinc-400">
        Número de autores por tipo de actividad o profesión (poeta, pintor,
        ensayista...), tal como consta en las fuentes biográficas cruzadas.
        Un autor puede tener más de una actividad. Haz clic en una barra
        para ver los autores correspondientes.
      </p>

      {status === "loading" && <LoaderAnalisis progreso={progreso} />}
      {status === "error" && (
        <p className="text-sm text-red-600 dark:text-red-400">
          No se han podido cargar las actividades. Inténtalo de nuevo más tarde.
        </p>
      )}
      {status === "success" && top.length === 0 && (
        <p className="text-zinc-500">No hay actividades registradas.</p>
      )}
      {status === "success" && top.length > 0 && (
        <>
          <div
            className="w-full rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800"
            style={{ height: altura }}
          >
            <PlotlyChart
              data={[
                {
                  type: "bar",
                  orientation: "h",
                  x: top.map((a) => a.autoresCount),
                  y: top.map((a) => `${a.nombre}${SEPARADOR_ETIQUETA}`),
                  hovertext: top.map((a) => a.nombre),
                  hovertemplate: "%{hovertext}: %{x} autor%{customdata}<extra></extra>",
                  customdata: top.map((a) => (a.autoresCount === 1 ? "" : "es")),
                  marker: { color: COLOR_BARRA },
                } as unknown as Data,
              ]}
              layout={{
                xaxis: { title: { text: "Autores" }, showgrid: true, gridcolor: "#F5F5F0" },
                yaxis: { autorange: "reversed", automargin: true },
                margin: { l: 200, r: 20, t: 20, b: 40 },
              }}
              onClick={handleClick}
            />
          </div>

          {visibles < actividades.length && (
            <button
              type="button"
              onClick={() => setVisibles((v) => v + PASO)}
              className="self-start text-sm font-semibold text-azul hover:underline dark:text-azul-claro"
            >
              Mostrar {Math.min(PASO, actividades.length - visibles)} más
              {" "}
              (quedan {actividades.length - visibles} de {actividades.length})
            </button>
          )}

          {seleccionada && (
            <div
              ref={panelRef}
              className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-negro"
            >
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-titulo text-base font-semibold text-negro dark:text-blanco">
                  {seleccionada.nombre}{" "}
                  <span className="font-light text-zinc-500 dark:text-zinc-400">
                    ({seleccionada.autoresCount} autor{seleccionada.autoresCount !== 1 ? "es" : ""})
                  </span>
                </h3>
                <button
                  type="button"
                  onClick={() => setSeleccionada(null)}
                  aria-label="Cerrar"
                  className="text-sm text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                >
                  ✕
                </button>
              </div>

              {autoresStatus === "loading" && (
                <p className="text-sm font-light text-zinc-400">Cargando autores…</p>
              )}
              {autoresStatus === "error" && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  No se han podido cargar los autores. Inténtalo de nuevo más tarde.
                </p>
              )}
              {autoresStatus === "success" && (
                <div className="flex flex-wrap gap-2">
                  {autores.map((autor) => (
                    <Link key={autor.documentId} href={`/autores/${autor.slug}`}>
                      <Badge color="verde" className="transition-opacity hover:opacity-70">
                        {autor.nombre}
                      </Badge>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </section>
  );
}
