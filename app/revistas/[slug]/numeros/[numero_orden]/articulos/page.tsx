import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { PageTitle } from "@/components/PageTitle";
import { getIssueByNumeroOrden, getStrapiMediaUrl } from "@/lib/api";
import { ArticleFilters } from "./ArticleFilters";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; numero_orden: string }>;
}): Promise<Metadata> {
  const { slug, numero_orden } = await params;
  const issue = await getIssueByNumeroOrden(slug, Number(numero_orden));

  if (!issue) {
    return { title: "Número no encontrado | Edad de Plata" };
  }

  const titulo = issue.titulo ?? `Número ${issue.numero_orden}`;

  return {
    title: `Índice de artículos · ${titulo} | Edad de Plata`,
    description: `Artículos publicados en ${titulo} de ${issue.publication?.titulo ?? ""}.`,
  };
}

export default async function IssueArticlesPage({
  params,
}: {
  params: Promise<{ slug: string; numero_orden: string }>;
}) {
  const { slug, numero_orden } = await params;
  const issue = await getIssueByNumeroOrden(slug, Number(numero_orden));

  if (!issue) {
    notFound();
  }

  const articles = issue.articles ?? [];
  const portadaUrl = getStrapiMediaUrl(issue.imagen_portada?.url);

  return (
    <div className="flex flex-1 flex-col px-6 py-12 sm:px-12">
      <header className="mb-10 flex items-start gap-6">
        {portadaUrl && (
          <div className="relative aspect-[3/4] w-24 shrink-0 overflow-hidden rounded shadow-sm bg-gris-claro dark:bg-zinc-900">
            <Image
              src={portadaUrl}
              alt={issue.titulo ?? `Número ${issue.numero_orden}`}
              fill
              sizes="96px"
              className="object-cover"
            />
          </div>
        )}
        <div>
          <p className="font-titulo text-xl font-semibold text-zinc-600 dark:text-zinc-400 sm:text-2xl">
            <Link href={`/revistas/${slug}`} className="hover:underline">
              {issue.publication?.titulo}
            </Link>
            {" · "}
            <Link href={`/revistas/${slug}/numeros`} className="hover:underline text-base font-normal sm:text-lg">
              Números
            </Link>
          </p>
          <PageTitle>{issue.titulo ?? `Número ${issue.numero_orden}`}</PageTitle>
        </div>
      </header>

      <ArticleFilters articles={articles} />
    </div>
  );
}
