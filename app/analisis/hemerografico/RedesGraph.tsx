"use client";

import { useEffect, useRef, useState, useCallback } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface GraphNode {
  id: string;
  nombre: string;
  articleCount: number;
  isCenter: boolean;
}

export interface GraphEdge {
  source: string;
  target: string;
}

// ── Physics constants ─────────────────────────────────────────────────────────

const K_REPEL   = 9000;
const K_SPRING  = 0.07;
const REST_LEN  = 140;
const GRAVITY   = 0.05;
const DAMPING   = 0.76;
const TICKS     = 280;

// ── Node sizing ───────────────────────────────────────────────────────────────

const R_MIN    = 7;
const R_MAX    = 26;
const R_CENTER = 18;

function nodeR(n: GraphNode, maxCount: number): number {
  if (n.isCenter) return R_CENTER;
  return R_MIN + (n.articleCount / Math.max(maxCount, 1)) * (R_MAX - R_MIN);
}

// ── Force simulation (pure TS, runs synchronously) ────────────────────────────

interface SimNode extends GraphNode {
  x: number; y: number; vx: number; vy: number;
}

function simulate(
  nodes: GraphNode[],
  edges: GraphEdge[],
  W: number,
  H: number
): SimNode[] {
  if (nodes.length === 0) return [];
  const cx = W / 2, cy = H / 2;

  // Radial initial positions
  const sims: SimNode[] = nodes.map((n, i) => {
    const angle = (2 * Math.PI * i) / nodes.length;
    const r = n.isCenter ? 0 : 180 + Math.random() * 60;
    return { ...n, x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle), vx: 0, vy: 0 };
  });

  const idx = new Map<string, number>(sims.map((n, i) => [n.id, i]));

  for (let t = 0; t < TICKS; t++) {
    const alpha = 1 - t / TICKS;
    const fx = new Array<number>(sims.length).fill(0);
    const fy = new Array<number>(sims.length).fill(0);

    // Repulsion (all pairs)
    for (let i = 0; i < sims.length; i++) {
      for (let j = i + 1; j < sims.length; j++) {
        const dx = sims[j].x - sims[i].x || 0.1;
        const dy = sims[j].y - sims[i].y || 0.1;
        const d2 = dx * dx + dy * dy + 0.01;
        const d  = Math.sqrt(d2);
        const f  = (K_REPEL / d2) * alpha;
        fx[i] -= f * (dx / d); fy[i] -= f * (dy / d);
        fx[j] += f * (dx / d); fy[j] += f * (dy / d);
      }
    }

    // Springs (edges)
    for (const e of edges) {
      const i = idx.get(e.source), j = idx.get(e.target);
      if (i == null || j == null) continue;
      const dx = sims[j].x - sims[i].x || 0.1;
      const dy = sims[j].y - sims[i].y || 0.1;
      const d  = Math.sqrt(dx * dx + dy * dy);
      const f  = K_SPRING * (d - REST_LEN) * alpha;
      fx[i] += f * (dx / d); fy[i] += f * (dy / d);
      fx[j] -= f * (dx / d); fy[j] -= f * (dy / d);
    }

    // Center gravity (skip center node — pinned)
    for (let i = 0; i < sims.length; i++) {
      if (sims[i].isCenter) continue;
      fx[i] += GRAVITY * (cx - sims[i].x) * alpha;
      fy[i] += GRAVITY * (cy - sims[i].y) * alpha;
    }

    // Integrate
    for (let i = 0; i < sims.length; i++) {
      if (sims[i].isCenter) { sims[i].x = cx; sims[i].y = cy; continue; }
      sims[i].vx = (sims[i].vx + fx[i]) * DAMPING;
      sims[i].vy = (sims[i].vy + fy[i]) * DAMPING;
      sims[i].x += sims[i].vx;
      sims[i].y += sims[i].vy;
    }
  }

  return sims;
}

// ── Component ─────────────────────────────────────────────────────────────────

const W = 820, H = 540;
const COLOR_CENTER = "#DA3C00";
const COLOR_NODE   = "#3838BD";

