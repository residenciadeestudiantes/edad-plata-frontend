"use client";

import { useState } from "react";
import { Button } from "@/components/Button";
import { login, registrar, type SessionUser } from "@/lib/auth";

type Modo = "login" | "registro";

// Formulario compartido de inicio de sesión / creación de cuenta, usado
// tanto por AnalisisGate (exige sesión para entrar) como por /cuenta
// (página de gestión de cuenta). onAutenticado recibe el usuario ya
// autenticado para que cada sitio decida qué hacer (desbloquear una
// sección, mostrar las pestañas de cuenta, etc.).
export function AuthForms({
  onAutenticado,
  modoInicial = "login",
}: {
  onAutenticado: (usuario: SessionUser) => void;
  modoInicial?: Modo;
}) {
  const [modo, setModo] = useState<Modo>(modoInicial);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(formData: FormData) {
    setError(null);
    setEnviando(true);
    try {
      const email = String(formData.get("email") ?? "").trim();
      const password = String(formData.get("password") ?? "");
      onAutenticado(await login(email, password));
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
      onAutenticado(await registrar(nombre, apellidos, email, password));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear la cuenta.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      <div className="flex justify-center gap-2 text-sm">
        <button
          type="button"
          onClick={() => setModo("login")}
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
          onClick={() => setModo("registro")}
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
