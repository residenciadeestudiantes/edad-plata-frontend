import { Suspense } from "react";
import type { Metadata } from "next";
import { PageTitle } from "@/components/PageTitle";
import { AnalisisClient } from "./AnalisisClient";

export const metadata: Metadata = {
  title: "Análisis de Corpus | Edad de Plata",
  description:
    "Busca concordancias de una palabra en todo el corpus de artículos de la hemeroteca: localiza cada ocurrencia con su contexto y consulta su distribución por revista y por autor. Una herramienta pensada para investigar el lenguaje y la literatura de la Edad de Plata.",
};

export default function AnalisisPage() {
  return (
    <div className="mx-auto w-full max-w-[1520px] flex flex-1 flex-col gap-10 px-10 py-12 sm:px-20">
      <header>
        <PageTitle color="azul">Análisis de Corpus</PageTitle>
        <p className="mt-2 max-w-3xl font-light text-zinc-600 dark:text-zinc-400">
          Busca concordancias de una palabra en todo el corpus de artículos de
          la hemeroteca: localiza cada ocurrencia con su contexto y consulta
          su distribución por revista y por autor. Una herramienta pensada
          para investigar el lenguaje y la literatura de la Edad de Plata.
        </p>
      </header>

      <Suspense fallback={null}>
        <AnalisisClient />
      </Suspense>
    </div>
  );
}
