"use client";

import { useModoNavegacion, type ModoNavegacion } from "@/lib/modoNavegacion";

const OPCIONES: { valor: ModoNavegacion; label: string }[] = [
  { valor: "lectura", label: "Modo lectura" },
  { valor: "investigacion", label: "Modo investigación" },
];

export function ModoNavegacionSwitch() {
  const { modo, setModo } = useModoNavegacion();

  return (
    <div
      role="group"
      aria-label="Modo de navegación"
      className="inline-flex items-center gap-1 rounded-full border border-teja/30 bg-white p-1 text-xs font-medium dark:border-teja-claro/30 dark:bg-negro"
    >
      {OPCIONES.map((opcion) => (
        <button
          key={opcion.valor}
          type="button"
          onClick={() => setModo(opcion.valor)}
          aria-pressed={modo === opcion.valor}
          className={`rounded-full px-3 py-1 transition-colors ${
            modo === opcion.valor
              ? "bg-teja text-white dark:bg-teja-claro dark:text-negro"
              : "text-teja hover:bg-teja/10 dark:text-teja-claro dark:hover:bg-teja-claro/10"
          }`}
        >
          {opcion.label}
        </button>
      ))}
    </div>
  );
}
