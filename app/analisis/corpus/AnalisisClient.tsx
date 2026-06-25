"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AuthorCombobox } from "@/components/AuthorCombobox";
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
  buscarMorfologica,
  getConcordancias,
  getPublications,
  type BusquedaTextoResponse,
  type ConcordanciasResponse,
  type Publication,
} from "@/lib/api";

type Status = "idle" | "loading" | "success" | "error";
type Scope = "corpus" | "autor" | "revista" | "año";
type Pestaña = "concordancias" | "morfologica";

const BRAND_COLORS = ["#DA3C00", "#3838BD", "#008867", "#DD158B"];

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

// Para los fragmentos de la búsqueda morfológica, que llegan del backend con
// las coincidencias ya marcadas entre **asteriscos** (a diferencia de
// concordancias, que no las marca y se resaltan en highlightFragment a
// partir de la palabra buscada).
function highlightFragmentoMarcado(fragmento: string) {
  const parts = fragmento.split(/\*\*(.+?)\*\*/g);
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <mark
        key={i}
        className="rounded bg-magenta/20 px-0.5 text-negro dark:bg-magenta-claro/30 dark:text-blanco"
      >
        {part}
      </mark>
    ) : (
      part
    )
  );
}

export function AnalisisClient() {
  const [pestaña, setPestaña] = useState<Pestaña>("concordancias");

  const [palabra, setPalabra] = useState("");
  const [scope, setScope] = useState<Scope>("corpus");
  const [autorSlug, setAutorSlug] = useState("");
  const [revistaSlug, setRevistaSlug] = useState("");
  const [año, setAño] = useState("");

  const [publications, setPublications] = useState<Publication[]>([]);

  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<ConcordanciasResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [mostrarGraficos, setMostrarGraficos] = useState(false);

  // --- Búsqueda con expansión morfológica ---
  const [palabraMorfo, setPalabraMorfo] = useState("");
  const [palabra2Morfo, setPalabra2Morfo] = useState("");
  const [distanciaMorfo, setDistanciaMorfo] = useState("");
  const [revistaSlugMorfo, setRevistaSlugMorfo] = useState("");
  const [autorSlugMorfo, setAutorSlugMorfo] = useState("");
  const [añoDesdeMorfo, setAñoDesdeMorfo] = useState("");
  const [añoHastaMorfo, setAñoHastaMorfo] = useState("");
  const [ambitoTituloAutorMorfo, setAmbitoTituloAutorMorfo] = useState(true);
  const [ambitoTextoMorfo, setAmbitoTextoMorfo] = useState(true);

  const [statusMorfo, setStatusMorfo] = useState<Status>("idle");
  const [resultMorfo, setResultMorfo] = useState<BusquedaTextoResponse | null>(null);
  const [errorMorfo, setErrorMorfo] = useState<string | null>(null);
  // Palabra(s) realmente enviadas en la última búsqueda (para el resumen de
  // resultados, que no debe cambiar si el usuario sigue escribiendo después).
  const [consultaMorfo, setConsultaMorfo] = useState<{ palabra: string; palabra2: string | null } | null>(
    null
  );

  useEffect(() => {
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

  function handleLimpiarConcordancias() {
    setPalabra("");
    setScope("corpus");
    setAutorSlug("");
    setRevistaSlug("");
    setAño("");
    setMostrarGraficos(false);
    setStatus("idle");
    setResult(null);
    setErrorMessage(null);
  }

  // Si se rellena `palabra2Morfo`, en vez de ocurrencias sueltas de
  // `palabraMorfo` se busca su proximidad con `palabra2Morfo` (requiere
  // también `distanciaMorfo`); en ese modo no se aplica el ámbito
  // título/autor, que no es prosa continua.
  const usaProximidadMorfo = palabra2Morfo.trim().length >= 3;
  const distanciaValidaMorfo = /^\d+$/.test(distanciaMorfo.trim());
  const puedeAnalizarMorfo =
    palabraMorfo.trim().length >= 3 &&
    (!usaProximidadMorfo || distanciaValidaMorfo) &&
    (usaProximidadMorfo || ambitoTituloAutorMorfo || ambitoTextoMorfo) &&
    statusMorfo !== "loading";

  async function handleAnalizarMorfologica() {
    const trimmed = palabraMorfo.trim();
    if (!puedeAnalizarMorfo || !trimmed) return;

    const trimmed2 = palabra2Morfo.trim();

    setStatusMorfo("loading");
    setErrorMorfo(null);
    setConsultaMorfo({ palabra: trimmed, palabra2: usaProximidadMorfo ? trimmed2 : null });

    try {
      const data = await buscarMorfologica(trimmed, 1, 100, {
        publicationSlug: revistaSlugMorfo || undefined,
        authorSlug: autorSlugMorfo || undefined,
        yearFrom: añoDesdeMorfo ? Number(añoDesdeMorfo) : undefined,
        yearTo: añoHastaMorfo ? Number(añoHastaMorfo) : undefined,
        enTituloAutor: ambitoTituloAutorMorfo,
        enTexto: ambitoTextoMorfo,
        palabra2: usaProximidadMorfo ? trimmed2 : undefined,
        distancia: usaProximidadMorfo ? Number(distanciaMorfo) : undefined,
      });
      setResultMorfo(data);
      setStatusMorfo("success");
    } catch (error) {
      console.error("Error en la búsqueda morfológica", error);
      setErrorMorfo(
        error instanceof Error ? error.message : "No se ha podido completar la búsqueda."
      );
      setStatusMorfo("error");
    }
  }

  function handleKeyDownMorfo(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      handleAnalizarMorfologica();
    }
  }

  function handleLimpiarMorfologica() {
    setPalabraMorfo("");
    setPalabra2Morfo("");
    setDistanciaMorfo("");
    setRevistaSlugMorfo("");
    setAutorSlugMorfo("");
    setAñoDesdeMorfo("");
    setAñoHastaMorfo("");
    setAmbitoTituloAutorMorfo(true);
    setAmbitoTextoMorfo(true);
    setStatusMorfo("idle");
    setResultMorfo(null);
    setErrorMorfo(null);
    setConsultaMorfo(null);
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
      <div
        role="tablist"
        aria-label="Herramienta de análisis"
        className="flex gap-6 border-b border-zinc-200 dark:border-zinc-800"
      >
        <button
          type="button"
          role="tab"
          aria-selected={pestaña === "concordancias"}
          onClick={() => setPestaña("concordancias")}
          className={`border-b-2 px-1 py-2 font-titulo text-lg font-semibold transition-colors ${
            pestaña === "concordancias"
              ? "border-azul text-azul dark:border-azul-claro dark:text-azul-claro"
              : "border-transparent text-zinc-500 hover:text-azul dark:text-zinc-400 dark:hover:text-azul-claro"
          }`}
        >
          Concordancias
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={pestaña === "morfologica"}
          onClick={() => setPestaña("morfologica")}
          className={`border-b-2 px-1 py-2 font-titulo text-lg font-semibold transition-colors ${
            pestaña === "morfologica"
              ? "border-azul text-azul dark:border-azul-claro dark:text-azul-claro"
              : "border-transparent text-zinc-500 hover:text-azul dark:text-zinc-400 dark:hover:text-azul-claro"
          }`}
        >
          Búsqueda con expansión morfológica
        </button>
      </div>

      {pestaña === "concordancias" && (
      <>
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
              <AuthorCombobox
                id="autor-concordancias"
                value={autorSlug}
                onChange={(slug) => setAutorSlug(slug)}
              />
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
              variant="azul"
              onClick={handleAnalizar}
              disabled={status === "loading" || palabra.trim().length === 0 || !scopeReady}
            >
              Analizar
            </Button>
            <Button variant="secondary-azul" onClick={handleLimpiarConcordancias}>
              Limpiar
            </Button>
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            checked={mostrarGraficos}
            onChange={(event) => setMostrarGraficos(event.target.checked)}
            className="h-4 w-4 accent-azul"
          />
          Mostrar gráficos
        </label>

        {status === "loading" && (
          <div className="flex flex-col items-center justify-center gap-3 py-6 text-center text-sm font-light text-zinc-500">
            <p>Analizando el corpus…</p>
            <div className="h-1.5 w-full max-w-md overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
              <div className="h-full w-1/3 animate-pulse rounded-full bg-azul dark:bg-azul-claro" />
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
                  <span className="font-medium text-azul dark:text-azul-claro">
                    {result.totalOcurrencias}
                  </span>{" "}
                  ocurrencia{result.totalOcurrencias === 1 ? "" : "s"} de “
                  {result.palabra}” en{" "}
                  <span className="font-medium text-azul dark:text-azul-claro">
                    {result.totalArticulos}
                  </span>{" "}
                  artículo{result.totalArticulos === 1 ? "" : "s"}.
                </p>
              </section>

              <section>
                <h2 className="mb-3 font-titulo text-lg font-semibold text-azul dark:text-azul-claro">
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
                <h2 className="mb-3 font-titulo text-lg font-semibold text-azul dark:text-azul-claro">
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
                <h2 className="mb-3 font-titulo text-lg font-semibold text-azul dark:text-azul-claro">
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
                <h2 className="mb-3 font-titulo text-lg font-semibold text-azul dark:text-azul-claro">
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
                          className="font-medium hover:text-azul dark:hover:text-azul-claro"
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
                <h2 className="mb-3 font-titulo text-lg font-semibold text-azul dark:text-azul-claro">
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
                <h2 className="mb-3 font-titulo text-lg font-semibold text-azul dark:text-azul-claro">
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
                              mode: "markers",
                              x: burbujas.map((_, i) => i),
                              y: burbujas.map(() => 1),
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
                            showlegend: false,
                            xaxis: {
                              visible: false,
                              showgrid: false,
                              zeroline: false,
                              showticklabels: false,
                              range: [-0.5, burbujas.length - 0.5],
                            },
                            yaxis: {
                              visible: false,
                              showgrid: false,
                              zeroline: false,
                              showticklabels: false,
                              range: [0.5, 1.5],
                            },
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
      </>
      )}

      {pestaña === "morfologica" && (
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-4 rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-negro">
            <p className="border-l-4 border-azul bg-gris-claro px-4 py-3 text-sm font-light text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
              <strong className="font-medium">Qué es la expansión morfológica:</strong>{" "}
              al escribir una palabra, el sistema busca también automáticamente
              sus variantes morfológicas (conjugaciones verbales, plurales…).
              Por ejemplo, si escribes “cantar”, también encuentra “canto”,
              “cantó”, “cantaba”, “cantando”, “cantado”, “cantará” o “cante”.
              Sin expansión morfológica, si buscas “cantar” y el texto dice
              “cantaba”, no lo encontrarías; con expansión, sí.
            </p>
            <p className="text-sm font-light text-zinc-500 dark:text-zinc-400">
              Esta técnica reconoce variantes de conjugación y número de una
              misma palabra, pero no relaciona palabras de la misma familia
              con terminaciones distintas (por ejemplo, “libre” y “libertad”),
              para lo que haría falta un diccionario de sinónimos aparte. Por
              el mismo motivo, en ocasiones puede agrupar también palabras
              distintas que comparten una raíz parecida.
            </p>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="palabraMorfo" className="text-sm font-medium">
                Palabra
              </label>
              <input
                id="palabraMorfo"
                type="text"
                value={palabraMorfo}
                onChange={(event) => setPalabraMorfo(event.target.value)}
                onKeyDown={handleKeyDownMorfo}
                placeholder="Ej. cantar, vanguardia…"
                className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium">
                Buscar también por proximidad con otra palabra (opcional)
              </span>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <input
                  type="text"
                  value={palabra2Morfo}
                  onChange={(event) => setPalabra2Morfo(event.target.value)}
                  onKeyDown={handleKeyDownMorfo}
                  placeholder="Segunda palabra…"
                  className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                />
                <div className="flex items-center gap-2 whitespace-nowrap text-sm font-light text-zinc-600 dark:text-zinc-400">
                  <label htmlFor="distanciaMorfo">a un máximo de</label>
                  <input
                    id="distanciaMorfo"
                    type="number"
                    min={0}
                    value={distanciaMorfo}
                    onChange={(event) => setDistanciaMorfo(event.target.value)}
                    onKeyDown={handleKeyDownMorfo}
                    placeholder="5"
                    className="w-20 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                  />
                  <span>palabras de separación</span>
                </div>
              </div>
              {usaProximidadMorfo && (
                <p className="text-sm font-light text-zinc-500 dark:text-zinc-400">
                  La búsqueda de proximidad solo se aplica al cuerpo del
                  artículo (no al título ni a los autores).
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="revistaMorfo" className="text-sm font-medium">
                  Revista
                </label>
                <select
                  id="revistaMorfo"
                  value={revistaSlugMorfo}
                  onChange={(event) => setRevistaSlugMorfo(event.target.value)}
                  className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                >
                  <option value="">Todas las revistas</option>
                  {publications.map((publication) => (
                    <option key={publication.slug} value={publication.slug}>
                      {publication.titulo}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="autorMorfo" className="text-sm font-medium">
                  Autor
                </label>
                <AuthorCombobox
                  id="autorMorfo"
                  value={autorSlugMorfo}
                  onChange={(slug) => setAutorSlugMorfo(slug)}
                  placeholder="Todos los autores"
                />
              </div>
            </div>

            {!usaProximidadMorfo && (
              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium">¿Dónde buscar?</span>

                <label className="flex items-start gap-2 text-sm font-light text-zinc-700 dark:text-zinc-300">
                  <input
                    type="checkbox"
                    checked={ambitoTituloAutorMorfo}
                    onChange={(event) => setAmbitoTituloAutorMorfo(event.target.checked)}
                    className="mt-0.5 h-4 w-4 accent-azul"
                  />
                  Buscar en el título y autor
                </label>

                <label className="flex items-start gap-2 text-sm font-light text-zinc-700 dark:text-zinc-300">
                  <input
                    type="checkbox"
                    checked={ambitoTextoMorfo}
                    onChange={(event) => setAmbitoTextoMorfo(event.target.checked)}
                    className="mt-0.5 h-4 w-4 accent-azul"
                  />
                  Buscar en los textos de los artículos
                </label>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 sm:max-w-xs">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="añoDesdeMorfo" className="text-sm font-medium">
                  Año desde
                </label>
                <input
                  id="añoDesdeMorfo"
                  type="number"
                  value={añoDesdeMorfo}
                  onChange={(event) => setAñoDesdeMorfo(event.target.value)}
                  placeholder="1900"
                  className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="añoHastaMorfo" className="text-sm font-medium">
                  Año hasta
                </label>
                <input
                  id="añoHastaMorfo"
                  type="number"
                  value={añoHastaMorfo}
                  onChange={(event) => setAñoHastaMorfo(event.target.value)}
                  placeholder="1936"
                  className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="azul" onClick={handleAnalizarMorfologica} disabled={!puedeAnalizarMorfo}>
                Buscar
              </Button>
              <Button variant="secondary-azul" onClick={handleLimpiarMorfologica}>
                Limpiar
              </Button>
            </div>

            {statusMorfo === "loading" && (
              <div className="flex flex-col items-center justify-center gap-3 py-6 text-center text-sm font-light text-zinc-500">
                <p>Analizando el corpus…</p>
                <div className="h-1.5 w-full max-w-md overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                  <div className="h-full w-1/3 animate-pulse rounded-full bg-azul dark:bg-azul-claro" />
                </div>
              </div>
            )}
          </div>

          {statusMorfo === "error" && errorMorfo && (
            <p className="text-sm text-red-600 dark:text-red-400">{errorMorfo}</p>
          )}

          {statusMorfo === "success" && resultMorfo && consultaMorfo && (
            <section>
              {resultMorfo.data.length === 0 ? (
                <p className="text-zinc-500">No se han encontrado resultados.</p>
              ) : (
                <>
                  <p className="mb-4 text-sm font-light text-zinc-600 dark:text-zinc-400">
                    Se han encontrado{" "}
                    <span className="font-medium text-azul dark:text-azul-claro">
                      {resultMorfo.meta.total}
                    </span>{" "}
                    artículo{resultMorfo.meta.total === 1 ? "" : "s"}
                    {consultaMorfo.palabra2
                      ? ` donde “${consultaMorfo.palabra}” aparece a un máximo de ${distanciaMorfo} palabras de “${consultaMorfo.palabra2}”.`
                      : ` con variantes de “${consultaMorfo.palabra}”.`}
                  </p>
                  <ol className="flex flex-col divide-y divide-zinc-200 dark:divide-zinc-800">
                    {resultMorfo.data.map((item) => (
                      <li key={item.id} className="flex flex-col gap-1 py-4">
                        <Link
                          href={`/articulos/${item.slug}`}
                          className="font-medium hover:text-azul dark:hover:text-azul-claro"
                        >
                          {item.titulo}
                        </Link>
                        <p className="text-sm font-light text-zinc-500 dark:text-zinc-400">
                          {item.autores.length > 0 && item.autores.join(", ")}
                          {item.autores.length > 0 && " · "}
                          {item.revista}
                          {item.numero_orden !== null && ` · Nº ${item.numero_orden}`}
                          {item.año !== null && ` · ${item.año}`}
                        </p>
                        <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                          {highlightFragmentoMarcado(item.fragmento)}
                        </p>
                      </li>
                    ))}
                  </ol>
                </>
              )}
            </section>
          )}
        </div>
      )}
    </div>
  );
}
