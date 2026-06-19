import Link from "next/link";

export function Pagination({
  basePath,
  currentPage,
  pageCount,
}: {
  basePath: string;
  currentPage: number;
  pageCount: number;
}) {
  if (pageCount <= 1) return null;

  const prevPage = Math.max(1, currentPage - 1);
  const nextPage = Math.min(pageCount, currentPage + 1);
  const isFirstPage = currentPage <= 1;
  const isLastPage = currentPage >= pageCount;

  return (
    <nav
      className="mt-10 flex items-center justify-center gap-4"
      aria-label="Paginación"
    >
      <Link
        href={`${basePath}?page=${prevPage}`}
        aria-disabled={isFirstPage}
        className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
          isFirstPage
            ? "pointer-events-none border-zinc-200 text-zinc-300 dark:border-zinc-800 dark:text-zinc-700"
            : "border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
        }`}
      >
        Anterior
      </Link>
      <span className="text-sm text-zinc-500 dark:text-zinc-400">
        Página {currentPage} de {pageCount}
      </span>
      <Link
        href={`${basePath}?page=${nextPage}`}
        aria-disabled={isLastPage}
        className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
          isLastPage
            ? "pointer-events-none border-zinc-200 text-zinc-300 dark:border-zinc-800 dark:text-zinc-700"
            : "border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
        }`}
      >
        Siguiente
      </Link>
    </nav>
  );
}
