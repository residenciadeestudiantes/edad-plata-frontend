"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/Button";
import { LoaderAnalisis } from "@/components/LoaderAnalisis";
import { useProgresoSimulado } from "@/lib/useProgresoSimulado";
import {
  getPublications,
  getValidadorArticulos,
  guardarValidadorTipos,
  type Publication,
  type ArticuloValidador,
} from "@/lib/api";

type Tipo = "prosa" | "poema" | "obra_grafica";

function tipoDeArticulo(a: { es_poema: boolean; es_obra_grafica: boolean }): Tipo {
  if (a.es_poema) return "poema";
  if (a.es_obra_grafica) return "obra_grafica";
  return "prosa";
}

const SELECT_CLASSES =
  "rounded-md border border-zinc-300 bg-white px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900";

export function ValidadorClient() {
  const [publicaciones, setPublicaciones] = useState<Publication[]>([]);
  const [revistaSlug, setRevistaSlug] = useState("");

  const [articulos, setArticulos] = useState<ArticuloValidador[]>([]);
  const [seleccion, setSeleccion] = useState<Record<string, Tipo>>({});
  const [cargando, setCargando] = useState(false);
  const progreso = useProgresoSimulado(cargando);
  const [error, setError] = useState<string | null>(null);

  const [guardando, setGuardando] = useState(false);
  const [mensajeGuardado, setMensajeGuardado] = useState<string | null>(null);

  useEffect(() => {
    getPublications(1, 200).then((res) => {
      const ordenadas = [...res.data].sort((a, b) => a.titulo.localeCompare(b.titulo, "es"));
      setPublicaciones(ordenadas);
    });
  }, []);

  useEffect(() => {
    if (!revistaSlug) {
      setArticulos([]);
      setSeleccion({});
      return;
    }

    setCargando(true);
    setError(null);
    setMensajeGuardado(null);

    getValidadorArticulos(revistaSlug)
      .then((res) => {
        const ordenados = [...res.data].sort((a, b) => {
          const numA = a.numero_orden ?? 0;
          const numB = b.numero_orden ?? 0;
          if (numA !== numB) return numA - numB;
          return (a.posicion ?? 0) - (b.posicion ?? 0);
        });
        setArticulos(ordenados);
        setSeleccion(
          Object.fromEntries(ordenados.map((a) => [a.documentId, tipoDeArticulo(a)]))
        );
      })
      .catch(() => setError("No se han podido cargar los artículos de esta revista."))
      .finally(() => setCargando(false));
  }, [revistaSlug]);

  const cambios = useMemo(
    () =>
      articulos.filter((a) => seleccion[a.documentId] !== tipoDeArticulo(a)),
    [articulos, seleccion]
  );

  async function guardar() {
    setGuardando(true);
    setMensajeGuardado(null);
    try {
      const payload = cambios.map((a) => {
        const tipo = seleccion[a.documentId];
        return {
          documentId: a.documentId,
          es_poema: tipo === "poema",
          es_obra_grafica: tipo === "obra_grafica",
        };
      });
      const res = await guardarValidadorTipos(payload);
      setArticulos((prev) =>
        prev.map((a) => {
          const tipo = seleccion[a.documentId];
          if (tipo === undefined) return a;
          return { ...a, es_poema: tipo === "poema", es_obra_grafica: tipo === "obra_grafica" };
        })
      );
      setMensajeGuardado(`Guardado: ${res.actualizados} artículo(s) actualizado(s).`);
    } catch {
      setMensajeGuardado("Error al guardar los cambios. Inténtalo de nuevo.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <label htmlFor="revista" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Revista
        </label>
        <select
          id="revista"
          value={revistaSlug}
          onChange={(e) => setRevistaSlug(e.target.value)}
          className={SELECT_CLASSES}
        >
          <option value="">— Selecciona una revista —</option>
          {publicaciones.map((p) => (
            <option key={p.slug} value={p.slug}>
              {p.titulo}
            </option>
          ))}
        </select>

        {revistaSlug && (
          <Button
            variant="azul"
            onClick={guardar}
            disabled={cambios.length === 0 || guardando}
          >
            {guardando ? "Guardando…" : `Guardar selección${cambios.length ? ` (${cambios.length})` : ""}`}
          </Button>
        )}

        {mensajeGuardado && (
          <span className="text-sm font-light text-zinc-600 dark:text-zinc-400">
            {mensajeGuardado}
          </span>
        )}
      </div>

      {cargando && <LoaderAnalisis progreso={progreso} mensaje="Cargando artículos…" />}
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      {!cargando && revistaSlug && articulos.length === 0 && !error && (
        <p className="text-zinc-500">Esta revista no tiene artículos.</p>
      )}

      {articulos.length > 0 && (
        <ol className="flex flex-col divide-y divide-zinc-200 dark:divide-zinc-800">
          {articulos.map((a) => (
            <li key={a.documentId} className="flex items-center justify-between gap-4 py-3">
              <a
                href={`/articulos/${a.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="truncate font-medium hover:text-teja hover:underline dark:hover:text-teja-claro"
              >
                {a.numero_orden != null && (
                  <span className="mr-2 text-xs font-normal text-zinc-400">
                    N.º {a.numero_orden}
                  </span>
                )}
                {a.titulo}
              </a>

              <select
                value={seleccion[a.documentId] ?? "prosa"}
                onChange={(e) =>
                  setSeleccion((prev) => ({ ...prev, [a.documentId]: e.target.value as Tipo }))
                }
                className={`${SELECT_CLASSES} flex-shrink-0`}
              >
                <option value="prosa">Prosa</option>
                <option value="poema">Poema</option>
                <option value="obra_grafica">Obra gráfica</option>
              </select>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
