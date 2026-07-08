"use client";

import Link from "next/link";
import { useState } from "react";
import type { Author } from "@/lib/api";

const LIMITE_INICIAL = 4;

export function ListaAutores({ authors }: { authors: Author[] }) {
  const [mostrarTodos, setMostrarTodos] = useState(false);
  const visibles = mostrarTodos ? authors : authors.slice(0, LIMITE_INICIAL);

  return (
    <>
      <ul className="mt-4 flex flex-wrap gap-3">
        {visibles.map((author) => (
          <li key={author.id}>
            <Link
              href={`/autores/${author.slug}`}
              className="rounded-full border border-zinc-300 px-4 py-1.5 text-sm transition-colors hover:border-teja hover:text-teja dark:border-zinc-700 dark:hover:border-teja-claro dark:hover:text-teja-claro"
            >
              {author.nombre}
            </Link>
          </li>
        ))}
      </ul>

      {authors.length > LIMITE_INICIAL && (
        <button
          type="button"
          onClick={() => setMostrarTodos((valor) => !valor)}
          className="mt-3 text-sm font-medium text-teja hover:underline dark:text-teja-claro"
        >
          {mostrarTodos ? "Ver menos" : `Ver todos (${authors.length})`}
        </button>
      )}
    </>
  );
}
