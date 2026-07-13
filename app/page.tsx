import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ActivarModoInvestigacion } from "@/components/ActivarModoInvestigacion";
import { AutoresDestacadosGallery } from "@/components/AutoresDestacadosGallery";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { getAutoresDestacados, getHomePublications, getPublications, getStrapiMediaUrl } from "@/lib/api";

export const metadata: Metadata = {
  title: "Edad de Plata | Hemeroteca digital",
  description:
    "Hemeroteca digital de revistas culturales de la Edad de Plata española, 1917–1939. Buscador de texto completo, navegador visual de autores y grupos, y lector facsímil.",
};

// Evita que el build de producción necesite el backend arrancado y
// accesible (lo necesitaría para la generación estática con ISR); se
// renderiza en el servidor en cada petición en su lugar.
export const dynamic = "force-dynamic";

const HERRAMIENTAS = [
  {
    n: "01",
    title: "Dos modos de lectura",
    desc: "Hojea la revista tal como la vieron sus lectores originales o sumérgete en los artículos con la comodidad de la lectura actual.",
    href: "/revistas",
  },
  {
    n: "02",
    title: "Los autores",
    desc: "Explora el universo de más de 1.700 autores nacionales e internacionales de la Edad de Plata, entre ellos Federico García Lorca, José Ortega y Gasset, Juan Ramón Jiménez, Pablo Neruda o María Zambrano. Descubre en qué revistas publicaron, qué temas abordaron, con qué frecuencia colaboraron y cuáles fueron sus redes de relación e influencia dentro del panorama intelectual y literario de la época.",
    href: "/autores",
  },
] as const;

const MODO_INVESTIGACION = {
  n: "03",
  title: "Modo investigación",
  desc: "Selecciona el modo investigación para tener una experiencia desde la que podrás acceder a información adicional en cada página. Podrás consultar análisis léxicos, metadatos detallados y fuentes primarias relacionadas procedentes de nuestros fondos, que aportan contexto y enriquecen la interpretación de los contenidos.",
} as const;

