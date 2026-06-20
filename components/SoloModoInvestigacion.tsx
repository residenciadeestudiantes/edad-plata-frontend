"use client";

import { useModoNavegacion } from "@/lib/modoNavegacion";

// Envuelve herramientas de investigación (nube de palabras, búsqueda exacta,
// etc.) para que solo se muestren cuando el usuario activa el modo
// investigación. El contenido puede venir ya renderizado por un Server
// Component, ya que se pasa como children.
export function SoloModoInvestigacion({
  children,
}: {
  children: React.ReactNode;
}) {
  const { modo } = useModoNavegacion();

  if (modo !== "investigacion") return null;

  return <>{children}</>;
}
