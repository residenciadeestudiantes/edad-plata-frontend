"use client";

import { useEffect, useState } from "react";
import type { Layout } from "plotly.js";
import { Button } from "@/components/Button";
import { LoaderAnalisis } from "@/components/LoaderAnalisis";
import { MetodologiaCientifica } from "@/components/MetodologiaCientifica";
import { PlotlyChart } from "@/components/PlotlyChart";
import { NubePalabrasComparativa } from "@/components/NubePalabrasComparativa";
import { useProgresoSimulado } from "@/lib/useProgresoSimulado";
import {
  getPublicidadVanguardia,
  getPublicidadPublicaciones,
  type PublicidadVanguardiaResponse,
} from "@/lib/api";

type Status = "idle" | "loading" | "success" | "error";

interface RevistaOpcion {
  slug: string;
  titulo: string;
}

const ZONAS = [
  { max: 0.2, label: "muy similar", color: "#008867" },
  { max: 0.4, label: "similar", color: "#00EDB4" },
  { max: 0.6, label: "moderadamente distinto", color: "#F2C94C" },
  { max: 0.8, label: "distinto", color: "#FF7D45" },
  { max: 1.0, label: "muy distinto", color: "#DA3C00" },
] as const;

function zonaDeInterpretacion(interpretacion: string) {
  return ZONAS.find((z) => z.label === interpretacion) ?? ZONAS[ZONAS.length - 1];
}

