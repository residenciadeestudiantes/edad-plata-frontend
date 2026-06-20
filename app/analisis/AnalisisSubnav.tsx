"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const SUBNAV_LINKS = [
  { href: "/analisis/corpus", label: "Análisis de Corpus" },
  { href: "/analisis/estilometrico", label: "Análisis Estilométrico" },
];

export function AnalisisSubnav() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-zinc-200 bg-white font-cuerpo dark:border-zinc-800 dark:bg-negro">
      <div className="mx-auto flex max-w-6xl gap-6 px-6 sm:px-12">
        {SUBNAV_LINKS.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`border-b-2 px-1 py-4 text-sm font-medium transition-colors ${
                isActive
                  ? "border-teja text-teja dark:border-teja-claro dark:text-teja-claro"
                  : "border-transparent text-zinc-500 hover:text-teja dark:text-zinc-400 dark:hover:text-teja-claro"
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
