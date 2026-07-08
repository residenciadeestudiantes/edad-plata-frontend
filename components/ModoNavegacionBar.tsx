"use client";

import { ModoNavegacionSwitch } from "@/components/ModoNavegacionSwitch";
import { useModoNavegacion } from "@/lib/modoNavegacion";

// Barra fija (sticky) bajo la cabecera donde vive el switch de modo de
// navegación: teja en modo lectura, azul de marca en modo investigación,
// como recordatorio visual mientras se navega.
export function ModoNavegacionBar() {
  const { modo } = useModoNavegacion();
  const activo = modo === "investigacion";

  return (
    <div
      className={`sticky top-0 z-40 border-t transition-colors ${
        activo ? "border-azul/30 bg-azul" : "border-teja/30 bg-teja"
      }`}
    >
      <div className="flex items-center justify-end px-10 py-2 sm:px-20">
        <ModoNavegacionSwitch />
      </div>
    </div>
  );
}
