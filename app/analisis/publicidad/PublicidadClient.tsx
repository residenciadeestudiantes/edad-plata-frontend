"use client";

import { useState } from "react";
import { FrecuenciaTab } from "./FrecuenciaTab";
import { TecnologiaTab } from "./TecnologiaTab";
import { LenguajeTab } from "./LenguajeTab";
import { VanguardiaTab } from "./VanguardiaTab";

type Tab = "frecuencia" | "tecnologia" | "lenguaje" | "vanguardia";

const TABS: { id: Tab; label: string }[] = [
  { id: "frecuencia", label: "Frecuencia y distribución" },
  { id: "tecnologia", label: "Tendencias" },
  { id: "lenguaje", label: "Lenguaje publicitario" },
  { id: "vanguardia", label: "Influencia de vanguardia" },
];

interface RevistaOpcion {
  slug: string;
  titulo: string;
}

export function PublicidadClient({ revistas }: { revistas: RevistaOpcion[] }) {
  const [tab, setTab] = useState<Tab>("frecuencia");

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap gap-2 border-b border-zinc-200 dark:border-zinc-800">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            aria-pressed={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
              tab === t.id
                ? "border-azul text-azul dark:border-azul-claro dark:text-azul-claro"
                : "border-transparent text-zinc-500 hover:text-azul dark:text-zinc-400 dark:hover:text-azul-claro"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "frecuencia" && <FrecuenciaTab revistas={revistas} />}
      {tab === "tecnologia" && <TecnologiaTab />}
      {tab === "lenguaje" && <LenguajeTab />}
      {tab === "vanguardia" && <VanguardiaTab revistas={revistas} />}
    </div>
  );
}
