import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { PageTitle } from "@/components/PageTitle";
import { getIssueByNumeroOrden, getStrapiMediaUrl } from "@/lib/api";
import { PdfViewer } from "./PdfViewer";
import { FlipbookViewer, type FlipbookPage } from "./FlipbookViewer";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; numero_orden: string }>;
}): Promise<Metadata> {
  const { slug, numero_orden } = await params;
  const issue = await getIssueByNumeroOrden(slug, Number(numero_orden));

  if (!issue) {
    return { title: "Facsímil no encontrado | Edad de Plata" };
  }

  const titulo = issue.titulo ?? `Número ${issue.numero_orden}`;

  return {
    title: `Facsímil · ${titulo} | Edad de Plata`,
    description: `Visor del facsímil digitalizado de ${titulo} de ${issue.publication?.titulo ?? ""}.`,
  };
}

export default async function FacsimilPage({
  params,
}: {
  params: Promise<{ slug: string; numero_orden: string }>;
}) {
  const { slug, numero_orden } = await params;
  const issue = await getIssueByNumeroOrden(slug, Number(numero_orden));

  const hasFlipbook = (issue?.paginas_facsimil?.length ?? 0) > 0;
  const hasPdf      = !!issue?.url_facsimil;

  if (!issue || (!hasFlipbook && !hasPdf)) {
    notFound();
  }

  // Build FlipbookPage array from Strapi media
  const flipbookPages: FlipbookPage[] = hasFlipbook
    ? issue.paginas_facsimil!.map((m, i) => ({
        src: getStrapiMediaUrl(m.url) ?? m.url,
        alt: m.alternativeText ?? `Página ${i + 1}`,
        w: m.width  ?? 800,
        h: m.height ?? 1100,
      }))
    : [];

  return (
    <div className="flex flex-1 flex-col px-6 py-12 sm:px-12">
      <header className="mb-6">
        <p className="text-sm font-light text-zinc-500 dark:text-zinc-400">
          <Link href={`/revistas/${slug}`} className="hover:underline">
            {issue.publication?.titulo}
          </Link>
          {" · "}
          <Link href={`/revistas/${slug}/numeros`} className="hover:underline">
            Números
          </Link>
          {" · "}
          <Link
            href={`/revistas/${slug}/numeros/${numero_orden}/articulos`}
            className="hover:underline"
          >
            Índice de artículos
          </Link>
        </p>
        <PageTitle>
          Facsímil · {issue.titulo ?? `Número ${issue.numero_orden}`}
        </PageTitle>
      </header>

      {hasFlipbook ? (
        <FlipbookViewer pages={flipbookPages} />
      ) : (
        <PdfViewer pdfUrl={`/revistas/${slug}/numeros/${numero_orden}/facsimil/pdf`} />
      )}
    </div>
  );
}
