import Link from "next/link";
import type { Metadata } from "next";
import { AlphabetFilter } from "@/components/AlphabetFilter";
import { AutoresDestacadosGallery } from "@/components/AutoresDestacadosGallery";
import { Button } from "@/components/Button";
import { Pagination } from "@/components/Pagination";
import { PageTitle } from "@/components/PageTitle";
import { SoloModoInvestigacion } from "@/components/SoloModoInvestigacion";
import { getAutoresDestacados, getAuthors, getPublications } from "@/lib/api";
import { ExportarAutoresCsv } from "./ExportarAutoresCsv";
import { RedesAutoresClient } from "./RedesAutoresClient";

const PAGE_SIZE = 50;

export const metadata: Metadata = {
  title: "Autores | Edad de Plata",
  description:
    "Listado alfabético de autores y colaboradores de las revistas de la Edad de Plata española.",
};

export default async function AuthorsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; letra?: string; revista?: string }>;
}) {
  const { page: pageParam, q, letra, revista } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const [{ data: authors, meta }, { data: publications }, autoresDestacados] = await Promise.all([
    getAuthors(page, PAGE_SIZE, q, letra, revista),
    getPublications(1, 100),
    getAutoresDestacados(),
  ]);
  const { pageCount, total } = meta.pagination;
  const extraParams = {
    ...(q ? { q } : {}),
    ...(letra ? { letra } : {}),
    ...(revista ? { revista } : {}),
  };
  const hayFiltros = Boolean(q || letra || revista);

  return (
    <div className="mx-auto w-full max-w-[1520px] flex flex-1 flex-col px-10 py-12 sm:px-20">
      <header className="mb-10">
        <PageTitle>Autores</PageTitle>
        <p className="mt-2 font-light text-zinc-600 dark:text-zinc-400">
          Listado alfabético de autores y colaboradores de las revistas
          catalogadas.
        </p>
      </header>

      {autoresDestacados.length > 0 && (
        <section className="mb-4">
          <AutoresDestacadosGallery autores={autoresDestacados} />
        </section>
      )}

      <SoloModoInvestigacion>
        <details className="group mb-12">
          <summary className="flex cursor-pointer list-none items-center justify-end gap-1.5 text-sm font-semibold text-azul select-none marker:hidden dark:text-azul-claro [&::-webkit-details-marker]:hidden">
            <span className="inline-block text-xs transition-transform group-open:rotate-90">▶</span>
            Redes de autores
          </summary>
          <div className="mt-4">
            <RedesAutoresClient />
          </div>
        </details>
      </SoloModoInvestigacion>

      <form method="get" className="mb-6 flex max-w-2xl flex-wrap gap-3">
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

        <label htmlFor="revista" className="sr-only">
          Filtrar por revista
        </label>
        <select
          id="revista"
          name="revista"
          defaultValue={revista ?? ""}
          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        >
          <option value="">Todas las revistas</option>
          {publications.map((publication) => (
            <option key={publication.slug} value={publication.slug}>
              {publication.titulo}
            </option>
          ))}
        </select>

        {letra && <input type="hidden" name="letra" value={letra} />}
        <Button type="submit" variant="primary">
          Buscar
        </Button>
      </form>

      <AlphabetFilter
        basePath="/autores"
        activeLetter={letra}
        extraParams={{ ...(q ? { q } : {}), ...(revista ? { revista } : {}) }}
      />

      <SoloModoInvestigacion>
        <div className="mb-6 flex justify-end">
          <ExportarAutoresCsv query={q} letter={letra} publicationSlug={revista} total={total} />
        </div>
      </SoloModoInvestigacion>

      {authors.length === 0 ? (
        <p className="text-zinc-500">
          {hayFiltros
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
