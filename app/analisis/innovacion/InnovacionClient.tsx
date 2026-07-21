"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import DOMPurify from "isomorphic-dompurify";
import type { PlotMouseEvent } from "plotly.js";
import { AuthorCombobox } from "@/components/AuthorCombobox";
import { Button } from "@/components/Button";
import { GuardarAnalisis } from "@/components/GuardarAnalisis";
import { LoaderAnalisis } from "@/components/LoaderAnalisis";
import { MetodologiaCientifica } from "@/components/MetodologiaCientifica";
import { PlotlyChart } from "@/components/PlotlyChart";
import { useProgresoSimulado } from "@/lib/useProgresoSimulado";
import {
  getArticle,
  getInterpretacionDeriva,
  getInnovacionEstilistica,
  type InnovacionArticulo,
  type InnovacionAutor,
  type InnovacionEstilisticaResponse,
} from "@/lib/api";

type Status = "idle" | "loading" | "success" | "error";
type Modo = "prosa" | "poesia";

type PuntoSeleccionado = {
  autor: InnovacionAutor;
  año: number;
  articulos: InnovacionArticulo[];
};

type ArticuloModal = {
  slug: string;
  titulo: string;
  html: string | null;
  cargando: boolean;
  error: boolean;
};

type Tendencia = "Innovador" | "Estable" | "Convergente";

const COLOR_TENDENCIA: Record<Tendencia, string> = {
  Innovador: "#DA3C00",
  Estable: "#71717A",
  Convergente: "#3838BD",
};

const NUM_SELECTORES = 4;

function calcularTendencia(inicial: number, final: number): Tendencia {
  const diferencia = final - inicial;
  if (diferencia > 0.5) return "Innovador";
  if (Math.abs(diferencia) <= 0.3) return "Estable";
  if (diferencia < -0.3) return "Convergente";
  return "Estable";
}

