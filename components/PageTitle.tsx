import type { ReactNode } from "react";

export function PageTitle({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <h1
      className={`font-titulo text-3xl font-bold tracking-tight text-teja dark:text-teja-claro sm:text-4xl ${className}`}
    >
      {children}
    </h1>
  );
}
