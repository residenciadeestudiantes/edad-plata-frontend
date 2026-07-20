import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import DOMPurify from "isomorphic-dompurify";
import { Badge } from "@/components/Badge";
import { GuardarEnProyecto } from "@/components/GuardarEnProyecto";
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
          .replace(/<a class="page"[\s\S]*?<\/a>/g, "")
          .replace(/<div class="DescrI">[\s\S]*?<\/div>/g, "")
      )
    : null;

  const piesLineas = article.pies_imagen
    ? article.pies_imagen.split("\n").filter(Boolean)
    : [];

  // Para obra gráfica, los bloques imgbox (autor + título de la obra) ya se
  // muestran como galería + pies arriba; si tras quitarlos no queda texto
  // real, no se renderiza la sección de texto.
  let obraGraficaTextoHtml: string | null = null;
  if (article.es_obra_grafica && article.texto) {
    const limpio = article.texto
      .replace(/<div class="imgbox">\s*(?:<div class="(?:AutorI|TituloI)">[\s\S]*?<\/div>\s*){1,2}<\/div>/g, "")
      .replace(/<a class="page"[\s\S]*?<\/a>/g, "");
    const tieneContenido = limpio.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").trim().length > 0;
    obraGraficaTextoHtml = tieneContenido ? DOMPurify.sanitize(limpio) : null;
  }

  const cabecera = (
    <header className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-3">
        <PageTitle>{article.titulo}</PageTitle>
        {article.es_anuncio && <Badge color="verde">Anuncio</Badge>}
        {article.es_poema && <Badge color="magenta">Poema</Badge>}
        {article.es_obra_grafica && <Badge color="teja">Obra gráfica</Badge>}
        {(article.temas ?? []).map((tema) => (
          <Badge key={tema.documentId} color="azul">
            {tema.nombre}
          </Badge>
        ))}
      </div>
      {authors.length > 0 && (
        <p className="font-light text-zinc-600 dark:text-zinc-400">
          {authors.map((author, i) => (
            <span key={author.id}>
              <Link href={`/autores/${author.slug}`} className="hover:underline">
                {author.nombre}
              </Link>
              {i < authors.length - 1 && ", "}
            </span>
          ))}
        </p>
      )}
      {article.issue?.publication && (
        <p className="text-sm font-light text-zinc-400 dark:text-zinc-500">
          <Link
            href={`/revistas/${article.issue.publication.slug}`}
            className="hover:underline"
          >
            {article.issue.publication.titulo}
          </Link>
          {article.issue.numero_orden != null && (
            <>
              {" · "}
              <Link
                href={`/revistas/${article.issue.publication.slug}/numeros/${article.issue.numero_orden}/articulos`}
                className="hover:underline"
              >
                N.º {article.issue.numero_orden}
              </Link>
            </>
          )}
          {article.issue.año != null && <> · {article.issue.año}</>}
        </p>
      )}
      <GuardarEnProyecto articleId={article.id} />
    </header>
  );

  const textoHtml = article.es_obra_grafica ? obraGraficaTextoHtml : sanitizedText;

  return (
    <article className="mx-auto w-full max-w-[1520px] flex flex-1 flex-col gap-8 px-10 py-12 sm:px-20">
      <ArticleLayoutSwitch
        imagenes={imagenes}
        alt={article.titulo}
        variante="clara"
        pies={piesLineas}
        cabecera={cabecera}
      >
        {textoHtml && (
          <div className="article-body" dangerouslySetInnerHTML={{ __html: textoHtml }} />
        )}
      </ArticleLayoutSwitch>

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
