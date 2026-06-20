import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { Button } from "@/components/Button";
import { PageTitle } from "@/components/PageTitle";
import { getAuthorsByPublication, getPublication, getStrapiMediaUrl } from "@/lib/api";
import { BlocksRenderer } from "@/lib/blocks";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const publication = await getPublication(slug);

  if (!publication) {
    return { title: "Revista no encontrada | Edad de Plata" };
  }

  const years = [publication.año_inicio, publication.año_fin]
    .filter((year) => year !== null && year !== undefined)
    .join("-");

  return {
    title: `${publication.titulo} | Edad de Plata`,
    description:
      publication.lugar_publicacion ??
      `Revista de la Edad de Plata española${years ? ` (${years})` : ""}.`,
  };
}

export default async function PublicationPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const publication = await getPublication(slug);

  if (!publication) {
    notFound();
  }

  const authors = await getAuthorsByPublication(slug);
  const imageUrl = getStrapiMediaUrl(publication.imagen_portada?.url);
  const years = [publication.año_inicio, publication.año_fin]
    .filter((year) => year !== null && year !== undefined)
    .join(" - ");

  return (
    <div className="flex flex-1 flex-col gap-10 px-6 py-12 sm:px-12">
      <div className="flex flex-col gap-8 sm:flex-row">
        <div className="relative aspect-[3/4] w-full max-w-xs flex-shrink-0 overflow-hidden rounded-lg bg-gris-claro dark:bg-zinc-900">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={publication.titulo}
              fill
              sizes="320px"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-zinc-400">
              Sin imagen
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-4">
          <div>
            <PageTitle>{publication.titulo}</PageTitle>
            <div className="mt-2 flex flex-wrap gap-3 text-sm font-light text-zinc-500 dark:text-zinc-400">
              {years && <span>{years}</span>}
              {publication.lugar_publicacion && (
                <span>{publication.lugar_publicacion}</span>
              )}
            </div>
          </div>

          {publication.descripcion && (
            <div className="font-light text-zinc-700 dark:text-zinc-300">
              <BlocksRenderer content={publication.descripcion} />
            </div>
          )}

          <Button href={`/revistas/${publication.slug}/numeros`} variant="primary">
            Ver números
          </Button>
        </div>
      </div>

      {authors.length > 0 && (
        <section>
          <h2 className="font-titulo text-xl font-semibold tracking-tight text-teja dark:text-teja-claro">
            Autores
          </h2>
          <ul className="mt-4 flex flex-wrap gap-3">
            {authors.map((author) => (
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
        </section>
      )}
    </div>
  );
}
