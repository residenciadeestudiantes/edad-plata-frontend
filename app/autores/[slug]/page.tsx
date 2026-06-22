import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { BiografiaAutor } from "@/components/BiografiaAutor";
import { ColaboracionesPorRevista } from "@/components/BurbujasRevistas";
import { NubePalabrasAutor } from "@/components/NubePalabrasAutor";
import { PageTitle } from "@/components/PageTitle";
import { SoloModoInvestigacion } from "@/components/SoloModoInvestigacion";
import { getAuthor, getStrapiMediaUrl } from "@/lib/api";
import { PublicationFilter } from "./PublicationFilter";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const author = await getAuthor(slug);

  if (!author) {
    return { title: "Autor no encontrado | Edad de Plata" };
  }

  return {
    title: `${author.nombre} | Edad de Plata`,
    description: `Artículos publicados por ${author.nombre} en revistas de la Edad de Plata española.`,
  };
}

export default async function AuthorPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ revista?: string }>;
}) {
  const { slug } = await params;
  const { revista } = await searchParams;

  const author = await getAuthor(slug);

  if (!author) {
    notFound();
  }

  const imageUrl = getStrapiMediaUrl(author.imagen?.url);
  const articles = author.articles ?? [];

  const publications = Array.from(
    new Map(
      articles
        .map((article) => article.issue?.publication)
        .filter((publication): publication is NonNullable<typeof publication> => Boolean(publication))
        .map((publication) => [publication.slug, publication])
    ).values()
  ).sort((a, b) => a.titulo.localeCompare(b.titulo));

  const filteredArticles = revista
    ? articles.filter((article) => article.issue?.publication?.slug === revista)
    : articles;

  return (
    <div className="flex flex-1 flex-col gap-10 px-6 py-12 sm:px-12">
      <div className="flex flex-col gap-8 sm:flex-row sm:items-start">
        {imageUrl && (
          <div className="relative aspect-square w-[200px] flex-shrink-0 overflow-hidden rounded-lg bg-gris-claro dark:bg-zinc-900">
            <Image
              src={imageUrl}
              alt={author.nombre}
              fill
              sizes="200px"
              className="object-cover"
            />
          </div>
        )}

        <div className="flex flex-1 flex-col gap-4">
          <PageTitle>{author.nombre}</PageTitle>

          {author.biografia && <BiografiaAutor content={author.biografia} />}
        </div>
      </div>

      <SoloModoInvestigacion>
        <section>
          <h2 className="mb-3 font-titulo text-xl font-semibold tracking-tight text-azul dark:text-azul-claro">
            Nube de palabras
          </h2>
          <NubePalabrasAutor
            autorSlug={slug}
            autorNombre={author.nombre}
            revistas={publications.map((publication) => ({
              slug: publication.slug,
              titulo: publication.titulo,
            }))}
          />
        </section>
      </SoloModoInvestigacion>

      <ColaboracionesPorRevista autorSlug={slug} autorNombre={author.nombre}>
        <section>
          {publications.length > 0 && (
            <div className="mb-4">
              <PublicationFilter
                slug={slug}
                currentSlug={revista ?? ""}
                publications={publications}
              />
            </div>
          )}

          <div className="mb-6 flex flex-wrap items-baseline gap-3">
            <h2 className="font-titulo text-xl font-semibold tracking-tight text-teja dark:text-teja-claro">
              Artículos
            </h2>
            <p className="text-sm font-light text-zinc-500 dark:text-zinc-400">
              {articles.length} artículo{articles.length === 1 ? "" : "s"} ·{" "}
              {publications.length} revista{publications.length === 1 ? "" : "s"}
            </p>
          </div>

          {filteredArticles.length === 0 ? (
            <p className="text-zinc-500">No se han encontrado artículos.</p>
          ) : (
            <ol className="flex flex-col divide-y divide-zinc-200 dark:divide-zinc-800">
              {filteredArticles.map((article) => (
                <li key={article.id} className="flex flex-col gap-1 py-4">
                  <Link
                    href={`/articulos/${article.slug}`}
                    className="font-medium hover:text-teja dark:hover:text-teja-claro"
                  >
                    {article.titulo}
                  </Link>
                  {article.issue?.publication && (
                    <p className="text-sm font-light text-zinc-500 dark:text-zinc-400">
                      <Link
                        href={`/revistas/${article.issue.publication.slug}`}
                        className="hover:underline"
                      >
                        {article.issue.publication.titulo}
                      </Link>
                      {article.issue.numero_orden !== null &&
                        ` · Nº ${article.issue.numero_orden}`}
                    </p>
                  )}
                </li>
              ))}
            </ol>
          )}
        </section>
      </ColaboracionesPorRevista>
    </div>
  );
}
