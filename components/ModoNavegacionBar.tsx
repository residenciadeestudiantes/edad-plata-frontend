"use client";

import { ModoNavegacionSwitch } from "@/components/ModoNavegacionSwitch";
import { useModoNavegacion } from "@/lib/modoNavegacion";

// Barra fija al pie de la ventana (position: fixed, no sticky: al vivir
// justo debajo de la cabecera, muy arriba en el flujo del documento, un
// sticky bottom-0 se despegaría nada más empezar a hacer scroll en vez de
// permanecer visible) donde vive el switch de modo de navegación: teja en
// modo lectura, azul de marca en modo investigación, como recordatorio
// visual permanente mientras se navega.
export function ModoNavegacionBar() {
  const { modo } = useModoNavegacion();
  const activo = modo === "investigacion";

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 border-t transition-colors ${
        activo ? "border-azul/30 bg-azul" : "border-teja/30 bg-teja"
      }`}
    >
      <div className="flex items-center justify-end px-6 py-2 sm:px-12">
        <ModoNavegacionSwitch />
      </div>
    </div>
  );
}
