import Link from "next/link";
import type { Metadata } from "next";
import { Pagination } from "@/components/Pagination";
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
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const { data: authors, meta } = await getAuthors(page, PAGE_SIZE);
  const { pageCount } = meta.pagination;

  return (
    <div className="flex flex-1 flex-col px-6 py-12 sm:px-12">
      <header className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight">Autores</h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Listado alfabético de autores y colaboradores de las revistas
          catalogadas.
        </p>
      </header>

      {authors.length === 0 ? (
        <p className="text-zinc-500">No se han encontrado autores.</p>
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {authors.map((author) => (
            <li key={author.id}>
              <Link
                href={`/autores/${author.slug}`}
                className="block rounded-md border border-zinc-200 px-4 py-3 transition-colors hover:bg-zinc-100 dark:border-zinc-800 dark:hover:bg-zinc-900"
              >
                {author.nombre}
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Pagination basePath="/autores" currentPage={page} pageCount={pageCount} />
    </div>
  );
}
