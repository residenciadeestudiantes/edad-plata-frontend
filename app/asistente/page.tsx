import type { Metadata } from "next";
import { PageTitle } from "@/components/PageTitle";
import { AsistenteClient } from "./AsistenteClient";

export const metadata: Metadata = {
  title: "Asistente · Revistas de la Edad de Plata",
  description:
    "Asistente conversacional que responde preguntas sobre las revistas, los artículos, los autores y las figuras de las vanguardias españolas a partir del corpus de la hemeroteca.",
};

export default function AsistentePage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-8 sm:px-10">
      <header>
        <PageTitle>Asistente</PageTitle>
        <p className="mt-2 font-light text-zinc-600 dark:text-zinc-400">
          Pregunta sobre las revistas, los artículos, los autores y las
          figuras de las vanguardias españolas. Responde solo con lo que
          encuentra en el corpus y cita sus fuentes.
        </p>
      </header>

      <AsistenteClient />
    </div>
  );
}
