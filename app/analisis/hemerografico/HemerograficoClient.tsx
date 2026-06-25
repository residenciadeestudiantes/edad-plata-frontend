"use client";

import { useEffect, useState } from "react";
import type { Data } from "plotly.js";
import { PlotlyChart } from "@/components/PlotlyChart";
import {
  getPublicacionesLineaTiempo,
  getPublicacionesDatosHemerograficos,
  getIdiomasArticulos,
  type Publication,
  type Article,
} from "@/lib/api";

type Status = "loading" | "success" | "error";

const ALTURA_POR_REVISTA = 28;
const ALTURA_MINIMA = 400;

function contarPorCampo<T extends object>(
  datos: T[],
  campo: keyof T,
  fallback = "Sin registrar"
): [string, number][] {
  const mapa = new Map<string, number>();
  for (const p of datos) {
    const valor = (p[campo] as string | null) ?? fallback;
    mapa.set(valor, (mapa.get(valor) ?? 0) + 1);
  }
  return [...mapa.entries()].sort((a, b) => b[1] - a[1]);
}

export function HemerograficoClient() {
  const [statusLinea, setStatusLinea] = useState<Status>("loading");
  const [publicaciones, setPublicaciones] = useState<Publication[]>([]);

  const [statusIdiomas, setStatusIdiomas] = useState<Status>("loading");
  const [articulos, setArticulos] = useState<Article[]>([]);

  const [statusDatos, setStatusDatos] = useState<Status>("loading");
  const [datos, setDatos] = useState<Publication[]>([]);

  useEffect(() => {
    getPublicacionesLineaTiempo()
      .then((data) => {
        setPublicaciones(data);
        setStatusLinea("success");
      })
      .catch(() => setStatusLinea("error"));

    getIdiomasArticulos()
      .then((data) => {
        setArticulos(data);
        setStatusIdiomas("success");
      })
      .catch(() => setStatusIdiomas("error"));

    getPublicacionesDatosHemerograficos()
      .then((data) => {
        setDatos(data);
        setStatusDatos("success");
      })
      .catch(() => setStatusDatos("error"));
  }, []);

  const altura = Math.max(ALTURA_MINIMA, publicaciones.length * ALTURA_POR_REVISTA);

  const idiomaEntries = contarPorCampo(articulos, "idioma");
  const ciudadEntries = contarPorCampo(datos, "lugar_publicacion");

  const maxBurbuja = Math.max(...idiomaEntries.map(([, n]) => n), 1);

  return (
    <div className="flex flex-col gap-12">

      {/* Línea de tiempo */}
      <section className="flex flex-col gap-4">
        <h2 className="font-titulo text-lg font-semibold text-azul dark:text-azul-claro">
          Línea de tiempo
        </h2>
        <p className="max-w-3xl font-light text-zinc-600 dark:text-zinc-400">
          Cada barra muestra el periodo de publicación de una revista, desde su
          primer hasta su último número conocido, según los años registrados en
          su ficha.
        </p>

        {statusLinea === "loading" && <CargandoBar />}
        {statusLinea === "error" && <ErrorMsg texto="la línea de tiempo" />}
        {statusLinea === "success" && publicaciones.length === 0 && (
          <p className="text-zinc-500">No hay revistas con fechas registradas.</p>
        )}
        {statusLinea === "success" && publicaciones.length > 0 && (
          <div
            className="w-full rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800"
            style={{ height: altura }}
          >
            <PlotlyChart
              data={[
                {
                  type: "bar",
                  orientation: "h",
                  base: publicaciones.map((p) => p.año_inicio ?? 0),
                  x: publicaciones.map(
                    (p) => (p.año_fin ?? p.año_inicio ?? 0) - (p.año_inicio ?? 0) + 1
                  ),
                  y: publicaciones.map((p) => p.titulo),
                  hovertext: publicaciones.map((p) => {
                    const fin = p.año_fin ?? p.año_inicio;
                    return p.año_inicio === fin
                      ? `${p.titulo}: ${p.año_inicio}`
                      : `${p.titulo}: ${p.año_inicio}–${fin}`;
                  }),
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
        )}
      </section>

      {/* Gráfico de burbujas por idioma */}
      <section className="flex flex-col gap-4">
        <h2 className="font-titulo text-lg font-semibold text-azul dark:text-azul-claro">
          Distribución por idioma
        </h2>
        <p className="max-w-3xl font-light text-zinc-600 dark:text-zinc-400">
          Cada burbuja representa un idioma; su tamaño es proporcional al número
          de artículos escritos en ese idioma.
        </p>

        {statusIdiomas === "loading" && <CargandoBar />}
        {statusIdiomas === "error" && <ErrorMsg texto="los datos de idioma" />}
        {statusIdiomas === "success" && idiomaEntries.length === 0 && (
          <p className="text-zinc-500">No hay datos de idioma registrados.</p>
        )}
        {statusIdiomas === "success" && idiomaEntries.length > 0 && (
          <div className="h-64 w-full rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800">
            <PlotlyChart
              data={[
                {
                  type: "scatter",
                  mode: "markers+text",
                  x: idiomaEntries.map((_, i) => i),
                  y: idiomaEntries.map(() => 0),
                  text: idiomaEntries.map(([idioma, n]) => `${idioma}<br>${n}`),
                  textposition: "top center",
                  hovertemplate: "%{text}<extra></extra>",
                  marker: {
                    size: idiomaEntries.map(
                      ([, n]) => 20 + (n / maxBurbuja) * 80
                    ),
                    color: "#3838BD",
                    opacity: 0.75,
                  },
                } as unknown as Data,
              ]}
              layout={{
                xaxis: {
                  showticklabels: false,
                  showgrid: false,
                  zeroline: false,
                },
                yaxis: {
                  showticklabels: false,
                  showgrid: false,
                  zeroline: false,
                  range: [-1, 1.5],
                },
                margin: { l: 10, r: 10, t: 10, b: 10 },
              }}
            />
          </div>
        )}
      </section>

      {/* Gráfico de barras por ciudad */}
      <section className="flex flex-col gap-4">
        <h2 className="font-titulo text-lg font-semibold text-azul dark:text-azul-claro">
          Distribución por ciudad de publicación
        </h2>
        <p className="max-w-3xl font-light text-zinc-600 dark:text-zinc-400">
          Número de revistas del corpus según la ciudad en que fueron publicadas.
        </p>

        {statusDatos === "loading" && <CargandoBar />}
        {statusDatos === "error" && <ErrorMsg texto="los datos de ciudad" />}
        {statusDatos === "success" && ciudadEntries.length === 0 && (
          <p className="text-zinc-500">No hay datos de ciudad registrados.</p>
        )}
        {statusDatos === "success" && ciudadEntries.length > 0 && (
          <div className="w-full rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800" style={{ height: 360 }}>
            <PlotlyChart
              data={[
                {
                  type: "bar",
                  x: ciudadEntries.map(([ciudad]) => ciudad),
                  y: ciudadEntries.map(([, n]) => n),
                  hovertemplate: "%{x}: %{y} revistas<extra></extra>",
                  marker: { color: "#3838BD" },
                } as Data,
              ]}
              layout={{
                xaxis: { automargin: true },
                yaxis: {
                  title: { text: "Nº de revistas" },
                  showgrid: true,
                  gridcolor: "#F5F5F0",
                  dtick: 1,
                },
                margin: { l: 50, r: 20, t: 20, b: 80 },
              }}
            />
          </div>
        )}
      </section>

    </div>
  );
}

function CargandoBar() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-center text-sm font-light text-zinc-500">
      <p>Cargando datos…</p>
      <div className="h-1.5 w-full max-w-md overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
        <div className="h-full w-1/3 animate-pulse rounded-full bg-azul dark:bg-azul-claro" />
      </div>
    </div>
  );
}

function ErrorMsg({ texto }: { texto: string }) {
  return (
    <p className="text-sm text-red-600 dark:text-red-400">
      No se ha podido cargar {texto}. Inténtalo de nuevo más tarde.
    </p>
  );
}
