"use client";

import { useEffect, useState, useCallback, useRef } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface GraphNode {
  id: string;
  nombre: string;
  articleCount: number; // total articles in scope (for node size)
  sharedIssues: number; // issues shared with center (for tooltip)
  isCenter: boolean;
}

export interface GraphEdge {
  source: string; // always center slug
  target: string;
  publicationSlug: string;
  publicationTitulo: string;
  color: string;
}

export interface GraphPublication {
  slug: string;
  titulo: string;
  color: string;
}

// ── Color palette for publications ───────────────────────────────────────────

export const PUB_PALETTE = [
  "#3838BD", "#059669", "#7C3AED", "#DB2777",
  "#D97706", "#0891B2", "#DC2626", "#16A34A",
  "#F59E0B", "#6366F1", "#EC4899", "#14B8A6",
  "#8B5CF6", "#F97316", "#06B6D4", "#84CC16",
  "#E11D48", "#0284C7", "#65A30D", "#9333EA",
];

// ── Physics constants ─────────────────────────────────────────────────────────

const K_REPEL   = 8000;
const K_SPRING  = 0.08;
const REST_LEN  = 150;
const GRAVITY   = 0.06;
const DAMPING   = 0.76;
const TICKS     = 260;

// ── Node sizing ───────────────────────────────────────────────────────────────

const R_MIN    = 6;
const R_MAX    = 24;
const R_CENTER = 17;

function nodeR(n: GraphNode, maxCount: number): number {
  if (n.isCenter) return R_CENTER;
  return R_MIN + (n.articleCount / Math.max(maxCount, 1)) * (R_MAX - R_MIN);
}

// ── Force simulation ──────────────────────────────────────────────────────────

interface SimNode extends GraphNode { x: number; y: number; vx: number; vy: number; }

