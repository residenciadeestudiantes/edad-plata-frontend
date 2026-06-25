"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const SUBNAV_LINKS = [
  { href: "/analisis/corpus", label: "Análisis de Corpus" },
  { href: "/analisis/estilometrico", label: "Análisis Estilométrico" },
  { href: "/analisis/innovacion", label: "Innovación Estilística" },

  { href: "/analisis/hemerografico", label: "Análisis Hemerográfico" },
  { href: "/analisis/publicidad", label: "Análisis de Publicidad" },
];

export function AnalisisSubnav() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-azul/20 bg-blanco font-titulo dark:border-azul-claro/20 dark:bg-negro">
      <div className="mx-auto flex max-w-6xl gap-6 px-6 sm:px-12">
        {SUBNAV_LINKS.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`border-b-2 px-1 py-4 text-lg font-bold transition-colors ${
                isActive
                  ? "border-azul text-azul dark:border-azul-claro dark:text-azul-claro"
                  : "border-transparent text-negro/70 hover:text-azul dark:text-blanco/70 dark:hover:text-azul-claro"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
