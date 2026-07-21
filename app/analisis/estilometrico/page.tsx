import { Suspense } from "react";
import type { Metadata } from "next";
import { PageTitle } from "@/components/PageTitle";
import { EstilometricoClient } from "./EstilometricoClient";

export const metadata: Metadata = {
  title: "Análisis Estilométrico · Revistas de la Edad de Plata",
  description:
    "Compara el vocabulario de dos autores y señala qué palabras distinguen más su estilo. Una herramienta pensada para investigar el estilo y el lenguaje literario de la Edad de Plata.",
};

export default function EstilometricoPage() {
  return (
    <div className="mx-auto w-full max-w-[1520px] flex flex-1 flex-col gap-10 px-10 py-12 sm:px-20">
      <header>
        <PageTitle color="azul">Análisis Estilométrico</PageTitle>
        <p className="mt-2 max-w-3xl font-light text-zinc-600 dark:text-zinc-400">
          Compara el vocabulario de dos autores y señala qué palabras
          distinguen más su estilo. Una herramienta pensada para investigar
          el estilo y el lenguaje literario de la Edad de Plata.
        </p>
      </header>

      <Suspense fallback={null}>
        <EstilometricoClient />
      </Suspense>
    </div>
  );
}
