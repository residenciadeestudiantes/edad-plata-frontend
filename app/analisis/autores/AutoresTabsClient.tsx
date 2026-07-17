"use client";

import { useState } from "react";
import { ActividadesAutoresClient } from "./ActividadesAutoresClient";
import { RedesAutoresClient } from "./RedesAutoresClient";

type Tab = "redes" | "actividades";

const TABS: { id: Tab; label: string }[] = [
  { id: "redes", label: "Redes de concurrencia" },
  { id: "actividades", label: "Actividades" },
];

export function AutoresTabsClient() {
  const [tab, setTab] = useState<Tab>("redes");

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

      {tab === "redes" && <RedesAutoresClient />}
      {tab === "actividades" && <ActividadesAutoresClient />}
    </div>
  );
}