export default async function Home() {
  const [{ data: publicaciones }, { meta }, autoresDestacados] = await Promise.all([
    getHomePublications(),
    getPublications(1, 1),
    getAutoresDestacados(),
  ]);

  const totalRevistas = meta.pagination.total;
  const coleccion = publicaciones.slice(0, 8);

  return (
    <div className="flex flex-1 flex-col">
      {/* HERO */}
      <section className="grid grid-cols-1 items-center gap-12 px-10 py-16 sm:px-20 lg:grid-cols-[1.05fr_0.95fr] lg:py-20">
        <div>
          <p className="mb-5 text-sm font-semibold tracking-[0.12em] text-teja uppercase dark:text-teja-claro">
            Revistas de la Edad de Plata · Residencia de Estudiantes
          </p>
          <h1 className="font-titulo text-5xl leading-[1.05] font-bold text-negro sm:text-6xl dark:text-blanco">
            Las revistas culturales de la vanguardia española
          </h1>
          <p className="font-titulo mt-3 text-[30px] font-medium text-zinc-500 dark:text-zinc-400">
            1917–1939
          </p>
          <p className="mt-6 max-w-xl text-lg font-light text-zinc-600 dark:text-zinc-400">
            Consulta el facsímil y la transcripción completa de las
            principales publicaciones que dieron voz a la Edad de Plata, y
            descubre cómo se relacionaron sus autores, grupos y movimientos.
          </p>
          <div className="mt-9 flex flex-wrap gap-4">
            <Button href="/revistas" variant="primary">
              Explorar la colección
            </Button>
            <Button href="/analisis" variant="secondary">
              Herramientas de análisis
            </Button>
          </div>
          <div className="mt-12 flex gap-10 border-t border-negro/10 pt-7 dark:border-blanco/10">
            <div>
              <p className="text-xs tracking-wide text-zinc-500 dark:text-zinc-400">
                Más de
              </p>
              <p className="font-titulo text-3xl font-bold text-negro dark:text-blanco">
                1.700
              </p>
              <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                autores
              </p>
            </div>
            <div>
              <p className="text-xs tracking-wide text-zinc-500 dark:text-zinc-400">
                Más de
              </p>
              <p className="font-titulo text-3xl font-bold text-negro dark:text-blanco">
                8.000
              </p>
              <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                artículos
              </p>
            </div>
          </div>
        </div>

        <div className="relative hidden h-[420px] sm:block lg:h-[520px]">
          <Image
            src="/images/portadas_revistas.png"
            alt="Portadas de revistas de la Edad de Plata"
            fill
            sizes="(min-width: 1024px) 45vw, 50vw"
            className="object-contain"
          />
        </div>
      </section>

      {/* LOS AUTORES */}
      {autoresDestacados.length > 0 && (
        <section className="px-10 pt-4 pb-16 sm:px-20 sm:pt-6">
          <div className="mb-9 flex items-end justify-between">
            <h2 className="font-titulo text-3xl font-bold text-negro dark:text-blanco">
              Los autores
            </h2>
            <Link href="/autores" className="text-sm font-semibold text-negro hover:underline dark:text-blanco">
              Ver todos los autores →
            </Link>
          </div>
          <AutoresDestacadosGallery autores={autoresDestacados} />
        </section>
      )}

      {/* HERRAMIENTAS */}
      <section className="border-y border-negro/10 bg-gris-claro px-10 py-16 sm:px-20 dark:border-blanco/10 dark:bg-zinc-900">
        <h2 className="mb-10 font-titulo text-3xl font-bold text-negro dark:text-blanco">
          Herramientas de lectura y análisis
        </h2>
        <div className="grid grid-cols-1 gap-px bg-negro/10 sm:grid-cols-3 dark:bg-blanco/10">
          {HERRAMIENTAS.map((herramienta) => (
            <Link
              key={herramienta.n}
              href={herramienta.href}
              className="group flex flex-col bg-gris-claro px-8 py-9 transition-colors hover:bg-blanco dark:bg-zinc-900 dark:hover:bg-negro"
            >
              <span className="mb-4 font-titulo text-base font-bold text-teja dark:text-teja-claro">
                {herramienta.n}
              </span>
              <h3 className="mb-3 text-lg font-semibold text-negro dark:text-blanco">
                {herramienta.title}
              </h3>
              <p className="mb-4 flex-1 text-sm font-light text-zinc-600 dark:text-zinc-400">
                {herramienta.desc}
              </p>
              <span className="text-sm font-semibold text-negro group-hover:underline dark:text-blanco">
                Abrir herramienta →
              </span>
            </Link>
          ))}

          <div className="flex flex-col bg-gris-claro px-8 py-9 dark:bg-zinc-900">
            <span className="mb-4 font-titulo text-base font-bold text-teja dark:text-teja-claro">
              {MODO_INVESTIGACION.n}
            </span>
            <h3 className="mb-3 text-lg font-semibold text-negro dark:text-blanco">
              {MODO_INVESTIGACION.title}
            </h3>
            <p className="mb-4 flex-1 text-sm font-light text-zinc-600 dark:text-zinc-400">
              {MODO_INVESTIGACION.desc}
            </p>
            <ActivarModoInvestigacion />
          </div>
        </div>
      </section>

      {/* NAVEGADOR VISUAL */}
      <section className="grid grid-cols-1 items-center gap-14 px-10 py-16 sm:px-20 lg:grid-cols-2">
        <div className="relative h-[380px] bg-gris-claro">
          <Image
            src="/images/navegador-visual.png"
            alt="Diagrama del navegador visual de autores, grupos y movimientos"
            fill
            sizes="(min-width: 1024px) 45vw, 90vw"
            className="object-contain"
          />
        </div>
        <div>
          <p className="mb-4 text-sm font-semibold tracking-[0.12em] text-teja uppercase dark:text-teja-claro">
            Navegador visual
          </p>
          <h2 className="mb-5 font-titulo text-3xl font-bold text-negro dark:text-blanco">
            Sigue el hilo entre autores, grupos y movimientos
          </h2>
          <p className="mb-7 max-w-md text-base font-light text-zinc-600 dark:text-zinc-400">
            Una red interactiva conecta cada colaborador con las revistas en
            las que publicó y los movimientos artísticos y literarios a los
            que perteneció: del 27 al ultraísmo, de Lorca a Gómez de la Serna.
          </p>
          <Button
            href="http://nrevistasedp.edaddeplata.org/#/"
            variant="secondary"
            arrowDirection="diagonal"
            target="_blank"
            rel="noopener noreferrer"
          >
            Entrar al navegador
          </Button>
        </div>
      </section>

      {/* COLECCIÓN */}
      <section className="px-10 py-16 sm:px-20">
        <div className="mb-9 flex items-end justify-between">
          <h2 className="font-titulo text-3xl font-bold text-negro dark:text-blanco">
            La colección
          </h2>
          <Link href="/revistas" className="text-sm font-semibold text-negro hover:underline dark:text-blanco">
            Ver las {totalRevistas} revistas →
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-7 sm:grid-cols-4 xl:grid-cols-8">
          {coleccion.map((publicacion) => {
            const years = [publicacion.año_inicio, publicacion.año_fin]
              .filter((year) => year !== null && year !== undefined)
              .join("–");
            const meta = [publicacion.lugar_publicacion, years]
              .filter(Boolean)
              .join(" · ");

            return (
              <Card
                key={publicacion.id}
                href={`/revistas/${publicacion.slug}`}
                imageUrl={getStrapiMediaUrl(publicacion.imagen_portada?.url)}
                imageAlt={publicacion.titulo}
                title={publicacion.titulo}
                meta={meta || undefined}
              />
            );
          })}
        </div>
      </section>
    </div>
  );
}
