"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/Button";
import { PageTitle } from "@/components/PageTitle";
import { useModoNavegacion } from "@/lib/modoNavegacion";

const STORAGE_KEY = "edad-plata-analisis-acceso";

// PROTOTIPO: contraseña fija en el cliente como solución provisional de
// acceso. En cuanto exista un sistema de registro de investigadores, esto
// debe sustituirse por una autenticación real (cuenta + permisos en el
// servidor), ya que una contraseña comprobada en el navegador no es segura.
const PASSWORD_PROVISIONAL = "revistas";

export function AnalisisGate({ children }: { children: React.ReactNode }) {
  const [comprobado, setComprobado] = useState(false);
  const [desbloqueado, setDesbloqueado] = useState(false);
  const [error, setError] = useState(false);
  const { setModo } = useModoNavegacion();

  useEffect(() => {
    const guardado = window.localStorage.getItem(STORAGE_KEY);

    Promise.resolve().then(() => {
      if (guardado === "true") setDesbloqueado(true);
      setComprobado(true);
    });
  }, []);

  // La sección de análisis es en sí misma una herramienta de investigación:
  // al acceder a ella (con la contraseña o ya desbloqueada de antes) se
  // activa el modo investigación en toda la web.
  useEffect(() => {
    if (desbloqueado) setModo("investigacion");
  }, [desbloqueado, setModo]);

  function handleSubmit(formData: FormData) {
    const intento = String(formData.get("password") ?? "").trim();

    if (intento === PASSWORD_PROVISIONAL) {
      window.localStorage.setItem(STORAGE_KEY, "true");
      setDesbloqueado(true);
      setError(false);
    } else {
      setError(true);
    }
  }

  if (!comprobado) return null;

  if (!desbloqueado) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-10 py-20 text-center sm:px-20">
        <div className="flex max-w-md flex-col gap-4">
          <PageTitle color="azul">Análisis</PageTitle>
          <p className="font-light text-zinc-600 dark:text-zinc-400">
            Esta es una sección para investigadores, con herramientas
            avanzadas de análisis lingüístico y estilométrico del corpus. El
            acceso debe solicitarse.
          </p>
          <form action={handleSubmit} className="flex flex-col gap-3">
            <label htmlFor="password" className="sr-only">
              Contraseña de acceso
            </label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="Contraseña de acceso"
              className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-center text-sm dark:border-zinc-700 dark:bg-zinc-900"
            />
            {error && (
              <p className="text-sm text-red-600 dark:text-red-400">
                Contraseña incorrecta.
              </p>
            )}
            <Button type="submit" variant="azul" className="self-center">
              Acceder
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