export function RedesGraph({ nodes, edges }: { nodes: GraphNode[]; edges: GraphEdge[] }) {
  const containerRef   = useRef<HTMLDivElement>(null);
  const [sims, setSims] = useState<SimNode[]>([]);
  const [hover, setHover] = useState<string | null>(null);

  // Pan / zoom state
  const [pan, setPan]     = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const panStart = useRef<{ px: number; py: number; x: number; y: number } | null>(null);

  // Run simulation when data changes
  useEffect(() => {
    if (nodes.length === 0) { setSims([]); return; }
    const result = simulate(nodes, edges, W, H);
    setSims(result);
    setPan({ x: 0, y: 0 });
    setScale(1);
  }, [nodes, edges]);

  const maxCount = Math.max(...nodes.map(n => n.articleCount), 1);

  // Drag for pan
  const onPointerDown = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    (e.target as Element).setPointerCapture(e.pointerId);
    panStart.current = { px: e.clientX, py: e.clientY, x: pan.x, y: pan.y };
  }, [pan]);

  const onPointerMove = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    if (!panStart.current) return;
    setPan({
      x: panStart.current.x + (e.clientX - panStart.current.px) / scale,
      y: panStart.current.y + (e.clientY - panStart.current.py) / scale,
    });
  }, [scale]);

  const onPointerUp = useCallback(() => { panStart.current = null; }, []);

  const onWheel = useCallback((e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    setScale(s => Math.max(0.3, Math.min(4, s * (e.deltaY < 0 ? 1.1 : 0.91))));
  }, []);

  if (sims.length === 0) return null;

  const posById = new Map(sims.map(n => [n.id, n]));

  return (
    <div ref={containerRef} className="relative w-full select-none overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950" style={{ height: H }}>
      <svg
        width={W} height={H}
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onWheel={onWheel}
      >
        <g transform={`scale(${scale}) translate(${pan.x}, ${pan.y})`}>
          {/* Edges */}
          <g>
            {edges.map(e => {
              const s = posById.get(e.source), t = posById.get(e.target);
              if (!s || !t) return null;
              return (
                <line
                  key={`${e.source}--${e.target}`}
                  x1={s.x} y1={s.y} x2={t.x} y2={t.y}
                  stroke="rgba(56,56,189,0.18)"
                  strokeWidth={1.2}
                  pointerEvents="none"
                />
              );
            })}
          </g>

          {/* Nodes */}
          <g>
            {sims.map(n => {
              const r = nodeR(n, maxCount);
              const isHovered = hover === n.id;
              return (
                <g
                  key={n.id}
                  transform={`translate(${n.x},${n.y})`}
                  onPointerEnter={() => setHover(n.id)}
                  onPointerLeave={() => setHover(null)}
                  style={{ cursor: "default" }}
                >
                  <circle
                    r={isHovered ? r + 3 : r}
                    fill={n.isCenter ? COLOR_CENTER : COLOR_NODE}
                    fillOpacity={n.isCenter ? 1 : 0.82}
                    stroke={isHovered ? "#fff" : "none"}
                    strokeWidth={2}
                  />
                  {/* Label — only show if big enough or hovered */}
                  {(r > 11 || isHovered) && (
                    <text
                      x={r + 5}
                      y="0.35em"
                      fontSize={isHovered ? 12 : 10}
                      fontWeight={n.isCenter || isHovered ? "600" : "400"}
                      fill={isHovered ? "#18181b" : "#52525b"}
                      pointerEvents="none"
                    >
                      {n.nombre}
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        </g>
      </svg>

      {/* Hover tooltip */}
      {hover && (() => {
        const n = sims.find(s => s.id === hover);
        if (!n) return null;
        return (
          <div className="pointer-events-none absolute bottom-3 left-3 rounded bg-zinc-900 px-2 py-1 text-xs text-white shadow">
            <span className="font-semibold">{n.nombre}</span>
            <span className="ml-1 text-zinc-400">· {n.articleCount} artículo{n.articleCount !== 1 ? "s" : ""}</span>
          </div>
        );
      })()}

      {/* Legend */}
      <div className="pointer-events-none absolute right-3 top-3 flex flex-col gap-1 rounded bg-white/90 px-2 py-1.5 text-xs text-zinc-600 shadow dark:bg-zinc-900/90 dark:text-zinc-400">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-full" style={{ background: COLOR_CENTER }} />
          Autor seleccionado
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-full" style={{ background: COLOR_NODE, opacity: 0.82 }} />
          Coautor · tamaño = nº artículos
        </span>
        <span className="mt-0.5 text-zinc-400 dark:text-zinc-600">Rueda: zoom · Arrastra: desplazar</span>
      </div>
    </div>
  );
}
