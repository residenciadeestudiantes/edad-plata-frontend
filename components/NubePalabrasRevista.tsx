"use client";

import { useEffect, useState } from "react";
import {
  getNubePalabrasRevista,
  type NubePalabrasRevista as NubePalabrasRevistaData,
  type PalabraFrecuencia,
} from "@/lib/api";
import { COLORES_NUBE_AZUL, NubeIndividual, NubePalabrasComparativa } from "./NubePalabrasComparativa";

type Status = "idle" | "loading" | "success" | "error";

interface RevistaOpcion {
  slug: string;
  titulo: string;
}

interface NubePalabrasRevistaProps {
  revistaSlug: string;
  revistaTitulo: string;
  otrasRevistas: RevistaOpcion[];
}

export function NubePalabrasRevista({ revistaSlug, revistaTitulo, otrasRevistas }: NubePalabrasRevistaProps) {
  const [status, setStatus] = useState<Status>("idle");
  const [palabras, setPalabras] = useState<PalabraFrecuencia[] | null>(null);
  const [compararSlug, setCompararSlug] = useState("");
  const [revistaComparada, setRevistaComparada] = useState<NubePalabrasRevistaData | null>(null);
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
      const data = await getNubePalabrasRevista(revistaSlug);
      setPalabras(data.revista.palabras);
      setStatus("success");
    } catch (error) {
      console.error("Error al calcular la nube de palabras de la revista", error);
      setErrorMessage("No se ha podido calcular la nube de palabras. Inténtalo de nuevo más tarde.");
      setStatus("error");
    }
  }

  async function handleSeleccionarRevista(slug: string) {
    setCompararSlug(slug);

    if (!slug) {
      setRevistaComparada(null);
      return;
    }

    setStatus("loading");
    setErrorMessage(null);

    try {
      const data = await getNubePalabrasRevista(revistaSlug, slug);
      setPalabras(data.revista.palabras);
      setRevistaComparada(data.comparar);
      setStatus("success");
    } catch (error) {
      console.error("Error al calcular la nube de palabras comparada", error);
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
        Mostrar nube de palabras de la revista
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

      {status === "success" && palabras && (
        <>
          <p className="max-w-3xl text-sm font-light text-zinc-600 dark:text-zinc-400">
            {revistaComparada ? (
              <>
                Comparando todo el contenido de{" "}
                <span className="font-medium text-negro dark:text-blanco">{revistaTitulo}</span> con{" "}
                <span className="font-medium text-negro dark:text-blanco">{revistaComparada.titulo}</span>{" "}
                ({revistaComparada.num_articulos} artículo
                {revistaComparada.num_articulos === 1 ? "" : "s"}).
              </>
            ) : (
              <>
                Mostrando las palabras más frecuentes de todo el contenido de{" "}
                <span className="font-medium text-negro dark:text-blanco">{revistaTitulo}</span>. Selecciona
                otra revista para comparar.
              </>
            )}
          </p>

          {otrasRevistas.length > 0 && (
            <div className="flex flex-col gap-1.5 sm:w-64">
              <label htmlFor="revista-comparar-nube" className="text-sm font-medium">
                Comparar con otra revista
              </label>
              <select
                id="revista-comparar-nube"
                value={compararSlug}
                onChange={(event) => handleSeleccionarRevista(event.target.value)}
                className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              >
                <option value="">Sin comparar</option>
                {otrasRevistas.map((revista) => (
                  <option key={revista.slug} value={revista.slug}>
                    {revista.titulo}
                  </option>
                ))}
              </select>
            </div>
          )}

          {revistaComparada ? (
            <NubePalabrasComparativa
              nombreAutor1={revistaTitulo}
              nombreAutor2={revistaComparada.titulo}
              palabrasAutor1={palabras}
              palabrasAutor2={revistaComparada.palabras}
            />
          ) : (
            <div className="flex flex-col items-center gap-2 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800">
              <NubeIndividual
                nombre={revistaTitulo}
                palabras={palabras}
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
