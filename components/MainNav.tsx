"use client";

import Link from "next/link";
import { useModoNavegacion } from "@/lib/modoNavegacion";

// Enlaces del menú principal: cambian a azul (color de marca del modo
// investigación) mientras ese modo está activo, en vez de mostrar una barra
// aparte con el switch.
export function MainNav({
  links,
}: {
  links: { href: string; label: string }[];
}) {
  const { modo } = useModoNavegacion();
  const activo = modo === "investigacion";

  return (
    <nav
      className={`hidden gap-8 font-titulo text-2xl font-bold transition-colors sm:flex ${
        activo ? "text-azul" : "text-teja"
      }`}
    >
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="transition-opacity hover:opacity-75"
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
