import { Suspense } from "react";
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
    <div className="mx-auto w-full max-w-[1520px] flex flex-1 flex-col gap-10 px-10 py-12 sm:px-20">
      <header>
        <PageTitle color="azul">Deriva Estilística</PageTitle>
      </header>

      <Suspense fallback={null}>
        <InnovacionClient />
      </Suspense>

      <hr className="border-zinc-200 dark:border-zinc-800" />

      <header>
        <h2 className="font-playfair text-2xl font-bold text-azul sm:text-3xl dark:text-azul-claro">
          Cadenas léxicas
        </h2>
      </header>

      <Suspense fallback={null}>
        <CadenasLexicasClient />
      </Suspense>
    </div>
  );
}
