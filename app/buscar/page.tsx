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
          La <strong className="font-medium">búsqueda rápida</strong> permite localizar artículos por
          título, autor, revista y rango de años. Para ir más lejos, la{" "}
          <strong className="font-medium">búsqueda avanzada</strong> ofrece dos modos: la búsqueda
          exacta rastrea frases literales en el texto completo de los artículos y admite combinar hasta
          tres términos con operadores Y, O y NO; también permite buscar en pies de imagen. La búsqueda
          semántica encuentra artículos por significado aunque no contengan las palabras exactas de la
          consulta. Para investigación filológica, la sección de{" "}
          <strong className="font-medium">análisis</strong> incluye un buscador con{" "}
          <strong className="font-medium">expansión morfológica</strong> que agrupa conjugaciones,
          plurales y variantes de una misma raíz.
        </p>
      </header>

      <Suspense fallback={null}>
        <BuscarClient />
      </Suspense>
    </div>
  );
}
