"use client";

import { useModoNavegacion } from "@/lib/modoNavegacion";

// Conmutador de modo investigación para usar sobre fondos claros (p. ej. la
// tarjeta "Modo investigación" de la home). Lee y escribe el mismo contexto
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
      <span className="text-sm font-semibold text-negro dark:text-blanco">
        Activar modo investigación
      </span>
      <span
        className={`relative inline-flex h-7 w-12 flex-shrink-0 items-center rounded-full transition-colors ${
          activo ? "bg-azul dark:bg-azul-claro" : "bg-negro/15 dark:bg-blanco/20"
        }`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
            activo ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </span>
    </button>
  );
}
