"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Data } from "plotly.js";
import { LoaderAnalisis } from "@/components/LoaderAnalisis";
import { PlotlyChart } from "@/components/PlotlyChart";
import { useProgresoSimulado } from "@/lib/useProgresoSimulado";

// Resultados de la prueba piloto, generados fuera de la web (ver
// INVESTIGACIONES.md en la raíz del proyecto) y servidos como fichero
// estático: el experimento no toca Strapi hasta que el método esté validado.
const DATOS_URL = "/datos/enunciados-piloto.json";

type Codigo = "O" | "G" | "A" | "N" | "M" | "F" | "X";

const CATEGORIAS: { codigo: Codigo; nombre: string; color: string; descripcion: string }[] = [
  { codigo: "O", nombre: "Observacional", color: "#008867", descripcion: "Hecho particular comprobable" },
  { codigo: "G", nombre: "Empírico general", color: "#5BBF9F", descripcion: "Generalización contrastable" },
  { codigo: "A", nombre: "Analítico", color: "#8A8A8A", descripcion: "Definición o verdad formal" },
  { codigo: "N", nombre: "Valorativo", color: "#3838BD", descripcion: "Juicio de valor, norma o interpretación crítica" },
  { codigo: "M", nombre: "Metafísico", color: "#DD158B", descripcion: "Esencias, alma, destino: sin verificación posible" },
  { codigo: "F", nombre: "Ficción", color: "#DA3C00", descripcion: "Narración, imagen poética o verso" },
  { codigo: "X", nombre: "Excluido", color: "#D4D4D8", descripcion: "Título, firma, referencia o fragmento" },
];
const CATEGORIA = Object.fromEntries(CATEGORIAS.map((c) => [c.codigo, c])) as Record<Codigo, (typeof CATEGORIAS)[number]>;

const COLORES_REVISTA = ["#3838BD", "#DA3C00", "#008867", "#DD158B", "#0A0A0A", "#C98500"];

type Cuentas = Record<Codigo, number>;

interface Articulo {
  id: number;
  titulo: string;
  slug: string;
  revista: string;
  año: number;
  autores: string[];
  n: number;
  cuentas: Cuentas;
  iae: number | null;
  nota: string;
  enunciados: [string, Codigo][];
}

interface Revista {
  revista: string;
  articulos: number;
  n: number;
  cuentas: Cuentas;
  iae: number | null;
}

interface Resultados {
  n: number;
  totales: Cuentas;
  iae_global: number;
  clasificador: string;
  revistas: Revista[];
  articulos: Articulo[];
}

type Status = "loading" | "success" | "error";

// Enunciados que afirman o valoran algo (sin ficción ni excluidos): base de
// los pesos empírico y metafísico.
function base(c: Cuentas) {
  return c.O + c.G + c.A + c.N + c.M;
}
function pesoEmpirico(c: Cuentas) {
  const b = base(c);
  return b ? (c.O + c.G) / b : null;
}
function pesoMetafisico(c: Cuentas) {
  const b = base(c);
  return b ? c.M / b : null;
}
const pct = (x: number | null) => (x == null ? "—" : `${Math.round(x * 100)} %`);

