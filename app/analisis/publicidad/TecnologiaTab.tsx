"use client";

import { useEffect, useState } from "react";
import { PlotlyChart } from "@/components/PlotlyChart";
import {
  getPublicidadTendencias,
  getPublicidadPublicaciones,
  getListarCategorias,
  postDescubrirCategorias,
  postGuardarCategorias,
  postToggleCategoria,
  type PublicidadTendenciasResponse,
  type PublicidadPublicacion,
  type CategoriaTecnologicaDB,
} from "@/lib/api";

type Status = "idle" | "loading" | "success" | "error";

const GRUPOS_ORDEN = [
  "Tecnología",
  "Cultura",
  "Medicina e higiene",
  "Comercio",
  "Ocio y turismo",
];

const COLORES_GRUPO: Record<string, string> = {
  "Tecnología":          "#3838BD",
  "Cultura":             "#DA3C00",
  "Medicina e higiene":  "#008867",
  "Comercio":            "#DD158B",
  "Ocio y turismo":      "#CA8A04",
};

const COLORES_SUBCATEGORIA = [
  "#3838BD", "#6b7280", "#7c3aed", "#0891b2", "#b45309",
  "#16a34a", "#dc2626", "#2563eb", "#CA8A04", "#008867",
  "#DA3C00", "#DD158B",
];

type Sugerencia = { nombre: string; concepto: string; seleccionada: boolean };

