"use client";

import { useEffect, useState } from "react";
import { AuthForms } from "@/components/AuthForms";
import { PageTitle } from "@/components/PageTitle";
import { useModoNavegacion } from "@/lib/modoNavegacion";
import { getSesionActual, logout, type SessionUser } from "@/lib/auth";

export function AnalisisGate({ children }: { children: React.ReactNode }) {
  const [comprobado, setComprobado] = useState(false);
  const [usuario, setUsuario] = useState<SessionUser | null>(null);
  const { setModo } = useModoNavegacion();

  useEffect(() => {
    getSesionActual().then((sesion) => {
      setUsuario(sesion);
      setComprobado(true);
    });
  }, []);

  // La sección de análisis es en sí misma una herramienta de investigación:
  // al acceder a ella (con sesión ya iniciada) se activa el modo
  // investigación en toda la web.
  useEffect(() => {
    if (usuario) setModo("investigacion");
  }, [usuario, setModo]);

  function handleLogout() {
    logout();
    setUsuario(null);
  }

  if (!comprobado) return null;

  if (!usuario) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-10 py-20 text-center sm:px-20">
        <div className="flex w-full max-w-md flex-col gap-4">
          <PageTitle color="azul">Análisis</PageTitle>
          <p className="font-light text-zinc-600 dark:text-zinc-400">
            Esta es una sección para investigadores, con herramientas
            avanzadas de análisis lingüístico y estilométrico del corpus.
            Inicia sesión o crea una cuenta para acceder.
          </p>
          <AuthForms onAutenticado={setUsuario} />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-end gap-3 border-b border-azul/10 px-4 py-2 text-xs text-zinc-600 dark:border-azul-claro/10 dark:text-zinc-400">
        <span>
          {usuario.nombre} {usuario.apellidos}
        </span>
        <button
          type="button"
          onClick={handleLogout}
          className="font-bold text-azul hover:underline dark:text-azul-claro"
        >
          Cerrar sesión
        </button>
      </div>
      {children}
    </>
  );
}
