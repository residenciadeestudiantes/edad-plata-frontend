"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/Badge";
import { ImageLightbox } from "@/components/ImageLightbox";
import { PageTitle } from "@/components/PageTitle";
import { parseIdiomas, type Article } from "@/lib/api";

const ARTICULOS_TAG = "__articulos__";
const ANUNCIOS_TAG = "__anuncios__";
const POEMA_TAG = "__poema__";
const OBRA_GRAFICA_TAG = "__obra_grafica__";

type PillColor = "teja" | "verde" | "magenta" | "azul";

const ACTIVE_PILL_CLASSES: Record<PillColor, string> = {
  teja: "border-teja bg-teja text-white dark:border-teja-claro dark:bg-teja-claro dark:text-negro",
  verde:
    "border-verde bg-verde text-white dark:border-verde-claro dark:bg-verde-claro dark:text-negro",
  magenta:
    "border-magenta bg-magenta text-white dark:border-magenta-claro dark:bg-magenta-claro dark:text-negro",
  azul:
    "border-azul bg-azul text-white dark:border-azul-claro dark:bg-azul-claro dark:text-negro",
};

// Estilo transparente por defecto (sin seleccionar): fondo translúcido del
// color de marca de cada grupo, en vez de un gris neutro.
const TINT_PILL_CLASSES: Record<PillColor, string> = {
  teja: "border-teja/30 bg-teja/10 text-teja hover:bg-teja/20 dark:border-teja-claro/30 dark:bg-teja-claro/10 dark:text-teja-claro dark:hover:bg-teja-claro/20",
  verde:
    "border-verde/30 bg-verde/10 text-verde hover:bg-verde/20 dark:border-verde-claro/30 dark:bg-verde-claro/10 dark:text-verde-claro dark:hover:bg-verde-claro/20",
  magenta:
    "border-magenta/30 bg-magenta/10 text-magenta hover:bg-magenta/20 dark:border-magenta-claro/30 dark:bg-magenta-claro/10 dark:text-magenta-claro dark:hover:bg-magenta-claro/20",
  azul: "border-azul/30 bg-azul/10 text-azul hover:bg-azul/20 dark:border-azul-claro/30 dark:bg-azul-claro/10 dark:text-azul-claro dark:hover:bg-azul-claro/20",
};

function pillClasses(seleccionado: boolean, color: PillColor) {
  if (!seleccionado) {
    return `rounded-full border px-3 py-1 text-xs transition-colors ${TINT_PILL_CLASSES[color]}`;
  }
  return `rounded-full border px-3 py-1 text-xs font-medium transition-colors ${ACTIVE_PILL_CLASSES[color]}`;
}

