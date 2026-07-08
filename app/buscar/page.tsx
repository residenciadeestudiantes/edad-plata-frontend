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
    <div className="mx-auto w-full max-w-[1520px] flex flex-1 flex-col gap-10 px-10 py-12 sm:px-20">
      <header>
        <PageTitle>Buscador</PageTitle>
        <div className="mt-2 flex flex-col gap-2 font-light text-zinc-600 dark:text-zinc-400">
          <p>
            Tienes a tu disposición dos tipos de búsqueda. La{" "}
            <strong className="font-medium">búsqueda rápida</strong> permite localizar artículos por
            título, autor y otros metadatos. La{" "}
            <strong className="font-medium">búsqueda avanzada</strong> ofrece mayores posibilidades:
            puedes buscar frases literales en el texto completo, combinar términos mediante operadores
            lógicos para refinar los resultados o utilizar la{" "}
            <strong className="font-medium">búsqueda semántica</strong>, que recupera artículos por su
            significado, aunque no contengan exactamente las mismas palabras.
          </p>
          <p>
            Además, la sección de{" "}
            <strong className="font-medium">Análisis</strong> incorpora un buscador con{" "}
            <strong className="font-medium">expansión morfológica</strong>, capaz de agrupar
            automáticamente conjugaciones, plurales y variantes derivadas de una misma raíz léxica, lo
            que facilita una recuperación más completa de la información.
          </p>
        </div>
      </header>

      <Suspense fallback={null}>
        <BuscarClient />
      </Suspense>
    </div>
  );
}
