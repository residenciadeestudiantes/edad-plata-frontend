import type { Metadata } from "next";
import { PageTitle } from "@/components/PageTitle";
import { getPublicacionesConUbicacion } from "@/lib/api";
import { MapaClient } from "./MapaClient";

export const metadata: Metadata = {
  title: "Mapa | Edad de Plata",
  description:
    "Mapa de las ciudades donde se publicaron las revistas de la Edad de Plata española.",
};

export default async function MapaPage() {
  const publicaciones = await getPublicacionesConUbicacion();

  return (
    <div className="flex flex-1 flex-col gap-6 px-6 py-12 sm:px-12">
      <header>
        <PageTitle>Mapa</PageTitle>
        <p className="mt-2 font-light text-zinc-600 dark:text-zinc-400">
          Ciudades donde se publicaron las revistas catalogadas. Pulsa sobre
          un punto para ver qué revistas se editaron allí.
        </p>
      </header>

      <MapaClient publicaciones={publicaciones} />
    </div>
  );
}
