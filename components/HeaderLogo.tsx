"use client";

import Image from "next/image";
import Link from "next/link";
import { useModoNavegacion } from "@/lib/modoNavegacion";

// Logo de la cabecera: cambia a la variante azul (marca del modo
// investigación) mientras ese modo está activo, igual que MainNav.
export function HeaderLogo() {
  const { modo } = useModoNavegacion();
  const activo = modo === "investigacion";

  return (
    <Link href="/" className="flex items-center">
      <Image
        src={
          activo
            ? "/images/logo-residencia-azul.png"
            : "/images/logo-residencia.png"
        }
        alt="Residencia de Estudiantes"
        width={220}
        height={62}
        className="h-16 w-auto"
        priority
      />
    </Link>
  );
}