export function InnovacionClient() {
  const [slugsSeleccionados, setSlugsSeleccionados] = useState<string[]>(
    Array(NUM_SELECTORES).fill("")
  );
  const [modo, setModo] = useState<Modo>("prosa");
  const [status, setStatus] = useState<Status>("idle");
  const progreso = useProgresoSimulado(status === "loading");
  const [data, setData] = useState<InnovacionEstilisticaResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [puntoSeleccionado, setPuntoSeleccionado] = useState<PuntoSeleccionado | null>(null);
  const [articuloModal, setArticuloModal] = useState<ArticuloModal | null>(null);
  const [interpretacion, setInterpretacion] = useState<string | null>(null);
  const [loadingInterpretacion, setLoadingInterpretacion] = useState(false);
  const [errorInterpretacion, setErrorInterpretacion] = useState<string | null>(null);

  const seleccionados = slugsSeleccionados.filter(Boolean);
  const hayDuplicados = new Set(seleccionados).size !== seleccionados.length;
  const puedeAnalizar = seleccionados.length >= 1 && !hayDuplicados && status !== "loading";

  function handleSeleccion(indice: number, slug: string) {
    setSlugsSeleccionados((actual) => {
      const copia = [...actual];
      copia[indice] = slug;
      return copia;
    });
  }

  function handleLimpiar() {
    setSlugsSeleccionados(Array(NUM_SELECTORES).fill(""));
    setStatus("idle");
    setData(null);
    setErrorMessage(null);
    setPuntoSeleccionado(null);
    setInterpretacion(null);
    setErrorInterpretacion(null);
  }

  async function handleInterpretar() {
    if (!data) return;
    setLoadingInterpretacion(true);
    setInterpretacion(null);
    setErrorInterpretacion(null);
    try {
      const res = await getInterpretacionDeriva({
        modo,
        norma: data.norma,
        autores: data.autores.map((a) => ({
          nombre: a.nombre,
          num_articulos: a.num_articulos,
          trayectoria: a.trayectoria.map((p) => ({ año: p.año, distancia: p.distancia })),
        })),
      });
      setInterpretacion(res.interpretacion);
    } catch {
      setErrorInterpretacion("No se ha podido obtener la interpretación. Inténtalo de nuevo.");
    } finally {
      setLoadingInterpretacion(false);
    }
  }

  function handleClickPunto(event: Readonly<PlotMouseEvent>) {
    if (!data) return;
    const punto = event.points[0];
    if (!punto) return;
    const año = punto.x as number;
    const autor = data.autores[punto.curveNumber];
    if (!autor) return;
    const puntoData = autor.trayectoria.find((p) => p.año === año);
    if (!puntoData) return;
    setPuntoSeleccionado({ autor, año, articulos: puntoData.articulos });
  }

  async function handleLeerArticulo(slug: string, titulo: string) {
    setArticuloModal({ slug, titulo, html: null, cargando: true, error: false });
    try {
      const article = await getArticle(slug);
      if (!article?.texto) {
        setArticuloModal({ slug, titulo, html: null, cargando: false, error: false });
        return;
      }
      const html = DOMPurify.sanitize(
        article.texto
          .replace(/<div class="Título">[\s\S]*?<\/div>/g, "")
          .replace(/<div class="Titulo">[\s\S]*?<\/div>/g, "")
          .replace(/<div class="Autortexto">[\s\S]*?<\/div>/g, "")
          .replace(/<div class="Autor">[\s\S]*?<\/div>/g, "")
          .replace(/<div class="Normal"><a class="page"[\s\S]*?<\/a><\/div>/g, "")
      );
      setArticuloModal({ slug, titulo, html, cargando: false, error: false });
    } catch {
      setArticuloModal({ slug, titulo, html: null, cargando: false, error: true });
    }
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setArticuloModal(null);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function handleModo(nuevoModo: Modo) {
    setModo(nuevoModo);
    setStatus("idle");
    setData(null);
    setErrorMessage(null);
  }

  async function handleAnalizar(overrides?: { slugs?: string[]; modo?: Modo }) {
    const slugs = overrides?.slugs ?? seleccionados;
    const modoActual = overrides?.modo ?? modo;
    if (slugs.length === 0 || new Set(slugs).size !== slugs.length) return;

    setStatus("loading");
    setErrorMessage(null);

    try {
      const res = await getInnovacionEstilistica(slugs, modoActual);
      setData(res);
      setStatus("success");
    } catch (error) {
      console.error("Error al calcular la innovación estilística", error);
      setErrorMessage(
        "No se ha podido completar el análisis. Inténtalo de nuevo más tarde."
      );
      setStatus("error");
    }
  }

  // Reabrir un análisis guardado desde Mis Proyectos: /analisis/innovacion?
  // autores=slug1,slug2&modo=prosa prefija el formulario y dispara el
  // análisis automáticamente.
  const searchParams = useSearchParams();
  useEffect(() => {
    const autoresUrl = searchParams.get("autores");
    if (!autoresUrl) return;

    const slugsUrl = autoresUrl.split(",").filter(Boolean);
    const modoUrl = (searchParams.get("modo") as Modo) || "prosa";

    setSlugsSeleccionados(
      Array.from({ length: NUM_SELECTORES }, (_, i) => slugsUrl[i] ?? "")
    );
    setModo(modoUrl);

    handleAnalizar({ slugs: slugsUrl, modo: modoUrl });
    // Solo al montar: es una prefijación desde la URL.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4 border-l-4 border-azul pl-4">
        <p className="max-w-3xl font-light text-zinc-600 dark:text-zinc-400">
          Mide cómo evoluciona el estilo de un autor a lo largo del tiempo en
          relación con la norma del corpus. Se puede analizar hasta cuatro
          autores simultáneamente y comparar sus trayectorias en prosa o en
          poesía por separado. Esta herramienta tiene la finalidad de
          investigar la evolución literaria y estilística de los autores de
          la Edad de Plata.
        </p>

        <MetodologiaCientifica>
          <p>
            Esta herramienta aplica el análisis de deriva estilística, método
            que sitúa el estilo de un autor respecto a la norma general del
            corpus a lo largo del tiempo. La norma se calcula a partir del
            vocabulario del conjunto de autores publicados, y cada punto de
            la trayectoria corresponde al texto de un autor en un año
            concreto, expresado como su distancia respecto a esa norma.
          </p>
        </MetodologiaCientifica>

        <div className="flex flex-wrap gap-x-8 gap-y-3 text-sm">
          <div className="flex flex-col gap-2">
            <span className="font-medium text-zinc-500 dark:text-zinc-400">Gráfico</span>
            <div className="flex flex-col gap-1 font-light text-zinc-500 dark:text-zinc-400">
              <span>
                <span className="inline-block h-3 w-5 rounded-sm bg-zinc-200 align-middle dark:bg-zinc-700" />{" "}
                Zona de norma (μ ± σ): aquí se sitúa el 68 % de los autores del corpus
              </span>
              <span>
                <span className="mr-1 font-mono text-zinc-400">- -</span>
                Umbral de singularidad (μ + 2σ): por encima, el 2,5 % más distintivo
              </span>
              <span>
                <span className="mr-1 font-mono text-zinc-400">···</span>
                Línea de norma exacta (μ = 0 en z-score)
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <span className="font-medium text-zinc-500 dark:text-zinc-400">Tendencia</span>
            <div className="flex flex-col gap-1 font-light">
              <span style={{ color: COLOR_TENDENCIA["Innovador"] }}>
                ↗ Innovador — el z-score sube más de 0,5σ entre el primer y el último año
              </span>
              <span style={{ color: COLOR_TENDENCIA["Estable"] }}>
                → Estable — variación inferior a 0,3σ
              </span>
              <span style={{ color: COLOR_TENDENCIA["Convergente"] }}>
                ↘ Convergente — el z-score baja más de 0,3σ (el autor se acerca a la norma)
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-negro">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Modo:</span>
          <div className="flex overflow-hidden rounded-md border border-zinc-300 dark:border-zinc-700">
            {(["prosa", "poesia"] as Modo[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => handleModo(m)}
                className={`px-4 py-1.5 text-sm font-medium transition-colors ${
                  modo === m
                    ? "bg-azul text-white dark:bg-azul-claro dark:text-negro"
                    : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                }`}
              >
                {m === "prosa" ? "Prosa" : "Poesía"}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: NUM_SELECTORES }).map((_, indice) => (
            <div key={indice} className="flex flex-col gap-1.5">
              <label htmlFor={`autor-${indice}`} className="text-sm font-medium">
                Autor {indice + 1}
                {indice > 0 && " (opcional)"}
              </label>
              <AuthorCombobox
                id={`autor-${indice}`}
                value={slugsSeleccionados[indice]}
                onChange={(slug) => handleSeleccion(indice, slug)}
                placeholder={indice === 0 ? "Selecciona un autor…" : "Ninguno"}
              />
            </div>
          ))}
        </div>

        {hayDuplicados && (
          <p className="text-sm text-red-600 dark:text-red-400">
            Selecciona autores distintos en cada campo.
          </p>
        )}

        <div className="flex gap-3">
          <Button variant="azul" onClick={() => handleAnalizar()} disabled={!puedeAnalizar}>
            Analizar
          </Button>
          <Button variant="secondary-azul" onClick={handleLimpiar}>
            Limpiar
          </Button>
        </div>

        {status === "loading" && (
          <LoaderAnalisis progreso={progreso} mensaje="Calculando la norma del corpus y las trayectorias…" />
        )}
      </div>

      {status === "error" && errorMessage && (
        <p className="text-sm text-red-600 dark:text-red-400">{errorMessage}</p>
      )}

      {status === "success" && data && (
        <>
          <div className="flex justify-end">
            <GuardarAnalisis
              tipo="innovacion"
              parametros={{
                autores: seleccionados.join(","),
                modo,
              }}
              titulo={`Deriva estilística: ${data.autores.map((a) => a.nombre).join(", ")}`}
            />
          </div>

          {data.norma.aviso_pocos_datos && (
            <p className="rounded-md border border-yellow-300 bg-yellow-50 px-4 py-3 text-sm text-yellow-800 dark:border-yellow-700 dark:bg-yellow-950 dark:text-yellow-200">
              {data.norma.aviso_pocos_datos}
            </p>
          )}

          {data.autores.some((autor) => autor.aviso_pocos_datos) && (
            <ul className="flex flex-col gap-1">
              {data.autores
                .filter((autor) => autor.aviso_pocos_datos)
                .map((autor) => (
                  <li
                    key={autor.slug}
                    className="rounded-md border border-yellow-300 bg-yellow-50 px-4 py-3 text-sm text-yellow-800 dark:border-yellow-700 dark:bg-yellow-950 dark:text-yellow-200"
                  >
                    {autor.aviso_pocos_datos}
                  </li>
                ))}
            </ul>
          )}

          {data.autores.every((autor) => autor.trayectoria.length === 0) ? (
            <p className="text-sm font-light text-zinc-500">
              No hay suficientes artículos con año conocido para calcular una
              trayectoria temporal.
            </p>
          ) : (
            <>
              <section>
                <div className="h-[36rem] w-full rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800">
                  <PlotlyChart
                    onClick={handleClickPunto}
                    data={data.autores.map((autor) => ({
                      type: "scatter" as const,
                      mode: "lines+markers" as const,
                      name: autor.nombre,
                      x: autor.trayectoria.map((p) => p.año),
                      y: autor.trayectoria.map((p) => p.distancia),
                      line: { color: autor.color, width: 3 },
                      marker: { color: autor.color, size: 9 },
                      hovertemplate: `${autor.nombre} · %{x}: distancia %{y:.2f}<extra></extra>`,
                    }))}
                    layout={{
                      title: {
                        text: modo === "poesia"
                          ? "Deriva estilística en poesía (z-score respecto a la norma)"
                          : "Deriva estilística en prosa (z-score respecto a la norma)",
                      },
                      margin: { l: 60, r: 30, t: 60, b: 50 },
                      xaxis: {
                        title: { text: "Año de publicación" },
                        dtick: 1,
                        tickformat: "d",
                      },
                      yaxis: {
                        title: { text: "Desviaciones típicas respecto a la norma (z-score)" },
                        zeroline: true,
                        zerolinecolor: "#D4D4D8",
                      },
                      shapes: [
                        {
                          type: "rect",
                          xref: "paper",
                          x0: 0,
                          x1: 1,
                          yref: "y",
                          y0: -1,
                          y1: 1,
                          fillcolor: "#F5F5F0",
                          line: { width: 0 },
                          layer: "below",
                        },
                        {
                          type: "line",
                          xref: "paper",
                          x0: 0,
                          x1: 1,
                          yref: "y",
                          y0: 2,
                          y1: 2,
                          line: { color: "#A1A1AA", dash: "dash", width: 1.5 },
                        },
                      ],
                      annotations: [
                        {
                          xref: "paper",
                          x: 0.01,
                          y: 1,
                          xanchor: "left",
                          yanchor: "bottom",
                          text: "Zona de norma (μ ± σ)",
                          showarrow: false,
                          font: { size: 11, color: "#71717A" },
                        },
                        {
                          xref: "paper",
                          x: 0.99,
                          y: 2,
                          xanchor: "right",
                          yanchor: "bottom",
                          text: "Umbral de singularidad (μ + 2σ)",
                          showarrow: false,
                          font: { size: 11, color: "#71717A" },
                        },
                      ],
                    }}
                  />
                </div>
                <p className="mt-2 text-xs font-light text-zinc-400 dark:text-zinc-500">
                  Norma del corpus ({data.norma.num_autores} autores,{" "}
                  {data.norma.num_articulos} textos): distancia media{" "}
                  μ = {data.norma.media.toFixed(3)}, σ = {data.norma.std.toFixed(3)}
                </p>
              </section>

              {puntoSeleccionado && (
                <section className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h3 className="text-sm font-medium">
                      <span
                        className="mr-1.5 inline-block h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: puntoSeleccionado.autor.color }}
                      />
                      {puntoSeleccionado.autor.nombre} · {puntoSeleccionado.año}
                      <span className="ml-2 font-light text-zinc-400">
                        ({puntoSeleccionado.articulos.length} texto{puntoSeleccionado.articulos.length !== 1 ? "s" : ""})
                      </span>
                    </h3>
                    <button
                      type="button"
                      onClick={() => setPuntoSeleccionado(null)}
                      className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                      aria-label="Cerrar panel"
                    >
                      ×
                    </button>
                  </div>
                  <ul className="flex flex-col divide-y divide-zinc-100 dark:divide-zinc-800">
                    {puntoSeleccionado.articulos.map((art) => (
                      <li key={art.slug} className="flex items-center justify-between gap-4 py-2 text-sm">
                        <span className="font-light text-zinc-700 dark:text-zinc-300">{art.titulo}</span>
                        <div className="flex shrink-0 gap-3">
                          <button
                            type="button"
                            onClick={() => handleLeerArticulo(art.slug, art.titulo)}
                            className="font-medium text-azul hover:underline dark:text-azul-claro"
                          >
                            Leer
                          </button>
                          <Link
                            href={`/articulos/${art.slug}`}
                            target="_blank"
                            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                            title="Abrir en nueva pestaña"
                          >
                            ↗
                          </Link>
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              <section>
                <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gris-claro text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
                      <tr>
                        <th className="px-4 py-2 font-medium">Autor</th>
                        <th className="px-4 py-2 font-medium">Artículos</th>
                        <th className="px-4 py-2 font-medium">
                          Z-score inicial
                        </th>
                        <th className="px-4 py-2 font-medium">Z-score final</th>
                        <th className="px-4 py-2 font-medium">Tendencia</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                      {data.autores.map((autor) => {
                        if (autor.trayectoria.length === 0) {
                          return (
                            <tr key={autor.slug}>
                              <td className="px-4 py-2 font-light">{autor.nombre}</td>
                              <td className="px-4 py-2 font-light">{autor.num_articulos}</td>
                              <td colSpan={3} className="px-4 py-2 font-light text-zinc-500">
                                Sin datos temporales suficientes
                              </td>
                            </tr>
                          );
                        }

                        const inicial = autor.trayectoria[0].distancia;
                        const final =
                          autor.trayectoria[autor.trayectoria.length - 1].distancia;
                        const tendencia = calcularTendencia(inicial, final);

                        return (
                          <tr key={autor.slug}>
                            <td className="px-4 py-2 font-light">{autor.nombre}</td>
                            <td className="px-4 py-2 font-light">{autor.num_articulos}</td>
                            <td className="px-4 py-2 font-light">{inicial.toFixed(2)}</td>
                            <td className="px-4 py-2 font-light">{final.toFixed(2)}</td>
                            <td
                              className="px-4 py-2 font-medium"
                              style={{ color: COLOR_TENDENCIA[tendencia] }}
                            >
                              {tendencia}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="flex flex-col gap-4 rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
                <div className="flex items-center justify-between gap-4">
                  <h3 className="font-titulo text-base font-semibold text-azul dark:text-azul-claro">
                    Descripción de resultados (IA)
                  </h3>
                  <Button
                    variant="azul"
                    onClick={handleInterpretar}
                    disabled={loadingInterpretacion}
                  >
                    {loadingInterpretacion ? "Generando…" : interpretacion ? "Regenerar" : "Describir resultados"}
                  </Button>
                </div>

                {(interpretacion !== null || loadingInterpretacion) && (
                  <p className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-light leading-relaxed text-amber-800 dark:border-amber-700/50 dark:bg-amber-950/40 dark:text-amber-300">
                    <strong className="font-medium">Aviso.</strong>{" "}
                    La información presentada ha sido generada por un modelo de inteligencia artificial generativa. Su finalidad es exclusivamente orientativa y no constituye un análisis definitivo ni una fuente académica o profesional. Aunque se ha procurado ofrecer información precisa y coherente, el contenido puede contener errores, imprecisiones o información no contrastada. Se recomienda verificar cualquier dato relevante mediante fuentes fiables.
                  </p>
                )}

                {errorInterpretacion && (
                  <p className="text-sm text-red-600 dark:text-red-400">{errorInterpretacion}</p>
                )}

                {loadingInterpretacion && (
                  <div className="flex items-center gap-2 text-sm font-light text-zinc-500">
                    <div className="h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                      <div className="h-full w-1/2 animate-pulse rounded-full bg-azul dark:bg-azul-claro" />
                    </div>
                    <span>Consultando OpenAI…</span>
                  </div>
                )}

                {interpretacion && (
                  <div className="border-l-4 border-azul/30 pl-4 text-sm font-light leading-relaxed text-zinc-700 dark:border-azul-claro/30 dark:text-zinc-300">
                    {interpretacion.split("\n\n").map((parrafo, i) => (
                      <p key={i} className={i > 0 ? "mt-4" : ""}>
                        {parrafo}
                      </p>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </>
      )}
    </div>

    {articuloModal && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-negro/60 p-4 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setArticuloModal(null); }}
        >
          <div className="relative my-10 w-full max-w-3xl rounded-xl bg-white shadow-2xl dark:bg-zinc-900">
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 rounded-t-xl border-b border-zinc-200 bg-white px-8 py-5 dark:border-zinc-800 dark:bg-zinc-900">
              <h2 className="font-titulo text-lg font-semibold leading-tight pr-4">
                {articuloModal.titulo}
              </h2>
              <button
                type="button"
                onClick={() => setArticuloModal(null)}
                className="shrink-0 text-2xl leading-none text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                aria-label="Cerrar"
              >
                ×
              </button>
            </div>

            <div className="px-8 py-6">
              {articuloModal.cargando && (
                <p className="text-sm font-light text-zinc-500">Cargando artículo…</p>
              )}
              {articuloModal.error && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  No se ha podido cargar el artículo.
                </p>
              )}
              {!articuloModal.html && !articuloModal.cargando && !articuloModal.error && (
                <p className="text-sm font-light text-zinc-500">
                  Este artículo no tiene texto disponible.
                </p>
              )}
              {articuloModal.html && (
                <div
                  className="article-body"
                  dangerouslySetInnerHTML={{ __html: articuloModal.html }}
                />
              )}
            </div>

            <div className="flex items-center justify-between border-t border-zinc-100 px-8 py-4 dark:border-zinc-800">
              <Link
                href={`/articulos/${articuloModal.slug}`}
                target="_blank"
                className="text-sm font-medium text-azul hover:underline dark:text-azul-claro"
              >
                Ver artículo completo ↗
              </Link>
              <button
                type="button"
                onClick={() => setArticuloModal(null)}
                className="text-sm text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
    )}
    </>
  );
}
