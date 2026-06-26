"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface FlipbookPage {
  src: string;
  alt: string;
  w: number;
  h: number;
}

// ── constants ─────────────────────────────────────────────────────────────────

const ANGLE_TURNED        = -170;
const FADE_START          = -115;
const ANIM_MS             = 600;
const DRAG_PX_FULL        = 260;
const DRAG_COMPLETE_THR   = 0.40;
const MIN_ZOOM            = 1;
const MAX_ZOOM            = 2.5;
const ZOOM_STEP           = 0.25;

function ease(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

type Anim = "idle" | "fwd" | "bwd" | "drag";

// ── component ─────────────────────────────────────────────────────────────────

export function FlipbookViewer({ pages }: { pages: FlipbookPage[] }) {
  const total = pages.length;

  const [page, setPage] = useState(0);
  const [anim, setAnim] = useState<Anim>("idle");
  const [zoom, setZoom] = useState(1);
  const [pan,  setPan]  = useState({ x: 0, y: 0 });
  const [full, setFull] = useState(false);

  const wrapRef    = useRef<HTMLDivElement>(null);
  const leafRef    = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const rafRef     = useRef<number>(0);

  // drag tracking — refs only (no re-renders during drag)
  const dragStartX  = useRef(0);
  const dragAngle   = useRef(0);
  const dragging    = useRef(false);
  const didDrag     = useRef(false);

  // pan tracking during zoom
  const panStart    = useRef({ x: 0, y: 0, px: 0, py: 0 });
  const panning     = useRef(false);

  const isAnim = anim !== "idle";

  // derived page indices
  const leafPage = anim === "bwd" ? page - 1 : page;
  const peekPage = anim === "bwd" ? page      : page + 1;

  // preload next page image
  useEffect(() => {
    if (page < total - 1) {
      const img = new Image();
      img.src = pages[page + 1].src;
    }
  }, [page, pages, total]);

  // fullscreen state sync
  useEffect(() => {
    const fn = () => setFull(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", fn);
    return () => document.removeEventListener("fullscreenchange", fn);
  }, []);

  // ── direct DOM animation helpers ──────────────────────────────────────────

  const applyAngle = useCallback((deg: number) => {
    const leaf = leafRef.current;
    const ov   = overlayRef.current;
    if (!leaf) return;

    leaf.style.transform = `rotateY(${deg}deg)`;

    // Fade leaf to hide backface past FADE_START deg
    const opacity = deg < FADE_START
      ? clamp(1 - (deg - FADE_START) / (ANGLE_TURNED - FADE_START), 0, 1)
      : 1;
    leaf.style.opacity = String(opacity);

    // Shadow overlay peaks at -85 deg (midway through turn)
    if (ov) {
      const shadow = Math.sin((Math.abs(deg) / 170) * Math.PI) * 0.4;
      ov.style.opacity = String(shadow);
    }
  }, []);

  const animateTo = useCallback(
    (from: number, to: number, onDone: () => void) => {
      const t0 = performance.now();
      function frame(now: number) {
        const t = clamp((now - t0) / ANIM_MS, 0, 1);
        applyAngle(from + (to - from) * ease(t));
        if (t < 1) {
          rafRef.current = requestAnimationFrame(frame);
        } else {
          applyAngle(to);
          onDone();
        }
      }
      rafRef.current = requestAnimationFrame(frame);
    },
    [applyAngle]
  );

  // ── start/reset leaf when anim state changes ───────────────────────────────

  useEffect(() => {
    if (anim === "fwd") {
      requestAnimationFrame(() => {
        applyAngle(0);
        animateTo(0, ANGLE_TURNED, () => {
          setPage((p) => p + 1);
          setAnim("idle");
        });
      });
    } else if (anim === "bwd") {
      requestAnimationFrame(() => {
        applyAngle(ANGLE_TURNED);
        animateTo(ANGLE_TURNED, 0, () => {
          setPage((p) => p - 1);
          setAnim("idle");
        });
      });
    } else if (anim === "drag") {
      // Snap leaf to current drag angle after re-render (avoids 1-frame flash)
      requestAnimationFrame(() => applyAngle(dragAngle.current));
    }
    return () => { cancelAnimationFrame(rafRef.current); };
  }, [anim, animateTo, applyAngle]);

  // ── keyboard navigation ────────────────────────────────────────────────────

  const next = useCallback(() => {
    if (!isAnim && page < total - 1) setAnim("fwd");
  }, [isAnim, page, total]);

  const prev = useCallback(() => {
    if (!isAnim && page > 0) setAnim("bwd");
  }, [isAnim, page]);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") { e.preventDefault(); next(); }
      if (e.key === "ArrowLeft")                    { e.preventDefault(); prev(); }
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [next, prev]);

  // ── pointer events ─────────────────────────────────────────────────────────

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (isAnim) return;

    if (zoom > 1) {
      // Pan mode when zoomed
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      panStart.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y };
      panning.current  = true;
      return;
    }

    if (page >= total - 1) return;

    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragStartX.current = e.clientX;
    dragAngle.current  = 0;
    dragging.current   = true;
    didDrag.current    = false;
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (panning.current) {
      const dx = e.clientX - panStart.current.x;
      const dy = e.clientY - panStart.current.y;
      setPan({ x: panStart.current.px + dx, y: panStart.current.py + dy });
      return;
    }

    if (!dragging.current) return;

    const delta = dragStartX.current - e.clientX;
    if (!didDrag.current && Math.abs(delta) > 5) {
      didDrag.current = true;
      setAnim("drag");
    }

    if (anim === "drag" || didDrag.current) {
      const deg = clamp(-(delta / DRAG_PX_FULL) * 170, ANGLE_TURNED, 0);
      dragAngle.current = deg;
      applyAngle(deg);
    }
  }

  function onPointerUp(e: React.PointerEvent<HTMLDivElement>) {
    if (panning.current) {
      panning.current = false;
      return;
    }

    if (!dragging.current) return;
    dragging.current = false;

    if (!didDrag.current) return; // pure click — let onClick handle

    const a   = dragAngle.current;
    const pct = Math.abs(a) / Math.abs(ANGLE_TURNED);

    if (pct >= DRAG_COMPLETE_THR && page < total - 1) {
      animateTo(a, ANGLE_TURNED, () => { setPage((p) => p + 1); setAnim("idle"); });
    } else {
      animateTo(a, 0, () => setAnim("idle"));
    }
  }

  function onClick(e: React.MouseEvent<HTMLDivElement>) {
    if (isAnim || didDrag.current || zoom > 1) return;
    const rect    = e.currentTarget.getBoundingClientRect();
    const isRight = e.clientX > rect.left + rect.width / 2;
    if (isRight) next(); else prev();
  }

  // ── zoom ───────────────────────────────────────────────────────────────────

  function zoomIn() {
    setZoom((z) => clamp(+(z + ZOOM_STEP).toFixed(2), MIN_ZOOM, MAX_ZOOM));
  }

  function zoomOut() {
    setZoom((z) => {
      const n = clamp(+(z - ZOOM_STEP).toFixed(2), MIN_ZOOM, MAX_ZOOM);
      if (n <= 1) { setPan({ x: 0, y: 0 }); return 1; }
      return n;
    });
  }

  // ── fullscreen ─────────────────────────────────────────────────────────────

  function toggleFs() {
    if (!wrapRef.current) return;
    if (!document.fullscreenElement) {
      wrapRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }

  // ── sizing ─────────────────────────────────────────────────────────────────

  const refPage    = pages[0];
  const aspectRatio = refPage ? `${refPage.w} / ${refPage.h}` : "3 / 4";

  // Leaf starts at correct angle to avoid 1-frame flash on bwd
  const leafInitTransform = anim === "bwd" ? `rotateY(${ANGLE_TURNED}deg)` : "rotateY(0deg)";

  // ── render ─────────────────────────────────────────────────────────────────

  return (
    <div
      ref={wrapRef}
      className="flex flex-col gap-3"
      style={{ userSelect: "none" }}
    >
      {/* ── Stage ── */}
      <div
        className="relative mx-auto w-full overflow-hidden rounded-lg shadow-lg"
        style={{
          aspectRatio,
          maxHeight: "80svh",
          background: "#E9E5DC",
          cursor: isAnim ? "default" : zoom > 1 ? "grab" : "pointer",
        }}
        role="presentation"
        onClick={onClick}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {/* 3D perspective stage */}
        <div
          style={{
            perspective: "2600px",
            perspectiveOrigin: "left center",
            position: "absolute",
            inset: 0,
          }}
        >
          {/* Peek layer — destination page, shown below the turning leaf */}
          {isAnim && pages[peekPage] && (
            <div style={{ position: "absolute", inset: 0, background: "#FAF8F3" }}>
              <img
                src={pages[peekPage].src}
                alt={pages[peekPage].alt}
                draggable={false}
                style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
              />
            </div>
          )}

          {/* Turning leaf */}
          <div
            ref={leafRef}
            style={{
              position: "absolute",
              inset: 0,
              background: "#FAF8F3",
              transformOrigin: "left center",
              transform: leafInitTransform,
              zIndex: isAnim ? 1 : "auto",
              willChange: isAnim ? "transform, opacity" : "auto",
            }}
          >
            {/* Zoom/pan wrapper (only in idle mode) */}
            <div
              style={{
                width: "100%",
                height: "100%",
                transition: "none",
                transform:
                  zoom > 1 && !isAnim
                    ? `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`
                    : undefined,
                transformOrigin: "center center",
              }}
            >
              <img
                src={pages[leafPage]?.src}
                alt={pages[leafPage]?.alt ?? `Página ${leafPage + 1}`}
                draggable={false}
                style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
              />
            </div>

            {/* Page-curl shadow overlay */}
            <div
              ref={overlayRef}
              aria-hidden
              style={{
                position: "absolute",
                inset: 0,
                opacity: 0,
                pointerEvents: "none",
                background:
                  "linear-gradient(to right, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.1) 35%, transparent 55%, rgba(255,255,255,0.1) 90%)",
              }}
            />
          </div>
        </div>

        {/* Prev chevron */}
        {!isAnim && page > 0 && (
          <NavBtn
            side="left"
            aria-label="Página anterior"
            onClick={(e) => { e.stopPropagation(); prev(); }}
          />
        )}

        {/* Next chevron */}
        {!isAnim && page < total - 1 && (
          <NavBtn
            side="right"
            aria-label="Página siguiente"
            onClick={(e) => { e.stopPropagation(); next(); }}
          />
        )}
      </div>

      {/* ── Controls ── */}
      <div className="rounded-lg border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950 flex flex-col gap-2.5">
        {/* Progress scrubber */}
        <input
          type="range"
          min={0}
          max={total - 1}
          value={page}
          onChange={(e) => { if (!isAnim) setPage(Number(e.target.value)); }}
          disabled={isAnim}
          aria-label="Saltar a página"
          className="w-full h-1.5 cursor-pointer"
          style={{ accentColor: "var(--color-teja, #DA3C00)" }}
        />

        {/* Bottom row */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Page counter */}
          <span className="tabular-nums text-sm font-light text-zinc-500 dark:text-zinc-400">
            {page + 1} / {total}
          </span>

          {/* Zoom controls */}
          <div className="flex items-center gap-1.5">
            <Btn onClick={zoomOut} disabled={zoom <= MIN_ZOOM} aria-label="Reducir zoom">−</Btn>
            <span className="min-w-[3rem] text-center text-xs text-zinc-500 dark:text-zinc-400">
              {Math.round(zoom * 100)}%
            </span>
            <Btn onClick={zoomIn} disabled={zoom >= MAX_ZOOM} aria-label="Aumentar zoom">+</Btn>
          </div>

          {/* Fullscreen */}
          <Btn onClick={toggleFs} aria-label={full ? "Salir de pantalla completa" : "Pantalla completa"}>
            {full ? <IcoMinimize /> : <IcoMaximize />}
          </Btn>
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function NavBtn({
  side,
  ...props
}: { side: "left" | "right" } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...props}
      className={`absolute top-1/2 -translate-y-1/2 z-10 rounded-full bg-white/75 p-2 text-teja shadow-md backdrop-blur-sm transition-colors hover:bg-white ${
        side === "left" ? "left-2" : "right-2"
      }`}
    >
      {side === "left" ? <IcoChevronLeft /> : <IcoChevronRight />}
    </button>
  );
}

function Btn({ children, className = "", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...props}
      className={`inline-flex items-center justify-center rounded-md border border-zinc-200 px-2.5 py-1 text-sm text-zinc-600 transition-colors hover:border-teja hover:text-teja disabled:pointer-events-none disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-400 ${className}`}
    >
      {children}
    </button>
  );
}

function IcoChevronLeft() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-5 w-5" aria-hidden>
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function IcoChevronRight() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-5 w-5" aria-hidden>
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function IcoMaximize() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4" aria-hidden>
      <polyline points="15 3 21 3 21 9" />
      <polyline points="9 21 3 21 3 15" />
      <line x1="21" y1="3" x2="14" y2="10" />
      <line x1="3" y1="21" x2="10" y2="14" />
    </svg>
  );
}

function IcoMinimize() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4" aria-hidden>
      <polyline points="4 14 10 14 10 20" />
      <polyline points="20 10 14 10 14 4" />
      <line x1="10" y1="14" x2="3" y2="21" />
      <line x1="21" y1="3" x2="14" y2="10" />
    </svg>
  );
}
