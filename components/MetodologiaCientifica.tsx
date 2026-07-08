import type { ReactNode } from "react";

// Explicación técnica (fórmulas, algoritmos) de una herramienta de análisis,
// oculta por defecto para no abrumar a quien solo quiere usar la
// herramienta; el texto introductorio de "qué obtienes y cómo usarlo" va
// fuera de este componente, siempre visible.
export function MetodologiaCientifica({ children }: { children: ReactNode }) {
  return (
    <details className="metodologia-cientifica">
      <summary className="text-azul dark:text-azul-claro">
        Ver metodología científica
      </summary>
      <div className="mt-2 flex max-w-3xl flex-col gap-2 font-light text-zinc-600 dark:text-zinc-400">
        {children}
      </div>
    </details>
  );
}
