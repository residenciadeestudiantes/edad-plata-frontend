import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Pagination } from "@/components/Pagination";
import { PageTitle } from "@/components/PageTitle";
import { getMaterias, getPublications, getStrapiMediaUrl } from "@/lib/api";
import { MateriaFilter } from "./MateriaFilter";

const PAGE_SIZE = 16;

export default async function RevistasPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; materia?: string }>;
}) {
  const { page: pageParam, q, materia } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const [{ data: publications, meta }, materias] = await Promise.all([
    getPublications(page, PAGE_SIZE, q, materia),
    getMaterias(),
  ]);
  const { pageCount } = meta.pagination;

  return (
    <div className="flex flex-1 flex-col px-10 py-12 sm:px-20">
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

      {materias.length > 0 && (
        <div className="mb-8">
          <MateriaFilter currentMateria={materia ?? ""} currentQuery={q} materias={materias} />
        </div>
      )}

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
        extraParams={{ ...(q ? { q } : {}), ...(materia ? { materia } : {}) }}
      />
    </div>
  );
}
