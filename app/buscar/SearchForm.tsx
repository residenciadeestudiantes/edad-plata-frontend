"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function SearchForm({
  query,
  publicationSlug,
  authorSlug,
  yearFrom,
  yearTo,
  publications,
  authors,
}: {
  query: string;
  publicationSlug: string;
  authorSlug: string;
  yearFrom: string;
  yearTo: string;
  publications: { slug: string; titulo: string }[];
  authors: { slug: string; nombre: string }[];
}) {
  const router = useRouter();
  const [q, setQ] = useState(query);

  function handleSubmit(formData: FormData) {
    const params = new URLSearchParams();

    const qValue = String(formData.get("q") ?? "").trim();
    const publicacion = String(formData.get("publicacion") ?? "");
    const autor = String(formData.get("autor") ?? "");
    const desde = String(formData.get("desde") ?? "");
    const hasta = String(formData.get("hasta") ?? "");

    if (qValue) params.set("q", qValue);
    if (publicacion) params.set("publicacion", publicacion);
    if (autor) params.set("autor", autor);
    if (desde) params.set("desde", desde);
    if (hasta) params.set("hasta", hasta);

    router.push(`/buscar?${params.toString()}`);
  }

  return (
    <form
      action={handleSubmit}
      className="flex flex-col gap-4 rounded-lg border border-zinc-200 p-6 dark:border-zinc-800"
    >
      <div className="flex flex-col gap-1.5">
        <label htmlFor="q" className="text-sm font-medium">
          Buscar
        </label>
        <input
          id="q"
          name="q"
          type="text"
          value={q}
          onChange={(event) => setQ(event.target.value)}
          placeholder="Título de artículo o nombre de autor"
          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="publicacion" className="text-sm font-medium">
            Revista
          </label>
          <select
            id="publicacion"
            name="publicacion"
            defaultValue={publicationSlug}
            className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          >
            <option value="">Todas las revistas</option>
            {publications.map((publication) => (
              <option key={publication.slug} value={publication.slug}>
                {publication.titulo}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="autor" className="text-sm font-medium">
            Autor
          </label>
          <select
            id="autor"
            name="autor"
            defaultValue={authorSlug}
            className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          >
            <option value="">Todos los autores</option>
            {authors.map((author) => (
              <option key={author.slug} value={author.slug}>
                {author.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:max-w-xs">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="desde" className="text-sm font-medium">
            Año desde
          </label>
          <input
            id="desde"
            name="desde"
            type="number"
            inputMode="numeric"
            defaultValue={yearFrom}
            placeholder="1900"
            className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="hasta" className="text-sm font-medium">
            Año hasta
          </label>
          <input
            id="hasta"
            name="hasta"
            type="number"
            inputMode="numeric"
            defaultValue={yearTo}
            placeholder="1936"
            className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
      </div>

      <button
        type="submit"
        className="w-fit rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-300"
      >
        Buscar
      </button>
    </form>
  );
}
