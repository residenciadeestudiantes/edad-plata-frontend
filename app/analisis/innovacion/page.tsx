import type { Metadata } from "next";
import { PageTitle } from "@/components/PageTitle";
import { InnovacionClient } from "./InnovacionClient";

export const metadata: Metadata = {
  title: "Innovación Estilística · Revistas de la Edad de Plata",
  description:
    "Deriva estilística de cada autor a lo largo del tiempo respecto a la norma del corpus.",
};

export default function InnovacionPage() {
  return (
    <div className="flex flex-1 flex-col gap-10 px-6 py-12 sm:px-12">
      <header>
        <PageTitle color="azul">Innovación Estilística</PageTitle>
      </header>

      <InnovacionClient />
    </div>
  );
}
