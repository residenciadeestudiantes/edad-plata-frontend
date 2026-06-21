"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/Button";
import { Pagination } from "@/components/Pagination";
import { useModoNavegacion } from "@/lib/modoNavegacion";
import {
  buscarEnTexto,
  getAuthors,
  getPublications,
  searchArticles,
  type Article,
  type Author,
  type BusquedaTextoResponse,
  type OperadorBooleano,
  type Publication,
} from "@/lib/api";

const PAGE_SIZE = 20;

const MESES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

type Status = "idle" | "loading" | "success" | "error";

// Resalta la coincidencia que el backend marca entre **asteriscos** con
// fondo amarillo pálido.
function highlightFragmento(fragmento: string) {
  const parts = fragmento.split(/\*\*(.+?)\*\*/g);
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <mark
        key={i}
        className="rounded bg-yellow-200 px-0.5 text-negro dark:bg-yellow-500/40 dark:text-blanco"
      >
        {part}
      </mark>
    ) : (
      part
    )
  );
}

const ETIQUETAS_OPERADOR: Record<OperadorBooleano, string> = {
  AND: "Y — también debe aparecer",
  OR: "O — puede aparecer en su lugar",
  NOT: "NO — no debe aparecer",
};

// Construye progresivamente la cadena booleana de la búsqueda avanzada:
// palabra 1 [operador palabra 2 [operador palabra 3]]. Es un componente
// aparte (con `key` en el punto de uso) para que su estado de "qué cajas
// están desplegadas" se reinicie solo al cambiar de búsqueda, sin afectar al
// resto de BuscarClient. Los campos viven dentro del <form> del padre, así
// que participan igual en su FormData al enviarlo.
function ConstructorBooleano({
  operador1Inicial,
  palabra2Inicial,
  operador2Inicial,
  palabra3Inicial,
  avisoPalabra2Corta,
  onCambiarPalabra2,
  avisoPalabra3Corta,
  onCambiarPalabra3,
}: {
  operador1Inicial: string;
  palabra2Inicial: string;
  operador2Inicial: string;
  palabra3Inicial: string;
  avisoPalabra2Corta: boolean;
  onCambiarPalabra2: () => void;
  avisoPalabra3Corta: boolean;
  onCambiarPalabra3: () => void;
}) {
  const [operador1, setOperador1] = useState(operador1Inicial);
  const [operador2, setOperador2] = useState(operador2Inicial);
  const [mostrarCondicion2, setMostrarCondicion2] = useState(Boolean(operador2Inicial));

  return (
    <>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="operador1" className="text-sm font-medium">
          Combinar con otra palabra (opcional)
        </label>
        <select
          id="operador1"
          name="operador1"
          value={operador1}
          onChange={(event) => setOperador1(event.target.value)}
          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        >
          <option value="">Sin combinar (solo la palabra 1)</option>
          {Object.entries(ETIQUETAS_OPERADOR).map(([valor, etiqueta]) => (
            <option key={valor} value={valor}>
              {etiqueta}
            </option>
          ))}
        </select>
      </div>

      {operador1 && (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="palabra2" className="text-sm font-medium">
            Palabra 2
          </label>
          <input
            id="palabra2"
            name="palabra2"
            type="text"
            defaultValue={palabra2Inicial}
            onChange={onCambiarPalabra2}
            placeholder="Segunda palabra…"
            className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
          {avisoPalabra2Corta && (
            <p className="text-sm text-red-600 dark:text-red-400">
              Introduce al menos 3 caracteres.
            </p>
          )}
        </div>
      )}

      {operador1 && !mostrarCondicion2 && (
        <button
          type="button"
          onClick={() => setMostrarCondicion2(true)}
          className="self-start text-sm font-medium text-azul hover:underline dark:text-azul-claro"
        >
          + Añadir otra condición
        </button>
      )}

      {operador1 && mostrarCondicion2 && (
        <>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="operador2" className="text-sm font-medium">
              Combinar con una tercera palabra
            </label>
            <select
              id="operador2"
              name="operador2"
              value={operador2}
              onChange={(event) => setOperador2(event.target.value)}
              className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            >
              <option value="">Selecciona…</option>
              {Object.entries(ETIQUETAS_OPERADOR).map(([valor, etiqueta]) => (
                <option key={valor} value={valor}>
                  {etiqueta}
                </option>
              ))}
            </select>
          </div>

          {operador2 && (
            <div className="flex flex-col gap-1.5">
              <label htmlFor="palabra3" className="text-sm font-medium">
                Palabra 3
              </label>
              <input
                id="palabra3"
                name="palabra3"
                type="text"
                defaultValue={palabra3Inicial}
                onChange={onCambiarPalabra3}
                placeholder="Tercera palabra…"
                className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              />
              {avisoPalabra3Corta && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  Introduce al menos 3 caracteres.
                </p>
              )}
            </div>
          )}
        </>
      )}
    </>
  );
}

