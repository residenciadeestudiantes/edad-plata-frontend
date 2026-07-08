import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PageTitle } from "@/components/PageTitle";
import { getPage } from "@/lib/api";
import { BlocksRenderer } from "@/lib/blocks";

const SLUG = "que-es-la-edad-de-plata";

// Evita que el build de producción necesite el backend arrancado y
// accesible (lo necesitaría para la generación estática con ISR); se
// renderiza en el servidor en cada petición en su lugar.
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPage(SLUG);

  if (!page) {
    return { title: "Página no encontrada | Edad de Plata" };
  }

  return {
    title: `${page.titulo} | Edad de Plata`,
    description: "Qué es la Edad de Plata española.",
  };
}

export default async function QueEsLaEdadDePlataPage() {
  const page = await getPage(SLUG);

  if (!page) {
    notFound();
  }

  return (
    <div className="mx-auto w-full max-w-[1520px] flex flex-1 flex-col gap-6 px-10 py-12 sm:px-20">
      <PageTitle>{page.titulo}</PageTitle>
      {page.contenido && (
        <div className="max-w-3xl font-light text-zinc-700 dark:text-zinc-300">
          <BlocksRenderer content={page.contenido} />
        </div>
      )}
    </div>
  );
}
