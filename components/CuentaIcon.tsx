"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getSesionActual } from "@/lib/auth";

// Icono de usuario en la cabecera: relleno y en color de marca si hay
// sesión iniciada, en contorno y color neutro si no. Enlaza siempre a
// /cuenta (login/registro si no hay sesión, panel de cuenta si la hay).
export function CuentaIcon() {
  const [conSesion, setConSesion] = useState<boolean | null>(null);

  useEffect(() => {
    getSesionActual().then((sesion) => setConSesion(sesion !== null));
  }, []);

  return (
    <Link
      href="/cuenta"
      title={conSesion ? "Mi cuenta" : "Iniciar sesión"}
      aria-label={conSesion ? "Mi cuenta" : "Iniciar sesión"}
      className={
        conSesion
          ? "text-teja dark:text-teja-claro"
          : "text-negro/70 hover:text-teja dark:text-blanco/70 dark:hover:text-teja-claro"
      }
    >
      <UserIcon relleno={conSesion === true} />
    </Link>
  );
}

function UserIcon({ relleno }: { relleno: boolean }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className="h-6 w-6">
      <circle
        cx="10"
        cy="6.5"
        r="3.25"
        fill={relleno ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={1.5}
      />
      <path
        d="M3.5 17c0-3.5 3-5.5 6.5-5.5s6.5 2 6.5 5.5"
        fill={relleno ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
      />
    </svg>
  );
}
