"use client";

import { useEffect, useState } from "react";
import type { Data } from "plotly.js";
import { PlotlyChart } from "@/components/PlotlyChart";
import {
  getPublicacionesLineaTiempo,
  getPublicacionesDatosHemerograficos,
  getPublicacionesSelectorHemerografico,
  getArticulosHemerografico,
  getArticulosTemasHemerografico,
  type Publication,
  type Article,
} from "@/lib/api";
import { RedesClient } from "./RedesClient";

const MAX_REVISTAS_COMPARADAS = 3;
const COLORES_REVISTAS = ["#3838BD", "#DA3C00", "#008867"];

type Status = "loading" | "success" | "error";
type Tab = "estadisticas" | "redes";

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

// Orden y color fijos (no por frecuencia): cada tipo tiene una identidad
// visual propia, la misma que su badge en la ficha del artículo.
const TIPO_COLORES: [string, string][] = [
  ["Prosa", "#3838BD"],
  ["Poemas", "#DD158B"],
  ["Obra gráfica", "#DA3C00"],
  ["Anuncios", "#008867"],
];

function contarPorTipo(articulos: Article[]): [string, number][] {
  const conteo = new Map(TIPO_COLORES.map(([tipo]) => [tipo, 0]));
  for (const a of articulos) {
    if (a.es_anuncio) conteo.set("Anuncios", conteo.get("Anuncios")! + 1);
    else if (a.es_obra_grafica) conteo.set("Obra gráfica", conteo.get("Obra gráfica")! + 1);
    else if (a.es_poema) conteo.set("Poemas", conteo.get("Poemas")! + 1);
    else conteo.set("Prosa", conteo.get("Prosa")! + 1);
  }
  return TIPO_COLORES.map(([tipo]) => [tipo, conteo.get(tipo)!]);
}

// Un artículo puede tener varios temas; cada uno de sus temas suma 1,
// ordenados de más a menos frecuentes.
function contarPorTema(articulos: Article[]): Map<string, number> {
  const mapa = new Map<string, number>();
  for (const a of articulos) {
    for (const tema of a.temas ?? []) {
      mapa.set(tema.nombre, (mapa.get(tema.nombre) ?? 0) + 1);
    }
  }
  return mapa;
}

