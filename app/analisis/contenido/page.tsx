import type { Metadata } from "next";
import { PageTitle } from "@/components/PageTitle";
import { ContenidoAnalisisClient } from "./ContenidoAnalisisClient";

export const metadata: Metadata = {
  title: "Análisis de contenido | Edad de Plata",
  description:
    "Personas reales mencionadas en los artículos del corpus, año a año, para detectar figuras que ganaron relevancia en un momento concreto.",
};

export default function ContenidoAnalisisPage() {
  return (
    <div className="mx-auto w-full max-w-[1520px] flex flex-1 flex-col gap-12 px-10 py-12 sm:px-20">
      <header>
        <PageTitle color="azul">Análisis de contenido</PageTitle>
        <p className="mt-2 max-w-3xl font-light text-zinc-600 dark:text-zinc-400">
          Qué personas se mencionaban en los artículos y cuándo — más allá de
          quién los escribía — para detectar figuras que de repente ganaron
          relevancia. Piloto en curso: de momento solo cubre el año 1927.
        </p>
      </header>

      <ContenidoAnalisisClient />
    </div>
  );
}
