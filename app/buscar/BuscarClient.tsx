"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AuthorCombobox } from "@/components/AuthorCombobox";
import { Button } from "@/components/Button";
import { Pagination } from "@/components/Pagination";
import { useModoNavegacion } from "@/lib/modoNavegacion";
import {
  buscarEnTexto,
  buscarSemantico,
  getPublications,
  searchArticles,
  type Article,
  type BusquedaTextoResponse,
  type BusquedaSemanticaResponse,
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
  const { modo, setModo } = useModoNavegacion();
  const modoInvestigacion = modo === "investigacion";

  // --- Ámbito de la URL: búsqueda general ---
  const q = searchParams.get("q") ?? "";
  const publicacionSlug = searchParams.get("publicacion") ?? "";
  const autorSlug = searchParams.get("autor") ?? "";
  const desde = searchParams.get("desde") ?? "";
  const hasta = searchParams.get("hasta") ?? "";
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const hasFiltrosGenerales = Boolean(q || publicacionSlug || autorSlug || desde || hasta);

  // --- Ámbito de la URL: búsqueda semántica ---
  const semantica = searchParams.get("semantica") ?? "";
  const revistaSemantica = searchParams.get("revistaSem") ?? "";
  const autorSemantica = searchParams.get("autorSem") ?? "";
  const desdeSemantica = searchParams.get("desdeSem") ?? "";
  const hastaSemantica = searchParams.get("hastaSem") ?? "";
  const pageSemantica = Math.max(1, Number(searchParams.get("pageSem")) || 1);
  const semanticaValida = semantica.trim().length >= 3;

  // --- Ámbito de la URL: búsqueda avanzada (booleana) en texto ---
  const frase = searchParams.get("frase") ?? "";
  const operador1Param = searchParams.get("operador1") ?? "";
  const palabra2Param = searchParams.get("palabra2") ?? "";
  const operador2Param = searchParams.get("operador2") ?? "";
  const palabra3Param = searchParams.get("palabra3") ?? "";
  const publicacionSlugTexto = searchParams.get("revistaTexto") ?? "";
  const autorSlugTexto = searchParams.get("autorTexto") ?? "";
  // Ámbito de la búsqueda avanzada: por defecto ambos activos (si el
  // parámetro no está en la URL todavía, ningún checkbox se ha desmarcado).
  const enTituloAutorParam = searchParams.get("enTituloAutor");
  const enTextoParam = searchParams.get("enTexto");
  const enPiesImagenParam = searchParams.get("enPiesImagen");
  const ambitoTituloAutor = enTituloAutorParam !== "false";
  const ambitoTexto = enTextoParam !== "false";
  const ambitoPiesImagen = enPiesImagenParam === "true";
  const desdeTexto = searchParams.get("desdeTexto") ?? "";
  const hastaTexto = searchParams.get("hastaTexto") ?? "";
  const pageTexto = Math.max(1, Number(searchParams.get("pageTexto")) || 1);
  const fraseValida = frase.trim().length >= 3;

  const [avisoFraseCorta, setAvisoFraseCorta] = useState(false);
  const [avisoPalabra2Corta, setAvisoPalabra2Corta] = useState(false);
  const [avisoPalabra3Corta, setAvisoPalabra3Corta] = useState(false);
  const [avisoSinAmbito, setAvisoSinAmbito] = useState(false);

  // `key` de cada <form>: los campos son no controlados (defaultValue/
  // defaultChecked), así que solo reflejan un cambio en la URL si el propio
  // <form> se remonta. Al derivarla de los valores actuales (en vez de un
  // contador incrementado a mano junto al router.push, que remontaría con
  // el valor todavía viejo antes de que la navegación termine), el remontaje
  // ocurre exactamente cuando cambian, tanto al buscar como al limpiar.
  // Los slugs de autores se gestionan por estado (AuthorCombobox), no por
  // remontaje de formulario, así que se excluyen de las claves de formulario.
  const formKeyGeneral = `${q}|${publicacionSlug}|${desde}|${hasta}`;
  const formKeyExacta = [
    frase,
    operador1Param,
    palabra2Param,
    operador2Param,
    palabra3Param,
    publicacionSlugTexto,
    enTituloAutorParam,
    enTextoParam,
    enPiesImagenParam,
    desdeTexto,
    hastaTexto,
  ].join("|");

  const [publications, setPublications] = useState<Publication[]>([]);

  // Slugs de autor seleccionados en cada modo (fuera del FormData porque
  // AuthorCombobox es un componente controlado que no usa <select> nativo).
  const [autorSelGeneral, setAutorSelGeneral] = useState(autorSlug);
  const [autorSelTexto, setAutorSelTexto] = useState(autorSlugTexto);
  const [autorSelSem, setAutorSelSem] = useState(autorSemantica);

  const [statusGeneral, setStatusGeneral] = useState<Status>("idle");
  const [articles, setArticles] = useState<Article[]>([]);
  const [totalGeneral, setTotalGeneral] = useState(0);
  const [pageCountGeneral, setPageCountGeneral] = useState(0);

  const [statusExacta, setStatusExacta] = useState<Status>("idle");
  const [resultado, setResultado] = useState<BusquedaTextoResponse | null>(null);

  const [modoAvanzado, setModoAvanzado] = useState<"exacta" | "semantica">("exacta");
  const [statusSemantica, setStatusSemantica] = useState<Status>("idle");
  const [resultadoSemantico, setResultadoSemantico] = useState<BusquedaSemanticaResponse | null>(null);
  const resultadosSemanticaRef = useRef<HTMLDivElement>(null);

  // Al completarse una búsqueda, se desplaza la vista hasta los resultados
  // para que se note que han llegado (el formulario puede dejarlos fuera de
  // la pantalla visible, especialmente en móvil).
  const resultadosGeneralRef = useRef<HTMLDivElement>(null);
  const resultadosExactaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (statusGeneral === "success" && hasFiltrosGenerales) {
      resultadosGeneralRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [statusGeneral, hasFiltrosGenerales]);

  useEffect(() => {
    if (statusExacta === "success") {
      resultadosExactaRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [statusExacta]);

  useEffect(() => {
    if (statusSemantica === "success") {
      resultadosSemanticaRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [statusSemantica]);


  useEffect(() => {
    getPublications(1, 100).then((res) => setPublications(res.data)).catch(() => {});
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
    if (!semanticaValida || !modoInvestigacion) return;
    let activo = true;
    Promise.resolve().then(() => { if (activo) setStatusSemantica("loading"); });
    buscarSemantico(semantica, pageSemantica, PAGE_SIZE, {
      publicationSlug: revistaSemantica || undefined,
      authorSlug: autorSemantica || undefined,
      yearFrom: desdeSemantica ? Number(desdeSemantica) : undefined,
      yearTo: hastaSemantica ? Number(hastaSemantica) : undefined,
    })
      .then(res => { if (!activo) return; setResultadoSemantico(res); setStatusSemantica("success"); })
      .catch(() => { if (!activo) return; setStatusSemantica("error"); });
    return () => { activo = false; };
  }, [semantica, pageSemantica, semanticaValida, modoInvestigacion, revistaSemantica, autorSemantica, desdeSemantica, hastaSemantica]);

  useEffect(() => {
    if (!fraseValida || !modoInvestigacion) return;
    if (!ambitoTituloAutor && !ambitoTexto && !ambitoPiesImagen) return;

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
      enTituloAutor: ambitoTituloAutor,
      enTexto: ambitoTexto,
      enPiesImagen: ambitoPiesImagen || undefined,
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
    ambitoTituloAutor,
    ambitoTexto,
    ambitoPiesImagen,
    desdeTexto,
    hastaTexto,
    operador1Param,
    palabra2Param,
    operador2Param,
    palabra3Param,
  ]);

  function handleSubmitSemantica(formData: FormData) {
    const q = String(formData.get("semantica") ?? "").trim();
    if (q.length < 3) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("semantica", q);
    const rev = String(formData.get("revistaSem") ?? "");
    const dsd = String(formData.get("desdeSem") ?? "");
    const hst = String(formData.get("hastaSem") ?? "");
    if (rev) params.set("revistaSem", rev); else params.delete("revistaSem");
    if (autorSelSem) params.set("autorSem", autorSelSem); else params.delete("autorSem");
    if (dsd) params.set("desdeSem", dsd);   else params.delete("desdeSem");
    if (hst) params.set("hastaSem", hst);   else params.delete("hastaSem");
    params.delete("pageSem");
    router.push(`/buscar?${params.toString()}`);
  }

  function handleLimpiarSemantica() {
    const params = new URLSearchParams(searchParams.toString());
    ["semantica", "revistaSem", "autorSem", "desdeSem", "hastaSem", "pageSem"].forEach(k => params.delete(k));
    setAutorSelSem("");
    router.push(`/buscar?${params.toString()}`);
  }

  function handleSubmitGeneral(formData: FormData) {
    const params = new URLSearchParams(searchParams.toString());

    const qValue = String(formData.get("q") ?? "").trim();
    const publicacion = String(formData.get("publicacion") ?? "");
    const desdeValue = String(formData.get("desde") ?? "");
    const hastaValue = String(formData.get("hasta") ?? "");

    if (qValue) params.set("q", qValue);
    else params.delete("q");
    if (publicacion) params.set("publicacion", publicacion);
    else params.delete("publicacion");
    if (autorSelGeneral) params.set("autor", autorSelGeneral);
    else params.delete("autor");
    if (desdeValue) params.set("desde", desdeValue);
    else params.delete("desde");
    if (hastaValue) params.set("hasta", hastaValue);
    else params.delete("hasta");
    params.delete("page");

    router.push(`/buscar?${params.toString()}`);
  }

  function handleLimpiarGeneral() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("q");
    params.delete("publicacion");
    params.delete("autor");
    params.delete("desde");
    params.delete("hasta");
    params.delete("page");
    setAutorSelGeneral("");
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

    const enTituloAutorChecked = formData.get("enTituloAutor") !== null;
    const enTextoChecked = formData.get("enTexto") !== null;
    const enPiesImagenChecked = formData.get("enPiesImagen") !== null;

    if (!enTituloAutorChecked && !enTextoChecked && !enPiesImagenChecked) {
      setAvisoSinAmbito(true);
      return;
    }
    setAvisoSinAmbito(false);

    const params = new URLSearchParams(searchParams.toString());
    params.set("frase", trimmed);
    params.set("enTituloAutor", enTituloAutorChecked ? "true" : "false");
    params.set("enTexto", enTextoChecked ? "true" : "false");
    if (enPiesImagenChecked) params.set("enPiesImagen", "true");
    else params.delete("enPiesImagen");

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
    const desdeValue = String(formData.get("desdeTexto") ?? "");
    const hastaValue = String(formData.get("hastaTexto") ?? "");

    if (revista) params.set("revistaTexto", revista);
    else params.delete("revistaTexto");
    if (autorSelTexto) params.set("autorTexto", autorSelTexto);
    else params.delete("autorTexto");
    if (desdeValue) params.set("desdeTexto", desdeValue);
    else params.delete("desdeTexto");
    if (hastaValue) params.set("hastaTexto", hastaValue);
    else params.delete("hastaTexto");
    params.delete("pageTexto");

    router.push(`/buscar?${params.toString()}`);
  }

  function handleLimpiarExacta() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("frase");
    params.delete("operador1");
    params.delete("palabra2");
    params.delete("operador2");
    params.delete("palabra3");
    params.delete("revistaTexto");
    params.delete("autorTexto");
    params.delete("enTituloAutor");
    params.delete("enTexto");
    params.delete("enPiesImagen");
    params.delete("desdeTexto");
    params.delete("hastaTexto");
    params.delete("pageTexto");
    setAvisoFraseCorta(false);
    setAvisoPalabra2Corta(false);
    setAvisoPalabra3Corta(false);
    setAvisoSinAmbito(false);
    setAutorSelTexto("");
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
  if (enTituloAutorParam) extraParamsGeneral.enTituloAutor = enTituloAutorParam;
  if (enTextoParam) extraParamsGeneral.enTexto = enTextoParam;
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
  if (enTituloAutorParam) extraParamsExacta.enTituloAutor = enTituloAutorParam;
  if (enTextoParam) extraParamsExacta.enTexto = enTextoParam;
  if (enPiesImagenParam) extraParamsExacta.enPiesImagen = enPiesImagenParam;
  if (desdeTexto) extraParamsExacta.desdeTexto = desdeTexto;
  if (hastaTexto) extraParamsExacta.hastaTexto = hastaTexto;

  return (
    <div className="flex flex-col gap-10">
      {!modoInvestigacion && (
      <div className="flex flex-col gap-6">
        <div>
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="font-titulo text-xl font-semibold text-teja dark:text-teja-claro">
              Búsqueda rápida
            </h2>
            <button
              type="button"
              onClick={() => setModo("investigacion")}
              className="text-sm font-medium text-azul hover:underline dark:text-azul-claro"
            >
              Pasar a búsqueda avanzada →
            </button>
          </div>
          <p className="mt-2 border-l-4 border-teja bg-gris-claro px-4 py-3 text-sm font-light text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
            Busca por palabras en el título de los artículos o en el nombre
            de los autores. Puedes combinar los filtros de revista y rango de
            años para acotar los resultados. Esta búsqueda no analiza el
            contenido completo de los textos.
          </p>
        </div>

        <form
          key={formKeyGeneral}
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
              <AuthorCombobox
                id="autor"
                value={autorSelGeneral}
                onChange={(slug) => setAutorSelGeneral(slug)}
                placeholder="Todos los autores"
              />
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

          <div className="flex gap-3">
            <Button type="submit" variant="primary">
              Buscar
            </Button>
            <Button type="button" variant="secondary" onClick={handleLimpiarGeneral}>
              Limpiar
            </Button>
          </div>
        </form>

        <section ref={resultadosGeneralRef}>
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
      )}

      {modoInvestigacion && (
      <div className="flex flex-col gap-6">
        <div>
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="font-titulo text-xl font-semibold text-azul dark:text-azul-claro">
              Búsqueda avanzada
            </h2>
            <button
              type="button"
              onClick={() => setModo("lectura")}
              className="text-sm font-medium text-teja hover:underline dark:text-teja-claro"
            >
              ← Volver a búsqueda simple
            </button>
          </div>

          {/* Toggle exacta / semántica */}
          <div className="mt-4 flex gap-1 border-b border-zinc-200 dark:border-zinc-800">
            {(["exacta", "semantica"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setModoAvanzado(m)}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  modoAvanzado === m
                    ? "border-b-2 border-azul text-azul dark:border-azul-claro dark:text-azul-claro"
                    : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
                }`}
              >
                {m === "exacta" ? "Búsqueda exacta" : "Búsqueda semántica"}
              </button>
            ))}
          </div>

          {modoAvanzado === "exacta" && (
            <p className="mt-3 border-l-4 border-azul bg-gris-claro px-4 py-3 text-sm font-light text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
              Busca una palabra o frase <strong className="font-medium">literal</strong> en el contenido completo de los artículos.
              Útil para localizar citas, términos específicos o expresiones concretas tal como aparecen en el texto original.
              Puedes encadenar hasta 3 palabras con operadores Y / O / NO.
            </p>
          )}
          {modoAvanzado === "semantica" && (
            <p className="mt-3 border-l-4 border-azul bg-gris-claro px-4 py-3 text-sm font-light text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
              Busca por <strong className="font-medium">significado</strong>, no por palabras exactas.
              Escribe una idea, concepto o frase en lenguaje natural y el sistema encontrará los artículos
              más relacionados semánticamente, aunque no contengan exactamente esas palabras.
              Cada resultado muestra su grado de similitud (0–1).
            </p>
          )}
        </div>

        {modoAvanzado === "semantica" && (
          <>
            <form
              key={semantica}
              action={handleSubmitSemantica}
              className="flex flex-col gap-4 rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-negro"
            >
              <div className="flex flex-col gap-1.5">
                <label htmlFor="semantica" className="text-sm font-medium">Consulta</label>
                <input
                  id="semantica"
                  name="semantica"
                  type="text"
                  defaultValue={semantica}
                  placeholder="Describe una idea, concepto o pregunta…"
                  className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="revistaSem" className="text-sm font-medium">Revista</label>
                  <select id="revistaSem" name="revistaSem" defaultValue={revistaSemantica}
                    className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900">
                    <option value="">Todas las revistas</option>
                    {publications.map(p => <option key={p.slug} value={p.slug}>{p.titulo}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="autorSem" className="text-sm font-medium">Autor</label>
                  <AuthorCombobox
                    id="autorSem"
                    value={autorSelSem}
                    onChange={(slug) => setAutorSelSem(slug)}
                    placeholder="Todos los autores"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 sm:max-w-xs">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="desdeSem" className="text-sm font-medium">Año desde</label>
                  <input id="desdeSem" name="desdeSem" type="number" inputMode="numeric"
                    defaultValue={desdeSemantica} placeholder="1900"
                    className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="hastaSem" className="text-sm font-medium">Año hasta</label>
                  <input id="hastaSem" name="hastaSem" type="number" inputMode="numeric"
                    defaultValue={hastaSemantica} placeholder="1936"
                    className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900" />
                </div>
              </div>
              <div className="flex gap-3">
                <Button type="submit" variant="azul">Buscar</Button>
                <Button type="button" variant="secondary-azul" onClick={handleLimpiarSemantica}>Limpiar</Button>
              </div>
            </form>

            <section ref={resultadosSemanticaRef}>
              {semanticaValida && statusSemantica === "loading" && (
                <p className="text-sm font-light text-zinc-500">Buscando…</p>
              )}
              {semanticaValida && statusSemantica === "error" && (
                <p className="text-sm text-red-600 dark:text-red-400">No se ha podido completar la búsqueda semántica. Inténtalo de nuevo.</p>
              )}
              {!semanticaValida && (
                <p className="text-zinc-500">Describe una idea o concepto para encontrar artículos relacionados semánticamente.</p>
              )}
              {semanticaValida && statusSemantica === "success" && resultadoSemantico && (
                <>
                  {resultadoSemantico.data.length === 0 ? (
                    <p className="text-zinc-500">No se han encontrado resultados.</p>
                  ) : (
                    <>
                      <p className="mb-4 text-sm font-light text-zinc-500 dark:text-zinc-400">
                        {resultadoSemantico.meta.total} artículo{resultadoSemantico.meta.total === 1 ? "" : "s"} relacionados con "{semantica}"
                      </p>
                      <ol className="flex flex-col divide-y divide-zinc-200 dark:divide-zinc-800">
                        {resultadoSemantico.data.map(item => (
                          <li key={item.id} className="flex flex-col gap-1 py-4">
                            <div className="flex items-start justify-between gap-3">
                              <Link href={`/articulos/${item.slug}`}
                                className="font-medium hover:text-azul dark:hover:text-azul-claro">
                                {item.titulo}
                              </Link>
                              <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                                item.similitud >= 0.5 ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300"
                                : item.similitud >= 0.4 ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300"
                                : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                              }`}>
                                {Math.round(item.similitud * 100)}%
                              </span>
                            </div>
                            <p className="text-sm font-light text-zinc-500 dark:text-zinc-400">
                              {item.autores.length > 0 && item.autores.join(", ")}
                              {item.autores.length > 0 && " · "}
                              {item.revista}
                              {item.numero_orden !== null && ` · Nº ${item.numero_orden}`}
                              {item.año !== null && ` · ${item.año}`}
                            </p>
                            <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                              {item.fragmento}
                            </p>
                          </li>
                        ))}
                      </ol>
                      <Pagination
                        basePath="/buscar"
                        currentPage={pageSemantica}
                        pageCount={resultadoSemantico.meta.pageCount}
                        pageParam="pageSem"
                        extraParams={{ semantica, ...(revistaSemantica && { revistaSem: revistaSemantica }), ...(autorSemantica && { autorSem: autorSemantica }), ...(desdeSemantica && { desdeSem: desdeSemantica }), ...(hastaSemantica && { hastaSem: hastaSemantica }) }}
                      />
                    </>
                  )}
                </>
              )}
            </section>
          </>
        )}

        {modoAvanzado === "exacta" && (
        <>
        <form
          key={formKeyExacta}
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
              <AuthorCombobox
                id="autorTexto"
                value={autorSelTexto}
                onChange={(slug) => setAutorSelTexto(slug)}
                placeholder="Todos los autores"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">¿Dónde buscar?</span>

            <label className="flex items-start gap-2 text-sm font-light text-zinc-700 dark:text-zinc-300">
              <input
                type="checkbox"
                name="enTituloAutor"
                defaultChecked={ambitoTituloAutor}
                onChange={() => {
                  if (avisoSinAmbito) setAvisoSinAmbito(false);
                }}
                className="mt-0.5 h-4 w-4 accent-azul"
              />
              Buscar en el título y autor
            </label>

            <label className="flex items-start gap-2 text-sm font-light text-zinc-700 dark:text-zinc-300">
              <input
                type="checkbox"
                name="enTexto"
                defaultChecked={ambitoTexto}
                onChange={() => {
                  if (avisoSinAmbito) setAvisoSinAmbito(false);
                }}
                className="mt-0.5 h-4 w-4 accent-azul"
              />
              Buscar en los textos de los artículos
            </label>

            <label className="flex items-start gap-2 text-sm font-light text-zinc-700 dark:text-zinc-300">
              <input
                type="checkbox"
                name="enPiesImagen"
                defaultChecked={ambitoPiesImagen}
                onChange={() => {
                  if (avisoSinAmbito) setAvisoSinAmbito(false);
                }}
                className="mt-0.5 h-4 w-4 accent-azul"
              />
              Buscar en pies de imagen
            </label>

            {avisoSinAmbito && (
              <p className="text-sm text-red-600 dark:text-red-400">
                Selecciona al menos una opción de dónde buscar.
              </p>
            )}
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

          <div className="flex gap-3">
            <Button type="submit" variant="azul">
              Buscar en textos
            </Button>
            <Button type="button" variant="secondary-azul" onClick={handleLimpiarExacta}>
              Limpiar
            </Button>
          </div>
        </form>

        <section ref={resultadosExactaRef}>
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
                    {resultado.meta.total === 1 ? "" : "s"} con la expresión "
                    {frase}"
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
        </>
        )}
      </div>
      )}
    </div>
  );
}
