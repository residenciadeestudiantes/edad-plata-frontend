import Link from "next/link";

const LETTERS = "ABCDEFGHIJKLMNÑOPQRSTUVWXYZ".split("");

// Abecedario para filtrar listados por la letra inicial, conservando el
// resto de parámetros de la URL (p. ej. una búsqueda por texto) y
// reiniciando la paginación al cambiar de letra.
export function AlphabetFilter({
  basePath,
  activeLetter,
  extraParams = {},
}: {
  basePath: string;
  activeLetter?: string;
  extraParams?: Record<string, string>;
}) {
  function buildHref(letter?: string) {
    const params = new URLSearchParams(extraParams);
    if (letter) params.set("letra", letter);
    const query = params.toString();
    return query ? `${basePath}?${query}` : basePath;
  }

  return (
    <nav
      aria-label="Filtrar por letra inicial"
      className="mb-8 flex flex-wrap gap-1.5"
    >
      <Link
        href={buildHref(undefined)}
        className={`rounded-md border px-2.5 py-1 text-sm transition-colors ${
          !activeLetter
            ? "border-teja bg-teja text-white dark:border-teja-claro dark:bg-teja-claro dark:text-negro"
            : "border-zinc-200 text-zinc-600 hover:border-teja hover:text-teja dark:border-zinc-800 dark:text-zinc-400 dark:hover:border-teja-claro dark:hover:text-teja-claro"
        }`}
      >
        Todos
      </Link>
      {LETTERS.map((letter) => {
        const isActive = activeLetter === letter;
        return (
          <Link
            key={letter}
            href={buildHref(letter)}
            className={`flex h-8 w-8 items-center justify-center rounded-md border text-sm transition-colors ${
              isActive
                ? "border-teja bg-teja text-white dark:border-teja-claro dark:bg-teja-claro dark:text-negro"
                : "border-zinc-200 text-zinc-600 hover:border-teja hover:text-teja dark:border-zinc-800 dark:text-zinc-400 dark:hover:border-teja-claro dark:hover:text-teja-claro"
            }`}
          >
            {letter}
          </Link>
        );
      })}
    </nav>
  );
}
