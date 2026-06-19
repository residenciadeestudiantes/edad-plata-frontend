import Link from "next/link";
import type { Metadata } from "next";
import { getAuthors, getPublications, searchArticles } from "@/lib/api";
import { SearchForm } from "./SearchForm";

const PAGE_SIZE = 20;

const MESES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

type SearchParams = {
  q?: string;
  publicacion?: string;
  autor?: string;
  desde?: string;
  hasta?: string;
  page?: string;
};

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}): Promise<Metadata> {
  const { q } = await searchParams;

  return {
    title: q ? `Buscar "${q}" | Edad de Plata` : "Buscador | Edad de Plata",
    description:
      "Busca artículos por título, autor, revista y rango de años en la hemeroteca digital de la Edad de Plata española.",
  };
}

function buildSearchUrl(params: SearchParams, page: number): string {
  const query = new URLSearchParams();
  if (params.q) query.set("q", params.q);
  if (params.publicacion) query.set("publicacion", params.publicacion);
  if (params.autor) query.set("autor", params.autor);
  if (params.desde) query.set("desde", params.desde);
  if (params.hasta) query.set("hasta", params.hasta);
  query.set("page", String(page));
  return `/buscar?${query.toString()}`;
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const yearFrom = params.desde ? Number(params.desde) : undefined;
  const yearTo = params.hasta ? Number(params.hasta) : undefined;

  const hasFilters = Boolean(
    params.q || params.publicacion || params.autor || params.desde || params.hasta
  );

  const [{ data: publications }, { data: authors }] = await Promise.all([
    getPublications(1, 100),
    getAuthors(1, 500),
  ]);

  const results = hasFilters
    ? await searchArticles({
        query: params.q,
        publicationSlug: params.publicacion,
        authorSlug: params.autor,
        yearFrom: Number.isFinite(yearFrom) ? yearFrom : undefined,
        yearTo: Number.isFinite(yearTo) ? yearTo : undefined,
        page,
        pageSize: PAGE_SIZE,
      })
    : null;

  const articles = results?.data ?? [];
  const pageCount = results?.meta.pagination.pageCount ?? 0;

  return (
    <div className="flex flex-1 flex-col gap-10 px-6 py-12 sm:px-12">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Buscador</h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Busca artículos por título, autor, revista y rango de años.
        </p>
      </header>

      <SearchForm
        query={params.q ?? ""}
        publicationSlug={params.publicacion ?? ""}
        authorSlug={params.autor ?? ""}
        yearFrom={params.desde ?? ""}
        yearTo={params.hasta ?? ""}
        publications={publications.map((p) => ({ slug: p.slug, titulo: p.titulo }))}
        authors={authors.map((a) => ({ slug: a.slug, nombre: a.nombre }))}
      />

      <section>
        {!hasFilters ? (
          <p className="text-zinc-500">
            Introduce un término de búsqueda o selecciona algún filtro para
            empezar.
          </p>
        ) : articles.length === 0 ? (
          <p className="text-zinc-500">No se han encontrado resultados.</p>
        ) : (
          <>
            <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
              {results?.meta.pagination.total} resultado
              {results?.meta.pagination.total === 1 ? "" : "s"}
            </p>
            <ol className="flex flex-col divide-y divide-zinc-200 dark:divide-zinc-800">
              {articles.map((article) => {
                const authorsList = article.authors ?? [];
                const issue = article.issue;
                const publication = issue?.publication;
                const fecha = [issue?.mes ? MESES[issue.mes - 1] : null, issue?.año]
                  .filter(Boolean)
                  .join(" de ");

                return (
                  <li key={article.id} className="flex flex-col gap-1 py-4">
                    <Link
                      href={`/articulos/${article.slug}`}
                      className="font-medium hover:underline"
                    >
                      {article.titulo}
                    </Link>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      {authorsList.length > 0 &&
                        authorsList.map((author, i) => (
                          <span key={author.id}>
                            {author.nombre}
                            {i < authorsList.length - 1 && ", "}
                          </span>
                        ))}
                      {authorsList.length > 0 && publication && " · "}
                      {publication && publication.titulo}
                      {issue?.numero_orden !== null &&
                        issue?.numero_orden !== undefined &&
                        ` · Nº ${issue.numero_orden}`}
                      {fecha && ` · ${fecha}`}
                    </p>
                  </li>
                );
              })}
            </ol>

            {pageCount > 1 && (
              <nav
                className="mt-10 flex items-center justify-center gap-4"
                aria-label="Paginación"
              >
                <Link
                  href={buildSearchUrl(params, Math.max(1, page - 1))}
                  aria-disabled={page <= 1}
                  className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
                    page <= 1
                      ? "pointer-events-none border-zinc-200 text-zinc-300 dark:border-zinc-800 dark:text-zinc-700"
                      : "border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
                  }`}
                >
                  Anterior
                </Link>
                <span className="text-sm text-zinc-500 dark:text-zinc-400">
                  Página {page} de {pageCount}
                </span>
                <Link
                  href={buildSearchUrl(params, Math.min(pageCount, page + 1))}
                  aria-disabled={page >= pageCount}
                  className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
                    page >= pageCount
                      ? "pointer-events-none border-zinc-200 text-zinc-300 dark:border-zinc-800 dark:text-zinc-700"
                      : "border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
                  }`}
                >
                  Siguiente
                </Link>
              </nav>
            )}
          </>
        )}
      </section>
    </div>
  );
}
