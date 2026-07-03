"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export function MobileNav({
  links,
}: {
  links: { href: string; label: string }[];
}) {
  const [open, setOpen] = useState(false);

  // Evita el scroll de fondo mientras el menú a pantalla completa está abierto.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <div className="sm:hidden">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={open ? "Cerrar menú" : "Abrir menú"}
        className={`relative z-50 flex h-9 w-9 items-center justify-center rounded-md transition-colors ${
          open ? "text-blanco hover:bg-blanco/10" : "text-negro hover:bg-negro/10"
        }`}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
          className="h-6 w-6"
          aria-hidden="true"
        >
          {open ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18 18 6M6 6l12 12"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5"
            />
          )}
        </svg>
      </button>

      {/* Panel a pantalla completa que entra desde la derecha; se mantiene
          montado siempre para poder animar la entrada/salida con transform. */}
      <nav
        id="mobile-menu"
        aria-label="Navegación principal"
        aria-hidden={!open}
        className={`fixed inset-0 z-[45] flex flex-col gap-1 bg-teja px-8 pt-28 pb-8 text-blanco transition-transform duration-300 ease-in-out ${
          open ? "translate-x-0" : "pointer-events-none translate-x-full"
        }`}
      >
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            onClick={() => setOpen(false)}
            tabIndex={open ? 0 : -1}
            className="rounded-md px-2 py-3 font-titulo text-2xl font-bold transition-colors hover:bg-blanco/10"
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