function GestorCategorias({ onGuardado }: { onGuardado: () => void }) {
  const [categorias, setCategorias] = useState<CategoriaTecnologicaDB[] | null>(null);
  const [cargando, setCargando] = useState(false);
  const [sugerencias, setSugerencias] = useState<Sugerencia[] | null>(null);
  const [buscando, setBuscando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);

  async function cargarCategorias() {
    setCargando(true);
    try {
      const res = await getListarCategorias();
      setCategorias(res.categorias);
    } finally {
      setCargando(false);
    }
  }

  async function handleToggle(id: number) {
    const res = await postToggleCategoria(id);
    setCategorias((prev) =>
      prev ? prev.map((c) => (c.id === id ? { ...c, activa: res.activa } : c)) : prev
    );
    onGuardado();
  }

  async function handleDescubrir() {
    setBuscando(true);
    setSugerencias(null);
    setMensaje(null);
    try {
      const res = await postDescubrirCategorias();
      setSugerencias(res.sugerencias.map((s) => ({ ...s, seleccionada: true })));
    } catch (e) {
      setMensaje(e instanceof Error ? e.message : "Error al descubrir categorías.");
    } finally {
      setBuscando(false);
    }
  }

  async function handleGuardar() {
    if (!sugerencias) return;
    const seleccionadas = sugerencias.filter((s) => s.seleccionada);
    if (seleccionadas.length === 0) return;
    setGuardando(true);
    setMensaje(null);
    try {
      const res = await postGuardarCategorias(seleccionadas);
      setMensaje(
        res.insertadas === 0
          ? "Todas las categorías seleccionadas ya existían."
          : `${res.insertadas} categoría${res.insertadas !== 1 ? "s" : ""} añadida${res.insertadas !== 1 ? "s" : ""}.`
      );
      setSugerencias(null);
      const lista = await getListarCategorias();
      setCategorias(lista.categorias);
      onGuardado();
    } finally {
      setGuardando(false);
    }
  }

  if (!categorias && !cargando) {
    return (
      <button
        type="button"
        onClick={cargarCategorias}
        className="text-sm font-medium text-azul underline underline-offset-2 hover:opacity-70 dark:text-azul-claro"
      >
        Gestionar categorías
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-900">
      <p className="text-sm font-semibold text-negro dark:text-blanco">Categorías semánticas</p>
      {cargando && <p className="text-sm text-zinc-500">Cargando...</p>}
      {categorias && (
        <ul className="flex flex-col gap-1">
          {categorias.map((cat) => (
            <li key={cat.id} className="flex items-start gap-3">
              <button
                type="button"
                onClick={() => handleToggle(cat.id)}
                className={`mt-0.5 h-4 w-4 shrink-0 rounded border transition-colors ${
                  cat.activa
                    ? "border-azul bg-azul dark:border-azul-claro dark:bg-azul-claro"
                    : "border-zinc-400 bg-white dark:border-zinc-600 dark:bg-zinc-800"
                }`}
                title={cat.activa ? "Desactivar" : "Activar"}
              >
                {cat.activa && (
                  <svg viewBox="0 0 10 10" className="h-full w-full text-white" fill="none">
                    <path d="M2 5l2.5 2.5L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
              <div>
                <span className={`text-sm font-medium ${cat.activa ? "text-negro dark:text-blanco" : "text-zinc-400 line-through"}`}>
                  {cat.nombre}
                </span>
                <span className="ml-2 text-xs text-zinc-500">{cat.concepto}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
      {sugerencias && (
        <div className="flex flex-col gap-2 border-t border-zinc-200 pt-4 dark:border-zinc-700">
          <p className="text-sm font-medium text-negro dark:text-blanco">
            Nuevas categorías sugeridas por IA:
          </p>
          <ul className="flex flex-col gap-1">
            {sugerencias.map((s, i) => (
              <li key={i} className="flex items-start gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setSugerencias((prev) =>
                      prev ? prev.map((x, j) => (j === i ? { ...x, seleccionada: !x.seleccionada } : x)) : prev
                    )
                  }
                  className={`mt-0.5 h-4 w-4 shrink-0 rounded border transition-colors ${
                    s.seleccionada
                      ? "border-azul bg-azul dark:border-azul-claro dark:bg-azul-claro"
                      : "border-zinc-400 bg-white dark:border-zinc-600 dark:bg-zinc-800"
                  }`}
                >
                  {s.seleccionada && (
                    <svg viewBox="0 0 10 10" className="h-full w-full text-white" fill="none">
                      <path d="M2 5l2.5 2.5L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
                <div>
                  <span className="text-sm font-medium text-negro dark:text-blanco">{s.nombre}</span>
                  <span className="ml-2 text-xs text-zinc-500">{s.concepto}</span>
                </div>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={handleGuardar}
            disabled={guardando || sugerencias.every((s) => !s.seleccionada)}
            className="mt-1 w-fit rounded bg-azul px-3 py-1.5 text-sm font-medium text-white transition-opacity hover:opacity-80 disabled:opacity-40 dark:bg-azul-claro"
          >
            {guardando ? "Guardando..." : "Añadir seleccionadas"}
          </button>
        </div>
      )}
      {mensaje && <p className="text-sm text-zinc-600 dark:text-zinc-400">{mensaje}</p>}
      <div className="flex gap-3 border-t border-zinc-200 pt-3 dark:border-zinc-700">
        <button
          type="button"
          onClick={handleDescubrir}
          disabled={buscando}
          className="text-sm font-medium text-azul underline underline-offset-2 hover:opacity-70 disabled:opacity-40 dark:text-azul-claro"
        >
          {buscando ? "Analizando corpus con IA..." : "Descubrir nuevas categorías con IA"}
        </button>
      </div>
    </div>
  );
}

// Agrega subcategorías por grupo: suma de num_anuncios para todos los años
function agregarPorGrupo(categorias: PublicidadTendenciasResponse["categorias"]) {
  const porGrupo = new Map<string, Map<number, number>>();

  for (const cat of categorias) {
    const grupo = cat.grupo || "Otros";
    if (!porGrupo.has(grupo)) porGrupo.set(grupo, new Map());
    const yearMap = porGrupo.get(grupo)!;
    for (const { año, num_anuncios } of cat.serie) {
      yearMap.set(año, (yearMap.get(año) ?? 0) + num_anuncios);
    }
  }

  return GRUPOS_ORDEN
    .filter((g) => porGrupo.has(g))
    .map((grupo) => {
      const yearMap = porGrupo.get(grupo)!;
      return {
        grupo,
        serie: [...yearMap.entries()]
          .map(([año, num_anuncios]) => ({ año, num_anuncios }))
          .sort((a, b) => a.año - b.año),
      };
    });
}

export function TecnologiaTab() {
  const [status, setStatus] = useState<Status>("idle");
  const [data, setData] = useState<PublicidadTendenciasResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [publicaciones, setPublicaciones] = useState<PublicidadPublicacion[]>([]);
  const [publicacionSlug, setPublicacionSlug] = useState("");
  const [destacado, setDestacado] = useState<string | null>(null);
  const [grupoDesglose, setGrupoDesglose] = useState<string>(""); // "" = vista grupos

  useEffect(() => {
    getPublicidadPublicaciones()
      .then((r) => setPublicaciones(r.publicaciones))
      .catch(() => {});
  }, []);

  async function cargar(slug = publicacionSlug) {
    setStatus("loading");
    setErrorMessage(null);
    setDestacado(null);
    try {
      const res = await getPublicidadTendencias(slug || undefined);
      setData(res);
      setStatus("success");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "No se ha podido completar el análisis."
      );
      setStatus("error");
    }
  }

  function handlePublicacionChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const slug = e.target.value;
    setPublicacionSlug(slug);
    if (status === "success" || status === "error") cargar(slug);
  }

  function handleLegendClick(event: { curveNumber: number }) {
    const nombre = trazas[event.curveNumber]?.name;
    if (nombre) setDestacado((prev) => (prev === nombre ? null : nombre));
    return false;
  }

  const gruposAgregados = data ? agregarPorGrupo(data.categorias) : [];

  // Trazas según el modo actual
  const trazas: { name: string; x: number[]; y: number[]; color: string }[] = (() => {
    if (!data) return [];
    if (!grupoDesglose) {
      // Vista grupos: 5 líneas
      return gruposAgregados.map((g) => ({
        name: g.grupo,
        x: g.serie.map((p) => p.año),
        y: g.serie.map((p) => p.num_anuncios),
        color: COLORES_GRUPO[g.grupo] ?? "#6b7280",
      }));
    } else {
      // Vista desglose: subcategorías del grupo seleccionado
      const subs = data.categorias.filter((c) => c.grupo === grupoDesglose && c.serie.length > 0);
      return subs.map((cat, i) => ({
        name: cat.categoria,
        x: cat.serie.map((p) => p.año),
        y: cat.serie.map((p) => p.num_anuncios),
        color: COLORES_SUBCATEGORIA[i % COLORES_SUBCATEGORIA.length],
      }));
    }
  })();

  const selectorRevista = publicaciones.length > 1 && (
    <div className="flex items-center gap-2">
      <label className="text-sm text-zinc-600 dark:text-zinc-400">Revista:</label>
      <select
        value={publicacionSlug}
        onChange={handlePublicacionChange}
        className="rounded border border-zinc-300 bg-white px-2 py-1 text-sm text-negro dark:border-zinc-600 dark:bg-zinc-800 dark:text-blanco"
      >
        <option value="">Todas</option>
        {publicaciones.map((p) => (
          <option key={p.slug} value={p.slug}>{p.titulo} ({p.num_anuncios})</option>
        ))}
      </select>
    </div>
  );

  if (status === "idle") {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={() => cargar()}
            className="inline-flex w-fit items-center gap-2 text-sm font-medium text-azul transition-colors hover:underline dark:text-azul-claro"
          >
            <span aria-hidden="true">☁</span>
            Mostrar tendencias publicitarias
          </button>
          {selectorRevista}
        </div>
        <GestorCategorias onGuardado={() => {}} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {status === "loading" && (
        <div className="flex flex-col items-center justify-center gap-3 py-6 text-center text-sm font-light text-zinc-500">
          <p>Calculando...</p>
          <div className="h-1.5 w-full max-w-md overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
            <div className="h-full w-1/3 animate-pulse rounded-full bg-azul dark:bg-azul-claro" />
          </div>
        </div>
      )}

      {status === "error" && errorMessage && (
        <div className="flex flex-wrap items-center gap-4">
          <p className="text-sm text-red-600 dark:text-red-400">{errorMessage}</p>
          {selectorRevista}
        </div>
      )}

      {status === "success" && data && (
        <>
          {/* Controles */}
          <div className="flex flex-wrap items-center gap-4">
            <p className="text-sm font-light text-zinc-600 dark:text-zinc-400">
              {data.total_anuncios} anuncio{data.total_anuncios !== 1 ? "s" : ""} analizados
              {publicacionSlug
                ? ` en ${publicaciones.find((p) => p.slug === publicacionSlug)?.titulo ?? publicacionSlug}`
                : " en todas las revistas"}
              .
            </p>
            {selectorRevista}
          </div>

          {/* Selector de desglose */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-zinc-600 dark:text-zinc-400">Desglosar por categoría:</span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => { setGrupoDesglose(""); setDestacado(null); }}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  grupoDesglose === ""
                    ? "bg-azul text-white dark:bg-azul-claro"
                    : "border border-zinc-300 text-zinc-600 hover:border-azul hover:text-azul dark:border-zinc-600 dark:text-zinc-400"
                }`}
              >
                Vista general
              </button>
              {GRUPOS_ORDEN.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => { setGrupoDesglose(g); setDestacado(null); }}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    grupoDesglose === g
                      ? "text-white"
                      : "border border-zinc-300 text-zinc-600 hover:text-white dark:border-zinc-600 dark:text-zinc-400"
                  }`}
                  style={
                    grupoDesglose === g
                      ? { backgroundColor: COLORES_GRUPO[g] }
                      : { ["--hover-bg" as string]: COLORES_GRUPO[g] }
                  }
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {trazas.length === 0 ? (
            <p className="text-sm text-zinc-500">
              No se ha detectado ninguna de las categorías en el corpus de anuncios disponible.
            </p>
          ) : (
            <div className="h-[36rem] w-full rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800">
              <PlotlyChart
                data={trazas.map((t) => {
                  const destacada = destacado === t.name;
                  const opaca = destacado !== null && !destacada;
                  return {
                    type: "scatter" as const,
                    mode: "lines+markers" as const,
                    name: t.name,
                    x: t.x,
                    y: t.y,
                    opacity: opaca ? 0.15 : 1,
                    line: { color: t.color, width: destacada ? 4 : 2 },
                    marker: { color: t.color, size: destacada ? 9 : 6 },
                  };
                })}
                layout={{
                  margin: { l: 50, r: 20, t: 10, b: 60 },
                  xaxis: {
                    title: { text: "Año" },
                    tickformat: "d",
                    rangeslider: { visible: true, thickness: 0.07 },
                  },
                  yaxis: { title: { text: "Anuncios" }, dtick: 1, fixedrange: true },
                  legend: { orientation: "h", y: 1.08, x: 0 },
                }}
                onLegendClick={handleLegendClick}
              />
            </div>
          )}

          {/* Detalle de subcategorías del grupo seleccionado */}
          {grupoDesglose && (
            <details className="text-sm text-zinc-500 dark:text-zinc-400" open>
              <summary className="cursor-pointer font-medium">
                Subcategorías de {grupoDesglose}
              </summary>
              <ul className="mt-2 flex flex-col gap-1">
                {data.categorias
                  .filter((c) => c.grupo === grupoDesglose)
                  .map((c) => (
                    <li key={c.categoria}>
                      <span className="font-medium text-negro dark:text-blanco">{c.categoria}:</span>{" "}
                      {c.palabras_clave[0]}
                    </li>
                  ))}
              </ul>
            </details>
          )}

          <GestorCategorias onGuardado={() => cargar()} />
        </>
      )}
    </div>
  );
}
