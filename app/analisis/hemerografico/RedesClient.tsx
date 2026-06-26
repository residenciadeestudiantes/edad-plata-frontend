"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { getAuthors, getAuthorNetworkData, type Author, type NetworkEntry } from "@/lib/api";
import { RedesGraph, type GraphNode, type GraphEdge } from "./RedesGraph";

const MAX_NODES = 120; // cap co-authors shown in graph

// ── Build graph from raw network entries ─────────────────────────────────────

function buildGraph(entries: NetworkEntry[], centerSlug: string): {
  nodes: GraphNode[];
  edges: GraphEdge[];
  truncated: boolean;
} {
  // Article count per author (number of entries = articles in scope)
  const countMap  = new Map<string, number>();
  const nameMap   = new Map<string, string>();
  const pubsByAuthor = new Map<string, Set<string>>();

  for (const e of entries) {
    countMap.set(e.authorSlug, (countMap.get(e.authorSlug) ?? 0) + 1);
    nameMap.set(e.authorSlug, e.authorNombre);
    if (!pubsByAuthor.has(e.authorSlug)) pubsByAuthor.set(e.authorSlug, new Set());
    pubsByAuthor.get(e.authorSlug)!.add(e.publicationSlug);
  }

  // Sort co-authors by article count, cap at MAX_NODES
  const center = { slug: centerSlug, count: countMap.get(centerSlug) ?? 0 };
  const coauthors = [...countMap.keys()]
    .filter(s => s !== centerSlug)
    .sort((a, b) => (countMap.get(b) ?? 0) - (countMap.get(a) ?? 0));

  const truncated  = coauthors.length > MAX_NODES;
  const kept       = coauthors.slice(0, MAX_NODES);
  const keptSet    = new Set([centerSlug, ...kept]);

  const nodes: GraphNode[] = [
    {
      id: centerSlug,
      nombre: nameMap.get(centerSlug) ?? centerSlug,
      articleCount: center.count,
      isCenter: true,
    },
    ...kept.map(slug => ({
      id: slug,
      nombre: nameMap.get(slug) ?? slug,
      articleCount: countMap.get(slug) ?? 0,
      isCenter: false,
    })),
  ];

  // Edges: between any two kept authors who share a publication
  const edgeSet = new Set<string>();
  const edges: GraphEdge[] = [];

  const keptArr = [centerSlug, ...kept];
  for (let i = 0; i < keptArr.length; i++) {
    for (let j = i + 1; j < keptArr.length; j++) {
      const a = keptArr[i], b = keptArr[j];
      const pubsA = pubsByAuthor.get(a);
      const pubsB = pubsByAuthor.get(b);
      if (!pubsA || !pubsB) continue;
      const shared = [...pubsA].some(p => pubsB.has(p));
      if (!shared) continue;
      const key = a < b ? `${a}||${b}` : `${b}||${a}`;
      if (edgeSet.has(key)) continue;
      edgeSet.add(key);
      edges.push({ source: a, target: b });
    }
  }

  return { nodes, edges, truncated };
}

// ── Author search combobox ────────────────────────────────────────────────────

function AuthorSearch({
  onSelect,
}: {
  onSelect: (author: Author) => void;
}) {
  const [query, setQuery]         = useState("");
  const [results, setResults]     = useState<Author[]>([]);
  const [open, setOpen]           = useState(false);
  const [loading, setLoading]     = useState(false);
  const debounceRef               = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapRef                   = useRef<HTMLDivElement>(null);

  const search = useCallback((q: string) => {
    if (!q.trim()) { setResults([]); setOpen(false); return; }
    setLoading(true);
    getAuthors(1, 12, q)
      .then(res => { setResults(res.data); setOpen(res.data.length > 0); })
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  }, []);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(e.target.value), 280);
  };

  const pick = (author: Author) => {
    setQuery(author.nombre);
    setOpen(false);
    setResults([]);
    onSelect(author);
  };

  // Close on outside click
  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  return (
    <div ref={wrapRef} className="relative w-full max-w-sm">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={onChange}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Buscar autor…"
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 shadow-sm focus:border-azul focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        />
        {loading && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400">…</span>
        )}
      </div>
      {open && (
        <ul className="absolute z-20 mt-1 w-full rounded-lg border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
          {results.map(a => (
            <li key={a.id}>
              <button
                type="button"
                className="w-full px-3 py-1.5 text-left text-sm text-zinc-800 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
                onMouseDown={() => pick(a)}
              >
                {a.nombre}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Main Redes tab ────────────────────────────────────────────────────────────

type Status = "idle" | "loading" | "done" | "empty" | "error";

export function RedesClient() {
  const [status, setStatus]       = useState<Status>("idle");
  const [selected, setSelected]   = useState<Author | null>(null);
  const [nodes, setNodes]         = useState<GraphNode[]>([]);
  const [edges, setEdges]         = useState<GraphEdge[]>([]);
  const [truncated, setTruncated] = useState(false);

  const loadNetwork = useCallback(async (author: Author) => {
    setSelected(author);
    setStatus("loading");
    setNodes([]);
    setEdges([]);
    try {
      const entries = await getAuthorNetworkData(author.slug);
      if (entries.length === 0) { setStatus("empty"); return; }
      const { nodes: n, edges: e, truncated: tr } = buildGraph(entries, author.slug);
      setNodes(n);
      setEdges(e);
      setTruncated(tr);
      setStatus("done");
    } catch {
      setStatus("error");
    }
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <AuthorSearch onSelect={loadNetwork} />
        {selected && status === "done" && (
          <p className="text-sm font-light text-zinc-500 dark:text-zinc-400">
            <span className="font-medium text-zinc-700 dark:text-zinc-300">{selected.nombre}</span>
            {" — "}{nodes.length - 1} coautor{nodes.length !== 2 ? "es" : ""}, {edges.length} conexion{edges.length !== 1 ? "es" : ""}
            {truncated && (
              <span className="ml-1 text-amber-600 dark:text-amber-400">
                (limitado a {MAX_NODES} coautores)
              </span>
            )}
          </p>
        )}
      </div>

      {status === "idle" && (
        <p className="py-16 text-center text-sm font-light text-zinc-400 dark:text-zinc-600">
          Busca un autor para ver su red de colaboraciones.
        </p>
      )}

      {status === "loading" && (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-sm font-light text-zinc-500">
          <p>Construyendo la red…</p>
          <div className="h-1.5 w-full max-w-md overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
            <div className="h-full w-1/2 animate-pulse rounded-full bg-azul dark:bg-azul-claro" />
          </div>
        </div>
      )}

      {status === "empty" && (
        <p className="py-16 text-center text-sm font-light text-zinc-400">
          No se encontraron conexiones para este autor.
        </p>
      )}

      {status === "error" && (
        <p className="py-16 text-center text-sm text-red-600 dark:text-red-400">
          Error al cargar la red. Inténtalo de nuevo.
        </p>
      )}

      {status === "done" && <RedesGraph nodes={nodes} edges={edges} />}
    </div>
  );
}
