import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import DOMPurify from "isomorphic-dompurify";
import { Badge } from "@/components/Badge";
import { NubePalabras } from "@/components/NubePalabras";
import { PageTitle } from "@/components/PageTitle";
import { SoloModoInvestigacion } from "@/components/SoloModoInvestigacion";
import { getArticle } from "@/lib/api";
import { ArticleLayoutSwitch } from "./ArticleLayoutSwitch";

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
  const sanitizedText = article.texto
    ? DOMPurify.sanitize(
        article.texto
          .replace(/<div class="Título">[\s\S]*?<\/div>/g, "")
          .replace(/<div class="Titulo">[\s\S]*?<\/div>/g, "")
          .replace(/<div class="Autortexto">[\s\S]*?<\/div>/g, "")
          .replace(/<div class="Autor">[\s\S]*?<\/div>/g, "")
          .replace(/<div class="Normal"><a class="page"[\s\S]*?<\/a><\/div>/g, "")
          .replace(/<div class="DescrI">[\s\S]*?<\/div>/g, "")
      )
    : null;

  const piesLineas = article.pies_imagen
    ? article.pies_imagen.split("\n").filter(Boolean)
    : [];

  return (
    <article className="flex flex-1 flex-col gap-8 px-6 py-12 sm:px-12">
      <header className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <PageTitle>{article.titulo}</PageTitle>
          {article.es_anuncio && <Badge color="verde">Anuncio</Badge>}
        </div>
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

      <ArticleLayoutSwitch imagenes={imagenes} alt={article.titulo}>
        {sanitizedText && (
          <div className="article-body" dangerouslySetInnerHTML={{ __html: sanitizedText }} />
        )}
      </ArticleLayoutSwitch>

      {piesLineas.length > 0 && (
        <details className="pie-imagen">
          <summary>Pies de imagen ({piesLineas.length})</summary>
          <ul className="mt-2 flex flex-col gap-1">
            {piesLineas.map((linea, i) => (
              <li key={i} className="text-sm font-light italic text-zinc-600 dark:text-zinc-400">
                {linea}
              </li>
            ))}
          </ul>
        </details>
      )}

      <SoloModoInvestigacion>
        <section className="flex flex-col gap-8 rounded-xl border border-azul/20 bg-white p-6 dark:border-azul-claro/20 dark:bg-zinc-950 sm:p-8">
          <div>
            <h2 className="font-titulo text-xl font-semibold text-azul dark:text-azul-claro">
              Herramientas de investigación
            </h2>
            <p className="mt-1 text-sm font-light text-zinc-500 dark:text-zinc-400">
              Herramientas avanzadas de análisis, disponibles en modo
              investigación.
            </p>
          </div>

          {article.texto && (
            <div className="flex flex-col gap-4">
              <h3 className="font-titulo text-lg font-semibold text-azul dark:text-azul-claro">
                Análisis léxico
              </h3>
              <NubePalabras textoHtml={article.texto} />
            </div>
          )}
        </section>
      </SoloModoInvestigacion>
    </article>
  );
}
