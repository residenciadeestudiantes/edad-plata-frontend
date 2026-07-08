import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { Card } from "@/components/Card";
import { Pagination } from "@/components/Pagination";
import { PageTitle } from "@/components/PageTitle";
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
    <div className="flex flex-1 flex-col px-10 py-12 sm:px-20">
      <header className="mb-10">
        <p className="text-sm font-light text-zinc-500 dark:text-zinc-400">
          <Link href={`/revistas/${slug}`} className="hover:underline">
            {publication.titulo}
          </Link>
        </p>
        <PageTitle>Números</PageTitle>
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
              <Card
                key={issue.id}
                imageUrl={imageUrl}
                imageAlt={issue.titulo ?? `Número ${issue.numero_orden}`}
                title={issue.titulo ?? `Número ${issue.numero_orden ?? ""}`}
                meta={
                  <>
                    {issue.numero_orden !== null && `Nº ${issue.numero_orden}`}
                    {fecha && ` · ${fecha}`}
                  </>
                }
              >
                <div className="flex gap-2 border-t border-zinc-200 p-3 dark:border-zinc-800">
                  <Link
                    href={`/revistas/${slug}/numeros/${issue.numero_orden}/articulos`}
                    className="flex-1 rounded-md bg-teja px-3 py-1.5 text-center text-sm font-medium text-white transition-colors hover:bg-teja/90 dark:bg-teja-claro dark:text-negro dark:hover:bg-teja-claro/90"
                  >
                    Texto
                  </Link>
                  <Link
                    href={`/revistas/${slug}/numeros/${issue.numero_orden}/facsimil`}
                    className="flex-1 rounded-md border border-teja px-3 py-1.5 text-center text-sm font-medium text-teja transition-colors hover:bg-teja/10 dark:border-teja-claro dark:text-teja-claro dark:hover:bg-teja-claro/10"
                  >
                    Original
                  </Link>
                </div>
              </Card>
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
