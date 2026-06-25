import { Suspense } from "react";
import type { Metadata } from "next";
import { PageTitle } from "@/components/PageTitle";
import { BuscarClient } from "./BuscarClient";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; frase?: string }>;
}): Promise<Metadata> {
  const { q, frase } = await searchParams;
  const termino = q || frase;

  return {
    title: termino ? `Buscar "${termino}" | Edad de Plata` : "Buscador | Edad de Plata",
    description:
      "Busca artículos por título, autor, revista y rango de años, o localiza frases exactas en el texto completo de la hemeroteca digital de la Edad de Plata española.",
  };
}

export default function SearchPage() {
  return (
    <div className="flex flex-1 flex-col gap-10 px-6 py-12 sm:px-12">
      <header>
        <PageTitle>Buscador</PageTitle>
        <p className="mt-2 font-light text-zinc-600 dark:text-zinc-400">
          Dos formas de buscar en la hemeroteca: por título, autor y filtros,
          o una frase exacta en el texto completo de los artículos.
        </p>
      </header>

      <Suspense fallback={null}>
        <BuscarClient />
      </Suspense>
    </div>
  );
}
