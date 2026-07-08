"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { getStrapiMediaUrl, type StrapiMedia } from "@/lib/api";

function IconoAnterior() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  );
}

function IconoSiguiente() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}

function IconoPantallaCompleta({ activo }: { activo: boolean }) {
  return activo ? (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 3v3a2 2 0 01-2 2H3m18 0h-3a2 2 0 01-2-2V3m0 18v-3a2 2 0 012-2h3M3 16h3a2 2 0 012 2v3" />
    </svg>
  ) : (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-5h-4m4 0v4m0 0l-5-5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
    </svg>
  );
}

// Lupa con "+": para la variante clara (prosa), donde ampliar la imagen se
// presenta como "zoom" en vez de como "pantalla completa".
function IconoZoom() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
      <circle cx="10.5" cy="10.5" r="6.5" strokeLinecap="round" strokeLinejoin="round" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 8v5M8 10.5h5M20 20l-4.35-4.35" />
    </svg>
  );
}

type Variante = "oscura" | "clara";

const TEMA = {
  oscura: {
    wrapper: "bg-negro",
    controles: "border-zinc-800 bg-zinc-950",
    contador: "text-zinc-400",
    contadorSeparador: "text-zinc-600",
    flecha: "bg-negro/60 text-white hover:bg-negro",
    miniaturaActiva: "border-white",
    miniaturaInactiva: "border-transparent opacity-50 hover:opacity-80",
    zoom: "text-zinc-400 hover:bg-zinc-800 hover:text-white",
  },
  clara: {
    wrapper: "bg-gris-claro",
    controles: "border-zinc-200 bg-white",
    contador: "text-zinc-500",
    contadorSeparador: "text-zinc-300",
    flecha: "bg-white/80 text-teja shadow-sm hover:bg-white",
    miniaturaActiva: "border-teja",
    miniaturaInactiva: "border-transparent opacity-60 hover:opacity-90",
    zoom: "text-teja hover:bg-teja/10",
  },
} as const;

export function ArticleGallery({
  imagenes,
  alt,
  variante = "oscura",
}: {
  imagenes: StrapiMedia[];
  alt: string;
  variante?: Variante;
}) {
  const tema = TEMA[variante];
  const valid = imagenes.filter((img) => getStrapiMediaUrl(img.url));
  const [indice, setIndice]   = useState(0);
  const [full, setFull]       = useState(false);
  const [cssFs, setCssFs]     = useState(false);
  const wrapRef               = useRef<HTMLDivElement>(null);

  if (valid.length === 0) return null;

  const actual    = valid[indice];
  const actualUrl = getStrapiMediaUrl(actual.url)!;
  const hayVarias = valid.length > 1;
  const isFullscreen = full || cssFs;

  function anterior() { setIndice((i) => (i - 1 + valid.length) % valid.length); }
  function siguiente() { setIndice((i) => (i + 1) % valid.length); }

  function toggleFullscreen() {
    if (!wrapRef.current) return;
    if (document.fullscreenEnabled) {
      if (!document.fullscreenElement) {
        wrapRef.current.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    } else {
      setCssFs((v) => !v);
    }
  }

  // Teclado
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!isFullscreen && !wrapRef.current?.contains(document.activeElement)) return;
      if (e.key === "ArrowLeft")  { e.preventDefault(); anterior(); }
      if (e.key === "ArrowRight") { e.preventDefault(); siguiente(); }
      if (e.key === "Escape" && cssFs) setCssFs(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isFullscreen, cssFs, valid.length]);

  // Listener fullscreen nativo
  useEffect(() => {
    const fn = () => setFull(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", fn);
    return () => document.removeEventListener("fullscreenchange", fn);
  }, []);

  // Bloquear scroll en CSS fullscreen
  useEffect(() => {
    if (cssFs) document.body.style.overflow = "hidden";
    else        document.body.style.overflow = "";
    return ()  => { document.body.style.overflow = ""; };
  }, [cssFs]);

  return (
    <div
      ref={wrapRef}
      className={
        cssFs
          ? `fixed inset-0 z-50 flex flex-col overflow-hidden ${tema.wrapper}`
          : `flex flex-col overflow-hidden rounded-xl ${tema.wrapper}`
      }
    >
      {/* Área de imagen */}
      <div className="relative flex-1" style={{ minHeight: isFullscreen ? 0 : "60vh", maxHeight: isFullscreen ? undefined : "75vh" }}>
        <Image
          src={actualUrl}
          alt={actual.alternativeText ?? alt}
          fill
          sizes="(min-width: 1024px) 65vw, 100vw"
          className="object-contain"
          priority
        />

        {/* Flechas superpuestas cuando hay varias imágenes */}
        {hayVarias && (
          <>
            <button
              type="button"
              onClick={anterior}
              aria-label="Imagen anterior"
              className={`absolute left-2 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full transition-colors ${tema.flecha}`}
            >
              <IconoAnterior />
            </button>
            <button
              type="button"
              onClick={siguiente}
              aria-label="Imagen siguiente"
              className={`absolute right-2 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full transition-colors ${tema.flecha}`}
            >
              <IconoSiguiente />
            </button>
          </>
        )}
      </div>

      {/* Barra de controles — igual que el flipbook */}
      <div className={`flex items-center justify-between gap-3 border-t px-4 py-2 ${tema.controles}`}>
        {/* Contador */}
        {hayVarias ? (
          <span className={`text-sm ${tema.contador}`}>
            {indice + 1} <span className={tema.contadorSeparador}>/</span> {valid.length}
          </span>
        ) : (
          <span />
        )}

        {/* Miniaturas centrales */}
        {hayVarias && (
          <div className="flex gap-1.5 overflow-x-auto">
            {valid.map((img, i) => {
              const u = getStrapiMediaUrl(img.url);
              if (!u) return null;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIndice(i)}
                  aria-label={`Ir a imagen ${i + 1}`}
                  className={`h-8 w-8 shrink-0 overflow-hidden rounded border-2 transition-colors ${
                    i === indice ? tema.miniaturaActiva : tema.miniaturaInactiva
                  }`}
                >
                  <Image src={u} alt="" width={32} height={32} className="h-full w-full object-cover" />
                </button>
              );
            })}
          </div>
        )}

        {/* Zoom / pantalla completa */}
        <button
          type="button"
          onClick={toggleFullscreen}
          aria-label={isFullscreen ? "Salir de pantalla completa" : variante === "clara" ? "Ampliar imagen" : "Pantalla completa"}
          className={`flex h-8 w-8 items-center justify-center rounded transition-colors ${tema.zoom}`}
        >
          {variante === "clara" ? <IconoZoom /> : <IconoPantallaCompleta activo={isFullscreen} />}
        </button>
      </div>
    </div>
  );
}
