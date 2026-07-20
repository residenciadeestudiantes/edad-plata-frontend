"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getSesionActual } from "@/lib/auth";
import { crearProyecto, guardarAnalisis, listarProyectos, type Proyecto } from "@/lib/proyectos";

// Botón "Guardar análisis": guarda los parámetros de la búsqueda actual
// (no el resultado) en uno de los proyectos del usuario, para poder
// volver a ejecutarla más tarde desde "Mis Proyectos". Hermano de
// GuardarEnProyecto.tsx, mismo patrón de icono + panel.
export function GuardarAnalisis({
  tipo,
  parametros,
  titulo,
}: {
  tipo: string;
  parametros: Record<string, string>;
  titulo: string;
}) {
  const [conSesion, setConSesion] = useState<boolean | null>(null);
  const [abierto, setAbierto] = useState(false);
  const [proyectos, setProyectos] = useState<Proyecto[] | null>(null);
  const [guardadoEn, setGuardadoEn] = useState<Set<string>>(new Set());
  const [nombreNuevo, setNombreNuevo] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getSesionActual().then((sesion) => setConSesion(sesion !== null));
  }, []);

  function abrir() {
    setAbierto(true);
    setGuardadoEn(new Set());
    if (proyectos === null) {
      listarProyectos()
        .then(setProyectos)
        .catch((err) => setError(err instanceof Error ? err.message : "Error al cargar proyectos."));
    }
  }

  async function handleGuardarEn(proyecto: Proyecto) {
    try {
      await guardarAnalisis(proyecto.documentId, tipo, parametros, titulo);
      setGuardadoEn((actual) => new Set(actual).add(proyecto.documentId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar el análisis.");
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

  if (!conSesion) {
    return (
      <Link href="/cuenta" className="text-sm font-bold text-teja hover:underline dark:text-teja-claro">
        Inicia sesión para guardar este análisis
      </Link>
    );
  }

  if (!abierto) {
    return (
      <button
        type="button"
        onClick={abrir}
        className="text-sm font-bold text-teja hover:underline dark:text-teja-claro"
      >
        Guardar análisis
      </button>
    );
  }

  return (
    <div className="flex w-full max-w-xs flex-col gap-2 rounded-md border border-zinc-300 bg-white p-3 text-sm dark:border-zinc-700 dark:bg-zinc-900">
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

      <button type="button" onClick={() => setAbierto(false)} className="self-start text-xs text-zinc-500">
        Cerrar
      </button>
    </div>
  );
}
