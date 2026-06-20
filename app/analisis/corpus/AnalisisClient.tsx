"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Badge } from "@/components/Badge";
import { BotonDescargaCsv } from "@/components/BotonDescargaCsv";
import { Button } from "@/components/Button";
import { PlotlyChart } from "@/components/PlotlyChart";
import {
  arrayToCsv,
  downloadCsv,
  fechaActualParaArchivo,
  slugificarParaArchivo,
} from "@/lib/exportCsv";
import {
  getAuthors,
  getConcordancias,
  getPublications,
  type Author,
  type ConcordanciasResponse,
  type Publication,
} from "@/lib/api";

type Status = "idle" | "loading" | "success" | "error";
type Scope = "corpus" | "autor" | "revista" | "año";

const BRAND_COLORS = ["#DA3C00", "#3838BD", "#008867", "#DD158B"];
const TOP_AUTORES_CON_ETIQUETA = 10;

// Quita las marcas diacríticas (tildes, diéresis) tras normalizar en NFD,
// igual que hace el backend, para poder localizar la palabra buscada dentro
// del fragmento ya recibido y envolverla en <mark> sin depender de mayúsculas
// ni tildes.
function stripDiacritics(text: string): string {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function highlightFragment(fragmento: string, palabra: string) {
  const normalizedWord = stripDiacritics(palabra.trim()).toLowerCase();
  if (!normalizedWord) return fragmento;

  const normalizedFragment = stripDiacritics(fragmento).toLowerCase();
  const escaped = escapeRegExp(normalizedWord);
  const regex = new RegExp(`\\b${escaped}\\b`, "g");

  const matches = [...normalizedFragment.matchAll(regex)];
  if (matches.length === 0) return fragmento;

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;

  matches.forEach((match, i) => {
    const index = match.index ?? 0;
    const end = index + match[0].length;
    parts.push(fragmento.slice(lastIndex, index));
    parts.push(
      <mark
        key={i}
        className="rounded bg-magenta/20 px-0.5 text-negro dark:bg-magenta-claro/30 dark:text-blanco"
      >
        {fragmento.slice(index, end)}
      </mark>
    );
    lastIndex = end;
  });

  parts.push(fragmento.slice(lastIndex));
  return parts;
}

export function AnalisisClient() {
  const [palabra, setPalabra] = useState("");
  const [scope, setScope] = useState<Scope>("corpus");
  const [autorSlug, setAutorSlug] = useState("");
  const [revistaSlug, setRevistaSlug] = useState("");
  const [año, setAño] = useState("");

  const [authors, setAuthors] = useState<Author[]>([]);
  const [publications, setPublications] = useState<Publication[]>([]);

  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<ConcordanciasResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [mostrarGraficos, setMostrarGraficos] = useState(false);

  useEffect(() => {
    getAuthors(1, 100).then((res) => setAuthors(res.data)).catch(() => {});
    getPublications(1, 100).then((res) => setPublications(res.data)).catch(() => {});
  }, []);

  const scopeReady =
    scope === "corpus" ||
    (scope === "autor" && autorSlug !== "") ||
    (scope === "revista" && revistaSlug !== "") ||
    (scope === "año" && /^\d{3,4}$/.test(año));

  async function handleAnalizar() {
    const trimmed = palabra.trim();
    if (!trimmed || !scopeReady) return;

    setStatus("loading");
    setErrorMessage(null);

    try {
      const data = await getConcordancias(trimmed, {
        autor: scope === "autor" ? autorSlug : undefined,
        revista: scope === "revista" ? revistaSlug : undefined,
        año: scope === "año" ? Number(año) : undefined,
      });
      setResult(data);
      setStatus("success");
    } catch (error) {
      console.error("Error al analizar la palabra", error);
      setErrorMessage(
        "No se ha podido completar el análisis. Inténtalo de nuevo más tarde."
      );
      setStatus("error");
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      handleAnalizar();
    }
  }

  const porRevista = result
    ? [...result.porRevista].sort((a, b) => b.ocurrencias - a.ocurrencias)
    : [];
  const porAutor = result
    ? [...result.porAutor].sort((a, b) => b.ocurrencias - a.ocurrencias)
    : [];
  const porAño = result
    ? [...result.porAño].sort((a, b) => b.ocurrencias - a.ocurrencias)
    : [];

  function handleDescargarResumen() {
    if (!result) return;

    const bloqueRevista = arrayToCsv(
      ["Término buscado", "Revista", "Ocurrencias", "Artículos con el término"],
      porRevista.map((entry) => [
        result.palabra,
        entry.revista,
        entry.ocurrencias,
        entry.articulos,
      ])
    );

    const bloqueAutor = arrayToCsv(
      ["Término buscado", "Autor", "Ocurrencias", "Artículos con el término"],
      porAutor.map((entry) => [
        result.palabra,
        entry.autor,
        entry.ocurrencias,
        entry.articulos,
      ])
    );

    const csv = `${bloqueRevista}\n\n${bloqueAutor}`;
    const fecha = fechaActualParaArchivo();
    downloadCsv(`resumen_${slugificarParaArchivo(result.palabra)}_${fecha}.csv`, csv);
  }

  function handleDescargarConcordancias() {
    if (!result) return;

    const csv = arrayToCsv(
      [
        "Término",
        "Título artículo",
        "Autor",
        "Revista",
        "Número",
        "Año",
        "Fragmento de contexto",
      ],
      result.concordancias.map((concordancia) => [
        result.palabra,
        concordancia.articuloTitulo,
        concordancia.autores.join(", "),
        concordancia.revista,
        concordancia.numeroOrden ?? "",
        concordancia.año ?? "",
        concordancia.fragmento,
      ])
    );

    const fecha = fechaActualParaArchivo();
    downloadCsv(
      `concordancias_${slugificarParaArchivo(result.palabra)}_${fecha}.csv`,
      csv
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4 rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-negro">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="palabra" className="text-sm font-medium">
            Palabra a analizar
          </label>
          <input
            id="palabra"
            type="text"
            value={palabra}
            onChange={(event) => setPalabra(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ej. poesía, vanguardia, jondo…"
            className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="scope" className="text-sm font-medium">
            Ámbito de la búsqueda
          </label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <select
              id="scope"
              value={scope}
              onChange={(event) => setScope(event.target.value as Scope)}
              className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            >
              <option value="corpus">Todo el corpus</option>
              <option value="autor">Un autor</option>
              <option value="revista">Una revista</option>
              <option value="año">Un año</option>
            </select>

            {scope === "autor" && (
              <select
                value={autorSlug}
                onChange={(event) => setAutorSlug(event.target.value)}
                className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              >
                <option value="">Selecciona un autor…</option>
                {authors.map((author) => (
                  <option key={author.slug} value={author.slug}>
                    {author.nombre}
                  </option>
                ))}
              </select>
            )}

            {scope === "revista" && (
              <select
                value={revistaSlug}
                onChange={(event) => setRevistaSlug(event.target.value)}
                className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              >
                <option value="">Selecciona una revista…</option>
                {publications.map((publication) => (
                  <option key={publication.slug} value={publication.slug}>
                    {publication.titulo}
                  </option>
                ))}
              </select>
            )}

            {scope === "año" && (
              <input
                type="number"
                value={año}
                onChange={(event) => setAño(event.target.value)}
                placeholder="Ej. 1927"
                className="w-32 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              />
            )}

            <Button
              variant="primary"
              onClick={handleAnalizar}
              disabled={status === "loading" || palabra.trim().length === 0 || !scopeReady}
            >
              Analizar
            </Button>
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            checked={mostrarGraficos}
            onChange={(event) => setMostrarGraficos(event.target.checked)}
            className="h-4 w-4 accent-teja"
          />
          Mostrar gráficos
        </label>

        {status === "loading" && (
          <div className="flex flex-col items-center justify-center gap-3 py-6 text-center text-sm font-light text-zinc-500">
            <p>Analizando el corpus…</p>
            <div className="h-1.5 w-full max-w-md overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
              <div className="h-full w-1/3 animate-pulse rounded-full bg-teja dark:bg-teja-claro" />
            </div>
          </div>
        )}
      </div>

      {status === "error" && errorMessage && (
        <p className="text-sm text-red-600 dark:text-red-400">{errorMessage}</p>
      )}

      {status === "success" && result && (
        <>
          {result.totalOcurrencias === 0 ? (
            <p className="text-zinc-500">
              No se han encontrado ocurrencias de “{result.palabra}” en el
              corpus.
            </p>
          ) : (
            <div className="flex flex-col gap-10">
              <div className="flex justify-end gap-3">
                <BotonDescargaCsv
                  onDescargar={handleDescargarResumen}
                  etiqueta="Descargar resumen CSV"
                />
                <BotonDescargaCsv
                  onDescargar={handleDescargarConcordancias}
                  etiqueta="Descargar concordancias CSV"
                />
              </div>

              <section>
                <p className="text-sm font-light text-zinc-600 dark:text-zinc-400">
                  Se han encontrado{" "}
                  <span className="font-medium text-teja dark:text-teja-claro">
                    {result.totalOcurrencias}
                  </span>{" "}
                  ocurrencia{result.totalOcurrencias === 1 ? "" : "s"} de “
                  {result.palabra}” en{" "}
                  <span className="font-medium text-teja dark:text-teja-claro">
                    {result.totalArticulos}
                  </span>{" "}
                  artículo{result.totalArticulos === 1 ? "" : "s"}.
                </p>
              </section>

              <section>
                <h2 className="mb-3 font-titulo text-lg font-semibold text-teja dark:text-teja-claro">
                  Por revista
                </h2>
                <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gris-claro text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
                      <tr>
                        <th className="px-4 py-2 font-medium">Revista</th>
                        <th className="px-4 py-2 font-medium">Ocurrencias</th>
                        <th className="px-4 py-2 font-medium">Artículos</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                      {porRevista.map((entry) => (
                        <tr key={entry.slug}>
                          <td className="px-4 py-2 font-light">{entry.revista}</td>
                          <td className="px-4 py-2 font-light">{entry.ocurrencias}</td>
                          <td className="px-4 py-2 font-light">{entry.articulos}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <section>
                <h2 className="mb-3 font-titulo text-lg font-semibold text-teja dark:text-teja-claro">
                  Por autor
                </h2>
                <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gris-claro text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
                      <tr>
                        <th className="px-4 py-2 font-medium">Autor</th>
                        <th className="px-4 py-2 font-medium">Ocurrencias</th>
                        <th className="px-4 py-2 font-medium">Artículos</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                      {porAutor.map((entry) => (
                        <tr key={entry.slug}>
                          <td className="px-4 py-2 font-light">{entry.autor}</td>
                          <td className="px-4 py-2 font-light">{entry.ocurrencias}</td>
                          <td className="px-4 py-2 font-light">{entry.articulos}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <section>
                <h2 className="mb-3 font-titulo text-lg font-semibold text-teja dark:text-teja-claro">
                  Por año
                </h2>
                <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gris-claro text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
                      <tr>
                        <th className="px-4 py-2 font-medium">Año</th>
                        <th className="px-4 py-2 font-medium">Ocurrencias</th>
                        <th className="px-4 py-2 font-medium">Artículos</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                      {porAño.map((entry) => (
                        <tr key={entry.año}>
                          <td className="px-4 py-2 font-light">{entry.año}</td>
                          <td className="px-4 py-2 font-light">{entry.ocurrencias}</td>
                          <td className="px-4 py-2 font-light">{entry.articulos}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <section>
                <h2 className="mb-3 font-titulo text-lg font-semibold text-teja dark:text-teja-claro">
                  Concordancias
                </h2>
                <ol className="flex flex-col divide-y divide-zinc-200 dark:divide-zinc-800">
                  {result.concordancias.map((concordancia, i) => (
                    <li key={i} className="flex flex-col gap-1 py-4">
                      <p className="text-sm leading-relaxed">
                        {concordancia.enTitulo ? (
                          <>
                            <Badge color="azul" className="mr-2">
                              En el título
                            </Badge>
                            {highlightFragment(concordancia.fragmento, result.palabra)}
                          </>
                        ) : (
                          <>
                            “…{highlightFragment(concordancia.fragmento, result.palabra)}…”
                          </>
                        )}
                      </p>
                      <p className="text-sm font-light text-zinc-500 dark:text-zinc-400">
                        <Link
                          href={`/articulos/${concordancia.articuloSlug}`}
                          className="font-medium hover:text-teja dark:hover:text-teja-claro"
                        >
                          {concordancia.articuloTitulo}
                        </Link>
                        {concordancia.autores.length > 0 &&
                          ` · ${concordancia.autores.join(", ")}`}
                        {` · ${concordancia.revista}`}
                        {concordancia.numeroOrden !== null &&
                          ` · Nº ${concordancia.numeroOrden}`}
                        {concordancia.año !== null && ` · ${concordancia.año}`}
                      </p>
                    </li>
                  ))}
                </ol>
              </section>

              {mostrarGraficos && (
              <>
              <section>
                <h2 className="mb-3 font-titulo text-lg font-semibold text-teja dark:text-teja-claro">
                  Evolución temporal del término
                </h2>
                {result.por_año.length === 0 ? (
                  <p className="text-sm font-light text-zinc-500">
                    No hay datos temporales suficientes para este término.
                  </p>
                ) : (
                  <div className="h-96 w-full rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800">
                    <PlotlyChart
                      data={[
                        {
                          type: "scatter",
                          mode: "lines+markers",
                          x: result.por_año.map((entry) => entry.año),
                          y: result.por_año.map((entry) => entry.ocurrencias),
                          line: { color: "#DA3C00" },
                          marker: { color: "#DA3C00", size: 8 },
                          hovertemplate: "Año %{x}: %{y} ocurrencias<extra></extra>",
                        },
                      ]}
                      layout={{
                        xaxis: { title: { text: "Año" }, showgrid: false, dtick: 1 },
                        yaxis: { title: { text: "Ocurrencias" }, gridcolor: "#F5F5F0" },
                      }}
                    />
                  </div>
                )}
              </section>

              <section>
                <h2 className="mb-3 font-titulo text-lg font-semibold text-teja dark:text-teja-claro">
                  Presencia por autor
                </h2>
                {result.por_autor_burbuja.length < 2 ? (
                  <p className="text-sm font-light text-zinc-500">
                    No hay suficientes datos de autoría para este término.
                  </p>
                ) : (
                  <div className="h-96 w-full rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800">
                    {(() => {
                      const burbujas = result.por_autor_burbuja;
                      const maxOcurrencias = Math.max(...burbujas.map((b) => b.ocurrencias));
                      const desiredMaxDiameter = 60;
                      const sizeref = (2 * maxOcurrencias) / desiredMaxDiameter ** 2;

                      return (
                        <PlotlyChart
                          data={[
                            {
                              type: "scatter",
                              mode: "text+markers",
                              x: burbujas.map((b) => b.num_articulos),
                              y: burbujas.map((b) => b.ocurrencias),
                              text: burbujas.map((b, i) =>
                                i < TOP_AUTORES_CON_ETIQUETA ? b.autor : ""
                              ),
                              textposition: "top center",
                              hovertext: burbujas.map(
                                (b) =>
                                  `${b.autor}<br>${b.ocurrencias} ocurrencias<br>${b.num_articulos} artículo${b.num_articulos === 1 ? "" : "s"}`
                              ),
                              hovertemplate: "%{hovertext}<extra></extra>",
                              marker: {
                                size: burbujas.map((b) => b.ocurrencias),
                                sizeref,
                                sizemode: "area",
                                color: burbujas.map(
                                  (_, i) => BRAND_COLORS[i % BRAND_COLORS.length]
                                ),
                              },
                            },
                          ]}
                          layout={{
                            xaxis: { title: { text: "Artículos" }, showgrid: false },
                            yaxis: { title: { text: "Ocurrencias" }, gridcolor: "#F5F5F0" },
                          }}
                        />
                      );
                    })()}
                  </div>
                )}
              </section>
              </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
