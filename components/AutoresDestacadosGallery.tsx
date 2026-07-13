import { Card } from "@/components/Card";
import { getStrapiMediaUrl, type Author } from "@/lib/api";

function AutorCard({ autor }: { autor: Author }) {
  const numArticulos = autor.articles?.length ?? 0;
  return (
    <Card
      href={`/autores/${autor.slug}`}
      imageUrl={getStrapiMediaUrl(autor.imagen?.url)}
      imageAlt={autor.nombre}
      title={autor.nombre}
      meta={`${numArticulos} artículo${numArticulos === 1 ? "" : "s"}`}
    />
  );
}

function enPares<T>(items: T[]): T[][] {
  const pares: T[][] = [];
  for (let i = 0; i < items.length; i += 2) pares.push(items.slice(i, i + 2));
  return pares;
}

// Galería de autores destacados: en móvil, slider con scroll-snap (dos
// autores por slide); a partir de `sm`, rejilla fija sin scroll.
export function AutoresDestacadosGallery({ autores }: { autores: Author[] }) {
  if (autores.length === 0) return null;

  return (
    <>
      <div className="overflow-x-auto [scrollbar-width:none] sm:hidden [&::-webkit-scrollbar]:hidden">
        <div className="flex snap-x snap-mandatory gap-4 scroll-smooth">
          {enPares(autores).map((par, i) => (
            <div key={i} className="grid w-full flex-none snap-start grid-cols-2 gap-4">
              {par.map((autor) => (
                <AutorCard key={autor.id} autor={autor} />
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="hidden gap-7 sm:grid sm:grid-cols-4 xl:grid-cols-8">
        {autores.map((autor) => (
          <AutorCard key={autor.id} autor={autor} />
        ))}
      </div>
    </>
  );
}
