import Image from "next/image";
import Link from "next/link";
import { Pagination } from "@/components/Pagination";
import { getPublications, getStrapiMediaUrl } from "@/lib/api";

const PAGE_SIZE = 25;

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const { data: publications, meta } = await getPublications(page, PAGE_SIZE);
  const { pageCount } = meta.pagination;

  return (
    <div className="flex flex-1 flex-col px-6 py-12 sm:px-12">
      <header className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight">
          Revistas de la Edad de Plata
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Explora el catálogo de publicaciones periódicas de la Edad de Plata
          española.
        </p>
      </header>

      {publications.length === 0 ? (
        <p className="text-zinc-500">No se han encontrado revistas.</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {publications.map((publication) => {
            const imageUrl = getStrapiMediaUrl(
              publication.imagen_portada?.url
            );
            const years = [publication.año_inicio, publication.año_fin]
              .filter((year) => year !== null && year !== undefined)
              .join(" - ");

            return (
              <Link
                key={publication.id}
                href={`/revistas/${publication.slug}`}
                className="group flex flex-col overflow-hidden rounded-lg border border-zinc-200 transition-shadow hover:shadow-md dark:border-zinc-800"
              >
                <div className="relative aspect-[3/4] w-full bg-zinc-100 dark:bg-zinc-900">
                  {imageUrl ? (
                    <Image
                      src={imageUrl}
                      alt={publication.titulo}
                      fill
                      sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                      className="object-cover transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-zinc-400">
                      Sin imagen
                    </div>
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-1 p-4">
                  <h2 className="font-semibold leading-snug">
                    {publication.titulo}
                  </h2>
                  {years && (
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      {years}
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <Pagination basePath="/" currentPage={page} pageCount={pageCount} />
    </div>
  );
}
