"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { Data, Datum, PlotData } from "plotly.js";
import { PlotlyChart } from "@/components/PlotlyChart";
import { getArticulosPorRevistaDeAutor, type ArticulosPorRevista } from "@/lib/api";
import { useModoNavegacion } from "@/lib/modoNavegacion";

const COLORES = ["#DA3C00", "#3838BD", "#008867", "#DD158B", "#FF7D45", "#45D2FF"];

// Rango de tamaño de burbuja relativo al propio autor: el máximo de
// colaboraciones siempre llega a MAX_SIZE, sea 1 o 50, para que autores con
// pocos artículos no salgan con burbujas minúsculas.
const MIN_SIZE = 20;
const MAX_SIZE = 60;

interface BurbujaRevistaProps {
  autorSlug: string;
  autorNombre: string;
}

export function BurbujasRevistas({ autorSlug, autorNombre }: BurbujaRevistaProps) {
  const router = useRouter();
  const [colaboraciones, setColaboraciones] = useState<ArticulosPorRevista[] | null>(null);

  useEffect(() => {
    let cancelado = false;

    getArticulosPorRevistaDeAutor(autorSlug).then((datos) => {
      if (!cancelado) setColaboraciones(datos);
    });

    return () => {
      cancelado = true;
    };
  }, [autorSlug]);

  if (colaboraciones === null) {
    return (
      <div className="flex items-center gap-2 text-sm font-light text-zinc-500 dark:text-zinc-400">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        Cargando colaboraciones...
      </div>
    );
  }

  if (colaboraciones.length === 0) {
    return null;
  }

  const maxArticulos = Math.max(...colaboraciones.map((c) => c.num_articulos));
  const tamanyo = (n: number) => MIN_SIZE + (n / maxArticulos) * (MAX_SIZE - MIN_SIZE);

  const data: Data[] = [
    {
      type: "scatter",
      mode: "markers",
      x: colaboraciones.map((_, i) => i),
      y: colaboraciones.map(() => 1),
      // Plotly admite objetos arbitrarios en customdata para usarlos en el
      // hovertemplate, aunque el tipo Datum de @types/plotly.js sea más
      // estricto (solo string | number | Date | null).
      customdata: colaboraciones.map(
        (c) => ({ revista: c.revista, num_articulos: c.num_articulos }) as unknown as Datum
      ),
      hovertemplate:
        "<b>%{customdata.revista}</b><br>%{customdata.num_articulos} artículos<extra></extra>",
      marker: {
        size: colaboraciones.map((c) => tamanyo(c.num_articulos)),
        color: colaboraciones.map((_, i) => COLORES[i % COLORES.length]),
      },
    } satisfies Partial<PlotData>,
  ];

  return (
    <div aria-label={`Colaboraciones de ${autorNombre} por revista`}>
      <PlotlyChart
        data={data}
        layout={{
          showlegend: false,
          xaxis: {
            visible: false,
            showgrid: false,
            zeroline: false,
            showticklabels: false,
            range: [-0.5, colaboraciones.length - 0.5],
          },
          yaxis: {
            visible: false,
            showgrid: false,
            zeroline: false,
            showticklabels: false,
            range: [0.5, 1.5],
          },
          paper_bgcolor: "transparent",
          plot_bgcolor: "transparent",
          font: { family: "Inter", color: "#0A0A0A" },
          height: 200,
          margin: { t: 10, b: 10, l: 10, r: 10 },
        }}
        onClick={(event) => {
          const punto = event.points[0];
          if (!punto) return;
          const colaboracion = colaboraciones[punto.pointIndex as number];
          if (colaboracion) router.push(`/revistas/${colaboracion.revista_slug}`);
        }}
      />
    </div>
  );
}

// Compone el layout de dos columnas de la página de autor: a la izquierda el
// contenido recibido como children (selector + listado de artículos), a la
// derecha el gráfico de burbujas. Vive aquí (no en page.tsx) porque depende
// de useModoNavegacion, que requiere un Client Component, mientras que
// page.tsx debe seguir siendo un Server Component para poder hacer
// `await getAuthor(...)`.
export function ColaboracionesPorRevista({
  autorSlug,
  autorNombre,
  children,
}: {
  autorSlug: string;
  autorNombre: string;
  children: ReactNode;
}) {
  const { modo } = useModoNavegacion();
  const conGrafico = modo === "investigacion";

  return (
    <div className="flex flex-col gap-10 lg:flex-row lg:items-start">
      <div className={conGrafico ? "w-full lg:w-2/3" : "w-full"}>{children}</div>

      {conGrafico && (
        <aside className="w-full lg:sticky lg:top-8 lg:w-1/3">
          <h3 className="font-playfair text-xl font-bold text-teja dark:text-teja-claro">
            Colaboraciones por revista
          </h3>
          <div className="mt-4">
            <BurbujasRevistas autorSlug={autorSlug} autorNombre={autorNombre} />
          </div>
          <p className="mt-2 text-xs font-light text-zinc-500 dark:text-zinc-400">
            Haz clic en una burbuja para ir a la revista.
          </p>
        </aside>
      )}
    </div>
  );
}
