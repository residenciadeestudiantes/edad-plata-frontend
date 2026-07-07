import type { Metadata } from "next";
import { PageTitle } from "@/components/PageTitle";
import { ValidadorClient } from "./ValidadorClient";

// Herramienta interna, no enlazada desde la navegación ni el subnav de
// Análisis (solo accesible con la URL directa). Protegida igualmente por el
// AnalisisGate del layout de /analisis (contraseña "revistas").
export const metadata: Metadata = {
  title: "Validador de tipo de artículo · Edad de Plata",
  robots: { index: false, follow: false },
};

export default function ValidadorPage() {
  return (
    <div className="flex flex-1 flex-col gap-6 px-6 py-12 sm:px-12">
      <header>
        <PageTitle color="azul">Validador de tipo de artículo</PageTitle>
        <p className="mt-2 max-w-3xl font-light text-zinc-600 dark:text-zinc-400">
          Revisa y corrige a mano la clasificación automática de cada
          artículo (Poema / Obra gráfica / Prosa) por revista, para arreglar
          falsos positivos y negativos de ambos clasificadores.
        </p>
      </header>

      <ValidadorClient />
    </div>
  );
}
