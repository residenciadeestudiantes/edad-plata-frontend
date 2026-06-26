"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { getAuthors, getAuthorNetworkData, type Author, type NetworkEntry } from "@/lib/api";
import {
  RedesGraph,
  PUB_PALETTE,
  type GraphNode,
  type GraphEdge,
  type GraphPublication,
} from "./RedesGraph";

const MAX_NODES = 120;

// ── Graph builder ─────────────────────────────────────────────────────────────
// Co-authorship = two authors who published an article in the SAME issue.
// One edge per (center ↔ co-author ↔ publication) triple.

function buildGraph(
  entries: NetworkEntry[],
  centerSlug: string,
  filterPub: string | null,
): {
  nodes: GraphNode[];
  edges: GraphEdge[];
  publications: GraphPublication[];
  truncated: boolean;
} {
  // ── Map issueId → { pub, authors } ──
  const byIssue = new Map<number, { pubSlug: string; pubTitulo: string; authors: Set<string> }>();
  const nameMap  = new Map<string, string>();

  for (const e of entries) {
    nameMap.set(e.authorSlug, e.authorNombre);
    if (!byIssue.has(e.issueId)) {
      byIssue.set(e.issueId, { pubSlug: e.publicationSlug, pubTitulo: e.publicationTitulo, authors: new Set() });
    }
    byIssue.get(e.issueId)!.authors.add(e.authorSlug);
  }

  // All publications where the selected author wrote (for the filter dropdown)
  const allPubs = new Map<string, string>(); // slug → titulo
  for (const [, issue] of byIssue) {
    if (issue.authors.has(centerSlug)) allPubs.set(issue.pubSlug, issue.pubTitulo);
  }

  // Assign palette colors to publications (stable order by slug)
  const pubColorMap = new Map<string, string>(
    [...allPubs.keys()].map((slug, i) => [slug, PUB_PALETTE[i % PUB_PALETTE.length]])
  );

  const publications: GraphPublication[] = [...allPubs.entries()].map(([slug, titulo]) => ({
    slug, titulo, color: pubColorMap.get(slug)!,
  }));

  // ── Co-authorship: center must be in the same issue ──
  // Edge key: `${coAuthorSlug}||${pubSlug}` — one edge per (co-author, pub) pair
  const edgeMap  = new Map<string, GraphEdge>();
  const sharedIssueCount = new Map<string, number>(); // co-author → # shared issues
  const articleCount     = new Map<string, number>(); // co-author → total articles in scope

  for (const [, { pubSlug, pubTitulo, authors }] of byIssue) {
    if (!authors.has(centerSlug)) continue;
    if (filterPub && pubSlug !== filterPub) continue;

    for (const coSlug of authors) {
      if (coSlug === centerSlug) continue;

      // Count shared issues
      sharedIssueCount.set(coSlug, (sharedIssueCount.get(coSlug) ?? 0) + 1);

      // One edge per (co-author, pub)
      const key = `${coSlug}||${pubSlug}`;
      if (!edgeMap.has(key)) {
        edgeMap.set(key, {
          source: centerSlug,
          target: coSlug,
          publicationSlug: pubSlug,
          publicationTitulo: pubTitulo,
          color: pubColorMap.get(pubSlug) ?? "#888",
        });
      }
    }
  }

  // Total articles per co-author across ALL entries in scope (not just shared issues)
  for (const e of entries) {
    if (e.authorSlug === centerSlug) continue;
    if (filterPub && e.publicationSlug !== filterPub) continue;
    articleCount.set(e.authorSlug, (articleCount.get(e.authorSlug) ?? 0) + 1);
  }

  // Keep only co-authors with at least one shared issue
  const sorted = [...sharedIssueCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, MAX_NODES);

  const truncated = sharedIssueCount.size > MAX_NODES;
  const keptSet   = new Set(sorted.map(([s]) => s));

  // Center article count in scope
  let centerArticles = 0;
  for (const e of entries) {
    if (e.authorSlug === centerSlug && (!filterPub || e.publicationSlug === filterPub)) centerArticles++;
  }

  const nodes: GraphNode[] = [
    {
      id: centerSlug,
      nombre: nameMap.get(centerSlug) ?? centerSlug,
      articleCount: centerArticles,
      sharedIssues: 0,
      isCenter: true,
    },
    ...sorted.map(([slug, shared]) => ({
      id: slug,
      nombre: nameMap.get(slug) ?? slug,
      articleCount: articleCount.get(slug) ?? 0,
      sharedIssues: shared,
      isCenter: false,
    })),
  ];

  const edges = [...edgeMap.values()].filter(e => keptSet.has(e.target));

  return { nodes, edges, publications, truncated };
}

// ── Author search combobox ────────────────────────────────────────────────────

