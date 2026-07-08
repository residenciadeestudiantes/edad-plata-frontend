import type { Metadata } from "next";
import { PageTitle } from "@/components/PageTitle";
import { HemerograficoClient } from "./HemerograficoClient";

export const metadata: Metadata = {
  title: "Datos hemerográficos · Revistas de la Edad de Plata",
  description:
    "Datos estadísticos sobre las revistas del corpus: línea de tiempo, distribución por idioma y por ciudad de publicación.",
};

export default function HemerograficoPage() {
  return (
    <div className="mx-auto w-full max-w-[1520px] flex flex-1 flex-col gap-10 px-10 py-12 sm:px-20">
      <header>
        <PageTitle color="azul">Datos hemerográficos</PageTitle>
        <p className="mt-2 max-w-3xl font-light text-zinc-600 dark:text-zinc-400">
          Estadísticas generales sobre las revistas del corpus: periodo de
          publicación, distribución por idioma y por ciudad de publicación.
        </p>
      </header>

      <HemerograficoClient />
    </div>
  );
}
