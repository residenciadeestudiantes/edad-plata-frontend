import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import DOMPurify from "isomorphic-dompurify";
import { ContextoArchivo } from "@/components/ContextoArchivo";
import { NubePalabras } from "@/components/NubePalabras";
import { PageTitle } from "@/components/PageTitle";
import { SoloModoInvestigacion } from "@/components/SoloModoInvestigacion";
import { getArticle } from "@/lib/api";
import { ArticleGallery } from "./ArticleGallery";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticle(slug);

  if (!article) {
    return { title: "Artículo no encontrado | Edad de Plata" };
  }

  const autores = (article.authors ?? []).map((author) => author.nombre).join(", ");

  return {
    title: `${article.titulo} | Edad de Plata`,
    description: autores ? `Artículo de ${autores}.` : article.titulo,
  };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await getArticle(slug);

  if (!article) {
    notFound();
  }

  const authors = article.authors ?? [];
  const imagenes = article.imagenes ?? [];
  const sanitizedText = article.texto ? DOMPurify.sanitize(article.texto) : null;

  return (
    <article className="flex flex-1 flex-col gap-8 px-6 py-12 sm:px-12">
      <header className="flex flex-col gap-2">
        {article.issue?.publication && (
          <p className="text-sm font-light text-zinc-500 dark:text-zinc-400">
            <Link
              href={`/revistas/${article.issue.publication.slug}`}
              className="hover:underline"
            >
              {article.issue.publication.titulo}
            </Link>
          </p>
        )}
        <PageTitle>{article.titulo}</PageTitle>
        {authors.length > 0 && (
          <p className="font-light text-zinc-600 dark:text-zinc-400">
            {authors.map((author, i) => (
              <span key={author.id}>
                <Link
                  href={`/autores/${author.slug}`}
                  className="hover:underline"
                >
                  {author.nombre}
                </Link>
                {i < authors.length - 1 && ", "}
              </span>
            ))}
          </p>
        )}
      </header>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
        {sanitizedText && (
          <div
            className={`flex flex-col gap-4 font-light text-zinc-700 dark:text-zinc-300 ${
              imagenes.length === 0 ? "lg:col-span-2" : ""
            }`}
            dangerouslySetInnerHTML={{ __html: sanitizedText }}
          />
        )}

        {imagenes.length > 0 && (
          <ArticleGallery imagenes={imagenes} alt={article.titulo} />
        )}
      </div>

      <ContextoArchivo tipo="articulo" nombre={article.titulo} />

      {article.texto && (
        <SoloModoInvestigacion>
          <div className="flex flex-col gap-4 border-t border-zinc-200 pt-8 dark:border-zinc-800">
            <h3 className="font-titulo text-lg font-semibold text-teja dark:text-teja-claro">
              Análisis léxico
            </h3>
            <NubePalabras textoHtml={article.texto} />
          </div>
        </SoloModoInvestigacion>
      )}
    </article>
  );
}