export function BuscarClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { modo } = useModoNavegacion();
  const modoInvestigacion = modo === "investigacion";

  // --- Ámbito de la URL: búsqueda general ---
  const q = searchParams.get("q") ?? "";
  const publicacionSlug = searchParams.get("publicacion") ?? "";
  const autorSlug = searchParams.get("autor") ?? "";
  const desde = searchParams.get("desde") ?? "";
  const hasta = searchParams.get("hasta") ?? "";
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const hasFiltrosGenerales = Boolean(q || publicacionSlug || autorSlug || desde || hasta);

  // --- Ámbito de la URL: búsqueda avanzada (booleana) en texto ---
  const frase = searchParams.get("frase") ?? "";
  const operador1Param = searchParams.get("operador1") ?? "";
  const palabra2Param = searchParams.get("palabra2") ?? "";
  const operador2Param = searchParams.get("operador2") ?? "";
  const palabra3Param = searchParams.get("palabra3") ?? "";
  const publicacionSlugTexto = searchParams.get("revistaTexto") ?? "";
  const autorSlugTexto = searchParams.get("autorTexto") ?? "";
  const desdeTexto = searchParams.get("desdeTexto") ?? "";
  const hastaTexto = searchParams.get("hastaTexto") ?? "";
  const pageTexto = Math.max(1, Number(searchParams.get("pageTexto")) || 1);
  const fraseValida = frase.trim().length >= 3;

  const [avisoFraseCorta, setAvisoFraseCorta] = useState(false);
  const [avisoPalabra2Corta, setAvisoPalabra2Corta] = useState(false);
  const [avisoPalabra3Corta, setAvisoPalabra3Corta] = useState(false);

  const [publications, setPublications] = useState<Publication[]>([]);
  const [authors, setAuthors] = useState<Author[]>([]);

  const [statusGeneral, setStatusGeneral] = useState<Status>("idle");
  const [articles, setArticles] = useState<Article[]>([]);
  const [totalGeneral, setTotalGeneral] = useState(0);
  const [pageCountGeneral, setPageCountGeneral] = useState(0);

  const [statusExacta, setStatusExacta] = useState<Status>("idle");
  const [resultado, setResultado] = useState<BusquedaTextoResponse | null>(null);

  useEffect(() => {
    getPublications(1, 100).then((res) => setPublications(res.data)).catch(() => {});
    getAuthors(1, 500).then((res) => setAuthors(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!hasFiltrosGenerales) return;

    let activo = true;

    Promise.resolve().then(() => {
      if (activo) setStatusGeneral("loading");
    });

    searchArticles({
      query: q || undefined,
      publicationSlug: publicacionSlug || undefined,
      authorSlug: autorSlug || undefined,
      yearFrom: desde ? Number(desde) : undefined,
      yearTo: hasta ? Number(hasta) : undefined,
      page,
      pageSize: PAGE_SIZE,
    })
      .then((res) => {
        if (!activo) return;
        setArticles(res.data);
        setTotalGeneral(res.meta.pagination.total);
        setPageCountGeneral(res.meta.pagination.pageCount);
        setStatusGeneral("success");
      })
      .catch((error) => {
        if (!activo) return;
        console.error("Error en la búsqueda general", error);
        setStatusGeneral("error");
      });

    return () => {
      activo = false;
    };
  }, [q, publicacionSlug, autorSlug, desde, hasta, page, hasFiltrosGenerales]);

  useEffect(() => {
    if (!fraseValida || !modoInvestigacion) return;

    let activo = true;

    Promise.resolve().then(() => {
      if (activo) setStatusExacta("loading");
    });

    buscarEnTexto(frase, pageTexto, PAGE_SIZE, {
      publicationSlug: publicacionSlugTexto || undefined,
      authorSlug: autorSlugTexto || undefined,
      yearFrom: desdeTexto ? Number(desdeTexto) : undefined,
      yearTo: hastaTexto ? Number(hastaTexto) : undefined,
      operador1: (operador1Param as OperadorBooleano) || undefined,
      palabra2: palabra2Param || undefined,
      operador2: (operador2Param as OperadorBooleano) || undefined,
      palabra3: palabra3Param || undefined,
    })
      .then((res) => {
        if (!activo) return;
        setResultado(res);
        setStatusExacta("success");
      })
      .catch((error) => {
        if (!activo) return;
        console.error("Error en la búsqueda exacta", error);
        setStatusExacta("error");
      });

    return () => {
      activo = false;
    };
  }, [
    frase,
    pageTexto,
    fraseValida,
    modoInvestigacion,
    publicacionSlugTexto,
    autorSlugTexto,
    desdeTexto,
    hastaTexto,
    operador1Param,
    palabra2Param,
    operador2Param,
    palabra3Param,
  ]);

  function handleSubmitGeneral(formData: FormData) {
    const params = new URLSearchParams(searchParams.toString());

    const qValue = String(formData.get("q") ?? "").trim();
    const publicacion = String(formData.get("publicacion") ?? "");
    const autor = String(formData.get("autor") ?? "");
    const desdeValue = String(formData.get("desde") ?? "");
    const hastaValue = String(formData.get("hasta") ?? "");

    if (qValue) params.set("q", qValue);
    else params.delete("q");
    if (publicacion) params.set("publicacion", publicacion);
    else params.delete("publicacion");
    if (autor) params.set("autor", autor);
    else params.delete("autor");
    if (desdeValue) params.set("desde", desdeValue);
    else params.delete("desde");
    if (hastaValue) params.set("hasta", hastaValue);
    else params.delete("hasta");
    params.delete("page");

    router.push(`/buscar?${params.toString()}`);
  }

  function handleSubmitExacta(formData: FormData) {
    const trimmed = String(formData.get("frase") ?? "").trim();

    if (trimmed.length < 3) {
      setAvisoFraseCorta(true);
      return;
    }
    setAvisoFraseCorta(false);

    const operador1 = String(formData.get("operador1") ?? "");
    const palabra2 = String(formData.get("palabra2") ?? "").trim();
    const operador2 = String(formData.get("operador2") ?? "");
    const palabra3 = String(formData.get("palabra3") ?? "").trim();

    if (operador1 && palabra2.length < 3) {
      setAvisoPalabra2Corta(true);
      return;
    }
    setAvisoPalabra2Corta(false);

    if (operador1 && operador2 && palabra3.length < 3) {
      setAvisoPalabra3Corta(true);
      return;
    }
    setAvisoPalabra3Corta(false);

    const params = new URLSearchParams(searchParams.toString());
    params.set("frase", trimmed);

    if (operador1 && palabra2.length >= 3) {
      params.set("operador1", operador1);
      params.set("palabra2", palabra2);
      if (operador2 && palabra3.length >= 3) {
        params.set("operador2", operador2);
        params.set("palabra3", palabra3);
      } else {
        params.delete("operador2");
        params.delete("palabra3");
      }
    } else {
      params.delete("operador1");
      params.delete("palabra2");
      params.delete("operador2");
      params.delete("palabra3");
    }

    const revista = String(formData.get("revistaTexto") ?? "");
    const autor = String(formData.get("autorTexto") ?? "");
    const desdeValue = String(formData.get("desdeTexto") ?? "");
    const hastaValue = String(formData.get("hastaTexto") ?? "");

    if (revista) params.set("revistaTexto", revista);
    else params.delete("revistaTexto");
    if (autor) params.set("autorTexto", autor);
    else params.delete("autorTexto");
    if (desdeValue) params.set("desdeTexto", desdeValue);
    else params.delete("desdeTexto");
    if (hastaValue) params.set("hastaTexto", hastaValue);
    else params.delete("hastaTexto");
    params.delete("pageTexto");

    router.push(`/buscar?${params.toString()}`);
  }

  const extraParamsGeneral: Record<string, string> = {};
  if (frase) extraParamsGeneral.frase = frase;
  if (operador1Param) extraParamsGeneral.operador1 = operador1Param;
  if (palabra2Param) extraParamsGeneral.palabra2 = palabra2Param;
  if (operador2Param) extraParamsGeneral.operador2 = operador2Param;
  if (palabra3Param) extraParamsGeneral.palabra3 = palabra3Param;
  if (publicacionSlugTexto) extraParamsGeneral.revistaTexto = publicacionSlugTexto;
  if (autorSlugTexto) extraParamsGeneral.autorTexto = autorSlugTexto;
  if (desdeTexto) extraParamsGeneral.desdeTexto = desdeTexto;
  if (hastaTexto) extraParamsGeneral.hastaTexto = hastaTexto;

  const extraParamsExacta: Record<string, string> = {};
  if (q) extraParamsExacta.q = q;
  if (publicacionSlug) extraParamsExacta.publicacion = publicacionSlug;
  if (autorSlug) extraParamsExacta.autor = autorSlug;
  if (desde) extraParamsExacta.desde = desde;
  if (hasta) extraParamsExacta.hasta = hasta;
  if (frase) extraParamsExacta.frase = frase;
  if (operador1Param) extraParamsExacta.operador1 = operador1Param;
  if (palabra2Param) extraParamsExacta.palabra2 = palabra2Param;
  if (operador2Param) extraParamsExacta.operador2 = operador2Param;
  if (palabra3Param) extraParamsExacta.palabra3 = palabra3Param;
  if (publicacionSlugTexto) extraParamsExacta.revistaTexto = publicacionSlugTexto;
  if (autorSlugTexto) extraParamsExacta.autorTexto = autorSlugTexto;
  if (desdeTexto) extraParamsExacta.desdeTexto = desdeTexto;
  if (hastaTexto) extraParamsExacta.hastaTexto = hastaTexto;

  return (
    <div
      className={`grid grid-cols-1 gap-10 ${
        modoInvestigacion
          ? "lg:grid-cols-2 lg:divide-x lg:divide-zinc-200 lg:dark:divide-zinc-800"
          : ""
      }`}
    >
      <div
        className={`flex flex-col gap-6 border-t border-zinc-200 pt-8 first:border-t-0 first:pt-0 lg:border-t-0 lg:pt-0 ${
          modoInvestigacion ? "lg:pr-10" : ""
        }`}
      >
        <div>
          <h2 className="font-titulo text-xl font-semibold text-teja dark:text-teja-claro">
            Búsqueda rápida
          </h2>
          <p className="mt-2 border-l-4 border-teja bg-gris-claro px-4 py-3 text-sm font-light text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
            Busca por palabras en el título de los artículos o en el nombre
            de los autores. Puedes combinar los filtros de revista y rango de
            años para acotar los resultados. Esta búsqueda no analiza el
            contenido completo de los textos.
          </p>
        </div>

        <form
          action={handleSubmitGeneral}
          className="flex flex-col gap-4 rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-negro"
        >
          <div className="flex flex-col gap-1.5">
            <label htmlFor="q" className="text-sm font-medium">
              Buscar
            </label>
            <input
              key={q}
              id="q"
              name="q"
              type="text"
              defaultValue={q}
              placeholder="Título de artículo o nombre de autor"
              className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="publicacion" className="text-sm font-medium">
                Revista
              </label>
              <select
                id="publicacion"
                name="publicacion"
                defaultValue={publicacionSlug}
                className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              >
                <option value="">Todas las revistas</option>
                {publications.map((publication) => (
                  <option key={publication.slug} value={publication.slug}>
                    {publication.titulo}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="autor" className="text-sm font-medium">
                Autor
              </label>
              <select
                id="autor"
                name="autor"
                defaultValue={autorSlug}
                className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              >
                <option value="">Todos los autores</option>
                {authors.map((author) => (
                  <option key={author.slug} value={author.slug}>
                    {author.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:max-w-xs">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="desde" className="text-sm font-medium">
                Año desde
              </label>
              <input
                id="desde"
                name="desde"
                type="number"
                inputMode="numeric"
                defaultValue={desde}
                placeholder="1900"
                className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="hasta" className="text-sm font-medium">
                Año hasta
              </label>
              <input
                id="hasta"
                name="hasta"
                type="number"
                inputMode="numeric"
                defaultValue={hasta}
                placeholder="1936"
                className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              />
            </div>
          </div>

          <Button type="submit" variant="primary">
            Buscar
          </Button>
        </form>

        <section>
          {hasFiltrosGenerales && statusGeneral === "loading" && (
            <p className="text-sm font-light text-zinc-500">Buscando…</p>
          )}

          {hasFiltrosGenerales && statusGeneral === "error" && (
            <p className="text-sm text-red-600 dark:text-red-400">
              No se ha podido completar la búsqueda. Inténtalo de nuevo más
              tarde.
            </p>
          )}

          {!hasFiltrosGenerales && (
            <p className="text-zinc-500">
              Introduce un término de búsqueda o selecciona algún filtro para
              empezar.
            </p>
          )}

          {statusGeneral === "success" && hasFiltrosGenerales && (
            <>
              {articles.length === 0 ? (
                <p className="text-zinc-500">No se han encontrado resultados.</p>
              ) : (
                <>
                  <p className="mb-4 text-sm font-light text-zinc-500 dark:text-zinc-400">
                    {totalGeneral} resultado{totalGeneral === 1 ? "" : "s"}
                  </p>
                  <ol className="flex flex-col divide-y divide-zinc-200 dark:divide-zinc-800">
                    {articles.map((article) => {
                      const authorsList = article.authors ?? [];
                      const issue = article.issue;
                      const publication = issue?.publication;
                      const fecha = [issue?.mes ? MESES[issue.mes - 1] : null, issue?.año]
                        .filter(Boolean)
                        .join(" de ");

                      return (
                        <li key={article.id} className="flex flex-col gap-1 py-4">
                          <Link
                            href={`/articulos/${article.slug}`}
                            className="font-medium hover:text-teja dark:hover:text-teja-claro"
                          >
                            {article.titulo}
                          </Link>
                          <p className="text-sm font-light text-zinc-500 dark:text-zinc-400">
                            {authorsList.length > 0 &&
                              authorsList.map((author, i) => (
                                <span key={author.id}>
                                  {author.nombre}
                                  {i < authorsList.length - 1 && ", "}
                                </span>
                              ))}
                            {authorsList.length > 0 && publication && " · "}
                            {publication && publication.titulo}
                            {issue?.numero_orden !== null &&
                              issue?.numero_orden !== undefined &&
                              ` · Nº ${issue.numero_orden}`}
                            {fecha && ` · ${fecha}`}
                          </p>
                        </li>
                      );
                    })}
                  </ol>

                  <Pagination
                    basePath="/buscar"
                    currentPage={page}
                    pageCount={pageCountGeneral}
                    pageParam="page"
                    extraParams={extraParamsGeneral}
                  />
                </>
              )}
            </>
          )}
        </section>
      </div>

      {modoInvestigacion && (
      <div className="flex flex-col gap-6 border-t border-zinc-200 pt-8 lg:border-t-0 lg:pt-0 lg:pl-10">
        <div>
          <h2 className="font-titulo text-xl font-semibold text-azul dark:text-azul-claro">
            Búsqueda avanzada
          </h2>
          <p className="mt-2 border-l-4 border-azul bg-gris-claro px-4 py-3 text-sm font-light text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
            Busca una palabra o frase literal en el contenido completo de los
            artículos. Esta búsqueda encuentra coincidencias exactas en los
            textos transcritos, incluyendo el cuerpo de los artículos. Es
            especialmente útil para localizar citas, términos específicos o
            expresiones concretas. Escribe la palabra o frase tal como
            aparece en el texto original.
          </p>
          <p className="mt-2 text-sm font-light text-zinc-500 dark:text-zinc-400">
            <strong className="font-medium">Cómo usarla:</strong> escribe la
            palabra 1 y, si quieres, combínala con una palabra 2 usando{" "}
            <strong>Y</strong> (también debe aparecer en el mismo artículo),{" "}
            <strong>O</strong> (puede aparecer en su lugar) o{" "}
            <strong>NO</strong> (no debe aparecer). Puedes encadenar una
            tercera palabra de la misma forma, hasta un máximo de 3.
          </p>
        </div>

        <form
          action={handleSubmitExacta}
          className="flex flex-col gap-4 rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-negro"
        >
          <div className="flex flex-col gap-1.5">
            <label htmlFor="frase" className="text-sm font-medium">
              Palabra o frase 1
            </label>
            <input
              key={frase}
              id="frase"
              name="frase"
              type="text"
              defaultValue={frase}
              onChange={() => {
                if (avisoFraseCorta) setAvisoFraseCorta(false);
              }}
              placeholder="Escribe una palabra o frase…"
              className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            />
            {avisoFraseCorta && (
              <p className="text-sm text-red-600 dark:text-red-400">
                Introduce al menos 3 caracteres.
              </p>
            )}
          </div>

          <ConstructorBooleano
            key={frase}
            operador1Inicial={operador1Param}
            palabra2Inicial={palabra2Param}
            operador2Inicial={operador2Param}
            palabra3Inicial={palabra3Param}
            avisoPalabra2Corta={avisoPalabra2Corta}
            onCambiarPalabra2={() => {
              if (avisoPalabra2Corta) setAvisoPalabra2Corta(false);
            }}
            avisoPalabra3Corta={avisoPalabra3Corta}
            onCambiarPalabra3={() => {
              if (avisoPalabra3Corta) setAvisoPalabra3Corta(false);
            }}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="revistaTexto" className="text-sm font-medium">
                Revista
              </label>
              <select
                id="revistaTexto"
                name="revistaTexto"
                defaultValue={publicacionSlugTexto}
                className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              >
                <option value="">Todas las revistas</option>
                {publications.map((publication) => (
                  <option key={publication.slug} value={publication.slug}>
                    {publication.titulo}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="autorTexto" className="text-sm font-medium">
                Autor
              </label>
              <select
                id="autorTexto"
                name="autorTexto"
                defaultValue={autorSlugTexto}
                className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              >
                <option value="">Todos los autores</option>
                {authors.map((author) => (
                  <option key={author.slug} value={author.slug}>
                    {author.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:max-w-xs">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="desdeTexto" className="text-sm font-medium">
                Año desde
              </label>
              <input
                id="desdeTexto"
                name="desdeTexto"
                type="number"
                inputMode="numeric"
                defaultValue={desdeTexto}
                placeholder="1900"
                className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="hastaTexto" className="text-sm font-medium">
                Año hasta
              </label>
              <input
                id="hastaTexto"
                name="hastaTexto"
                type="number"
                inputMode="numeric"
                defaultValue={hastaTexto}
                placeholder="1936"
                className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              />
            </div>
          </div>

          <Button type="submit" variant="azul">
            Buscar en textos
          </Button>
        </form>

        <section>
          {fraseValida && statusExacta === "loading" && (
            <p className="text-sm font-light text-zinc-500">Buscando…</p>
          )}

          {fraseValida && statusExacta === "error" && (
            <p className="text-sm text-red-600 dark:text-red-400">
              No se ha podido completar la búsqueda. Inténtalo de nuevo más
              tarde.
            </p>
          )}

          {!fraseValida && (
            <p className="text-zinc-500">
              Escribe una frase de al menos 3 caracteres para buscar en el
              texto completo de los artículos.
            </p>
          )}

          {fraseValida && statusExacta === "success" && resultado && (
            <>
              {resultado.data.length === 0 ? (
                <p className="text-zinc-500">No hay coincidencia exacta.</p>
              ) : (
                <>
                  <p className="mb-4 text-sm font-light text-zinc-500 dark:text-zinc-400">
                    Se han encontrado {resultado.meta.total} artículo
                    {resultado.meta.total === 1 ? "" : "s"} con la expresión “
                    {frase}”
                  </p>
                  <ol className="flex flex-col divide-y divide-zinc-200 dark:divide-zinc-800">
                    {resultado.data.map((item) => (
                      <li key={item.id} className="flex flex-col gap-1 py-4">
                        <Link
                          href={`/articulos/${item.slug}`}
                          className="font-medium hover:text-azul dark:hover:text-azul-claro"
                        >
                          {item.titulo}
                        </Link>
                        <p className="text-sm font-light text-zinc-500 dark:text-zinc-400">
                          {item.autores.length > 0 && item.autores.join(", ")}
                          {item.autores.length > 0 && " · "}
                          {item.revista}
                          {item.numero_orden !== null && ` · Nº ${item.numero_orden}`}
                          {item.año !== null && ` · ${item.año}`}
                        </p>
                        <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                          {highlightFragmento(item.fragmento)}
                        </p>
                      </li>
                    ))}
                  </ol>

                  <Pagination
                    basePath="/buscar"
                    currentPage={pageTexto}
                    pageCount={resultado.meta.pageCount}
                    pageParam="pageTexto"
                    extraParams={extraParamsExacta}
                  />
                </>
              )}
            </>
          )}
        </section>
      </div>
      )}
    </div>
  );
}
