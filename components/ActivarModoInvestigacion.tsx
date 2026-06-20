"use client";

import { useModoNavegacion } from "@/lib/modoNavegacion";

// Selector dentro del banner de la home. Lee y escribe el mismo contexto
// global que el switch de la cabecera, así que ambos quedan siempre
// sincronizados: activar uno activa el otro, y viceversa.
export function ActivarModoInvestigacion() {
  const { modo, setModo } = useModoNavegacion();
  const activo = modo === "investigacion";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={activo}
      onClick={() => setModo(activo ? "lectura" : "investigacion")}
      className="flex items-center gap-3"
    >
      <span className="font-medium text-white">Activa modo investigación</span>
      <span
        className={`relative inline-flex h-7 w-12 flex-shrink-0 items-center rounded-full transition-colors ${
          activo ? "bg-white" : "bg-white/30"
        }`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-azul transition-transform ${
            activo ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </span>
    </button>
  );
}
