import type { Metadata } from "next";
import { PageTitle } from "@/components/PageTitle";
import { ValidadorTemasClient } from "./ValidadorTemasClient";

// Herramienta interna, no enlazada desde la navegación ni el subnav de
// Análisis (solo accesible con la URL directa). Protegida igualmente por el
// AnalisisGate del layout de /analisis (contraseña "revistas").
export const metadata: Metadata = {
  title: "Validador de temas dudosos · Edad de Plata",
  robots: { index: false, follow: false },
};

export default function ValidadorTemasPage() {
  return (
    <div className="flex flex-1 flex-col gap-6 px-6 py-12 sm:px-12">
      <header>
        <PageTitle color="azul">Validador de temas dudosos</PageTitle>
        <p className="mt-2 max-w-3xl font-light text-zinc-600 dark:text-zinc-400">
          Solo los artículos a los que la clasificación automática por LLM
          les asignó más de un tema (los casos en que el propio modelo
          detectó ambigüedad). Marca los temas correctos y desmarca los que
          no correspondan.
        </p>
      </header>

      <ValidadorTemasClient />
    </div>
  );
}
