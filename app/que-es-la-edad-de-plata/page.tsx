import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PageTitle } from "@/components/PageTitle";
import { getPage } from "@/lib/api";
import { BlocksRenderer } from "@/lib/blocks";

const SLUG = "que-es-la-edad-de-plata";

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
    <div className="flex flex-1 flex-col gap-6 px-6 py-12 sm:px-12">
      <PageTitle>{page.titulo}</PageTitle>
      {page.contenido && (
        <div className="max-w-3xl font-light text-zinc-700 dark:text-zinc-300">
          <BlocksRenderer content={page.contenido} />
        </div>
      )}
    </div>
  );
}
