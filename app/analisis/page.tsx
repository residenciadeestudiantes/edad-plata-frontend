import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PageTitle } from "@/components/PageTitle";

export const metadata: Metadata = {
  title: "Análisis | Edad de Plata",
  description:
    "Herramientas cuantitativas y críticas para el estudio del corpus de revistas culturales de la Edad de Plata: estilo, autoría, hemerografía y cultura material impresa.",
};

type Herramienta = {
  n: string;
  title: string;
  desc: string;
  href: string;
  img?: string;
};

const HERRAMIENTAS: Herramienta[] = [
  {
    n: "01",
    title: "Análisis de Corpus",
    desc: "Exploración cuantitativa del conjunto de revistas: extensión, distribución cronológica, tipologías textuales y cobertura del corpus digitalizado.",
    href: "/analisis/corpus",
  },
  {
    n: "02",
    title: "Análisis Estilométrico",
    desc: "Métodos estadísticos aplicados al estilo: riqueza léxica, longitud de frase y marcadores de autoría para la atribución y comparación de textos.",
    href: "/analisis/estilometrico",
  },
  {
    n: "03",
    title: "Innovación Estilística",
    desc: "Detección de rupturas y novedades formales en el lenguaje literario de las vanguardias a lo largo del periodo estudiado.",
    href: "/analisis/innovacion",
  },
  {
    n: "04",
    title: "Datos hemerográficos",
    desc: "Metadatos de publicación: periodicidad, tirada, redes editoriales y distribución geográfica de las cabeceras.",
    href: "/analisis/hemerografico",
  },
  {
    n: "05",
    title: "Análisis de Publicidad",
    desc: "Estudio de los anuncios insertos en las revistas como fuente para la historia cultural, económica y del diseño gráfico de la época.",
    href: "/analisis/publicidad",
  },
];

export default function AnalisisPage() {
  return (
    <div className="mx-auto w-full max-w-[1520px] flex flex-1 flex-col gap-10 px-10 py-12 sm:px-20">
      <header>
        <PageTitle color="azul">Análisis</PageTitle>
        <p className="mt-2 max-w-3xl font-light text-zinc-600 dark:text-zinc-400">
          Herramientas cuantitativas y críticas para el estudio del corpus de
          revistas culturales de la Edad de Plata: estilo, autoría,
          hemerografía y cultura material impresa.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {HERRAMIENTAS.map((herramienta) => (
          <Link
            key={herramienta.n}
            href={herramienta.href}
            className="group flex flex-col overflow-hidden rounded-lg border border-zinc-200 bg-blanco transition-colors hover:border-azul dark:border-zinc-800 dark:bg-negro dark:hover:border-azul-claro"
          >
            {herramienta.img && (
              <div className="relative h-40 w-full bg-gris-claro dark:bg-zinc-900">
                <Image
                  src={herramienta.img}
                  alt={herramienta.title}
                  fill
                  sizes="(min-width: 1024px) 33vw, 100vw"
                  className="object-cover"
                />
              </div>
            )}
            <div className="flex flex-1 flex-col gap-3 p-6">
              <span className="font-titulo text-sm font-bold text-azul dark:text-azul-claro">
                {herramienta.n}
              </span>
              <h2 className="font-titulo text-xl font-bold text-negro dark:text-blanco">
                {herramienta.title}
              </h2>
              <p className="flex-1 text-sm font-light text-zinc-600 dark:text-zinc-400">
                {herramienta.desc}
              </p>
              <span className="text-sm font-semibold text-azul group-hover:underline dark:text-azul-claro">
                Explorar →
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
