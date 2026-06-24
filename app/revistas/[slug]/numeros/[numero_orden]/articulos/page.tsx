import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { Badge } from "@/components/Badge";
import { PageTitle } from "@/components/PageTitle";
import { getIssueByNumeroOrden } from "@/lib/api";
import { IdiomaFilter } from "./IdiomaFilter";

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
  searchParams,
}: {
  params: Promise<{ slug: string; numero_orden: string }>;
  searchParams: Promise<{ idioma?: string }>;
}) {
  const { slug, numero_orden } = await params;
  const { idioma } = await searchParams;
  const issue = await getIssueByNumeroOrden(slug, Number(numero_orden));

  if (!issue) {
    notFound();
  }

  const allArticles = issue.articles ?? [];
  const idiomas = Array.from(
    new Set(allArticles.map((article) => article.idioma).filter((value): value is string => Boolean(value)))
  ).sort();

  const articles = idioma && idiomas.includes(idioma)
    ? allArticles.filter((article) => article.idioma === idioma)
    : allArticles;

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

      {idiomas.length > 1 && (
        <div className="mb-6">
          <IdiomaFilter
            basePath={`/revistas/${slug}/numeros/${numero_orden}/articulos`}
            currentIdioma={idiomas.includes(idioma ?? "") ? (idioma ?? "") : ""}
            idiomas={idiomas}
          />
        </div>
      )}

      {articles.length === 0 ? (
        <p className="text-zinc-500">
          {allArticles.length === 0
            ? "No se han encontrado artículos."
            : "No hay artículos en este idioma."}
        </p>
      ) : (
        <ol className="flex flex-col divide-y divide-zinc-200 dark:divide-zinc-800">
          {articles.map((article) => {
            const authors = article.authors ?? [];

            return (
              <li key={article.id} className="flex flex-col gap-1 py-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/articulos/${article.slug}`}
                    className="font-medium hover:text-teja dark:hover:text-teja-claro"
                  >
                    {article.titulo}
                  </Link>
                  {article.es_anuncio && <Badge color="magenta">Anuncio</Badge>}
                </div>
                {authors.length > 0 && (
                  <p className="text-sm font-light text-zinc-500 dark:text-zinc-400">
                    {authors.map((author, i) => (
                      <span key={author.id}>
                        <Link
                          href={`/autores/${author.slug}`}
                          className="hover:underline"
                        >
                          {author.nombre}
                        </Link>
                        {i < authors.length - 1 && ", "}
                      </span>
                    ))}
                  </p>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