export function VanguardiaTab({ revistas: _revistas }: { revistas: RevistaOpcion[] }) {
  const [revistaSlug, setRevistaSlug] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const progreso = useProgresoSimulado(status === "loading");
  const [data, setData] = useState<PublicidadVanguardiaResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [revistasConAnuncios, setRevistasConAnuncios] = useState<RevistaOpcion[]>([]);

  useEffect(() => {
    getPublicidadPublicaciones()
      .then((r) =>
        setRevistasConAnuncios(r.publicaciones.map((p) => ({ slug: p.slug, titulo: p.titulo })))
      )
      .catch(() => {});
  }, []);

  async function handleAnalizar() {
    setStatus("loading");
    setErrorMessage(null);

    try {
      const res = await getPublicidadVanguardia(revistaSlug || undefined);
      setData(res);
      setStatus("success");
    } catch (error) {
      console.error("Error al comparar anuncios y literatura", error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "No se ha podido completar el análisis. Inténtalo de nuevo más tarde."
      );
      setStatus("error");
    }
  }

  const zona = data ? zonaDeInterpretacion(data.interpretacion) : null;

  const palabrasUnion = data
    ? [
        ...data.palabras_caracteristicas.anuncios.map((p) => p.palabra),
        ...data.palabras_caracteristicas.literatura.map((p) => p.palabra),
      ]
    : [];

  const pesosAnuncios = data
    ? palabrasUnion.map(
        (palabra) =>
          data.palabras_caracteristicas.anuncios.find((p) => p.palabra === palabra)?.peso ?? 0
      )
    : [];

  const pesosLiteratura = data
    ? palabrasUnion.map(
        (palabra) =>
          data.palabras_caracteristicas.literatura.find((p) => p.palabra === palabra)?.peso ?? 0
      )
    : [];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4 border-l-4 border-azul pl-4">
        <p className="max-w-3xl font-light text-zinc-600 dark:text-zinc-400">
          ¿Adoptó la publicidad el léxico y los recursos retóricos de las
          vanguardias literarias que convivían en las mismas revistas?
          Compara el vocabulario de los anuncios contra el de los artículos
          literarios del mismo ámbito (toda la colección, una revista, o un
          número concreto).
        </p>

        <MetodologiaCientifica>
          <p>
            Se usa la misma distancia TF-IDF que el análisis estilométrico:
            cada corpus (anuncios y literatura) se representa como un vector
            de frecuencias de términos ponderadas por su relevancia, y se
            mide la distancia del coseno entre ambos vectores.
          </p>
        </MetodologiaCientifica>
      </div>

      <div className="flex flex-col gap-4 rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-negro">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex flex-1 flex-col gap-1.5">
            <label htmlFor="vanguardia-revista" className="text-sm font-medium">
              Revista (opcional)
            </label>
            <select
              id="vanguardia-revista"
              value={revistaSlug}
              onChange={(event) => setRevistaSlug(event.target.value)}
              className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            >
              <option value="">Toda la colección</option>
              {revistasConAnuncios.map((revista) => (
                <option key={revista.slug} value={revista.slug}>
                  {revista.titulo}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2">
            <Button variant="azul" onClick={handleAnalizar} disabled={status === "loading"}>
              Comparar
            </Button>
            {(status === "success" || status === "error") && (
              <Button
                variant="secondary"
                onClick={() => { setData(null); setStatus("idle"); setErrorMessage(null); }}
              >
                Limpiar
              </Button>
            )}
          </div>
        </div>
      </div>

      {status === "loading" && <LoaderAnalisis progreso={progreso} mensaje="Calculando…" />}

      {status === "error" && errorMessage && (
        <p className="text-sm text-red-600 dark:text-red-400">{errorMessage}</p>
      )}

      {status === "success" && data && zona && (
        <div className="flex flex-col gap-10">
          <section>
            <h2 className="mb-3 font-titulo text-lg font-semibold text-azul dark:text-azul-claro">
              Distancia entre anuncios y literatura
            </h2>
            <div className="flex flex-col items-center gap-2 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800">
              <div className="h-72 w-full max-w-md">
                <PlotlyChart
                  data={[
                    {
                      type: "indicator",
                      mode: "gauge+number",
                      value: data.distancia_coseno,
                      number: { valueformat: ".3f" },
                      gauge: {
                        axis: { range: [0, 1] },
                        bar: { color: zona.color },
                        steps: ZONAS.map((z, i) => ({
                          range: [i === 0 ? 0 : ZONAS[i - 1].max, z.max],
                          color: `${z.color}33`,
                        })),
                      },
                    },
                  ]}
                  layout={{ margin: { l: 30, r: 30, t: 30, b: 10 } }}
                />
              </div>
              <p className="text-lg font-bold uppercase tracking-wide" style={{ color: zona.color }}>
                {data.interpretacion}
              </p>
              <p className="max-w-md text-center text-sm font-light text-zinc-500 dark:text-zinc-400">
                0 = mismo vocabulario y estilo · 1 = vocabularios
                completamente diferenciados. Una distancia baja sugiere que
                la publicidad adoptó el léxico literario del entorno.
              </p>
            </div>
          </section>

          <section>
            <h2 className="mb-3 font-titulo text-lg font-semibold text-azul dark:text-azul-claro">
              Palabras características
            </h2>
            <div className="h-[32rem] w-full rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800">
              <PlotlyChart
                data={[
                  {
                    type: "bar",
                    orientation: "h",
                    name: "Anuncios",
                    x: pesosAnuncios,
                    y: palabrasUnion,
                    marker: { color: "#DA3C00" },
                  },
                  {
                    type: "bar",
                    orientation: "h",
                    name: "Literatura",
                    x: pesosLiteratura,
                    y: palabrasUnion,
                    marker: { color: "#3838BD" },
                  },
                ]}
                layout={{
                  barmode: "group",
                  showlegend: true,
                  yaxis: {
                    autorange: "reversed",
                    automargin: true,
                    // Separación entre la palabra y el inicio de las barras
                    // (no tipada en @types/plotly.js, pero sí soportada por
                    // la librería instalada).
                    ticklabelstandoff: 10,
                  } as Partial<Layout["yaxis"]>,
                  xaxis: { title: { text: "Peso TF-IDF" } },
                  margin: { l: 120, r: 20, t: 20, b: 40 },
                }}
              />
            </div>
          </section>

          <section>
            <h2 className="mb-3 font-titulo text-lg font-semibold text-azul dark:text-azul-claro">
              Nube de palabras comparativa
            </h2>
            <NubePalabrasComparativa
              nombreAutor1="Anuncios"
              nombreAutor2="Literatura"
              palabrasAutor1={data.nube_palabras.anuncios}
              palabrasAutor2={data.nube_palabras.literatura}
            />
          </section>

          <section>
            <h2 className="mb-3 font-titulo text-lg font-semibold text-azul dark:text-azul-claro">
              Resumen
            </h2>
            <p className="max-w-3xl font-light text-zinc-600 dark:text-zinc-400">
              Se han analizado {data.anuncios.num_articulos} anuncio
              {data.anuncios.num_articulos === 1 ? "" : "s"} frente a{" "}
              {data.literatura.num_articulos} artículo
              {data.literatura.num_articulos === 1 ? "" : "s"} literario
              {data.literatura.num_articulos === 1 ? "" : "s"}
              {revistaSlug ? " de la revista seleccionada." : " de toda la colección."}
            </p>
          </section>
        </div>
      )}
    </div>
  );
}
