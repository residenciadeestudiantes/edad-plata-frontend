"use client";

import { ModoNavegacionSwitch } from "@/components/ModoNavegacionSwitch";
import { useModoNavegacion } from "@/lib/modoNavegacion";

// Barra fija (sticky) bajo la cabecera donde vive el switch de modo de
// navegación. Cambia a azul de marca cuando el modo investigación está
// activo, como recordatorio visual mientras se navega.
export function ModoNavegacionBar() {
  const { modo } = useModoNavegacion();
  const activo = modo === "investigacion";

  return (
    <div
      className={`sticky top-0 z-40 border-t transition-colors ${
        activo
          ? "border-azul/30 bg-azul"
          : "border-teja/20 bg-gris-claro dark:border-teja-claro/20 dark:bg-zinc-950"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-end px-6 py-2 sm:px-12">
        <ModoNavegacionSwitch />
      </div>
    </div>
  );
}
