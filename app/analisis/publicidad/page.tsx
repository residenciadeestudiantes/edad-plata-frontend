import type { Metadata } from "next";
import { PageTitle } from "@/components/PageTitle";
import { getPublications } from "@/lib/api";
import { PublicidadClient } from "./PublicidadClient";

export const metadata: Metadata = {
  title: "Análisis de Publicidad · Revistas de la Edad de Plata",
  description:
    "Qué se anuncia, qué tecnologías aparecen, cómo es el lenguaje publicitario en las revistas del corpus, y su relación con el lenguaje de las vanguardias literarias.",
};

// Evita que el build de producción necesite el backend arrancado y
// accesible (lo necesitaría para la generación estática con ISR); se
// renderiza en el servidor en cada petición en su lugar.
export const dynamic = "force-dynamic";

export default async function PublicidadPage() {
  const { data: publicaciones } = await getPublications(1, 200);
  const revistas = publicaciones.map((p) => ({ slug: p.slug, titulo: p.titulo }));

  return (
    <div className="flex flex-1 flex-col gap-10 px-6 py-12 sm:px-12">
      <header>
        <PageTitle color="azul">Análisis de Publicidad</PageTitle>
        <p className="mt-2 max-w-3xl font-light text-zinc-600 dark:text-zinc-400">
          Qué se anuncia, qué tecnologías aparecen y cómo es el lenguaje
          publicitario en las revistas del corpus, y su relación con el
          lenguaje de las vanguardias literarias que conviven en las mismas
          páginas.
        </p>
      </header>

      <PublicidadClient revistas={revistas} />
    </div>
  );
}
