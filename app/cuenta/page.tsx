"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AuthForms } from "@/components/AuthForms";
import { Button } from "@/components/Button";
import { PageTitle } from "@/components/PageTitle";
import {
  actualizarCuenta,
  eliminarCuenta,
  getSesionActual,
  logout,
  type SessionUser,
} from "@/lib/auth";
import {
  crearProyecto,
  eliminarProyecto,
  listarArticulosDeProyecto,
  listarProyectos,
  quitarArticuloDeProyecto,
  renombrarProyecto,
  type ArticuloGuardado,
  type Proyecto,
} from "@/lib/proyectos";

type Tab = "proyectos" | "datos";

export default function CuentaPage() {
  const [comprobado, setComprobado] = useState(false);
  const [usuario, setUsuario] = useState<SessionUser | null>(null);
  const [tab, setTab] = useState<Tab>("proyectos");

  useEffect(() => {
    getSesionActual().then((sesion) => {
      setUsuario(sesion);
      setComprobado(true);
    });
  }, []);

  if (!comprobado) return null;

  if (!usuario) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-10 py-20 text-center sm:px-20">
        <div className="flex w-full max-w-md flex-col gap-4">
          <PageTitle>Mi cuenta</PageTitle>
          <p className="font-light text-zinc-600 dark:text-zinc-400">
            Inicia sesión o crea una cuenta para guardar artículos en
            Proyectos y gestionar tus datos.
          </p>
          <AuthForms onAutenticado={setUsuario} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col px-10 py-12 sm:px-20">
      <PageTitle>Mi cuenta</PageTitle>
      <p className="mt-1 font-light text-zinc-600 dark:text-zinc-400">
        Hola, {usuario.nombre}
      </p>

      <div className="mt-6 flex gap-2 border-b border-teja/20 text-sm dark:border-teja-claro/20">
        <TabButton activo={tab === "proyectos"} onClick={() => setTab("proyectos")}>
          Mis Proyectos
        </TabButton>
        <TabButton activo={tab === "datos"} onClick={() => setTab("datos")}>
          Mis datos
        </TabButton>
      </div>

      <div className="mt-6 max-w-2xl">
        {tab === "proyectos" ? (
          <ProyectosTab />
        ) : (
          <DatosTab usuario={usuario} onUsuarioActualizado={setUsuario} onSesionCerrada={() => setUsuario(null)} />
        )}
      </div>
    </div>
  );
}

function TabButton({
  activo,
  onClick,
  children,
}: {
  activo: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`-mb-px border-b-2 px-4 py-2 font-bold transition-colors ${
        activo
          ? "border-teja text-teja dark:border-teja-claro dark:text-teja-claro"
          : "border-transparent text-zinc-500 hover:text-teja dark:text-zinc-400 dark:hover:text-teja-claro"
      }`}
    >
      {children}
    </button>
  );
}

