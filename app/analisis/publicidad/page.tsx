import { Suspense } from "react";
import type { Metadata } from "next";
import { PageTitle } from "@/components/PageTitle";
import { getPublications } from "@/lib/api";
import { PublicidadClient } from "./PublicidadClient";

export const metadata: Metadata = {
  title: "Análisis de Publicidad · Revistas de la Edad de Plata",
  description:
    "Analiza qué se anuncia en las revistas del corpus, qué tecnologías aparecen y el lenguaje publicitario empleado en ellas, estudiando además su relación con el lenguaje de las vanguardias literarias que conviven en las mismas páginas.",
};

// Evita que el build de producción necesite el backend arrancado y
// accesible (lo necesitaría para la generación estática con ISR); se
// renderiza en el servidor en cada petición en su lugar.
export const dynamic = "force-dynamic";

export default async function PublicidadPage() {
  const { data: publicaciones } = await getPublications(1, 200);
  const revistas = publicaciones.map((p) => ({ slug: p.slug, titulo: p.titulo }));

  return (
    <div className="mx-auto w-full max-w-[1520px] flex flex-1 flex-col gap-10 px-10 py-12 sm:px-20">
      <header>
        <PageTitle color="azul">Análisis de Publicidad</PageTitle>
        <p className="mt-2 max-w-3xl font-light text-zinc-600 dark:text-zinc-400">
          Analiza qué se anuncia en las revistas del corpus, qué tecnologías
          aparecen y el lenguaje publicitario empleado en ellas, estudiando
          además su relación con el lenguaje de las vanguardias literarias
          que conviven en las mismas páginas.
        </p>
      </header>

      <Suspense fallback={null}>
        <PublicidadClient revistas={revistas} />
      </Suspense>
    </div>
  );
}
