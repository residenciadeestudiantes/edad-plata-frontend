"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/Button";
import { PageTitle } from "@/components/PageTitle";
import { useModoNavegacion } from "@/lib/modoNavegacion";
import { getSesionActual, login, logout, registrar, type SessionUser } from "@/lib/auth";

type Modo = "login" | "registro";

export function AnalisisGate({ children }: { children: React.ReactNode }) {
  const [comprobado, setComprobado] = useState(false);
  const [usuario, setUsuario] = useState<SessionUser | null>(null);
  const [modo, setModoFormulario] = useState<Modo>("login");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

  async function handleLogin(formData: FormData) {
    setError(null);
    setEnviando(true);
    try {
      const email = String(formData.get("email") ?? "").trim();
      const password = String(formData.get("password") ?? "");
      setUsuario(await login(email, password));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo iniciar sesión.");
    } finally {
      setEnviando(false);
    }
  }

  async function handleRegistro(formData: FormData) {
    setError(null);

    const nombre = String(formData.get("nombre") ?? "").trim();
    const apellidos = String(formData.get("apellidos") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const emailConfirmacion = String(formData.get("emailConfirmacion") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    if (email.toLowerCase() !== emailConfirmacion.toLowerCase()) {
      setError("Los dos emails no coinciden.");
      return;
    }

    setEnviando(true);
    try {
      setUsuario(await registrar(nombre, apellidos, email, password));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear la cuenta.");
    } finally {
      setEnviando(false);
    }
  }

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

          <div className="flex justify-center gap-2 text-sm">
            <button
              type="button"
              onClick={() => setModoFormulario("login")}
              className={`rounded-md px-3 py-1.5 font-bold transition-colors ${
                modo === "login"
                  ? "bg-azul text-white dark:bg-azul-claro dark:text-negro"
                  : "text-azul hover:bg-azul/10 dark:text-azul-claro dark:hover:bg-azul-claro/10"
              }`}
            >
              Iniciar sesión
            </button>
            <button
              type="button"
              onClick={() => setModoFormulario("registro")}
              className={`rounded-md px-3 py-1.5 font-bold transition-colors ${
                modo === "registro"
                  ? "bg-azul text-white dark:bg-azul-claro dark:text-negro"
                  : "text-azul hover:bg-azul/10 dark:text-azul-claro dark:hover:bg-azul-claro/10"
              }`}
            >
              Crear cuenta
            </button>
          </div>

          {modo === "login" ? (
            <form action={handleLogin} className="flex flex-col gap-3 text-left">
              <Campo label="Email" name="email" type="email" required />
              <Campo label="Contraseña" name="password" type="password" required />
              {error && <MensajeError texto={error} />}
              <Button type="submit" variant="azul" className="self-center" disabled={enviando}>
                {enviando ? "Entrando…" : "Entrar"}
              </Button>
            </form>
          ) : (
            <form action={handleRegistro} className="flex flex-col gap-3 text-left">
              <Campo label="Nombre" name="nombre" required />
              <Campo label="Apellidos" name="apellidos" required />
              <Campo label="Email" name="email" type="email" required />
              <Campo label="Repite el email" name="emailConfirmacion" type="email" required />
              <Campo label="Contraseña" name="password" type="password" required />
              {error && <MensajeError texto={error} />}
              <Button type="submit" variant="azul" className="self-center" disabled={enviando}>
                {enviando ? "Creando cuenta…" : "Crear cuenta"}
              </Button>
            </form>
          )}
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

function Campo({
  label,
  name,
  type = "text",
  required,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      {label}
      <input
        name={name}
        type={type}
        required={required}
        className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
      />
    </label>
  );
}

function MensajeError({ texto }: { texto: string }) {
  return <p className="text-sm text-red-600 dark:text-red-400">{texto}</p>;
}