function simulate(nodes: GraphNode[], uniqueEdges: { source: string; target: string }[], W: number, H: number): SimNode[] {
  if (nodes.length === 0) return [];
  const cx = W / 2, cy = H / 2;

  const sims: SimNode[] = nodes.map((n, i) => {
    const angle = (2 * Math.PI * i) / nodes.length;
    const r = n.isCenter ? 0 : 170 + Math.random() * 60;
    return { ...n, x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle), vx: 0, vy: 0 };
  });

  const idx = new Map(sims.map((n, i) => [n.id, i]));

  for (let t = 0; t < TICKS; t++) {
    const alpha = 1 - t / TICKS;
    const fx = new Array<number>(sims.length).fill(0);
    const fy = new Array<number>(sims.length).fill(0);

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

    for (const e of uniqueEdges) {
      const i = idx.get(e.source), j = idx.get(e.target);
      if (i == null || j == null) continue;
      const dx = sims[j].x - sims[i].x || 0.1;
      const dy = sims[j].y - sims[i].y || 0.1;
      const d  = Math.sqrt(dx * dx + dy * dy);
      const f  = K_SPRING * (d - REST_LEN) * alpha;
      fx[i] += f * (dx / d); fy[i] += f * (dy / d);
      fx[j] -= f * (dx / d); fy[j] -= f * (dy / d);
    }

    for (let i = 0; i < sims.length; i++) {
      if (sims[i].isCenter) continue;
      fx[i] += GRAVITY * (cx - sims[i].x) * alpha;
      fy[i] += GRAVITY * (cy - sims[i].y) * alpha;
    }

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

// ── Bezier path for multi-edges ────────────────────────────────────────────────
// Edges from the same source→target pair are curved with increasing offset
// so they fan out and don't overlap.

function edgePath(sx: number, sy: number, tx: number, ty: number, edgeIdx: number, total: number): string {
  if (total === 1) {
    // Single edge: gentle default curve so it's easy to click
    const mx = (sx + tx) / 2, my = (sy + ty) / 2;
    const len = Math.sqrt((tx - sx) ** 2 + (ty - sy) ** 2) || 1;
    const px = -(ty - sy) / len, py = (tx - sx) / len;
    const bow = 18;
    return `M ${sx} ${sy} Q ${mx + px * bow} ${my + py * bow} ${tx} ${ty}`;
  }
  const dx = tx - sx, dy = ty - sy;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const px = -dy / len, py = dx / len;
  const SPREAD = 30;
  const offset = (edgeIdx - (total - 1) / 2) * SPREAD;
  const mx = (sx + tx) / 2 + px * offset;
  const my = (sy + ty) / 2 + py * offset;
  return `M ${sx} ${sy} Q ${mx} ${my} ${tx} ${ty}`;
}

// ── Component ─────────────────────────────────────────────────────────────────

const W = 820, H = 520;
const COLOR_CENTER = "#DA3C00";

export function RedesGraph({
  centerSlug,
  nodes,
  edges,
  publications,
}: {
  centerSlug: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
  publications: GraphPublication[];
}) {
  const [sims, setSims]   = useState<SimNode[]>([]);
  const [hover, setHover] = useState<string | null>(null);

  // Pan / zoom
  const [pan, setPan]     = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const panStart          = useRef<{ px: number; py: number; x: number; y: number } | null>(null);

  // Build unique edges for simulation (one per center↔co-author pair)
  const uniqueEdges = [...new Map(edges.map(e => [`${e.source}||${e.target}`, { source: e.source, target: e.target }])).values()];

  useEffect(() => {
    if (nodes.length === 0) { setSims([]); return; }
    setSims(simulate(nodes, uniqueEdges, W, H));
    setPan({ x: 0, y: 0 });
    setScale(1);
  }, [nodes, edges]); // eslint-disable-line react-hooks/exhaustive-deps

  const maxCount = Math.max(...nodes.map(n => n.articleCount), 1);
  const posById  = new Map(sims.map(n => [n.id, n]));

  // Group edges by target to compute bezier offsets per pair
  const edgesByTarget = new Map<string, GraphEdge[]>();
  for (const e of edges) {
    if (!edgesByTarget.has(e.target)) edgesByTarget.set(e.target, []);
    edgesByTarget.get(e.target)!.push(e);
  }

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
  const onPointerUp   = useCallback(() => { panStart.current = null; }, []);
  const onWheel       = useCallback((e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    setScale(s => Math.max(0.25, Math.min(4, s * (e.deltaY < 0 ? 1.1 : 0.91))));
  }, []);

  if (sims.length === 0) return null;

  const center = posById.get(centerSlug);

  return (
    <div className="flex flex-col gap-4">
      {/* Graph canvas */}
      <div className="relative w-full select-none overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950" style={{ height: H }}>
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
          <g transform={`scale(${scale}) translate(${pan.x},${pan.y})`}>
            {/* ── Bezier edges ── */}
            <g>
              {[...edgesByTarget.entries()].map(([targetId, targetEdges]) => {
                const s = center, t = posById.get(targetId);
                if (!s || !t) return null;
                return targetEdges.map((e, i) => (
                  <path
                    key={`${targetId}-${e.publicationSlug}`}
                    d={edgePath(s.x, s.y, t.x, t.y, i, targetEdges.length)}
                    stroke={e.color}
                    strokeWidth={hover === targetId ? 2.5 : 1.6}
                    strokeOpacity={hover === targetId || hover === null ? 0.75 : 0.2}
                    fill="none"
                    pointerEvents="none"
                  />
                ));
              })}
            </g>

            {/* ── Nodes ── */}
            <g>
              {sims.map(n => {
                const r = nodeR(n, maxCount);
                const isHov = hover === n.id;
                return (
                  <g
                    key={n.id}
                    transform={`translate(${n.x},${n.y})`}
                    onPointerEnter={() => setHover(n.id)}
                    onPointerLeave={() => setHover(null)}
                    style={{ cursor: "default" }}
                  >
                    <circle
                      r={isHov ? r + 3 : r}
                      fill={n.isCenter ? COLOR_CENTER : COLOR_NODE_FILL}
                      fillOpacity={n.isCenter ? 1 : 0.85}
                      stroke={isHov ? "#fff" : "none"}
                      strokeWidth={2}
                    />
                    {(r > 10 || isHov) && (
                      <text
                        x={r + 5} y="0.35em"
                        fontSize={isHov ? 12 : 10}
                        fontWeight={n.isCenter || isHov ? "600" : "400"}
                        fill={isHov ? "#18181b" : "#52525b"}
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
          const edgesForNode = edgesByTarget.get(n.id) ?? [];
          return (
            <div className="pointer-events-none absolute bottom-3 left-3 max-w-xs rounded bg-zinc-900 px-2.5 py-1.5 text-xs text-white shadow">
              <p className="font-semibold">{n.nombre}</p>
              {!n.isCenter && (
                <>
                  <p className="text-zinc-400">{n.articleCount} artículo{n.articleCount !== 1 ? "s" : ""} en las revistas compartidas</p>
                  <p className="text-zinc-400">{n.sharedIssues} número{n.sharedIssues !== 1 ? "s" : ""} en común</p>
                  {edgesForNode.length > 0 && (
                    <ul className="mt-1 flex flex-col gap-0.5">
                      {edgesForNode.map(e => (
                        <li key={e.publicationSlug} className="flex items-center gap-1.5">
                          <span className="inline-block h-2 w-2 shrink-0 rounded-full" style={{ background: e.color }} />
                          {e.publicationTitulo}
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </div>
          );
        })()}

        {/* Zoom hint */}
        <p className="pointer-events-none absolute right-2 bottom-2 text-[10px] text-zinc-400 dark:text-zinc-600">
          Rueda: zoom · Arrastra: desplazar
        </p>
      </div>

      {/* ── Legend ── */}
      <div className="flex flex-wrap gap-x-6 gap-y-2 rounded-lg border border-zinc-100 bg-zinc-50 px-4 py-3 text-xs dark:border-zinc-800 dark:bg-zinc-900">
        {/* Node types */}
        <div className="flex flex-col gap-1">
          <p className="font-semibold text-zinc-600 dark:text-zinc-400">Nodos</p>
          <span className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
            <span className="inline-block h-3.5 w-3.5 shrink-0 rounded-full" style={{ background: COLOR_CENTER }} />
            Autor seleccionado
          </span>
          <span className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
            <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: COLOR_NODE_FILL }} />
            Coautor · tamaño = nº artículos en las mismas revistas
          </span>
        </div>
        {/* Publication colors */}
        {publications.length > 0 && (
          <div className="flex flex-col gap-1">
            <p className="font-semibold text-zinc-600 dark:text-zinc-400">Aristas · una por revista compartida</p>
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {publications.map(p => (
                <span key={p.slug} className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
                  <span className="inline-block h-0.5 w-5 shrink-0 rounded" style={{ background: p.color }} />
                  {p.titulo}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const COLOR_NODE_FILL = "#3838BD";
