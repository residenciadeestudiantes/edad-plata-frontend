"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/Button";
import { PlotlyChart } from "@/components/PlotlyChart";
import {
  getAuthors,
  getEstilometria,
  type Author,
  type EstilometriaResponse,
} from "@/lib/api";

type Status = "idle" | "loading" | "success" | "error";

// Las 5 zonas de la interpretación de la distancia de coseno, con su color y
// el texto exacto que devuelve el backend para poder casar por valor.
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

export function EstilometricoClient() {
  const [authors, setAuthors] = useState<Author[]>([]);
  const [autor1Slug, setAutor1Slug] = useState("");
  const [autor2Slug, setAutor2Slug] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<EstilometriaResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    getAuthors(1, 100)
      .then((res) => setAuthors(res.data))
      .catch(() => {});
  }, []);

  const authorsOrdenados = useMemo(
    () => [...authors].sort((a, b) => a.nombre.localeCompare(b.nombre, "es")),
    [authors]
  );

  const mismoAutor = autor1Slug !== "" && autor1Slug === autor2Slug;
  const seleccionIncompleta = autor1Slug === "" || autor2Slug === "";
  const puedeAnalizar = !seleccionIncompleta && !mismoAutor && status !== "loading";

  async function handleAnalizar() {
    if (!puedeAnalizar) return;

    setStatus("loading");
    setErrorMessage(null);

    try {
      const data = await getEstilometria(autor1Slug, autor2Slug);
      setResult(data);
      setStatus("success");
    } catch (error) {
      console.error("Error al calcular la distancia estilométrica", error);
      setErrorMessage(
        "No se ha podido completar el análisis. Inténtalo de nuevo más tarde."
      );
      setStatus("error");
    }
  }

  const zona = result ? zonaDeInterpretacion(result.interpretacion) : null;

  const palabrasUnion = result
    ? [
        ...result.palabras_caracteristicas.autor1.map((p) => p.palabra),
        ...result.palabras_caracteristicas.autor2.map((p) => p.palabra),
      ]
    : [];

  const pesosAutor1 = result
    ? palabrasUnion.map((palabra) => {
        const entry = result.palabras_caracteristicas.autor1.find(
          (p) => p.palabra === palabra
        );
        return entry?.peso ?? 0;
      })
    : [];

  const pesosAutor2 = result
    ? palabrasUnion.map((palabra) => {
        const entry = result.palabras_caracteristicas.autor2.find(
          (p) => p.palabra === palabra
        );
        return entry?.peso ?? 0;
      })
    : [];

  return (
    <div className="flex flex-col gap-8">
      <div className="border-l-4 border-teja pl-4">
        <p className="max-w-3xl font-light text-zinc-600 dark:text-zinc-400">
          El análisis estilométrico mide la distancia filológica entre dos
          autores comparando la frecuencia y distribución de sus términos más
          significativos mediante el algoritmo TF-IDF y la distancia del
          coseno. Un valor cercano a 0 indica que los autores comparten
          vocabulario y estilo; un valor cercano a 1 indica estilos muy
          diferenciados. Este análisis se basa en el corpus completo de
          artículos de cada autor disponible en la colección.
        </p>
      </div>

      <div className="flex flex-col gap-4 rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-negro">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex flex-1 flex-col gap-1.5">
            <label htmlFor="autor1" className="text-sm font-medium">
              Primer autor
            </label>
            <select
              id="autor1"
              value={autor1Slug}
              onChange={(event) => setAutor1Slug(event.target.value)}
              className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            >
              <option value="">Selecciona un autor…</option>
              {authorsOrdenados.map((author) => (
                <option key={author.slug} value={author.slug}>
                  {author.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-1 flex-col gap-1.5">
            <label htmlFor="autor2" className="text-sm font-medium">
              Segundo autor
            </label>
            <select
              id="autor2"
              value={autor2Slug}
              onChange={(event) => setAutor2Slug(event.target.value)}
              className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            >
              <option value="">Selecciona un autor…</option>
              {authorsOrdenados.map((author) => (
                <option key={author.slug} value={author.slug}>
                  {author.nombre}
                </option>
              ))}
            </select>
          </div>

          <Button variant="primary" onClick={handleAnalizar} disabled={!puedeAnalizar}>
            Analizar
          </Button>
        </div>

        {mismoAutor && (
          <p className="text-sm text-red-600 dark:text-red-400">
            Selecciona dos autores distintos
          </p>
        )}

        {status === "loading" && (
          <div className="flex flex-col items-center justify-center gap-3 py-6 text-center text-sm font-light text-zinc-500">
            <p>Calculando distancia estilométrica...</p>
            <div className="h-1.5 w-full max-w-md overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
              <div className="h-full w-1/3 animate-pulse rounded-full bg-teja dark:bg-teja-claro" />
            </div>
          </div>
        )}
      </div>

      {status === "error" && errorMessage && (
        <p className="text-sm text-red-600 dark:text-red-400">{errorMessage}</p>
      )}

      {status === "success" && result && zona && (
        <div className="flex flex-col gap-10">
          <section>
            <h2 className="mb-3 font-titulo text-lg font-semibold text-teja dark:text-teja-claro">
              Distancia estilométrica
            </h2>
            <div className="flex flex-col items-center gap-2 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800">
              <div className="h-72 w-full max-w-md">
                <PlotlyChart
                  data={[
                    {
                      type: "indicator",
                      mode: "gauge+number",
                      value: result.distancia_coseno,
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
              <p
                className="text-lg font-bold uppercase tracking-wide"
                style={{ color: zona.color }}
              >
                {result.interpretacion}
              </p>
              <p className="max-w-md text-center text-sm font-light text-zinc-500 dark:text-zinc-400">
                0 = mismo vocabulario y estilo · 1 = estilos completamente
                diferenciados
              </p>
            </div>
          </section>

          <section>
            <h2 className="mb-3 font-titulo text-lg font-semibold text-teja dark:text-teja-claro">
              Palabras características
            </h2>
            <div className="h-[32rem] w-full rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800">
              <PlotlyChart
                data={[
                  {
                    type: "bar",
                    orientation: "h",
                    name: result.autor1.nombre,
                    x: pesosAutor1,
                    y: palabrasUnion,
                    marker: { color: "#DA3C00" },
                  },
                  {
                    type: "bar",
                    orientation: "h",
                    name: result.autor2.nombre,
                    x: pesosAutor2,
                    y: palabrasUnion,
                    marker: { color: "#3838BD" },
                  },
                ]}
                layout={{
                  barmode: "group",
                  showlegend: true,
                  yaxis: { autorange: "reversed" },
                  xaxis: { title: { text: "Peso TF-IDF" } },
                  margin: { l: 120, r: 20, t: 20, b: 40 },
                }}
              />
            </div>
          </section>

          <section>
            <h2 className="mb-3 font-titulo text-lg font-semibold text-teja dark:text-teja-claro">
              Resumen
            </h2>
            <p className="max-w-3xl font-light text-zinc-600 dark:text-zinc-400">
              Se han analizado {result.autor1.num_articulos} artículo
              {result.autor1.num_articulos === 1 ? "" : "s"} de{" "}
              <span className="font-medium text-negro dark:text-blanco">
                {result.autor1.nombre}
              </span>{" "}
              y {result.autor2.num_articulos} artículo
              {result.autor2.num_articulos === 1 ? "" : "s"} de{" "}
              <span className="font-medium text-negro dark:text-blanco">
                {result.autor2.nombre}
              </span>
              .
            </p>
            <p className="mt-2 max-w-3xl font-light text-zinc-600 dark:text-zinc-400">
              La distancia de coseno entre el vocabulario de{" "}
              <span className="font-medium text-negro dark:text-blanco">
                {result.autor1.nombre}
              </span>{" "}
              y{" "}
              <span className="font-medium text-negro dark:text-blanco">
                {result.autor2.nombre}
              </span>{" "}
              es de{" "}
              <span className="font-medium text-teja dark:text-teja-claro">
                {result.distancia_coseno.toFixed(3)}
              </span>{" "}
              (similitud de coseno:{" "}
              {result.similitud_coseno.toFixed(3)}), lo que se interpreta como
              un estilo{" "}
              <span className="font-medium" style={{ color: zona.color }}>
                {result.interpretacion}
              </span>{" "}
              entre ambos autores.
            </p>
          </section>
        </div>
      )}
    </div>
  );
}
