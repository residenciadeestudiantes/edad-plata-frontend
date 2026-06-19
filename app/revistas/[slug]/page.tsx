import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
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
        <div className="relative aspect-[3/4] w-full max-w-xs flex-shrink-0 overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-900">
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
            <h1 className="text-3xl font-bold tracking-tight">
              {publication.titulo}
            </h1>
            <div className="mt-2 flex flex-wrap gap-3 text-sm text-zinc-500 dark:text-zinc-400">
              {years && <span>{years}</span>}
              {publication.lugar_publicacion && (
                <span>{publication.lugar_publicacion}</span>
              )}
            </div>
          </div>

          {publication.descripcion && (
            <div className="text-zinc-700 dark:text-zinc-300">
              <BlocksRenderer content={publication.descripcion} />
            </div>
          )}

          <Link
            href={`/revistas/${publication.slug}/numeros`}
            className="inline-flex w-fit items-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            Ver números
          </Link>
        </div>
      </div>

      {authors.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold tracking-tight">Autores</h2>
          <ul className="mt-4 flex flex-wrap gap-3">
            {authors.map((author) => (
              <li key={author.id}>
                <Link
                  href={`/autores/${author.slug}`}
                  className="rounded-full border border-zinc-300 px-4 py-1.5 text-sm transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
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
