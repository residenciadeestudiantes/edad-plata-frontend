import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { Pagination } from "@/components/Pagination";
import { getIssues, getPublication, getStrapiMediaUrl } from "@/lib/api";

const PAGE_SIZE = 20;

const MESES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

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

  return {
    title: `Números de ${publication.titulo} | Edad de Plata`,
    description: `Listado de números publicados de ${publication.titulo}.`,
  };
}

export default async function IssuesPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { slug } = await params;
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const publication = await getPublication(slug);

  if (!publication) {
    notFound();
  }

  const { data: issues, meta } = await getIssues(slug, page, PAGE_SIZE);
  const { pageCount } = meta.pagination;

  return (
    <div className="flex flex-1 flex-col px-6 py-12 sm:px-12">
      <header className="mb-10">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          <Link href={`/revistas/${slug}`} className="hover:underline">
            {publication.titulo}
          </Link>
        </p>
        <h1 className="text-3xl font-bold tracking-tight">Números</h1>
      </header>

      {issues.length === 0 ? (
        <p className="text-zinc-500">No se han encontrado números.</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {issues.map((issue) => {
            const imageUrl = getStrapiMediaUrl(issue.imagen_portada?.url);
            const fecha = [issue.mes ? MESES[issue.mes - 1] : null, issue.año]
              .filter(Boolean)
              .join(" de ");

            return (
              <div
                key={issue.id}
                className="flex flex-col overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800"
              >
                <div className="relative aspect-[3/4] w-full bg-zinc-100 dark:bg-zinc-900">
                  {imageUrl ? (
                    <Image
                      src={imageUrl}
                      alt={issue.titulo ?? `Número ${issue.numero_orden}`}
                      fill
                      sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-zinc-400">
                      Sin imagen
                    </div>
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-1 p-4">
                  <h2 className="font-semibold leading-snug">
                    {issue.titulo ?? `Número ${issue.numero_orden ?? ""}`}
                  </h2>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    {issue.numero_orden !== null && `Nº ${issue.numero_orden}`}
                    {fecha && ` · ${fecha}`}
                  </p>
                </div>
                <div className="flex gap-2 border-t border-zinc-200 p-3 dark:border-zinc-800">
                  <Link
                    href={`/revistas/${slug}/numeros/${issue.numero_orden}/articulos`}
                    className="flex-1 rounded-md bg-zinc-900 px-3 py-1.5 text-center text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-300"
                  >
                    Ver texto
                  </Link>
                  <Link
                    href={`/revistas/${slug}/numeros/${issue.numero_orden}/facsimil`}
                    className="flex-1 rounded-md border border-zinc-300 px-3 py-1.5 text-center text-sm font-medium transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
                  >
                    Ver facsímil
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Pagination
        basePath={`/revistas/${slug}/numeros`}
        currentPage={page}
        pageCount={pageCount}
      />
    </div>
  );
}
