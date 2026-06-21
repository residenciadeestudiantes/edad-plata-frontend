"use client";

import { useModoNavegacion, type ModoNavegacion } from "@/lib/modoNavegacion";

const OPCIONES: { valor: ModoNavegacion; label: string }[] = [
  { valor: "lectura", label: "Modo lectura" },
  { valor: "investigacion", label: "Modo investigación" },
];

// Cada opción usa el color que la identifica en el resto del sitio: teja
// para lectura, azul de marca para investigación (igual que ModoNavegacionBar
// y el resto de elementos exclusivos del modo investigación).
const COLOR_POR_MODO: Record<ModoNavegacion, { activo: string; inactivo: string }> = {
  lectura: {
    activo: "bg-teja text-white dark:bg-teja-claro dark:text-negro",
    inactivo: "text-teja hover:bg-teja/10 dark:text-teja-claro dark:hover:bg-teja-claro/10",
  },
  investigacion: {
    activo: "bg-azul text-white dark:bg-azul-claro dark:text-negro",
    inactivo: "text-azul hover:bg-azul/10 dark:text-azul-claro dark:hover:bg-azul-claro/10",
  },
};

export function ModoNavegacionSwitch() {
  const { modo, setModo } = useModoNavegacion();

  return (
    <div
      role="group"
      aria-label="Modo de navegación"
      className="inline-flex items-center gap-1 rounded-full border border-zinc-300 bg-white p-1 text-xs font-medium dark:border-zinc-700 dark:bg-negro"
    >
      {OPCIONES.map((opcion) => (
        <button
          key={opcion.valor}
          type="button"
          onClick={() => setModo(opcion.valor)}
          aria-pressed={modo === opcion.valor}
          className={`rounded-full px-3 py-1 transition-colors ${
            modo === opcion.valor
              ? COLOR_POR_MODO[opcion.valor].activo
              : COLOR_POR_MODO[opcion.valor].inactivo
          }`}
        >
          {opcion.label}
        </button>
      ))}
    </div>
  );
}
