"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export const SUBNAV_LINKS = [
  { href: "/analisis/corpus", label: "Análisis de Corpus" },
  { href: "/analisis/estilometrico", label: "Análisis Estilométrico" },
  { href: "/analisis/innovacion", label: "Innovación Estilística" },

  { href: "/analisis/hemerografico", label: "Datos hemerográficos" },
  { href: "/analisis/publicidad", label: "Análisis de Publicidad" },
];

// Barra lateral para escritorio (>= sm); en móvil se usa el panel deslizante
// de AnalisisSubnavMobile en su lugar.
export function AnalisisSubnav() {
  const pathname = usePathname();

  // La portada de Análisis (/analisis) es la puerta de entrada a las
  // herramientas, no una herramienta en sí: no lleva submenú.
  if (pathname === "/analisis") return null;

  return (
    <nav className="hidden w-56 flex-shrink-0 flex-col border-r border-azul/20 bg-blanco font-titulo sm:flex dark:border-azul-claro/20 dark:bg-negro">
      {SUBNAV_LINKS.map((link, index) => {
        const isActive = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            style={{ animationDelay: `${index * 60}ms` }}
            className={`animate-[slideFadeIn_0.4s_ease-out_backwards] border-b border-azul/10 px-5 py-4 text-base font-bold transition-colors dark:border-azul-claro/10 ${
              isActive
                ? "bg-azul/10 text-azul dark:bg-azul-claro/10 dark:text-azul-claro"
                : "text-negro/70 hover:bg-azul/5 hover:text-azul dark:text-blanco/70 dark:hover:bg-azul-claro/5 dark:hover:text-azul-claro"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
