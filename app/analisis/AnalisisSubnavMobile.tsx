"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState, type TouchEvent } from "react";
import { SUBNAV_LINKS } from "./AnalisisSubnav";

// Distancia mínima de arrastre (px) para que un swipe cuente como gesto,
// en vez de un simple toque.
const SWIPE_THRESHOLD = 40;

// Panel de herramientas de análisis para móvil (< sm): un tirador fijo en
// el borde derecho abre el panel al tocarlo o al deslizar el dedo hacia la
// izquierda desde ahí; deslizar hacia la derecha sobre el panel abierto (o
// tocar el fondo) lo cierra. En >= sm se usa la barra lateral fija de
// AnalisisSubnav en su lugar.
export function AnalisisSubnavMobile() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const touchStartX = useRef<number | null>(null);

  // La portada de Análisis (/analisis) no lleva submenú.
  if (pathname === "/analisis") return null;

  function handleTouchStart(event: TouchEvent) {
    touchStartX.current = event.touches[0].clientX;
  }

  function handleTouchEnd(event: TouchEvent) {
    if (touchStartX.current === null) return;
    const deltaX = event.changedTouches[0].clientX - touchStartX.current;
    if (!open && deltaX < -SWIPE_THRESHOLD) setOpen(true);
    if (open && deltaX > SWIPE_THRESHOLD) setOpen(false);
    touchStartX.current = null;
  }

  return (
    <div className="sm:hidden">
      {/* Tirador fijo en el lateral derecho: tocar o deslizar hacia la
          izquierda desde aquí abre el panel. */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        aria-label="Abrir herramientas de análisis"
        aria-expanded={open}
        aria-controls="analisis-subnav-mobile"
        className={`fixed top-1/2 right-0 z-40 -translate-y-1/2 rounded-l-md border border-r-0 border-azul/30 bg-blanco py-4 pr-1 pl-2 text-azul shadow-md transition-opacity dark:border-azul-claro/30 dark:bg-negro dark:text-azul-claro ${
          open ? "pointer-events-none opacity-0" : "opacity-100"
        }`}
      >
        <span className="block text-xs font-bold tracking-wide [writing-mode:vertical-rl]">
          Herramientas
        </span>
      </button>

      {/* Fondo: toca fuera del panel para cerrarlo. */}
      <div
        aria-hidden="true"
        onClick={() => setOpen(false)}
        className={`fixed inset-0 z-40 bg-negro/40 transition-opacity ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <nav
        id="analisis-subnav-mobile"
        aria-label="Herramientas de análisis"
        aria-hidden={!open}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className={`fixed inset-y-0 right-0 z-50 flex w-64 flex-col overflow-y-auto border-l border-azul/20 bg-blanco font-titulo transition-transform duration-300 ease-in-out dark:border-azul-claro/20 dark:bg-negro ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-azul/10 px-5 py-4 dark:border-azul-claro/10">
          <span className="text-sm font-bold text-azul dark:text-azul-claro">
            Herramientas
          </span>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Cerrar"
            tabIndex={open ? 0 : -1}
            className="flex h-8 w-8 items-center justify-center rounded-md text-negro/60 transition-colors hover:bg-negro/5 dark:text-blanco/60 dark:hover:bg-blanco/10"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              className="h-5 w-5"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {SUBNAV_LINKS.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              tabIndex={open ? 0 : -1}
              className={`border-b border-azul/10 px-5 py-4 text-base font-bold transition-colors dark:border-azul-claro/10 ${
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
    </div>
  );
}
