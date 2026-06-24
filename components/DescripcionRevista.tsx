"use client";

import { useState } from "react";
import type { StrapiBlocksContent } from "@/lib/api";
import { BlocksRenderer, extractPlainText } from "@/lib/blocks";

const LIMITE_CARACTERES = 300;

export function DescripcionRevista({ content }: { content: StrapiBlocksContent }) {
  const [expandido, setExpandido] = useState(false);
  const textoPlano = extractPlainText(content);

  if (textoPlano.length <= LIMITE_CARACTERES) {
    return (
      <div className="font-light text-zinc-700 dark:text-zinc-300">
        <BlocksRenderer content={content} />
      </div>
    );
  }

  return (
    <div className="font-light text-zinc-700 dark:text-zinc-300">
      {expandido ? (
        <BlocksRenderer content={content} />
      ) : (
        <p>{textoPlano.slice(0, LIMITE_CARACTERES).trimEnd()}…</p>
      )}
      <button
        type="button"
        onClick={() => setExpandido((valor) => !valor)}
        className="mt-2 text-sm font-medium text-teja hover:underline dark:text-teja-claro"
      >
        {expandido ? "Leer menos" : "Leer más"}
      </button>
    </div>
  );
}
