import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { PageTitle } from "@/components/PageTitle";
import { getIssueByNumeroOrden } from "@/lib/api";
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

  return (
    <div className="flex flex-1 flex-col px-6 py-12 sm:px-12">
      <header className="mb-10">
        <p className="text-sm font-light text-zinc-500 dark:text-zinc-400">
          <Link href={`/revistas/${slug}`} className="hover:underline">
            {issue.publication?.titulo}
          </Link>
          {" · "}
          <Link href={`/revistas/${slug}/numeros`} className="hover:underline">
            Números
          </Link>
        </p>
        <PageTitle>{issue.titulo ?? `Número ${issue.numero_orden}`}</PageTitle>
      </header>

      <ArticleFilters articles={articles} />
    </div>
  );
}
