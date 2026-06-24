"use client";

export function IdiomaFilter({
  basePath,
  currentIdioma,
  idiomas,
}: {
  basePath: string;
  currentIdioma: string;
  idiomas: string[];
}) {
  return (
    <form action={basePath} className="flex items-center gap-2 text-sm">
      <label htmlFor="idioma" className="font-light text-zinc-600 dark:text-zinc-400">
        Idioma
      </label>
      <select
        id="idioma"
        name="idioma"
        defaultValue={currentIdioma}
        onChange={(event) => event.currentTarget.form?.requestSubmit()}
        className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
      >
        <option value="">Todos los idiomas</option>
        {idiomas.map((idioma) => (
          <option key={idioma} value={idioma}>
            {idioma}
          </option>
        ))}
      </select>
      <noscript>
        <button
          type="submit"
          className="rounded-md border border-teja px-3 py-1.5 text-sm font-medium text-teja transition-colors hover:bg-teja/10 dark:border-teja-claro dark:text-teja-claro dark:hover:bg-teja-claro/10"
        >
          Filtrar
        </button>
      </noscript>
    </form>
  );
}
