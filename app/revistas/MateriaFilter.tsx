"use client";

export function MateriaFilter({
  currentMateria,
  currentQuery,
  materias,
}: {
  currentMateria: string;
  currentQuery?: string;
  materias: { slug: string; nombre: string }[];
}) {
  return (
    <form action="/revistas" className="flex items-center gap-2 text-sm">
      {currentQuery && <input type="hidden" name="q" value={currentQuery} />}
      <label htmlFor="materia" className="font-light text-zinc-600 dark:text-zinc-400">
        Materia
      </label>
      <select
        id="materia"
        name="materia"
        defaultValue={currentMateria}
        onChange={(event) => event.currentTarget.form?.requestSubmit()}
        className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
      >
        <option value="">Todas las materias</option>
        {materias.map((materia) => (
          <option key={materia.slug} value={materia.slug}>
            {materia.nombre}
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
