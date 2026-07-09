import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getIssueByNumeroOrden, getStrapiMediaUrl } from "@/lib/api";
import { IssueArticlesLayout } from "./IssueArticlesLayout";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; numero_orden: string }>;
}): Promise<Metadata> {
  const { slug, numero_orden } = await params;
  const issue = await getIssueByNumeroOrden(slug, Number(numero_orden));

  if (!issue) {
    return { title: "Número no encontrado | Edad de Plata" };
  }

  const titulo = issue.titulo ?? `Número ${issue.numero_orden}`;

  return {
    title: `Índice de artículos · ${titulo} | Edad de Plata`,
    description: `Artículos publicados en ${titulo} de ${issue.publication?.titulo ?? ""}.`,
  };
}

export default async function IssueArticlesPage({
  params,
}: {
  params: Promise<{ slug: string; numero_orden: string }>;
}) {
  const { slug, numero_orden } = await params;
  const issue = await getIssueByNumeroOrden(slug, Number(numero_orden));

  if (!issue) {
    notFound();
  }

  const articles = issue.articles ?? [];
  const portadaUrl = getStrapiMediaUrl(issue.imagen_portada?.url);
  const titulo = issue.titulo ?? `Número ${issue.numero_orden}`;

  return (
    <div className="mx-auto w-full max-w-[1520px] flex flex-1 flex-col gap-8 px-10 py-12 sm:px-20">
      <p className="font-titulo text-xl font-semibold text-zinc-600 dark:text-zinc-400 sm:text-2xl">
        <Link href={`/revistas/${slug}`} className="hover:underline">
          {issue.publication?.titulo}
        </Link>
        {" · "}
        <Link href={`/revistas/${slug}/numeros`} className="hover:underline text-base font-normal sm:text-lg">
          Números
        </Link>
      </p>

      <IssueArticlesLayout
        articles={articles}
        portadaUrl={portadaUrl}
        portadaAlt={titulo}
        titulo={titulo}
        facsimilHref={`/revistas/${slug}/numeros/${numero_orden}/facsimil`}
      />
    </div>
  );
}
