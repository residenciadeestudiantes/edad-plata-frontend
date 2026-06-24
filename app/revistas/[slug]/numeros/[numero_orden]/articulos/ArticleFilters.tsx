"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/Badge";
import type { Article } from "@/lib/api";

const ANUNCIOS_TAG = "__anuncios__";

function pillClasses(seleccionado: boolean, color: "teja" | "verde") {
  if (!seleccionado) {
    return "rounded-full border border-zinc-300 px-4 py-1.5 text-sm text-zinc-500 transition-colors hover:border-teja hover:text-teja dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-teja-claro dark:hover:text-teja-claro";
  }
  if (color === "verde") {
    return "rounded-full border border-verde bg-verde px-4 py-1.5 text-sm font-medium text-white transition-colors dark:border-verde-claro dark:bg-verde-claro dark:text-negro";
  }
  return "rounded-full border border-teja bg-teja px-4 py-1.5 text-sm font-medium text-white transition-colors dark:border-teja-claro dark:bg-teja-claro dark:text-negro";
}

function FilterPill({
  seleccionado,
  color,
  onClick,
  children,
}: {
  seleccionado: boolean;
  color: "teja" | "verde";
  onClick: () => void;
  children: string;
}) {
  return (
    <span className="group relative inline-block">
      <button
        type="button"
        aria-pressed={seleccionado}
        onClick={onClick}
        className={pillClasses(seleccionado, color)}
      >
        {children}
      </button>
      <span className="pointer-events-none absolute -top-8 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md bg-negro px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100 dark:bg-zinc-700">
        {seleccionado ? "Desactivar" : "Activar"}
      </span>
    </span>
  );
}

// Etiquetas de idioma (y, si hay anuncios en el número, una etiqueta
// "Anuncios" más) con la misma estética que las de Autores, pero
// seleccionables como filtro: todas activas por defecto (se muestra todo) y
// al desactivar una deja de mostrarse lo que tenga esa etiqueta, combinando
// los filtros en AND (un artículo necesita tener seleccionadas TODAS las
// etiquetas que le correspondan — su idioma, y "Anuncios" si lo es).
export function ArticleFilters({ articles }: { articles: Article[] }) {
  const idiomas = Array.from(
    new Set(articles.map((article) => article.idioma).filter((value): value is string => Boolean(value)))
  ).sort();
  const hayAnuncios = articles.some((article) => article.es_anuncio);

  const [seleccionadas, setSeleccionadas] = useState<Set<string>>(
    () => new Set([...idiomas, ANUNCIOS_TAG])
  );

  function toggle(tag: string) {
    setSeleccionadas((actual) => {
      const next = new Set(actual);
      if (next.has(tag)) {
        next.delete(tag);
      } else {
        next.add(tag);
      }
      return next;
    });
  }

  const articulosFiltrados = articles.filter((article) => {
    if (article.idioma && !seleccionadas.has(article.idioma)) return false;
    if (article.es_anuncio && !seleccionadas.has(ANUNCIOS_TAG)) return false;
    return true;
  });

  const mostrarFiltros = idiomas.length > 1 || hayAnuncios;

  return (
    <div>
      {mostrarFiltros && (
        <div className="mb-6 flex flex-wrap gap-3">
          {idiomas.map((idioma) => (
            <FilterPill
              key={idioma}
              seleccionado={seleccionadas.has(idioma)}
              color="teja"
              onClick={() => toggle(idioma)}
            >
              {`Artículos en ${idioma}`}
            </FilterPill>
          ))}
          {hayAnuncios && (
            <FilterPill
              seleccionado={seleccionadas.has(ANUNCIOS_TAG)}
              color="verde"
              onClick={() => toggle(ANUNCIOS_TAG)}
            >
              Incluir Anuncios
            </FilterPill>
          )}
        </div>
      )}

      {articulosFiltrados.length === 0 ? (
        <p className="text-zinc-500">
          {articles.length === 0
            ? "No se han encontrado artículos."
            : "No hay artículos que coincidan con los filtros seleccionados."}
        </p>
      ) : (
        <ol className="flex flex-col divide-y divide-zinc-200 dark:divide-zinc-800">
          {articulosFiltrados.map((article) => {
            const authors = article.authors ?? [];

            return (
              <li key={article.id} className="flex flex-col gap-1 py-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/articulos/${article.slug}`}
                    className="font-medium hover:text-teja dark:hover:text-teja-claro"
                  >
                    {article.titulo}
                  </Link>
                  {article.es_anuncio && <Badge color="verde">Anuncio</Badge>}
                </div>
                {authors.length > 0 && (
                  <p className="text-sm font-light text-zinc-500 dark:text-zinc-400">
                    {authors.map((author, i) => (
                      <span key={author.id}>
                        <Link href={`/autores/${author.slug}`} className="hover:underline">
                          {author.nombre}
                        </Link>
                        {i < authors.length - 1 && ", "}
                      </span>
                    ))}
                  </p>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