function FilterPill({
  seleccionado,
  color,
  onClick,
  children,
}: {
  seleccionado: boolean;
  color: PillColor;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      title="Activar"
      aria-pressed={seleccionado}
      onClick={onClick}
      className={pillClasses(seleccionado, color)}
    >
      {children}
    </button>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
        {label}
      </p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

// Layout de dos columnas del número, igual que el single de artículo:
// izquierda (portada, título, enlace al facsímil y filtros) fija; derecha,
// el índice de artículos.
// Los filtros viven bajo un desplegable "Filtros" con tres grupos (Idioma,
// Tipo, Materias). Todos comparten el mismo comportamiento: parten
// transparentes y sin seleccionar (se ven todos los artículos); al
// seleccionar una etiqueta de un grupo, solo se ven los artículos que la
// tengan (OR entre etiquetas del mismo grupo). Los grupos se combinan entre
// sí en AND (un artículo debe cumplir todos los grupos que tengan alguna
// selección activa).
export function IssueArticlesLayout({
  articles,
  portadaUrl,
  portadaAlt,
  titulo,
  facsimilHref,
}: {
  articles: Article[];
  portadaUrl: string | null;
  portadaAlt: string;
  titulo: string;
  facsimilHref: string;
}) {
  const idiomas = Array.from(
    new Set(articles.flatMap((article) => parseIdiomas(article.idioma)))
  ).sort();
  const hayArticulosNormales = articles.some((article) => !article.es_anuncio);
  const hayAnuncios = articles.some((article) => article.es_anuncio);
  const hayPoemas = articles.some((article) => article.es_poema);
  const hayObraGrafica = articles.some((article) => article.es_obra_grafica);
  const temas = Array.from(
    new Map(articles.flatMap((article) => article.temas ?? []).map((tema) => [tema.documentId, tema])).values()
  ).sort((a, b) => a.nombre.localeCompare(b.nombre));

  const [idiomasSeleccionados, setIdiomasSeleccionados] = useState<Set<string>>(() => new Set());
  const [tipoSeleccionado, setTipoSeleccionado] = useState<Set<string>>(() => new Set());
  const [temasSeleccionados, setTemasSeleccionados] = useState<Set<string>>(() => new Set());

  // Al cambiar cualquier filtro, sube hasta el primer artículo de la
  // selección resultante: en móvil los filtros van antes que el listado, y
  // sin esto el usuario se queda donde estaba desplazado (a veces por
  // debajo de los resultados, sin ver que ya han cambiado). Se salta en el
  // montaje inicial para no saltar al cargar la página.
  //
  // El propio contenedor lleva scroll-mt-28 para no quedar tapado bajo el
  // <header> sticky (105px de alto).
  //
  // Animación manual en vez de scrollIntoView/scrollTo con
  // behavior:"smooth": al acortarse la lista filtrada, el "scroll
  // anchoring" del navegador reajusta el scroll de forma concurrente con
  // la animación nativa y descuadra el destino (verificado repetidamente:
  // con la API nativa, tanto con como sin retraso de frames, el resultado
  // no coincidía con la posición real del primer artículo). Calculando el
  // destino una sola vez — después de que el DOM ya refleja el filtro
  // aplicado — y animando nosotros mismos con requestAnimationFrame hacia
  // ese número fijo, el resultado es consistente.
  //
  // El destino se mide tras un DOBLE rAF, no uno solo: con un único frame
  // de margen, en algunos filtros (verificado con "Poemas") el navegador
  // no había terminado de recalcular el layout aún, y el destino medido
  // no coincidía con la posición final real del contenedor.
  const resultadosRef = useRef<HTMLDivElement>(null);
  const montadoRef = useRef(false);
  useEffect(() => {
    if (!montadoRef.current) {
      montadoRef.current = true;
      return;
    }
    let idFrame1 = 0;
    let idFrame2 = 0;
    let idAnimacion = 0;
    idFrame1 = requestAnimationFrame(() => {
      idFrame2 = requestAnimationFrame(() => {
        const el = resultadosRef.current;
        if (!el) return;
        const scrollMarginTop = parseFloat(getComputedStyle(el).scrollMarginTop) || 0;
        const inicio = window.scrollY;
        const destino = Math.max(0, inicio + el.getBoundingClientRect().top - scrollMarginTop);
        const distancia = destino - inicio;
        if (Math.abs(distancia) < 1) return;

        const DURACION_MS = 350;
        const t0 = performance.now();
        const paso = (t: number) => {
          const progreso = Math.min(1, (t - t0) / DURACION_MS);
          const suavizado = 1 - (1 - progreso) ** 3; // easeOutCubic
          window.scrollTo(0, inicio + distancia * suavizado);
          if (progreso < 1) idAnimacion = requestAnimationFrame(paso);
        };
        idAnimacion = requestAnimationFrame(paso);
      });
    });
    return () => {
      cancelAnimationFrame(idFrame1);
      cancelAnimationFrame(idFrame2);
      cancelAnimationFrame(idAnimacion);
    };
  }, [idiomasSeleccionados, tipoSeleccionado, temasSeleccionados]);

  function toggleEn(setFn: React.Dispatch<React.SetStateAction<Set<string>>>, valor: string) {
    setFn((actual) => {
      const next = new Set(actual);
      if (next.has(valor)) {
        next.delete(valor);
      } else {
        next.add(valor);
      }
      return next;
    });
  }

  const articulosFiltrados = articles.filter((article) => {
    if (idiomasSeleccionados.size > 0) {
      const idiomasArticulo = parseIdiomas(article.idioma);
      if (!idiomasArticulo.some((idioma) => idiomasSeleccionados.has(idioma))) return false;
    }
    if (tipoSeleccionado.size > 0) {
      const coincideTipo =
        (!article.es_anuncio && tipoSeleccionado.has(ARTICULOS_TAG)) ||
        (article.es_anuncio && tipoSeleccionado.has(ANUNCIOS_TAG)) ||
        (article.es_poema && tipoSeleccionado.has(POEMA_TAG)) ||
        (article.es_obra_grafica && tipoSeleccionado.has(OBRA_GRAFICA_TAG));
      if (!coincideTipo) return false;
    }
    if (temasSeleccionados.size > 0) {
      const articleTemas = article.temas ?? [];
      if (!articleTemas.some((tema) => temasSeleccionados.has(tema.documentId))) return false;
    }
    return true;
  });

  const hayTipo = hayArticulosNormales || hayAnuncios || hayPoemas || hayObraGrafica;
  const hayFiltros = idiomas.length > 0 || hayTipo || temas.length > 0;

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-16">
      <div className="flex flex-col gap-4 lg:self-start">
        {portadaUrl && (
          <div className="relative aspect-[3/4] w-full max-w-sm overflow-hidden rounded-lg bg-gris-claro shadow-sm dark:bg-zinc-900">
            <ImageLightbox
              src={portadaUrl}
              alt={portadaAlt}
              wrapperClassName="absolute inset-0"
              sizes="(min-width: 1024px) 40vw, 100vw"
            />
          </div>
        )}

        <PageTitle>{titulo}</PageTitle>

        <Link
          href={facsimilHref}
          className="self-start rounded-md border border-teja px-4 py-2 text-sm font-medium text-teja transition-colors hover:bg-teja/10 dark:border-teja-claro dark:text-teja-claro dark:hover:bg-teja-claro/10"
        >
          Ver original
        </Link>

        {hayFiltros && (
          <div className="flex flex-col gap-4 rounded-lg border border-zinc-200 px-4 py-4 dark:border-zinc-800">
            <p className="text-sm font-medium text-negro dark:text-blanco">Filtros</p>

            {idiomas.length > 0 && (
              <FilterGroup label="Idioma">
                {idiomas.map((idioma) => (
                  <FilterPill
                    key={idioma}
                    seleccionado={idiomasSeleccionados.has(idioma)}
                    color="teja"
                    onClick={() => toggleEn(setIdiomasSeleccionados, idioma)}
                  >
                    {idioma}
                  </FilterPill>
                ))}
              </FilterGroup>
            )}

            {hayTipo && (
              <FilterGroup label="Tipo">
                {hayArticulosNormales && (
                  <FilterPill
                    seleccionado={tipoSeleccionado.has(ARTICULOS_TAG)}
                    color="teja"
                    onClick={() => toggleEn(setTipoSeleccionado, ARTICULOS_TAG)}
                  >
                    Artículos
                  </FilterPill>
                )}
                {hayAnuncios && (
                  <FilterPill
                    seleccionado={tipoSeleccionado.has(ANUNCIOS_TAG)}
                    color="verde"
                    onClick={() => toggleEn(setTipoSeleccionado, ANUNCIOS_TAG)}
                  >
                    Anuncios
                  </FilterPill>
                )}
                {hayPoemas && (
                  <FilterPill
                    seleccionado={tipoSeleccionado.has(POEMA_TAG)}
                    color="magenta"
                    onClick={() => toggleEn(setTipoSeleccionado, POEMA_TAG)}
                  >
                    Poemas
                  </FilterPill>
                )}
                {hayObraGrafica && (
                  <FilterPill
                    seleccionado={tipoSeleccionado.has(OBRA_GRAFICA_TAG)}
                    color="teja"
                    onClick={() => toggleEn(setTipoSeleccionado, OBRA_GRAFICA_TAG)}
                  >
                    Obra gráfica
                  </FilterPill>
                )}
              </FilterGroup>
            )}

            {temas.length > 0 && (
              <FilterGroup label="Materias">
                {temas.map((tema) => (
                  <FilterPill
                    key={tema.documentId}
                    seleccionado={temasSeleccionados.has(tema.documentId)}
                    color="azul"
                    onClick={() => toggleEn(setTemasSeleccionados, tema.documentId)}
                  >
                    {tema.nombre}
                  </FilterPill>
                ))}
              </FilterGroup>
            )}
          </div>
        )}
      </div>

      <div ref={resultadosRef} className="scroll-mt-28">
        {articulosFiltrados.length === 0 ? (
          <p className="text-zinc-500">
            {articles.length === 0
              ? "No se han encontrado artículos."
              : "No hay artículos que coincidan con los filtros seleccionados."}
          </p>
        ) : (
          <ol className="flex flex-col divide-y divide-zinc-200 dark:divide-zinc-800">
            {articulosFiltrados.map((article) => {
              const authors = article.authors ?? [];

              return (
                <li key={article.id} className="flex flex-col gap-1 py-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/articulos/${article.slug}`}
                      className="font-medium hover:text-teja dark:hover:text-teja-claro"
                    >
                      {article.titulo}
                    </Link>
                    {article.es_anuncio && <Badge color="verde">Anuncio</Badge>}
                    {article.es_poema && <Badge color="magenta">Poema</Badge>}
                    {article.es_obra_grafica && !article.es_anuncio && (
                      <Badge color="teja">Obra gráfica</Badge>
                    )}
                  </div>
                  {authors.length > 0 && (
                    <p className="text-sm font-light text-zinc-500 dark:text-zinc-400">
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
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </div>
  );
}
