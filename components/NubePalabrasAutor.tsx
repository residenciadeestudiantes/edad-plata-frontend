"use client";

import { useEffect, useState } from "react";
import {
  getNubePalabrasAutor,
  type NubePalabrasAutorRevista,
  type PalabraFrecuencia,
} from "@/lib/api";
import { COLORES_NUBE_AZUL, NubeIndividual, NubePalabrasComparativa } from "./NubePalabrasComparativa";

type Status = "idle" | "loading" | "success" | "error";

interface RevistaOpcion {
  slug: string;
  titulo: string;
}

interface NubePalabrasAutorProps {
  autorSlug: string;
  autorNombre: string;
  revistas: RevistaOpcion[];
}

export function NubePalabrasAutor({ autorSlug, autorNombre, revistas }: NubePalabrasAutorProps) {
  const [status, setStatus] = useState<Status>("idle");
  const [corpusCompleto, setCorpusCompleto] = useState<PalabraFrecuencia[] | null>(null);
  const [revistaSlug, setRevistaSlug] = useState("");
  const [revistaSeleccionada, setRevistaSeleccionada] = useState<NubePalabrasAutorRevista | null>(
    null
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [anchoVentana, setAnchoVentana] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth : 1024
  );

  useEffect(() => {
    function handleResize() {
      setAnchoVentana(window.innerWidth);
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const esMovil = anchoVentana < 640;
  const width = esMovil ? 320 : 600;
  const height = esMovil ? 240 : 320;

  async function handleMostrarNube() {
    setStatus("loading");
    setErrorMessage(null);

    try {
      const data = await getNubePalabrasAutor(autorSlug);
      setCorpusCompleto(data.corpus_completo);
      setStatus("success");
    } catch (error) {
      console.error("Error al calcular la nube de palabras del autor", error);
      setErrorMessage("No se ha podido calcular la nube de palabras. Inténtalo de nuevo más tarde.");
      setStatus("error");
    }
  }

  async function handleSeleccionarRevista(slug: string) {
    setRevistaSlug(slug);

    if (!slug) {
      setRevistaSeleccionada(null);
      return;
    }

    setStatus("loading");
    setErrorMessage(null);

    try {
      const data = await getNubePalabrasAutor(autorSlug, slug);
      setCorpusCompleto(data.corpus_completo);
      setRevistaSeleccionada(data.revista);
      setStatus("success");
    } catch (error) {
      console.error("Error al calcular la nube de palabras de la revista", error);
      setErrorMessage("No se ha podido calcular la nube de palabras. Inténtalo de nuevo más tarde.");
      setStatus("error");
    }
  }

  if (status === "idle") {
    return (
      <button
        type="button"
        onClick={handleMostrarNube}
        className="inline-flex w-fit items-center gap-2 text-sm font-medium text-azul transition-colors hover:underline dark:text-azul-claro"
      >
        <span aria-hidden="true">☁</span>
        Mostrar nube de palabras del corpus
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {status === "loading" && (
        <div className="flex flex-col items-center justify-center gap-3 py-6 text-center text-sm font-light text-zinc-500">
          <p>Calculando nube de palabras...</p>
          <div className="h-1.5 w-full max-w-md overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
            <div className="h-full w-1/3 animate-pulse rounded-full bg-azul dark:bg-azul-claro" />
          </div>
        </div>
      )}

      {status === "error" && errorMessage && (
        <p className="text-sm text-red-600 dark:text-red-400">{errorMessage}</p>
      )}

      {status === "success" && corpusCompleto && (
        <>
          <p className="max-w-3xl text-sm font-light text-zinc-600 dark:text-zinc-400">
            {revistaSeleccionada ? (
              <>
                Comparando todo el corpus de{" "}
                <span className="font-medium text-negro dark:text-blanco">{autorNombre}</span>{" "}
                con sus{" "}
                {revistaSeleccionada.num_articulos} artículo
                {revistaSeleccionada.num_articulos === 1 ? "" : "s"} en{" "}
                <span className="font-medium text-negro dark:text-blanco">
                  {revistaSeleccionada.titulo}
                </span>
                .
              </>
            ) : (
              <>
                Mostrando las palabras más frecuentes de todo el corpus de{" "}
                <span className="font-medium text-negro dark:text-blanco">{autorNombre}</span>.
                Selecciona una revista para comparar.
              </>
            )}
          </p>

          {revistas.length > 0 && (
            <div className="flex flex-col gap-1.5 sm:w-64">
              <label htmlFor="revista-nube" className="text-sm font-medium">
                Comparar con una revista
              </label>
              <select
                id="revista-nube"
                value={revistaSlug}
                onChange={(event) => handleSeleccionarRevista(event.target.value)}
                className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              >
                <option value="">Todo el corpus (sin comparar)</option>
                {revistas.map((revista) => (
                  <option key={revista.slug} value={revista.slug}>
                    {revista.titulo}
                  </option>
                ))}
              </select>
            </div>
          )}

          {revistaSeleccionada ? (
            <NubePalabrasComparativa
              nombreAutor1="Todo el corpus"
              nombreAutor2={revistaSeleccionada.titulo}
              palabrasAutor1={corpusCompleto}
              palabrasAutor2={revistaSeleccionada.palabras}
            />
          ) : (
            <div className="flex flex-col items-center gap-2 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800">
              <NubeIndividual
                nombre="Todo el corpus"
                palabras={corpusCompleto}
                colores={COLORES_NUBE_AZUL}
                width={width}
                height={height}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
