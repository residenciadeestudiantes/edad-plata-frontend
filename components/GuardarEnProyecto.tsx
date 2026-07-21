"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getSesionActual } from "@/lib/auth";
import {
  agregarArticuloAProyecto,
  crearProyecto,
  listarArticulosDeProyecto,
  listarProyectos,
  type Proyecto,
} from "@/lib/proyectos";

// Icono de "guardar en proyecto" junto al título del artículo: gris y con
// tooltip "Artículo ya guardado" si ya está en algún proyecto del usuario;
// en color de marca y "Guardar en proyecto" si todavía no lo está. Al hacer
// clic despliega el panel para elegir en qué proyecto guardarlo (o crear
// uno nuevo al vuelo).
export function GuardarEnProyecto({ articleId }: { articleId: number }) {
  const [conSesion, setConSesion] = useState<boolean | null>(null);
  const [abierto, setAbierto] = useState(false);
  const [proyectos, setProyectos] = useState<Proyecto[] | null>(null);
  const [guardadoEn, setGuardadoEn] = useState<Set<string>>(new Set());
  const [nombreNuevo, setNombreNuevo] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;

    getSesionActual().then(async (sesion) => {
      if (cancelado) return;
      setConSesion(sesion !== null);
      if (!sesion) return;

      const lista = await listarProyectos();
      if (cancelado) return;
      setProyectos(lista);

      // Comprueba en qué proyectos, si en alguno, ya está este artículo, para
      // poder mostrar el icono en gris desde el primer render.
      const idsConArticulo = await Promise.all(
        lista.map(async (proyecto) => {
          const articulos = await listarArticulosDeProyecto(proyecto.documentId);
          return articulos.some((a) => a.id === articleId) ? proyecto.documentId : null;
        })
      );
      if (cancelado) return;
      setGuardadoEn(new Set(idsConArticulo.filter((id): id is string => id !== null)));
    });

    return () => {
      cancelado = true;
    };
  }, [articleId]);

  async function handleGuardarEn(proyecto: Proyecto) {
    try {
      await agregarArticuloAProyecto(proyecto.documentId, articleId);
      setGuardadoEn((actual) => new Set(actual).add(proyecto.documentId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar el artículo.");
    }
  }

  async function handleCrearYGuardar(e: React.FormEvent) {
    e.preventDefault();
    const nombre = nombreNuevo.trim();
    if (!nombre) return;
    try {
      const proyecto = await crearProyecto(nombre);
      setProyectos((actual) => [...(actual ?? []), proyecto]);
      setNombreNuevo("");
      await handleGuardarEn(proyecto);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear el proyecto.");
    }
  }

  if (conSesion === null) return null;

  const yaGuardado = guardadoEn.size > 0;

  if (!conSesion) {
    return (
      <Link
        href="/cuenta"
        title="Inicia sesión para guardar este artículo"
        aria-label="Inicia sesión para guardar este artículo"
        className="text-zinc-400 hover:text-teja dark:hover:text-teja-claro"
      >
        <BookmarkIcon />
      </Link>
    );
  }

  return (
    <div className="relative inline-flex">
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        title={yaGuardado ? "Artículo ya guardado" : "Guardar en proyecto"}
        aria-label={yaGuardado ? "Artículo ya guardado" : "Guardar en proyecto"}
        className={
          yaGuardado
            ? "text-zinc-400 hover:text-zinc-500 dark:text-zinc-500 dark:hover:text-zinc-400"
            : "text-teja hover:text-teja/70 dark:text-teja-claro dark:hover:text-teja-claro/70"
        }
      >
        <BookmarkIcon relleno={yaGuardado} />
      </button>

      {abierto && (
        <div className="absolute left-0 top-full z-10 mt-2 flex w-64 flex-col gap-2 rounded-md border border-zinc-300 bg-white p-3 text-sm shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
          <p className="font-bold text-negro dark:text-blanco">Guardar en</p>

          {error && <p className="text-red-600 dark:text-red-400">{error}</p>}

          {proyectos === null && <p className="text-zinc-500">Cargando…</p>}
          {proyectos?.length === 0 && (
            <p className="text-zinc-500">Aún no tienes proyectos. Crea uno abajo.</p>
          )}

          <ul className="flex flex-col gap-1">
            {proyectos?.map((proyecto) => (
              <li key={proyecto.documentId}>
                <button
                  type="button"
                  onClick={() => handleGuardarEn(proyecto)}
                  disabled={guardadoEn.has(proyecto.documentId)}
                  className="w-full truncate rounded px-2 py-1 text-left hover:bg-zinc-100 disabled:text-green-700 dark:hover:bg-zinc-800 dark:disabled:text-green-400"
                >
                  {guardadoEn.has(proyecto.documentId) ? "✓ " : ""}
                  {proyecto.nombre}
                </button>
              </li>
            ))}
          </ul>

          <form onSubmit={handleCrearYGuardar} className="flex gap-2">
            <input
              value={nombreNuevo}
              onChange={(e) => setNombreNuevo(e.target.value)}
              placeholder="Nuevo proyecto…"
              className="min-w-0 flex-1 rounded-md border border-zinc-300 bg-white px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            />
            <button type="submit" className="font-bold text-teja dark:text-teja-claro">
              Crear
            </button>
          </form>

          <button
            type="button"
            onClick={() => setAbierto(false)}
            className="self-start text-xs text-zinc-500"
          >
            Cerrar
          </button>
        </div>
      )}
    </div>
  );
}

function BookmarkIcon({ relleno = false }: { relleno?: boolean }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className="h-5 w-5">
      <path
        d="M6 3.5A1.5 1.5 0 0 1 7.5 2h5A1.5 1.5 0 0 1 14 3.5v13l-4-3-4 3v-13Z"
        fill={relleno ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
