import type { Metadata } from "next";
import { PageTitle } from "@/components/PageTitle";
import { HemerograficoClient } from "./HemerograficoClient";

export const metadata: Metadata = {
  title: "Análisis Hemerográfico · Revistas de la Edad de Plata",
  description:
    "Línea de tiempo con el periodo de publicación de cada revista del corpus, de su primer al último número conocido.",
};

export default function HemerograficoPage() {
  return (
    <div className="flex flex-1 flex-col gap-10 px-6 py-12 sm:px-12">
      <header>
        <PageTitle color="azul">Análisis Hemerográfico</PageTitle>
        <p className="mt-2 max-w-3xl font-light text-zinc-600 dark:text-zinc-400">
          Línea de tiempo con el periodo de publicación de cada revista del
          corpus, de su primer al último número conocido.
        </p>
      </header>

      <HemerograficoClient />
    </div>
  );
}