export function EnunciadosClient() {
  const [status, setStatus] = useState<Status>("loading");
  const [datos, setDatos] = useState<Resultados | null>(null);
  const [seleccion, setSeleccion] = useState<number | null>(null);
  const [filtro, setFiltro] = useState<Codigo | null>(null);
  const progreso = useProgresoSimulado(status === "loading");

  useEffect(() => {
    fetch(DATOS_URL)
      .then((res) => {
        if (!res.ok) throw new Error(`Error ${res.status}`);
        return res.json() as Promise<Resultados>;
      })
      .then((d) => {
        setDatos(d);
        // Abre el explorador con el artículo de mayor peso metafísico, el
        // ejemplo más ilustrativo del método.
        const ejemplo = [...d.articulos].sort((a, b) => (pesoMetafisico(b.cuentas) ?? 0) - (pesoMetafisico(a.cuentas) ?? 0))[0];
        setSeleccion(ejemplo?.id ?? null);
        setStatus("success");
      })
      .catch(() => setStatus("error"));
  }, []);

  const revistasOrdenadas = useMemo(
    () => (datos ? [...datos.revistas].sort((a, b) => (pesoEmpirico(a.cuentas) ?? 0) - (pesoEmpirico(b.cuentas) ?? 0)) : []),
    [datos],
  );
  const colorRevista = useMemo(() => {
    const nombres = datos ? [...datos.revistas].map((r) => r.revista).sort((a, b) => a.localeCompare(b, "es")) : [];
    return Object.fromEntries(nombres.map((n, i) => [n, COLORES_REVISTA[i % COLORES_REVISTA.length]]));
  }, [datos]);

  if (status === "loading") return <LoaderAnalisis progreso={progreso} mensaje="Cargando la prueba piloto…" />;
  if (status === "error" || !datos)
    return <p className="text-sm text-teja">No se pudieron cargar los resultados de la prueba piloto.</p>;

  const articulo = datos.articulos.find((a) => a.id === seleccion) ?? null;

  // Composición por revista: barras apiladas al 100 %, de menos a más peso empírico.
  const composicion: Data[] = CATEGORIAS.map((cat) => ({
    type: "bar",
    orientation: "h",
    name: cat.nombre,
    y: revistasOrdenadas.map((r) => r.revista),
    x: revistasOrdenadas.map((r) => (100 * r.cuentas[cat.codigo]) / r.n),
    customdata: revistasOrdenadas.map((r) => [r.cuentas[cat.codigo], r.n]),
    marker: { color: cat.color, line: { color: "#FFFFFF", width: 1 } },
    hovertemplate: `<b>%{y}</b><br>${cat.nombre}: %{customdata[0]} de %{customdata[1]} enunciados (%{x:.0f} %)<extra></extra>`,
  }));

  // Dispersión de artículos: peso empírico frente a peso metafísico.
  const dispersion: Data[] = Object.keys(colorRevista).map((revista) => {
    const arts = datos.articulos.filter((a) => a.revista === revista && base(a.cuentas) > 0);
    return {
      type: "scatter",
      mode: "markers",
      name: revista,
      x: arts.map((a) => 100 * (pesoEmpirico(a.cuentas) ?? 0)),
      y: arts.map((a) => 100 * (pesoMetafisico(a.cuentas) ?? 0)),
      customdata: arts.map((a) => [a.id, a.titulo, a.año, a.autores.join(", ") || "Sin firma"]),
      marker: {
        color: colorRevista[revista],
        size: arts.map((a) => Math.max(10, Math.sqrt(a.n) * 2.2)),
        line: { color: "#FFFFFF", width: 2 },
        opacity: 0.9,
      },
      hovertemplate: "<b>%{customdata[1]}</b><br>%{customdata[3]} · %{customdata[2]}<br>Empírico: %{x:.0f} % · Metafísico: %{y:.0f} %<extra>" + revista + "</extra>",
    };
  });
  const soloFiccion = datos.articulos.filter((a) => base(a.cuentas) === 0);

  const enunciadosVisibles = articulo ? articulo.enunciados.map((e, i) => ({ texto: e[0], codigo: e[1], n: i + 1 })).filter((e) => !filtro || e.codigo === filtro) : [];

  return (
    <div className="flex flex-col gap-14">
      {/* Cifras de la prueba */}
      <section className="grid grid-cols-2 gap-6 sm:grid-cols-4">
        {[
          [datos.articulos.length, "artículos"],
          [datos.revistas.length, "revistas"],
          [datos.n.toLocaleString("es-ES"), "enunciados clasificados"],
          [pct(datos.iae_global), "anclaje empírico global"],
        ].map(([valor, etiqueta]) => (
          <div key={etiqueta as string} className="flex flex-col gap-1 border-l-2 border-azul/30 pl-4 dark:border-azul-claro/30">
            <span className="font-titulo text-3xl font-bold text-negro dark:text-blanco">{valor}</span>
            <span className="text-sm font-light text-zinc-600 dark:text-zinc-400">{etiqueta}</span>
          </div>
        ))}
      </section>

      {/* Leyenda de categorías */}
      <section className="flex flex-col gap-3">
        <h2 className="font-titulo text-2xl font-bold text-negro dark:text-blanco">Tipos de enunciado</h2>
        <ul className="grid grid-cols-1 gap-x-8 gap-y-2 sm:grid-cols-2 lg:grid-cols-4">
          {CATEGORIAS.map((c) => (
            <li key={c.codigo} className="flex items-start gap-2 text-sm">
              <span className="mt-1 h-3 w-3 flex-shrink-0 rounded-sm" style={{ backgroundColor: c.color }} />
              <span>
                <strong>{c.nombre}</strong>{" "}
                <span className="font-light text-zinc-600 dark:text-zinc-400">— {c.descripcion}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* Composición por revista */}
      <section className="flex flex-col gap-3">
        <h2 className="font-titulo text-2xl font-bold text-negro dark:text-blanco">Composición por revista</h2>
        <p className="max-w-3xl text-sm font-light text-zinc-600 dark:text-zinc-400">
          Reparto de los enunciados de cada revista entre los siete tipos, ordenadas de menos a más peso empírico.{" "}
          <em>Octubre</em> parece poco empírica porque la mayor parte de su muestra son relatos; <em>Cruz y Raya</em> concentra la metafísica.
        </p>
        <div className="h-[360px] w-full overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
          <PlotlyChart
            data={composicion}
            layout={{
              barmode: "stack",
              xaxis: { title: { text: "% de enunciados" }, range: [0, 100], ticksuffix: " %", gridcolor: "#EEEEEE" },
              yaxis: { automargin: true },
              legend: { orientation: "h", y: -0.22 },
              margin: { l: 20, r: 20, t: 10, b: 90 },
            }}
          />
        </div>
      </section>

      {/* Dispersión de artículos */}
      <section className="flex flex-col gap-3">
        <h2 className="font-titulo text-2xl font-bold text-negro dark:text-blanco">Cada artículo, entre la experiencia y la metafísica</h2>
        <p className="max-w-3xl text-sm font-light text-zinc-600 dark:text-zinc-400">
          Abajo a la derecha, los textos que describen hechos; arriba, los que hablan de esencias y destinos; abajo a la izquierda, los que se
          dedican sobre todo a valorar (crítica, polémica). El tamaño indica la extensión. Pulsa un punto para leer sus enunciados clasificados.
          {soloFiccion.length > 0 && ` Quedan fuera ${soloFiccion.length} textos que son enteramente ficción.`}
        </p>
        <div className="linea-tiempo-autor h-[480px] w-full overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
          <PlotlyChart
            data={dispersion}
            layout={{
              xaxis: { title: { text: "Peso empírico (% de enunciados no ficticios)" }, range: [-4, 104], ticksuffix: " %", gridcolor: "#EEEEEE", zeroline: false },
              yaxis: { title: { text: "Peso metafísico" }, range: [-4, 64], ticksuffix: " %", gridcolor: "#EEEEEE", zeroline: false },
              legend: { orientation: "h", y: -0.18 },
              margin: { l: 70, r: 20, t: 10, b: 90 },
              hovermode: "closest",
            }}
            onClick={(e) => {
              const id = (e.points[0]?.customdata as unknown as [number])?.[0];
              if (id) {
                setSeleccion(id);
                setFiltro(null);
                document.getElementById("explorador-enunciados")?.scrollIntoView({ behavior: "smooth", block: "start" });
              }
            }}
          />
        </div>
      </section>

      {/* Explorador */}
      <section id="explorador-enunciados" className="flex scroll-mt-6 flex-col gap-4">
        <h2 className="font-titulo text-2xl font-bold text-negro dark:text-blanco">Leer los enunciados de un artículo</h2>
        <label htmlFor="enunciados-articulo" className="flex max-w-3xl flex-col gap-1 text-sm">
          <span className="font-medium">Artículo</span>
          <select
            id="enunciados-articulo"
            value={seleccion ?? ""}
            onChange={(e) => {
              setSeleccion(Number(e.target.value));
              setFiltro(null);
            }}
            className="rounded border border-zinc-300 bg-blanco px-3 py-2 text-sm dark:border-zinc-700 dark:bg-negro"
          >
            {[...datos.articulos]
              .sort((a, b) => a.revista.localeCompare(b.revista, "es") || a.año - b.año)
              .map((a) => (
                <option key={a.id} value={a.id}>
                  {a.revista} ({a.año}) · {a.titulo.slice(0, 80)}
                </option>
              ))}
          </select>
        </label>

        {articulo && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {articulo.autores.join(", ") || "Sin firma"} · <em>{articulo.revista}</em>, {articulo.año} ·{" "}
                <Link href={`/articulos/${articulo.slug}`} className="text-azul underline dark:text-azul-claro">
                  ver el artículo
                </Link>
              </p>
              <p className="max-w-3xl font-light">{articulo.nota}</p>
              <p className="text-sm font-light text-zinc-600 dark:text-zinc-400">
                Anclaje empírico {pct(articulo.iae)} · peso empírico {pct(pesoEmpirico(articulo.cuentas))} · peso metafísico{" "}
                {pct(pesoMetafisico(articulo.cuentas))}
              </p>
            </div>

            <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por tipo de enunciado">
              <button
                type="button"
                onClick={() => setFiltro(null)}
                aria-pressed={filtro === null}
                className={`rounded-full border px-3 py-1 text-xs transition-colors ${filtro === null ? "border-azul bg-azul text-blanco dark:border-azul-claro dark:bg-azul-claro dark:text-negro" : "border-zinc-300 hover:border-azul dark:border-zinc-700"}`}
              >
                Todos ({articulo.n})
              </button>
              {CATEGORIAS.filter((c) => articulo.cuentas[c.codigo] > 0).map((c) => (
                <button
                  key={c.codigo}
                  type="button"
                  onClick={() => setFiltro(filtro === c.codigo ? null : c.codigo)}
                  aria-pressed={filtro === c.codigo}
                  className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors ${filtro === c.codigo ? "border-negro dark:border-blanco" : "border-zinc-300 hover:border-zinc-500 dark:border-zinc-700"}`}
                >
                  <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: c.color }} />
                  {c.nombre} ({articulo.cuentas[c.codigo]})
                </button>
              ))}
            </div>

            <ol className="flex max-w-4xl flex-col gap-1.5">
              {enunciadosVisibles.map((e) => (
                <li key={e.n} className="flex gap-3 border-l-4 py-1 pl-3 text-sm" style={{ borderColor: CATEGORIA[e.codigo].color }}>
                  <span className="w-28 flex-shrink-0 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                    {e.n}. {CATEGORIA[e.codigo].nombre}
                  </span>
                  <span className={`min-w-0 ${e.codigo === "X" ? "text-zinc-400" : ""}`}>{e.texto}</span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </section>

      {/* Tabla resumen */}
      <section className="flex flex-col gap-3">
        <h2 className="font-titulo text-2xl font-bold text-negro dark:text-blanco">Resultados por artículo</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-zinc-300 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-700">
              <tr>
                <th className="py-2 pr-4 font-medium">Artículo</th>
                <th className="py-2 pr-4 font-medium">Revista</th>
                <th className="py-2 pr-4 text-right font-medium">Enunciados</th>
                <th className="py-2 pr-4 text-right font-medium">Anclaje empírico</th>
                <th className="py-2 pr-4 text-right font-medium">Peso empírico</th>
                <th className="py-2 text-right font-medium">Peso metafísico</th>
              </tr>
            </thead>
            <tbody>
              {[...datos.articulos]
                .sort((a, b) => (pesoMetafisico(b.cuentas) ?? -1) - (pesoMetafisico(a.cuentas) ?? -1))
                .map((a) => (
                  <tr key={a.id} className="border-b border-zinc-100 dark:border-zinc-800">
                    <td className="py-2 pr-4">
                      <button
                        type="button"
                        onClick={() => {
                          setSeleccion(a.id);
                          setFiltro(null);
                          document.getElementById("explorador-enunciados")?.scrollIntoView({ behavior: "smooth", block: "start" });
                        }}
                        className="text-left text-azul hover:underline dark:text-azul-claro"
                      >
                        {a.titulo}
                      </button>
                      <div className="text-xs font-light text-zinc-500">{a.autores.join(", ") || "Sin firma"}</div>
                    </td>
                    <td className="py-2 pr-4 font-light">
                      {a.revista}, {a.año}
                    </td>
                    <td className="py-2 pr-4 text-right tabular-nums">{a.n}</td>
                    <td className="py-2 pr-4 text-right tabular-nums">{pct(a.iae)}</td>
                    <td className="py-2 pr-4 text-right tabular-nums">{pct(pesoEmpirico(a.cuentas))}</td>
                    <td className="py-2 text-right tabular-nums">{pct(pesoMetafisico(a.cuentas))}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs font-light text-zinc-500">Clasificación: {datos.clasificador}.</p>
      </section>
    </div>
  );
}
