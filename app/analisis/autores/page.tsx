import type { Metadata } from "next";
import { PageTitle } from "@/components/PageTitle";
import { AutoresTabsClient } from "./AutoresTabsClient";

export const metadata: Metadata = {
  title: "Autores · Análisis | Edad de Plata",
  description:
    "Análisis de redes de concurrencia y distribución de actividades o profesiones de los autores del corpus.",
};

export default function AutoresAnalisisPage() {
  return (
    <div className="mx-auto w-full max-w-[1520px] flex flex-1 flex-col gap-12 px-10 py-12 sm:px-20">
      <header>
        <PageTitle color="azul">Autores</PageTitle>
        <p className="mt-2 max-w-3xl font-light text-zinc-600 dark:text-zinc-400">
          Análisis cuantitativo de los autores del corpus: redes de
          concurrencia por número de revista y distribución por tipo de
          actividad o profesión.
        </p>
      </header>

      <AutoresTabsClient />
    </div>
  );
}