function ProyectosTab() {
  const [proyectos, setProyectos] = useState<Proyecto[] | null>(null);
  const [seleccionado, setSeleccionado] = useState<Proyecto | null>(null);
  const [articulos, setArticulos] = useState<ArticuloGuardado[] | null>(null);
  const [nombreNuevo, setNombreNuevo] = useState("");
  const [error, setError] = useState<string | null>(null);

  function cargarProyectos() {
    listarProyectos()
      .then(setProyectos)
      .catch((err) => setError(err instanceof Error ? err.message : "Error al cargar proyectos."));
  }

  useEffect(() => {
    cargarProyectos();
  }, []);

  useEffect(() => {
    if (!seleccionado) {
      setArticulos(null);
      return;
    }
    listarArticulosDeProyecto(seleccionado.documentId)
      .then(setArticulos)
      .catch((err) => setError(err instanceof Error ? err.message : "Error al cargar artículos."));
  }, [seleccionado]);

  async function handleCrear(e: React.FormEvent) {
    e.preventDefault();
    const nombre = nombreNuevo.trim();
    if (!nombre) return;
    try {
      const proyecto = await crearProyecto(nombre);
      setNombreNuevo("");
      setProyectos((actual) => [...(actual ?? []), proyecto]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear el proyecto.");
    }
  }

  async function handleEliminarProyecto(proyecto: Proyecto) {
    try {
      await eliminarProyecto(proyecto.documentId);
      setProyectos((actual) => (actual ?? []).filter((p) => p.documentId !== proyecto.documentId));
      if (seleccionado?.documentId === proyecto.documentId) setSeleccionado(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo eliminar el proyecto.");
    }
  }

  async function handleRenombrar(proyecto: Proyecto) {
    const nombre = window.prompt("Nuevo nombre del proyecto:", proyecto.nombre);
    if (!nombre || nombre.trim() === "" || nombre === proyecto.nombre) return;
    try {
      const actualizado = await renombrarProyecto(proyecto.documentId, nombre.trim());
      setProyectos((actual) =>
        (actual ?? []).map((p) => (p.documentId === proyecto.documentId ? actualizado : p))
      );
      if (seleccionado?.documentId === proyecto.documentId) setSeleccionado(actualizado);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo renombrar el proyecto.");
    }
  }

  async function handleQuitarArticulo(articulo: ArticuloGuardado) {
    if (!seleccionado) return;
    try {
      await quitarArticuloDeProyecto(seleccionado.documentId, articulo.id);
      setArticulos((actual) => (actual ?? []).filter((a) => a.id !== articulo.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo quitar el artículo.");
    }
  }

  return (
    <div className="flex flex-col gap-6 sm:flex-row">
      <div className="flex w-full flex-col gap-3 sm:w-64 sm:flex-shrink-0">
        <form onSubmit={handleCrear} className="flex gap-2">
          <input
            value={nombreNuevo}
            onChange={(e) => setNombreNuevo(e.target.value)}
            placeholder="Nombre del proyecto"
            className="min-w-0 flex-1 rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
          <Button type="submit" variant="secondary" className="px-3 py-1.5 text-sm">
            Crear
          </Button>
        </form>

        {proyectos === null && <p className="text-sm text-zinc-500">Cargando…</p>}
        {proyectos?.length === 0 && (
          <p className="text-sm text-zinc-500">Aún no tienes proyectos.</p>
        )}

        <ul className="flex flex-col gap-1">
          {proyectos?.map((proyecto) => (
            <li key={proyecto.documentId} className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setSeleccionado(proyecto)}
                className={`flex-1 truncate rounded-md px-3 py-1.5 text-left text-sm transition-colors ${
                  seleccionado?.documentId === proyecto.documentId
                    ? "bg-teja/10 font-bold text-teja dark:bg-teja-claro/10 dark:text-teja-claro"
                    : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
                }`}
              >
                {proyecto.nombre}
              </button>
              <button
                type="button"
                onClick={() => handleRenombrar(proyecto)}
                title="Renombrar"
                className="px-1 text-xs text-zinc-400 hover:text-teja dark:hover:text-teja-claro"
              >
                ✎
              </button>
              <button
                type="button"
                onClick={() => handleEliminarProyecto(proyecto)}
                title="Eliminar proyecto"
                className="px-1 text-xs text-zinc-400 hover:text-red-600"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="min-w-0 flex-1">
        {error && <p className="mb-3 text-sm text-red-600 dark:text-red-400">{error}</p>}

        {!seleccionado && (
          <p className="text-sm text-zinc-500">
            Elige un proyecto para ver los artículos guardados.
          </p>
        )}

        {seleccionado && articulos === null && <p className="text-sm text-zinc-500">Cargando…</p>}

        {seleccionado && articulos?.length === 0 && (
          <p className="text-sm text-zinc-500">
            Este proyecto todavía no tiene artículos guardados. Puedes añadir
            uno desde la página de cualquier artículo.
          </p>
        )}

        {articulos && articulos.length > 0 && (
          <ul className="flex flex-col gap-3">
            {articulos.map((articulo) => (
              <li
                key={articulo.id}
                className="flex items-start justify-between gap-3 border-b border-zinc-200 pb-3 dark:border-zinc-800"
              >
                <div>
                  <Link
                    href={`/articulos/${articulo.slug}`}
                    className="font-bold text-teja hover:underline dark:text-teja-claro"
                  >
                    {articulo.titulo}
                  </Link>
                  {articulo.authors && articulo.authors.length > 0 && (
                    <p className="text-sm text-zinc-500">
                      {articulo.authors.map((a) => a.nombre).join(", ")}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => handleQuitarArticulo(articulo)}
                  className="flex-shrink-0 text-xs font-bold text-zinc-400 hover:text-red-600"
                >
                  Quitar
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function DatosTab({
  usuario,
  onUsuarioActualizado,
  onSesionCerrada,
}: {
  usuario: SessionUser;
  onUsuarioActualizado: (usuario: SessionUser) => void;
  onSesionCerrada: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [guardado, setGuardado] = useState(false);
  const [confirmandoBorrado, setConfirmandoBorrado] = useState(false);
  const [enviando, setEnviando] = useState(false);

  async function handleGuardar(formData: FormData) {
    setError(null);
    setGuardado(false);
    setEnviando(true);
    try {
      const actualizado = await actualizarCuenta({
        nombre: String(formData.get("nombre") ?? "").trim(),
        apellidos: String(formData.get("apellidos") ?? "").trim(),
        email: String(formData.get("email") ?? "").trim(),
      });
      onUsuarioActualizado(actualizado);
      setGuardado(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron guardar los cambios.");
    } finally {
      setEnviando(false);
    }
  }

  function handleCerrarSesion() {
    logout();
    onSesionCerrada();
  }

  async function handleEliminarCuenta() {
    setEnviando(true);
    try {
      await eliminarCuenta();
      onSesionCerrada();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo eliminar la cuenta.");
      setEnviando(false);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <form action={handleGuardar} className="flex flex-col gap-3">
        <Campo label="Nombre" name="nombre" defaultValue={usuario.nombre} required />
        <Campo label="Apellidos" name="apellidos" defaultValue={usuario.apellidos} required />
        <Campo label="Email" name="email" type="email" defaultValue={usuario.email} required />
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        {guardado && !error && (
          <p className="text-sm text-green-700 dark:text-green-400">Cambios guardados.</p>
        )}
        <Button type="submit" variant="secondary" className="self-start" disabled={enviando}>
          {enviando ? "Guardando…" : "Guardar cambios"}
        </Button>
      </form>

      <div className="flex flex-col gap-2 border-t border-zinc-200 pt-6 dark:border-zinc-800">
        <Button type="button" variant="secondary" className="self-start" onClick={handleCerrarSesion}>
          Cerrar sesión
        </Button>
      </div>

      <div className="flex flex-col gap-2 border-t border-zinc-200 pt-6 dark:border-zinc-800">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Eliminar la cuenta borra también todos tus Proyectos guardados.
          Esta acción no se puede deshacer.
        </p>
        {!confirmandoBorrado ? (
          <button
            type="button"
            onClick={() => setConfirmandoBorrado(true)}
            className="self-start text-xs font-bold text-red-600 hover:underline dark:text-red-400"
          >
            Eliminar cuenta
          </button>
        ) : (
          <div className="flex flex-col gap-2">
            <p className="text-sm font-bold text-red-600 dark:text-red-400">
              ¿Seguro que quieres eliminar esta cuenta?
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                className="border-red-600 text-red-600 hover:bg-red-50 dark:border-red-400 dark:text-red-400 dark:hover:bg-red-950"
                onClick={handleEliminarCuenta}
                disabled={enviando}
              >
                {enviando ? "Eliminando…" : "Sí, eliminar"}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setConfirmandoBorrado(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Campo({
  label,
  name,
  type = "text",
  defaultValue,
  required,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string;
  required?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      {label}
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        required={required}
        className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
      />
    </label>
  );
}