export function HemerograficoClient() {
  const [tab, setTab] = useState<Tab>("estadisticas");

  const [statusLinea, setStatusLinea] = useState<Status>("loading");
  const [publicaciones, setPublicaciones] = useState<Publication[]>([]);

  const [statusIdiomas, setStatusIdiomas] = useState<Status>("loading");
  const [articulos, setArticulos] = useState<Article[]>([]);

  const [statusDatos, setStatusDatos] = useState<Status>("loading");
  const [datos, setDatos] = useState<Publication[]>([]);

  const [statusTemas, setStatusTemas] = useState<Status>("loading");
  const [articulosTemas, setArticulosTemas] = useState<Article[]>([]);
  const [revistasSelector, setRevistasSelector] = useState<Publication[]>([]);
  const [revistasComparadas, setRevistasComparadas] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    getPublicacionesLineaTiempo()
      .then((data) => { setPublicaciones(data); setStatusLinea("success"); })
      .catch(() => setStatusLinea("error"));

    getArticulosHemerografico()
      .then((data) => { setArticulos(data); setStatusIdiomas("success"); })
      .catch(() => setStatusIdiomas("error"));

    getPublicacionesDatosHemerograficos()
      .then((data) => { setDatos(data); setStatusDatos("success"); })
      .catch(() => setStatusDatos("error"));

    getArticulosTemasHemerografico()
      .then((data) => { setArticulosTemas(data); setStatusTemas("success"); })
      .catch(() => setStatusTemas("error"));

    getPublicacionesSelectorHemerografico()
      .then((data) => setRevistasSelector(data))
      .catch(() => {});
  }, []);

  const altura = Math.max(ALTURA_MINIMA, publicaciones.length * ALTURA_POR_REVISTA);

  function toggleRevistaComparada(slug: string) {
    setRevistasComparadas((actual) => {
      const next = new Set(actual);
      if (next.has(slug)) {
        next.delete(slug);
      } else if (next.size < MAX_REVISTAS_COMPARADAS) {
        next.add(slug);
      }
      return next;
    });
  }

  const revistasElegidas = Array.from(revistasComparadas);
  const articulosTemasRelevantes =
    revistasElegidas.length === 0
      ? articulosTemas
      : articulosTemas.filter((a) =>
          revistasElegidas.includes(a.issue?.publication?.slug ?? "")
        );
  const temasOrdenados = [...contarPorTema(articulosTemasRelevantes).entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([nombre]) => nombre);

  const temaTraces: Data[] =
    revistasElegidas.length === 0
      ? (() => {
          const conteo = contarPorTema(articulosTemas);
          return [
            {
              type: "bar",
              x: temasOrdenados,
              y: temasOrdenados.map((t) => conteo.get(t) ?? 0),
              name: "Todas las revistas",
              marker: { color: "#3838BD" },
              hovertemplate: "%{x}: %{y} artículos<extra></extra>",
            } as Data,
          ];
        })()
      : revistasElegidas.map((slug, i) => {
          const publicacion = revistasSelector.find((p) => p.slug === slug);
          const conteo = contarPorTema(
            articulosTemas.filter((a) => a.issue?.publication?.slug === slug)
          );
          return {
            type: "bar",
            x: temasOrdenados,
            y: temasOrdenados.map((t) => conteo.get(t) ?? 0),
            name: publicacion?.titulo ?? slug,
            marker: { color: COLORES_REVISTAS[i % COLORES_REVISTAS.length] },
            hovertemplate: "%{x}: %{y} artículos<extra></extra>",
          } as Data;
        });

  const idiomaEntries = contarPorCampo(articulos, "idioma");
  const ciudadEntries = contarPorCampo(datos, "lugar_publicacion");
  const tipoEntries = contarPorTipo(articulos);

  const maxBurbuja = Math.max(...idiomaEntries.map(([, n]) => n), 1);

  return (
    <div className="flex flex-col gap-8">

      {/* ── Tab nav ── */}
      <div className="flex gap-1 border-b border-zinc-200 dark:border-zinc-800">
        {(["estadisticas", "redes"] as Tab[]).map(t => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              tab === t
                ? "border-b-2 border-azul text-azul dark:border-azul-claro dark:text-azul-claro"
                : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
            }`}
          >
            {t === "estadisticas" ? "Estadísticas" : "Redes"}
          </button>
        ))}
      </div>

      {/* ── Redes tab ── */}
      {tab === "redes" && <RedesClient />}

      {/* ── Estadísticas tab ── */}
      {tab === "estadisticas" && <div className="flex flex-col gap-12">

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

      {/* Gráfico de barras por tipo de artículo */}
      <section className="flex flex-col gap-4">
        <h2 className="font-titulo text-lg font-semibold text-azul dark:text-azul-claro">
          Distribución por tipo de artículo
        </h2>
        <p className="max-w-3xl font-light text-zinc-600 dark:text-zinc-400">
          Número de artículos del corpus según sean prosa, poemas, obra
          gráfica (láminas, retratos, óleos sin texto) o anuncios.
        </p>

        {statusIdiomas === "loading" && <CargandoBar />}
        {statusIdiomas === "error" && <ErrorMsg texto="los datos de tipo de artículo" />}
        {statusIdiomas === "success" && (
          <div className="w-full rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800" style={{ height: 320 }}>
            <PlotlyChart
              data={[
                {
                  type: "bar",
                  x: tipoEntries.map(([tipo]) => tipo),
                  y: tipoEntries.map(([, n]) => n),
                  hovertemplate: "%{x}: %{y} artículos<extra></extra>",
                  marker: { color: tipoEntries.map(([tipo]) => TIPO_COLORES.find(([t]) => t === tipo)![1]) },
                } as Data,
              ]}
              layout={{
                xaxis: { automargin: true },
                yaxis: {
                  title: { text: "Nº de artículos" },
                  showgrid: true,
                  gridcolor: "#F5F5F0",
                },
                margin: { l: 60, r: 20, t: 20, b: 40 },
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

      {/* Gráfico de barras por tema, con comparativa entre revistas */}
      <section className="flex flex-col gap-4">
        <h2 className="font-titulo text-lg font-semibold text-azul dark:text-azul-claro">
          Artículos por tema
        </h2>
        <p className="max-w-3xl font-light text-zinc-600 dark:text-zinc-400">
          Número de artículos por tema asignado. Elige hasta tres revistas
          para comparar su distribución temática, o deja "Todas las
          revistas" para ver el total del corpus.
        </p>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setRevistasComparadas(new Set())}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              revistasComparadas.size === 0
                ? "border-azul bg-azul text-white dark:border-azul-claro dark:bg-azul-claro dark:text-negro"
                : "border-zinc-300 text-zinc-500 hover:border-azul hover:text-azul dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-azul-claro dark:hover:text-azul-claro"
            }`}
          >
            Todas las revistas
          </button>
          {revistasSelector.map((p) => {
            const seleccionada = revistasComparadas.has(p.slug);
            const deshabilitada = !seleccionada && revistasComparadas.size >= MAX_REVISTAS_COMPARADAS;
            return (
              <button
                key={p.slug}
                type="button"
                disabled={deshabilitada}
                onClick={() => toggleRevistaComparada(p.slug)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  seleccionada
                    ? "border-azul bg-azul text-white dark:border-azul-claro dark:bg-azul-claro dark:text-negro"
                    : deshabilitada
                      ? "border-zinc-200 text-zinc-300 dark:border-zinc-800 dark:text-zinc-600"
                      : "border-zinc-300 text-zinc-500 hover:border-azul hover:text-azul dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-azul-claro dark:hover:text-azul-claro"
                }`}
              >
                {p.titulo}
              </button>
            );
          })}
        </div>
        {revistasComparadas.size >= MAX_REVISTAS_COMPARADAS && (
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Máximo {MAX_REVISTAS_COMPARADAS} revistas para comparar.
          </p>
        )}

        {statusTemas === "loading" && <CargandoBar />}
        {statusTemas === "error" && <ErrorMsg texto="los datos de temas" />}
        {statusTemas === "success" && temasOrdenados.length === 0 && (
          <p className="text-zinc-500">No hay artículos con temas asignados.</p>
        )}
        {statusTemas === "success" && temasOrdenados.length > 0 && (
          <div className="w-full rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800" style={{ height: 420 }}>
            <PlotlyChart
              data={temaTraces}
              layout={{
                barmode: "group",
                xaxis: { automargin: true },
                yaxis: {
                  title: { text: "Nº de artículos" },
                  showgrid: true,
                  gridcolor: "#F5F5F0",
                },
                legend: { orientation: "h", y: -0.2 },
                margin: { l: 50, r: 20, t: 20, b: 100 },
              }}
            />
          </div>
        )}
      </section>

    </div>} {/* end estadisticas tab */}

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
