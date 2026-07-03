import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getIssueByNumeroOrden } from "@/lib/api";
import { FlipbookViewer } from "./FlipbookViewer";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; numero_orden: string }>;
}): Promise<Metadata> {
  const { slug, numero_orden } = await params;
  const issue = await getIssueByNumeroOrden(slug, Number(numero_orden));
  if (!issue) return { title: "Facsímil no encontrado | Edad de Plata" };
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

  if (!issue?.url_facsimil) notFound();

  const titulo = issue.titulo ?? `Número ${issue.numero_orden}`;

  return (
    <div className="flex flex-1 flex-col gap-2 px-4 pb-4 pt-3 sm:px-8">
      {/* Breadcrumbs — compact */}
      <p className="text-xs font-light text-zinc-500 dark:text-zinc-400">
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

      {/* Viewer — self-sizing via calc(100svh) inside FlipbookViewer */}
      <FlipbookViewer
        pdfUrl={`/revistas/${slug}/numeros/${numero_orden}/facsimil/pdf`}
      />

      {/* Title below the viewer */}
      <p className="font-titulo text-sm font-semibold text-zinc-700 dark:text-zinc-300">
        Original · {titulo}
      </p>
    </div>
  );
}