function AuthorSearch({ onSelect, externalValue }: { onSelect: (a: Author) => void; externalValue?: string }) {
  const [query, setQuery]     = useState("");
  const [results, setResults] = useState<Author[]>([]);
  const [open, setOpen]       = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef           = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapRef               = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (externalValue !== undefined) { setQuery(externalValue); setOpen(false); }
  }, [externalValue]);

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

  const pick = (a: Author) => { setQuery(a.nombre); setOpen(false); onSelect(a); };

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  return (
    <div ref={wrapRef} className="relative w-full max-w-xs">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={onChange}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Buscar autor…"
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 shadow-sm focus:border-azul focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        />
        {loading && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400">…</span>}
      </div>
      {open && (
        <ul className="absolute z-20 mt-1 w-full rounded-lg border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
          {results.map(a => (
            <li key={a.id}>
              <button type="button" className="w-full px-3 py-1.5 text-left text-sm text-zinc-800 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800" onMouseDown={() => pick(a)}>
                {a.nombre}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

type Status = "idle" | "loading" | "done" | "empty" | "error";

export function RedesClient() {
  const [status, setStatus]             = useState<Status>("idle");
  const [selected, setSelected]         = useState<Author | null>(null);
  const [allEntries, setAllEntries]     = useState<NetworkEntry[]>([]);
  const [filterPub, setFilterPub]       = useState<string | null>(null);
  const [externalAuthor, setExternalAuthor] = useState<string | undefined>(undefined);

  // Derived graph (recomputed on filter change)
  const [nodes, setNodes]             = useState<GraphNode[]>([]);
  const [edges, setEdges]             = useState<GraphEdge[]>([]);
  const [publications, setPublications] = useState<GraphPublication[]>([]);
  const [truncated, setTruncated]     = useState(false);

  const rebuildGraph = useCallback((entries: NetworkEntry[], slug: string, pub: string | null) => {
    const { nodes: n, edges: e, publications: p, truncated: tr } = buildGraph(entries, slug, pub);
    if (n.length <= 1) { setStatus("empty"); return; }
    setNodes(n); setEdges(e); setPublications(p); setTruncated(tr);
    setStatus("done");
  }, []);

  const loadNetwork = useCallback(async (author: Author) => {
    setSelected(author);
    setFilterPub(null);
    setStatus("loading");
    setNodes([]); setEdges([]);
    try {
      const entries = await getAuthorNetworkData(author.slug);
      setAllEntries(entries);
      rebuildGraph(entries, author.slug, null);
    } catch {
      setStatus("error");
    }
  }, [rebuildGraph]);

  const handleNodeClick = useCallback((slug: string, nombre: string) => {
    setExternalAuthor(nombre);
    loadNetwork({ slug, nombre } as Author);
  }, [loadNetwork]);

  // Recompute when filter changes (no new network fetch needed)
  useEffect(() => {
    if (selected && allEntries.length > 0) rebuildGraph(allEntries, selected.slug, filterPub);
  }, [filterPub, selected, allEntries, rebuildGraph]);

  const coauthorCount = nodes.filter(n => !n.isCenter).length;

  return (
    <div className="flex flex-col gap-6">

      {/* ── Explanation ── */}
      <div className="max-w-3xl space-y-2 font-light text-zinc-600 dark:text-zinc-400">
        <p>
          Este grafo muestra la <span className="font-medium text-zinc-800 dark:text-zinc-200">red de coautorías</span> de un autor:
          quiénes han publicado artículos en el mismo número de alguna de las revistas en las que
          también escribió el autor seleccionado.
        </p>
        <p>
          Cada <span className="font-medium text-zinc-800 dark:text-zinc-200">línea</span> representa una revista en la que ambos autores coincidieron en al menos un número;
          si coincidieron en varias, se dibujan tantas líneas como revistas (cada una en un color distinto).
          El <span className="font-medium text-zinc-800 dark:text-zinc-200">tamaño de cada nodo</span> es proporcional al número total de artículos
          que ese autor publicó en las revistas compartidas.
        </p>
        <p>
          Puedes usar el filtro de revista para ver únicamente las conexiones forjadas en una publicación concreta,
          y pasar el cursor sobre un nodo para consultar cuántos números compartieron y en qué revistas.
        </p>
      </div>

      {/* ── Controls row ── */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Autor</label>
          <AuthorSearch onSelect={loadNetwork} externalValue={externalAuthor} />
        </div>

        {publications.length > 0 && (
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Filtrar por revista</label>
            <select
              value={filterPub ?? ""}
              onChange={e => setFilterPub(e.target.value || null)}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-800 shadow-sm focus:border-azul focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
            >
              <option value="">Todas las revistas</option>
              {publications.map(p => (
                <option key={p.slug} value={p.slug}>{p.titulo}</option>
              ))}
            </select>
          </div>
        )}

        {selected && status === "done" && (
          <p className="pb-2 text-sm font-light text-zinc-500 dark:text-zinc-400">
            <span className="font-medium text-zinc-700 dark:text-zinc-300">{selected.nombre}</span>
            {" — "}{coauthorCount} coautor{coauthorCount !== 1 ? "es" : ""}, {edges.length} conexión{edges.length !== 1 ? "es" : ""}
            {truncated && <span className="ml-1 text-amber-600 dark:text-amber-400">(limitado a {MAX_NODES})</span>}
          </p>
        )}
      </div>

      {/* ── States ── */}
      {status === "idle" && (
        <p className="py-16 text-center text-sm font-light text-zinc-400 dark:text-zinc-600">
          Busca un autor para ver su red de colaboraciones por número de revista.
        </p>
      )}
      {status === "loading" && (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-sm font-light text-zinc-500">
          <p>Construyendo la red…</p>
          <div className="h-1.5 w-full max-w-md overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
            <div className="h-full w-1/2 animate-pulse rounded-full bg-azul" />
          </div>
        </div>
      )}
      {status === "empty" && (
        <p className="py-16 text-center text-sm font-light text-zinc-400">
          No se encontraron coautorías en los mismos números para este autor{filterPub ? " en esta revista" : ""}.
        </p>
      )}
      {status === "error" && (
        <p className="py-16 text-center text-sm text-red-600 dark:text-red-400">
          Error al cargar la red. Inténtalo de nuevo.
        </p>
      )}
      {status === "done" && (
        <RedesGraph
          centerSlug={selected!.slug}
          nodes={nodes}
          edges={edges}
          publications={publications}
          onNodeClick={handleNodeClick}
        />
      )}
    </div>
  );
}
