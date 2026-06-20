"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const SUBNAV_LINKS = [
  { href: "/analisis/corpus", label: "Análisis de Corpus" },
  { href: "/analisis/estilometrico", label: "Análisis Estilométrico" },
  { href: "/analisis/innovacion", label: "Innovación Estilística" },
  { href: "/analisis/narrativa", label: "Narrativa Visual" },
];

export function AnalisisSubnav() {
  const pathname = usePathname();

  return (
    <nav className="bg-teja">
      <div className="mx-auto flex max-w-6xl gap-6 px-6 sm:px-12">
        {SUBNAV_LINKS.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`border-b-2 px-1 py-4 font-titulo text-lg font-bold text-white transition-colors ${
                isActive ? "border-white" : "border-transparent opacity-80 hover:opacity-100"
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
