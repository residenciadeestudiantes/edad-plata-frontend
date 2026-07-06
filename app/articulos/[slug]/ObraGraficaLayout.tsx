import type { ReactNode } from "react";
import { getStrapiMediaUrl, type StrapiMedia } from "@/lib/api";
import { ArticleGallery } from "./ArticleGallery";

// Obra gráfica (lámina, retrato, óleo...): la imagen manda, a página
// completa (con el mismo visor/galería que el resto de facsímiles, tanto si
// hay una imagen como varias), el pie debajo y, si queda algo de texto, al
// final.
export function ObraGraficaLayout({
  imagenes,
  alt,
  pies,
  children,
}: {
  imagenes: StrapiMedia[];
  alt: string;
  pies: string[];
  children?: ReactNode;
}) {
  const valid = imagenes.filter((imagen) => getStrapiMediaUrl(imagen.url));

  return (
    <div className="flex flex-col gap-6">
      {valid.length > 0 && <ArticleGallery imagenes={imagenes} alt={alt} />}

      {pies.length > 0 && (
        <ol className="flex list-decimal flex-col gap-1 pl-5">
          {pies.map((pie, i) => (
            <li
              key={i}
              className="text-sm font-light italic text-zinc-600 dark:text-zinc-400"
            >
              {pie}
            </li>
          ))}
        </ol>
      )}

      {children && (
        <div className="flex max-w-[680px] flex-col gap-4 text-[1.05rem] leading-relaxed font-light text-zinc-700 dark:text-zinc-300">
          {children}
        </div>
      )}
    </div>
  );
}
