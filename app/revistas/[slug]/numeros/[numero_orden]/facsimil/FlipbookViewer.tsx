"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import type {
  PDFDocumentProxy,
  PDFDocumentLoadingTask,
} from "pdfjs-dist";
import { applyPdfJsCompatPolyfills } from "@/lib/pdfjsCompatPolyfills";

// ── constants ─────────────────────────────────────────────────────────────────

const ANIM_MS        = 550;
const ANGLE_DONE     = -170;   // final rotateY when leaf is fully turned
const FADE_FROM      = -100;   // start fading leaf opacity past this angle
const RENDER_SCALE   = 1.5;    // PDF render scale (quality vs speed)
const DRAG_PX_FULL   = 280;    // pointer px to reach full turn
const DRAG_THRESHOLD = 0.38;   // fraction to commit forward turn

function ease(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}
function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

type AnimState = "idle" | "fwd" | "bwd" | "drag";

// ── component ─────────────────────────────────────────────────────────────────

export function FlipbookViewer({ pdfUrl }: { pdfUrl: string }) {
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading");
  const [loadProgress, setLoadProgress] = useState(0);
  const [totalPages, setTotalPages]     = useState(0);
  const [spread, setSpread]             = useState(0);
  const [anim, setAnim]                 = useState<AnimState>("idle");
  const [, forceUpdate]                 = useState(0);  // triggers re-render when pages cache
  const [full, setFull]                 = useState(false);

  const pdfRef      = useRef<PDFDocumentProxy | null>(null);
  const loadRef     = useRef<PDFDocumentLoadingTask | null>(null);
  const leafRef     = useRef<HTMLDivElement>(null);
  const shadowRef   = useRef<HTMLDivElement>(null);
  const rafRef      = useRef<number>(0);
  const wrapRef     = useRef<HTMLDivElement>(null);
  const cacheRef    = useRef<Map<number, string>>(new Map());
  const renderingRef = useRef<Set<number>>(new Set());

  // Spread 0: blank left + page 1 right (cover alone)
  // Spread s>0: pages 2s left, 2s+1 right
  const totalSpreads = totalPages > 0 ? Math.ceil((totalPages + 1) / 2) : 0;
  const isAnim       = anim !== "idle";

  // 1-indexed PDF page numbers (-1 = blank slot)
  const LP = (s: number): number => s === 0 ? -1 : 2 * s;
  const RP = (s: number): number => 2 * s + 1;

  function isBlank(n: number) { return n === -1 || n > totalPages; }

  // Which pages go in each visual slot during animation
  const leftSlot   = anim === "bwd" ? LP(spread - 1) : LP(spread);
  const leafSlot   = anim === "bwd" ? RP(spread - 1) : RP(spread);
  const behindSlot = anim === "bwd" ? LP(spread)     : LP(spread + 1);

  // ── Load PDF ──────────────────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        applyPdfJsCompatPolyfills();
        const lib = await import("pdfjs-dist");
        lib.GlobalWorkerOptions.workerSrc = "/pdf.worker.entry.mjs";
        const task = lib.getDocument({ url: pdfUrl });
        loadRef.current = task;
        task.onProgress = ({ loaded, total }: { loaded: number; total: number }) => {
          if (total > 0) setLoadProgress(Math.min(99, Math.round(loaded / total * 100)));
        };
        const doc = await task.promise;
        if (cancelled) { task.destroy(); return; }
        pdfRef.current = doc;
        setTotalPages(doc.numPages);
        setLoadState("ready");
      } catch {
        if (!cancelled) setLoadState("error");
      }
    }
    load();
    return () => {
      cancelled = true;
      loadRef.current?.destroy();
      pdfRef.current = null;
    };
  }, [pdfUrl]);

  // ── Render PDF page to data URL ───────────────────────────────────────────

  const ensurePage = useCallback(async (n: number) => {
    const doc = pdfRef.current;
    if (!doc || n < 1 || n > doc.numPages) return;
    if (cacheRef.current.has(n) || renderingRef.current.has(n)) return;
    renderingRef.current.add(n);
    try {
      const page   = await doc.getPage(n);
      const vp     = page.getViewport({ scale: RENDER_SCALE });
      const canvas = document.createElement("canvas");
      canvas.width  = vp.width;
      canvas.height = vp.height;
      await page.render({ canvas, canvasContext: canvas.getContext("2d")!, viewport: vp }).promise;
      cacheRef.current.set(n, canvas.toDataURL("image/jpeg", 0.92));
      forceUpdate(k => k + 1);
    } finally {
      renderingRef.current.delete(n);
    }
  }, []);

  // Preload current spread ± 1
  useEffect(() => {
    if (loadState !== "ready") return;
    [
      LP(spread), RP(spread),
      LP(spread + 1), RP(spread + 1),
      LP(spread - 1), RP(spread - 1),
    ].forEach(ensurePage);
  }, [spread, loadState, ensurePage]);

  // Fullscreen sync
  useEffect(() => {
    const fn = () => setFull(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", fn);
    return () => document.removeEventListener("fullscreenchange", fn);
  }, []);

  // ── Direct DOM angle control ──────────────────────────────────────────────

  const applyAngle = useCallback((deg: number) => {
    const leaf = leafRef.current;
    if (!leaf) return;
    leaf.style.transform = `rotateY(${deg}deg)`;
    leaf.style.opacity   = String(
      deg < FADE_FROM
        ? clamp(1 - (deg - FADE_FROM) / (ANGLE_DONE - FADE_FROM), 0, 1)
        : 1
    );
    if (shadowRef.current) {
      shadowRef.current.style.opacity = String(
        Math.sin((Math.abs(deg) / Math.abs(ANGLE_DONE)) * Math.PI) * 0.45
      );
    }
  }, []);

  const animateTo = useCallback((from: number, to: number, done: () => void) => {
    const t0 = performance.now();
    function frame(now: number) {
      const t = clamp((now - t0) / ANIM_MS, 0, 1);
      applyAngle(from + (to - from) * ease(t));
      if (t < 1) rafRef.current = requestAnimationFrame(frame);
      else { applyAngle(to); done(); }
    }
    rafRef.current = requestAnimationFrame(frame);
  }, [applyAngle]);

  // Set leaf's initial angle before first paint of each animation phase
  useLayoutEffect(() => {
    if (anim === "fwd")  applyAngle(0);
    if (anim === "bwd")  applyAngle(ANGLE_DONE);
    if (anim === "drag") applyAngle(dAngle.current);
  }, [anim, applyAngle]); // eslint-disable-line react-hooks/exhaustive-deps

  // Start RAF animation (after layout effect has set initial position)
  useEffect(() => {
    if (anim === "fwd") {
      animateTo(0, ANGLE_DONE, () => { setSpread(s => s + 1); setAnim("idle"); });
    } else if (anim === "bwd") {
      animateTo(ANGLE_DONE, 0, () => { setSpread(s => s - 1); setAnim("idle"); });
    }
    return () => cancelAnimationFrame(rafRef.current);
  }, [anim, animateTo]);

  // ── Drag ──────────────────────────────────────────────────────────────────

  const dStart  = useRef(0);
  const dAngle  = useRef(0);
  const dActive = useRef(false);
  const dMoved  = useRef(false);

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (isAnim || spread >= totalSpreads - 1) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dStart.current  = e.clientX;
    dAngle.current  = 0;
    dActive.current = true;
    dMoved.current  = false;
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dActive.current) return;
    const delta = dStart.current - e.clientX;
    if (!dMoved.current && Math.abs(delta) > 6) {
      dMoved.current = true;
      setAnim("drag");
    }
    if (dMoved.current) {
      dAngle.current = clamp(-(delta / DRAG_PX_FULL) * 170, ANGLE_DONE, 0);
      applyAngle(dAngle.current);
    }
  }

  function onPointerUp() {
    if (!dActive.current) return;
    dActive.current = false;
    if (!dMoved.current) { setAnim("idle"); return; }
    const pct = Math.abs(dAngle.current) / Math.abs(ANGLE_DONE);
    if (pct >= DRAG_THRESHOLD && spread < totalSpreads - 1) {
      animateTo(dAngle.current, ANGLE_DONE, () => { setSpread(s => s + 1); setAnim("idle"); });
    } else {
      animateTo(dAngle.current, 0, () => setAnim("idle"));
    }
  }

  // ── Keyboard navigation ───────────────────────────────────────────────────

  const next = useCallback(() => {
    if (!isAnim && spread < totalSpreads - 1) setAnim("fwd");
  }, [isAnim, spread, totalSpreads]);

  const prev = useCallback(() => {
    if (!isAnim && spread > 0) setAnim("bwd");
  }, [isAnim, spread]);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") { e.preventDefault(); next(); }
      if (e.key === "ArrowLeft")                    { e.preventDefault(); prev(); }
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [next, prev]);

  function onClick(e: React.MouseEvent<HTMLDivElement>) {
    if (isAnim || dMoved.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    if (e.clientX > rect.left + rect.width / 2) next(); else prev();
  }

  function toggleFs() {
    if (!wrapRef.current) return;
    if (!document.fullscreenElement) wrapRef.current.requestFullscreen().catch(() => {});
    else document.exitFullscreen().catch(() => {});
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  function img(n: number) { return cacheRef.current.get(n); }

  const pageLeft  = spread === 0 ? null : LP(spread);
  const pageRight = Math.min(RP(spread), totalPages);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div ref={wrapRef} className="flex h-full flex-col overflow-hidden rounded-xl bg-negro">

      {/* ── Loading ── */}
      {loadState === "loading" && (
        <div className="flex flex-1 flex-col items-center justify-center gap-2">
          <video
            autoPlay
            muted
            loop
            playsInline
            className="max-h-48 max-w-xs"
            aria-hidden
          >
            <source src="/loader-web.mp4" type="video/mp4" />
          </video>
          {loadProgress > 0 && (
            <p className="text-xs text-zinc-500">{loadProgress}%</p>
          )}
        </div>
      )}

      {/* ── Error ── */}
      {loadState === "error" && (
        <div className="flex flex-1 items-center justify-center text-sm text-zinc-500">
          No se ha podido cargar el facsímil.
        </div>
      )}

      {/* ── Stage: double-page spread ── */}
      {loadState === "ready" && (
        <div
          className="relative flex min-h-0 flex-1 select-none"
          style={{ cursor: isAnim ? "default" : "pointer" }}
          onClick={onClick}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          {/* ── Left page (always static) ── */}
          <div
            className="relative flex h-full flex-1 items-center justify-center overflow-hidden p-3"
            style={{ boxShadow: isBlank(leftSlot) ? undefined : "inset -6px 0 18px rgba(0,0,0,0.55)" }}
          >
            <PageImg src={img(leftSlot)} blank={isBlank(leftSlot)} />
            {!isAnim && spread > 0 && (
              <NavBtn side="left" onClick={(e) => { e.stopPropagation(); prev(); }} />
            )}
          </div>

          {/* ── Right: either idle (plain) or animated (3-D) ── */}
          <div
            className="relative flex h-full flex-1 items-center justify-center overflow-hidden p-3"
            style={{ boxShadow: "inset 6px 0 18px rgba(0,0,0,0.55)" }}
          >
            {!isAnim ? (
              /* Idle: plain right page, no transform */
              <PageImg src={img(RP(spread))} blank={isBlank(RP(spread))} />
            ) : (
              /* Animation: 3-D perspective container */
              <div
                className="absolute inset-0"
                style={{ perspective: "2600px", perspectiveOrigin: "left center" }}
              >
                {/* Behind layer — revealed as leaf curls away */}
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-3">
                  <PageImg src={img(behindSlot)} blank={isBlank(behindSlot)} />
                </div>

                {/* Turning leaf */}
                <div
                  ref={leafRef}
                  className="absolute inset-0 flex items-center justify-center p-3"
                  style={{ transformOrigin: "left center", zIndex: 1 }}
                >
                  <PageImg src={img(leafSlot)} blank={isBlank(leafSlot)} />
                  {/* Page-curl shadow gradient */}
                  <div
                    ref={shadowRef}
                    aria-hidden
                    className="pointer-events-none absolute inset-0"
                    style={{
                      opacity: 0,
                      background:
                        "linear-gradient(to right, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.2) 30%, transparent 55%)",
                    }}
                  />
                </div>
              </div>
            )}

            {!isAnim && spread < totalSpreads - 1 && (
              <NavBtn side="right" onClick={(e) => { e.stopPropagation(); next(); }} />
            )}
          </div>

          {/* Spine shadow */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-1/2 w-8 -translate-x-1/2"
            style={{
              background:
                "linear-gradient(to right, rgba(0,0,0,0.45), transparent 40%, transparent 60%, rgba(0,0,0,0.45))",
            }}
          />
        </div>
      )}

      {/* ── Controls ── */}
      <div className="flex items-center justify-between gap-3 border-t border-zinc-800 bg-zinc-950 px-4 py-2">
        <span className="min-w-[5rem] tabular-nums text-xs text-zinc-400">
          {totalPages > 0
            ? pageLeft === null
              ? `1 / ${totalPages}`
              : `${pageLeft}–${pageRight} / ${totalPages}`
            : loadState === "loading" ? "Cargando…" : ""}
        </span>

        <input
          type="range"
          min={0}
          max={Math.max(0, totalSpreads - 1)}
          value={spread}
          onChange={(e) => { if (!isAnim) setSpread(Number(e.target.value)); }}
          disabled={isAnim || totalSpreads <= 1}
          className="min-w-0 flex-1 cursor-pointer sm:max-w-xs"
          style={{ accentColor: "var(--color-teja, #DA3C00)" }}
          aria-label="Saltar a página"
        />

        <button
          type="button"
          onClick={toggleFs}
          aria-label={full ? "Salir de pantalla completa" : "Pantalla completa"}
          className="text-zinc-400 transition-colors hover:text-white"
        >
          {full ? <IcoMinimize /> : <IcoMaximize />}
        </button>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function PageImg({ src, blank = false }: { src?: string; blank?: boolean }) {
  if (blank) return <div className="h-full w-full" />;
  if (!src)  return <div className="h-full w-full animate-pulse rounded bg-zinc-800" />;
  return (
    <img
      src={src}
      alt=""
      draggable={false}
      className="h-full w-full object-contain"
    />
  );
}

function NavBtn({
  side,
  ...props
}: { side: "left" | "right" } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...props}
      className={`absolute top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/60 p-2 text-white backdrop-blur-sm transition-colors hover:bg-teja ${
        side === "left" ? "left-2" : "right-2"
      }`}
    >
      {side === "left" ? <ChevLeft /> : <ChevRight />}
    </button>
  );
}

function ChevLeft() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-5 w-5" aria-hidden>
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}
function ChevRight() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-5 w-5" aria-hidden>
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}
function IcoMaximize() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4" aria-hidden>
      <polyline points="15 3 21 3 21 9" /><polyline points="9 21 3 21 3 15" />
      <line x1="21" y1="3" x2="14" y2="10" /><line x1="3" y1="21" x2="10" y2="14" />
    </svg>
  );
}
function IcoMinimize() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4" aria-hidden>
      <polyline points="4 14 10 14 10 20" /><polyline points="20 10 14 10 14 4" />
      <line x1="10" y1="14" x2="3" y2="21" /><line x1="21" y1="3" x2="14" y2="10" />
    </svg>
  );
}
