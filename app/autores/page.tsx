import Link from "next/link";
import type { Metadata } from "next";
import { AlphabetFilter } from "@/components/AlphabetFilter";
import { Button } from "@/components/Button";
import { Pagination } from "@/components/Pagination";
import { PageTitle } from "@/components/PageTitle";
import { getAuthors } from "@/lib/api";

const PAGE_SIZE = 50;

export const metadata: Metadata = {
  title: "Autores | Edad de Plata",
  description:
    "Listado alfabético de autores y colaboradores de las revistas de la Edad de Plata española.",
};

export default async function AuthorsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; letra?: string }>;
}) {
  const { page: pageParam, q, letra } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const { data: authors, meta } = await getAuthors(page, PAGE_SIZE, q, letra);
  const { pageCount } = meta.pagination;
  const extraParams = { ...(q ? { q } : {}), ...(letra ? { letra } : {}) };

  return (
    <div className="flex flex-1 flex-col px-6 py-12 sm:px-12">
      <header className="mb-10">
        <PageTitle>Autores</PageTitle>
        <p className="mt-2 font-light text-zinc-600 dark:text-zinc-400">
          Listado alfabético de autores y colaboradores de las revistas
          catalogadas.
        </p>
      </header>

      <form method="get" className="mb-6 flex max-w-md gap-3">
        <label htmlFor="q" className="sr-only">
          Buscar autor
        </label>
        <input
          id="q"
          name="q"
          type="text"
          defaultValue={q ?? ""}
          placeholder="Buscar un autor por nombre…"
          className="flex-1 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
        {letra && <input type="hidden" name="letra" value={letra} />}
        <Button type="submit" variant="primary">
          Buscar
        </Button>
      </form>

      <AlphabetFilter
        basePath="/autores"
        activeLetter={letra}
        extraParams={q ? { q } : {}}
      />

      {authors.length === 0 ? (
        <p className="text-zinc-500">
          {q || letra
            ? "No se han encontrado autores que coincidan con los filtros aplicados."
            : "No se han encontrado autores."}
        </p>
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {authors.map((author) => (
            <li key={author.id}>
              <Link
                href={`/autores/${author.slug}`}
                className="block rounded-md border border-zinc-200 px-4 py-3 transition-colors hover:border-teja hover:text-teja dark:border-zinc-800 dark:hover:border-teja-claro dark:hover:text-teja-claro"
              >
                {author.nombre}
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Pagination
        basePath="/autores"
        currentPage={page}
        pageCount={pageCount}
        extraParams={extraParams}
      />
    </div>
  );
}
