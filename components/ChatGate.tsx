"use client";

import { useEffect, useState } from "react";
import { AuthForms } from "@/components/AuthForms";
import { PageTitle } from "@/components/PageTitle";
import { getSesionActual, logout, type SessionUser } from "@/lib/auth";

// Mismo patrón que AnalisisGate.tsx, sin activar el modo investigación: el
// asistente es una herramienta propia, no forma parte de /analisis.
export function ChatGate({ children }: { children: React.ReactNode }) {
  const [comprobado, setComprobado] = useState(false);
  const [usuario, setUsuario] = useState<SessionUser | null>(null);

  useEffect(() => {
    getSesionActual().then((sesion) => {
      setUsuario(sesion);
      setComprobado(true);
    });
  }, []);

  function handleLogout() {
    logout();
    setUsuario(null);
  }

  if (!comprobado) return null;

  if (!usuario) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-10 py-20 text-center sm:px-20">
        <div className="flex w-full max-w-md flex-col gap-4">
          <PageTitle>Asistente</PageTitle>
          <p className="font-light text-zinc-600 dark:text-zinc-400">
            Un asistente conversacional que responde preguntas sobre las
            revistas, los artículos y los autores de la Edad de Plata.
            Inicia sesión o crea una cuenta para acceder.
          </p>
          <AuthForms onAutenticado={setUsuario} />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-end gap-3 border-b border-teja/10 px-4 py-2 text-xs text-zinc-600 dark:border-teja-claro/10 dark:text-zinc-400">
        <span>
          {usuario.nombre} {usuario.apellidos}
        </span>
        <button
          type="button"
          onClick={handleLogout}
          className="font-bold text-teja hover:underline dark:text-teja-claro"
        >
          Cerrar sesión
        </button>
      </div>
      {children}
    </>
  );
}
