import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getIssueByNumeroOrden } from "@/lib/api";

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
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          <Link href={`/revistas/${slug}`} className="hover:underline">
            {issue.publication?.titulo}
          </Link>
          {" · "}
          <Link href={`/revistas/${slug}/numeros`} className="hover:underline">
            Números
          </Link>
        </p>
        <h1 className="text-3xl font-bold tracking-tight">
          {issue.titulo ?? `Número ${issue.numero_orden}`}
        </h1>
      </header>

      {articles.length === 0 ? (
        <p className="text-zinc-500">No se han encontrado artículos.</p>
      ) : (
        <ol className="flex flex-col divide-y divide-zinc-200 dark:divide-zinc-800">
          {articles.map((article) => {
            const authors = article.authors ?? [];

            return (
              <li key={article.id} className="flex flex-col gap-1 py-4">
                <Link
                  href={`/articulos/${article.slug}`}
                  className="font-medium hover:underline"
                >
                  {article.titulo}
                </Link>
                {authors.length > 0 && (
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
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
