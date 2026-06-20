import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { PageTitle } from "@/components/PageTitle";
import { getIssueByNumeroOrden } from "@/lib/api";
import { PdfViewer } from "./PdfViewer";

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

  if (!issue || !issue.url_facsimil) {
    notFound();
  }

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

      <PdfViewer pdfUrl={`/revistas/${slug}/numeros/${numero_orden}/facsimil/pdf`} />
    </div>
  );
}
