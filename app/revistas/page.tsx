import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Pagination } from "@/components/Pagination";
import { PageTitle } from "@/components/PageTitle";
import { getPublications, getStrapiMediaUrl } from "@/lib/api";

const PAGE_SIZE = 25;

export default async function RevistasPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string }>;
}) {
  const { page: pageParam, q } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const { data: publications, meta } = await getPublications(page, PAGE_SIZE, q);
  const { pageCount } = meta.pagination;

  return (
    <div className="flex flex-1 flex-col px-6 py-12 sm:px-12">
      <header className="mb-10">
        <PageTitle>Revistas de la Edad de Plata</PageTitle>
        <p className="mt-2 font-light text-zinc-600 dark:text-zinc-400">
          Explora el catálogo de publicaciones periódicas de la Edad de Plata
          española.
        </p>
      </header>

      <form method="get" className="mb-8 flex max-w-md gap-3">
        <label htmlFor="q" className="sr-only">
          Buscar revista
        </label>
        <input
          id="q"
          name="q"
          type="text"
          defaultValue={q ?? ""}
          placeholder="Buscar una revista por título…"
          className="flex-1 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
        <Button type="submit" variant="primary">
          Buscar
        </Button>
      </form>

      {publications.length === 0 ? (
        <p className="text-zinc-500">
          {q
            ? `No se han encontrado revistas que coincidan con "${q}".`
            : "No se han encontrado revistas."}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {publications.map((publication) => {
            const imageUrl = getStrapiMediaUrl(
              publication.imagen_portada?.url
            );
            const years = [publication.año_inicio, publication.año_fin]
              .filter((year) => year !== null && year !== undefined)
              .join(" - ");

            return (
              <Card
                key={publication.id}
                href={`/revistas/${publication.slug}`}
                imageUrl={imageUrl}
                imageAlt={publication.titulo}
                title={publication.titulo}
                meta={years || undefined}
              />
            );
          })}
        </div>
      )}

      <Pagination
        basePath="/revistas"
        currentPage={page}
        pageCount={pageCount}
        extraParams={q ? { q } : {}}
      />
    </div>
  );
}
