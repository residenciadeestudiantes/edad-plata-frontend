import Link from "next/link";

// `pageParam`/`extraParams` permiten reutilizar este paginador cuando la
// página tiene más de un bloque paginable o un filtro propio en la misma URL
// (p. ej. /buscar o /revistas con una búsqueda): cada uso puede tener su
// propio nombre de parámetro de página y conservar el resto de parámetros al
// construir el enlace.
export function Pagination({
  basePath,
  currentPage,
  pageCount,
  pageParam = "page",
  extraParams = {},
}: {
  basePath: string;
  currentPage: number;
  pageCount: number;
  pageParam?: string;
  extraParams?: Record<string, string>;
}) {
  if (pageCount <= 1) return null;

  const prevPage = Math.max(1, currentPage - 1);
  const nextPage = Math.min(pageCount, currentPage + 1);
  const isFirstPage = currentPage <= 1;
  const isLastPage = currentPage >= pageCount;

  function buildHref(page: number) {
    const params = new URLSearchParams(extraParams);
    params.set(pageParam, String(page));
    return `${basePath}?${params.toString()}`;
  }

  return (
    <nav
      className="mt-10 flex items-center justify-center gap-4"
      aria-label="Paginación"
    >
      <Link
        href={buildHref(prevPage)}
        aria-disabled={isFirstPage}
        className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
          isFirstPage
            ? "pointer-events-none border-zinc-200 text-zinc-300 dark:border-zinc-800 dark:text-zinc-700"
            : "border-teja text-teja hover:bg-teja hover:text-white dark:border-teja-claro dark:text-teja-claro dark:hover:bg-teja-claro dark:hover:text-negro"
        }`}
      >
        Anterior
      </Link>
      <span className="text-sm font-light text-zinc-500 dark:text-zinc-400">
        Página {currentPage} de {pageCount}
      </span>
      <Link
        href={buildHref(nextPage)}
        aria-disabled={isLastPage}
        className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
          isLastPage
            ? "pointer-events-none border-zinc-200 text-zinc-300 dark:border-zinc-800 dark:text-zinc-700"
            : "border-teja text-teja hover:bg-teja hover:text-white dark:border-teja-claro dark:text-teja-claro dark:hover:bg-teja-claro dark:hover:text-negro"
        }`}
      >
        Siguiente
      </Link>
    </nav>
  );
}
