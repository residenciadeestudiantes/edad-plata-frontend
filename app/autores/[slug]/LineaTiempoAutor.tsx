"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PlotlyChart } from "@/components/PlotlyChart";
import type { Article } from "@/lib/api";
import type { PlotMouseEvent } from "plotly.js";

export function LineaTiempoAutor({ articles }: { articles: Article[] }) {
  const router = useRouter();
  const [seleccionados, setSeleccionados] = useState<{ año: number; arts: Article[] } | null>(null);

  const porAño = new Map<number, Article[]>();
  for (const art of articles) {
    const año = art.issue?.año;
    if (año == null) continue;
    if (!porAño.has(año)) porAño.set(año, []);
    porAño.get(año)!.push(art);
  }

  if (porAño.size === 0) return null;

  const años   = Array.from(porAño.keys()).sort((a, b) => a - b);
  const counts = años.map((a) => porAño.get(a)!.length);

  function handleClick(event: Readonly<PlotMouseEvent>) {
    const point = event.points[0];
    if (!point) return;
    const año = point.x as number;
    const arts = porAño.get(año) ?? [];
    if (arts.length === 1) {
      router.push(`/articulos/${arts[0].slug}`);
    } else {
      setSeleccionados((prev) => (prev?.año === año ? null : { año, arts }));
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="h-56 w-full">
        <PlotlyChart
          data={[
            {
              type: "scatter",
              mode: "lines+markers",
              x: años,
              y: counts,
              line: { color: "#3838BD", width: 2 },
              marker: { color: "#3838BD", size: 8, symbol: "circle" },
              hovertemplate: "%{y} artículo%{y == 1 ? '' : 's'}<extra></extra>",
            },
          ]}
          layout={{
            title: { text: "Artículos por año", font: { size: 14 } },
            xaxis: { title: { text: "" }, tickformat: "d", dtick: 1 },
            yaxis: { title: { text: "" }, dtick: 1, rangemode: "tozero" },
            margin: { l: 40, r: 16, t: 36, b: 40 },
          }}
          onClick={handleClick}
        />
      </div>

      {seleccionados && (
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-900">
          <p className="mb-2 text-sm font-medium text-zinc-600 dark:text-zinc-400">
            {seleccionados.arts.length} artículos en {seleccionados.año}
          </p>
          <ul className="flex flex-col gap-1">
            {seleccionados.arts.map((art) => (
              <li key={art.id}>
                <Link
                  href={`/articulos/${art.slug}`}
                  className="text-sm font-medium text-azul hover:underline dark:text-azul-claro"
                >
                  {art.titulo}
                </Link>
                {art.issue?.publication && (
                  <span className="ml-2 text-xs text-zinc-400">
                    {art.issue.publication.titulo}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
