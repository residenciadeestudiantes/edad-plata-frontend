import { Suspense } from "react";
import type { Metadata } from "next";
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
    <div className="mx-auto w-full max-w-[1520px] flex flex-1 flex-col gap-10 px-10 py-12 sm:px-20">
      <Suspense fallback={null}>
        <BuscarClient />
      </Suspense>
    </div>
  );
}
