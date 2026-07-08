import type { Metadata } from "next";
import { PageTitle } from "@/components/PageTitle";
import { EstilometricoClient } from "./EstilometricoClient";

export const metadata: Metadata = {
  title: "Análisis Estilométrico · Revistas de la Edad de Plata",
  description:
    "Compara el vocabulario característico de dos autores del corpus mediante TF-IDF y distancia de coseno, e identifica las palabras que distinguen su estilo.",
};

export default function EstilometricoPage() {
  return (
    <div className="mx-auto w-full max-w-[1520px] flex flex-1 flex-col gap-10 px-10 py-12 sm:px-20">
      <header>
        <PageTitle color="azul">Análisis Estilométrico</PageTitle>
        <p className="mt-2 max-w-3xl font-light text-zinc-600 dark:text-zinc-400">
          Compara el vocabulario característico de dos autores del corpus
          mediante TF-IDF y distancia de coseno, e identifica las palabras
          que distinguen su estilo.
        </p>
      </header>

      <EstilometricoClient />
    </div>
  );
}
