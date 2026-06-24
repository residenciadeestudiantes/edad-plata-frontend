"use client";

import { useEffect, useRef, useState } from "react";
import { getAuthors, type Author } from "@/lib/api";

const RESULT_LIMIT = 20;
const DEBOUNCE_MS = 250;
const BLUR_CLOSE_MS = 150;

// Combobox con búsqueda en servidor para elegir un autor entre 1700+. En vez
// de cargar toda la lista en un <select>, busca por nombre (getAuthors ya
// soporta $containsi) a medida que el usuario escribe.
export function AuthorCombobox({
  id,
  value,
  onChange,
  placeholder = "Escribe un nombre…",
}: {
  id: string;
  value: string;
  onChange: (slug: string, author: Author | null) => void;
  placeholder?: string;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<Author[]>([]);
  const [loading, setLoading] = useState(false);
  const [highlighted, setHighlighted] = useState(0);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Si el padre limpia la selección (value vuelve a ""), refleja el vaciado
  // en el texto mostrado. El combobox es la única fuente de selecciones no
  // vacías, así que no necesitamos resolver un nombre a partir de un slug.
  useEffect(() => {
    if (value === "") setQuery("");
  }, [value]);

  useEffect(() => {
    return () => {
      clearTimeout(debounceRef.current);
      clearTimeout(blurTimeoutRef.current);
    };
  }, []);

  function buscar(texto: string) {
    setLoading(true);
    getAuthors(1, RESULT_LIMIT, texto || undefined)
      .then((res) => setResults(res.data))
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  }

  function handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    const texto = event.target.value;
    setQuery(texto);
    setOpen(true);
    setHighlighted(0);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => buscar(texto), DEBOUNCE_MS);
  }

  function handleFocus() {
    setOpen(true);
    if (results.length === 0 && !loading) buscar(query);
  }

  function handleBlur() {
    blurTimeoutRef.current = setTimeout(() => setOpen(false), BLUR_CLOSE_MS);
  }

  function handleSelect(author: Author) {
    clearTimeout(blurTimeoutRef.current);
    setQuery(author.nombre);
    setOpen(false);
    onChange(author.slug, author);
  }

  function handleClear() {
    setQuery("");
    setResults([]);
    onChange("", null);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setHighlighted((i) => Math.min(i + 1, results.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlighted((i) => Math.max(i - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const author = results[highlighted];
      if (author) handleSelect(author);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div className="relative">
      <input
        id={id}
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
        autoComplete="off"
        value={query}
        placeholder={placeholder}
        onChange={handleInputChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 pr-8 text-sm dark:border-zinc-700 dark:bg-zinc-900"
      />
      {value && (
        <button
          type="button"
          onMouseDown={(event) => event.preventDefault()}
          onClick={handleClear}
          aria-label="Limpiar selección"
          className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
        >
          ×
        </button>
      )}
      {open && (
        <ul className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border border-zinc-300 bg-white text-sm shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
          {loading ? (
            <li className="px-3 py-2 text-zinc-500">Buscando…</li>
          ) : results.length === 0 ? (
            <li className="px-3 py-2 text-zinc-500">Sin resultados.</li>
          ) : (
            results.map((author, index) => (
              <li key={author.slug}>
                <button
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => handleSelect(author)}
                  className={`block w-full px-3 py-2 text-left ${
                    index === highlighted
                      ? "bg-azul/10 text-azul dark:bg-azul-claro/10 dark:text-azul-claro"
                      : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  }`}
                >
                  {author.nombre}
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
