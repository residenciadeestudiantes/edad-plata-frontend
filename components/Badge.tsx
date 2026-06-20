import type { ReactNode } from "react";

type BadgeColor = "teja" | "azul" | "verde" | "magenta";

const COLOR_CLASSES: Record<BadgeColor, string> = {
  teja: "bg-teja/10 text-teja dark:bg-teja-claro/10 dark:text-teja-claro",
  azul: "bg-azul/10 text-azul dark:bg-azul-claro/10 dark:text-azul-claro",
  verde: "bg-verde/10 text-verde dark:bg-verde-claro/10 dark:text-verde-claro",
  magenta:
    "bg-magenta/10 text-magenta dark:bg-magenta-claro/10 dark:text-magenta-claro",
};

export function Badge({
  children,
  color = "teja",
  className = "",
}: {
  children: ReactNode;
  color?: BadgeColor;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${COLOR_CLASSES[color]} ${className}`}
    >
      {children}
    </span>
  );
}
