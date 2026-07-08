"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/Button";
import {
  getTemas,
  getValidadorTemasArticulos,
  guardarValidadorTemas,
  type Tema,
  type ArticuloValidadorTema,
} from "@/lib/api";

function mismoConjunto(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const setA = new Set(a);
  return b.every((id) => setA.has(id));
}

export function ValidadorTemasClient() {
  const [temas, setTemas] = useState<Tema[]>([]);
  const [articulos, setArticulos] = useState<ArticuloValidadorTema[]>([]);
  const [seleccion, setSeleccion] = useState<Record<string, string[]>>({});
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [guardando, setGuardando] = useState(false);
  const [mensajeGuardado, setMensajeGuardado] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getTemas(), getValidadorTemasArticulos()])
      .then(([resTemas, resArticulos]) => {
        setTemas(resTemas.data);
        setArticulos(resArticulos.data);
        setSeleccion(
          Object.fromEntries(
            resArticulos.data.map((a) => [a.documentId, a.temas.map((t) => t.documentId)])
          )
        );
      })
      .catch(() => setError("No se han podido cargar los artículos con temas dudosos."))
      .finally(() => setCargando(false));
  }, []);

  const originalPorArticulo = useMemo(
    () =>
      Object.fromEntries(articulos.map((a) => [a.documentId, a.temas.map((t) => t.documentId)])),
    [articulos]
  );

  const cambios = useMemo(
    () =>
      articulos.filter(
        (a) => !mismoConjunto(seleccion[a.documentId] ?? [], originalPorArticulo[a.documentId] ?? [])
      ),
    [articulos, seleccion, originalPorArticulo]
  );

  function toggleTema(documentId: string, temaId: string) {
    setSeleccion((prev) => {
      const actuales = prev[documentId] ?? [];
      const nuevos = actuales.includes(temaId)
        ? actuales.filter((id) => id !== temaId)
        : [...actuales, temaId];
      return { ...prev, [documentId]: nuevos };
    });
  }

  async function guardar() {
    setGuardando(true);
    setMensajeGuardado(null);
    try {
      const payload = cambios.map((a) => ({
        documentId: a.documentId,
        temaIds: seleccion[a.documentId] ?? [],
      }));
      const res = await guardarValidadorTemas(payload);
      setArticulos((prev) =>
        prev.map((a) => {
          const idsNuevos = seleccion[a.documentId];
          if (!idsNuevos) return a;
          const temasNuevos = idsNuevos
            .map((id) => temas.find((t) => t.documentId === id))
            .filter((t): t is Tema => !!t)
            .map((t) => ({ documentId: t.documentId, nombre: t.nombre }));
          return { ...a, temas: temasNuevos };
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
        <Button variant="azul" onClick={guardar} disabled={cambios.length === 0 || guardando}>
          {guardando ? "Guardando…" : `Guardar selección${cambios.length ? ` (${cambios.length})` : ""}`}
        </Button>

        {mensajeGuardado && (
          <span className="text-sm font-light text-zinc-600 dark:text-zinc-400">
            {mensajeGuardado}
          </span>
        )}
      </div>

      {cargando && <p className="text-zinc-500">Cargando artículos…</p>}
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      {!cargando && !error && articulos.length === 0 && (
        <p className="text-zinc-500">No hay artículos con más de un tema asignado.</p>
      )}

      {articulos.length > 0 && (
        <p className="text-sm font-light text-zinc-500 dark:text-zinc-400">
          {articulos.length} artículo(s) con más de un tema.
        </p>
      )}

      {articulos.length > 0 && (
        <ol className="flex flex-col divide-y divide-zinc-200 dark:divide-zinc-800">
          {articulos.map((a) => (
            <li key={a.documentId} className="flex flex-col gap-2 py-4">
              <a
                href={`/articulos/${a.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium hover:text-teja hover:underline dark:hover:text-teja-claro"
              >
                {a.titulo}
                {a.revista && (
                  <span className="ml-2 text-xs font-normal text-zinc-400">{a.revista}</span>
                )}
              </a>

              <div className="flex flex-wrap gap-x-4 gap-y-1">
                {temas.map((tema) => (
                  <label
                    key={tema.documentId}
                    className="flex items-center gap-1.5 text-sm text-zinc-700 dark:text-zinc-300"
                  >
                    <input
                      type="checkbox"
                      checked={(seleccion[a.documentId] ?? []).includes(tema.documentId)}
                      onChange={() => toggleTema(a.documentId, tema.documentId)}
                      className="accent-azul"
                    />
                    {tema.nombre}
                  </label>
                ))}
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
