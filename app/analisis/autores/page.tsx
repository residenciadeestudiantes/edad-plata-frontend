import type { Metadata } from "next";
import { PageTitle } from "@/components/PageTitle";
import { AutoresTabsClient } from "./AutoresTabsClient";

export const metadata: Metadata = {
  title: "Autores · Análisis | Edad de Plata",
  description:
    "Analiza cuantitativamente a los autores del corpus: sus redes de concurrencia por número de revista y su distribución por tipo de actividad o profesión.",
};

export default function AutoresAnalisisPage() {
  return (
    <div className="mx-auto w-full max-w-[1520px] flex flex-1 flex-col gap-12 px-10 py-12 sm:px-20">
      <header>
        <PageTitle color="azul">Autores</PageTitle>
        <p className="mt-2 max-w-3xl font-light text-zinc-600 dark:text-zinc-400">
          Analiza cuantitativamente a los autores del corpus: sus redes de
          concurrencia por número de revista y su distribución por tipo de
          actividad o profesión.
        </p>
      </header>

      <AutoresTabsClient />
    </div>
  );
}
