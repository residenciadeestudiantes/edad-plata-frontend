import type { Metadata } from "next";
import { PageTitle } from "@/components/PageTitle";
import { CadenasLexicasClient } from "./CadenasLexicasClient";
import { InnovacionClient } from "./InnovacionClient";

export const metadata: Metadata = {
  title: "Deriva Estilística · Revistas de la Edad de Plata",
  description:
    "Deriva estilística de cada autor a lo largo del tiempo respecto a la norma del corpus.",
};

export default function InnovacionPage() {
  return (
    <div className="flex flex-1 flex-col gap-10 px-6 py-12 sm:px-12">
      <header>
        <PageTitle color="azul">Deriva Estilística</PageTitle>
      </header>

      <InnovacionClient />

      <hr className="border-zinc-200 dark:border-zinc-800" />

      <header>
        <h2 className="font-playfair text-2xl font-bold text-teja sm:text-3xl dark:text-teja-claro">
          Cadenas léxicas
        </h2>
      </header>

      <CadenasLexicasClient />
    </div>
  );
}
