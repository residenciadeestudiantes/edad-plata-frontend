import type { Metadata } from "next";
import { AnalisisClient } from "./AnalisisClient";

export const metadata: Metadata = {
  title: "Análisis Filológico | Edad de Plata",
  description:
    "Busca concordancias de una palabra en todo el corpus de artículos de la hemeroteca: localiza cada ocurrencia con su contexto, y consulta su distribución por revista y por autor. Una herramienta pensada para investigadores y filólogos que estudian el uso del lenguaje en la prensa cultural de la Edad de Plata española.",
};

export default function AnalisisPage() {
  return (
    <div className="flex flex-1 flex-col gap-10 px-6 py-12 sm:px-12">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">
          Análisis Filológico
        </h1>
        <p className="mt-2 max-w-3xl text-zinc-600 dark:text-zinc-400">
          Busca concordancias de una palabra en todo el corpus de artículos de
          la hemeroteca: localiza cada ocurrencia con su contexto, y consulta
          su distribución por revista y por autor. Una herramienta pensada
          para investigadores y filólogos que estudian el uso del lenguaje en
          la prensa cultural de la Edad de Plata española.
        </p>
      </header>

      <AnalisisClient />
    </div>
  );
}
