import type { ReactNode } from "react";

const COLOR_CLASSES = {
  teja: "text-teja dark:text-teja-claro",
  // Color primario de la sección de análisis y de los elementos exclusivos
  // del modo investigación.
  azul: "text-azul dark:text-azul-claro",
};

export function PageTitle({
  children,
  className = "",
  color = "teja",
}: {
  children: ReactNode;
  className?: string;
  color?: keyof typeof COLOR_CLASSES;
}) {
  return (
    <h1
      className={`font-titulo text-3xl font-bold tracking-tight sm:text-4xl ${COLOR_CLASSES[color]} ${className}`}
    >
      {children}
    </h1>
  );
}
