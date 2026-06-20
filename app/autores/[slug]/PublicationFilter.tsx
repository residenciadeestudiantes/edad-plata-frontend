"use client";

export function PublicationFilter({
  slug,
  currentSlug,
  publications,
}: {
  slug: string;
  currentSlug: string;
  publications: { slug: string; titulo: string }[];
}) {
  return (
    <form action={`/autores/${slug}`} className="flex items-center gap-2 text-sm">
      <label htmlFor="revista" className="font-light text-zinc-600 dark:text-zinc-400">
        Revista
      </label>
      <select
        id="revista"
        name="revista"
        defaultValue={currentSlug}
        onChange={(event) => event.currentTarget.form?.requestSubmit()}
        className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
      >
        <option value="">Todas las revistas</option>
        {publications.map((publication) => (
          <option key={publication.slug} value={publication.slug}>
            {publication.titulo}
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
