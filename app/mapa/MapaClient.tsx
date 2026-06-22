"use client";

import "leaflet/dist/leaflet.css";
import { useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import type { LatLngExpression } from "leaflet";
import type { Publication } from "@/lib/api";

// react-leaflet depende del DOM (igual que Plotly), así que se carga solo
// en el cliente.
const MapContainer = dynamic(() => import("react-leaflet").then((m) => m.MapContainer), {
  ssr: false,
});
const TileLayer = dynamic(() => import("react-leaflet").then((m) => m.TileLayer), { ssr: false });
const CircleMarker = dynamic(() => import("react-leaflet").then((m) => m.CircleMarker), {
  ssr: false,
});
const Popup = dynamic(() => import("react-leaflet").then((m) => m.Popup), { ssr: false });

// Agrupa las revistas por ciudad (mismas coordenadas exactas) para mostrar
// un único marcador con todas ellas en vez de superponer varios círculos
// idénticos.
function agruparPorCiudad(publicaciones: Publication[]) {
  const grupos = new Map<string, { lat: number; lng: number; ciudad: string; publicaciones: Publication[] }>();

  for (const publicacion of publicaciones) {
    if (publicacion.latitud === null || publicacion.longitud === null) continue;

    const clave = `${publicacion.latitud},${publicacion.longitud}`;
    const grupo = grupos.get(clave) ?? {
      lat: publicacion.latitud,
      lng: publicacion.longitud,
      ciudad: publicacion.lugar_publicacion ?? "Ciudad desconocida",
      publicaciones: [],
    };
    grupo.publicaciones.push(publicacion);
    grupos.set(clave, grupo);
  }

  return Array.from(grupos.values());
}

export function MapaClient({ publicaciones }: { publicaciones: Publication[] }) {
  const grupos = useMemo(() => agruparPorCiudad(publicaciones), [publicaciones]);

  if (grupos.length === 0) {
    return (
      <p className="text-zinc-500">
        No hay revistas con una ciudad de publicación reconocida todavía.
      </p>
    );
  }

  const centro: LatLngExpression = [40.0, -4.0];

  return (
    <div className="h-[70vh] w-full overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
      <MapContainer
        center={centro}
        zoom={5}
        scrollWheelZoom
        style={{ width: "100%", height: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {grupos.map((grupo) => (
          <CircleMarker
            key={`${grupo.lat},${grupo.lng}`}
            center={[grupo.lat, grupo.lng]}
            radius={8 + grupo.publicaciones.length * 2}
            pathOptions={{ color: "#DA3C00", fillColor: "#DA3C00", fillOpacity: 0.6 }}
          >
            <Popup>
              <div className="flex flex-col gap-1">
                <p className="font-medium">{grupo.ciudad}</p>
                <ul className="flex flex-col gap-1">
                  {grupo.publicaciones.map((publicacion) => (
                    <li key={publicacion.slug}>
                      <Link
                        href={`/revistas/${publicacion.slug}`}
                        className="text-teja hover:underline"
                      >
                        {publicacion.titulo}
                      </Link>
                      {(publicacion.año_inicio || publicacion.año_fin) && (
                        <span className="text-zinc-500">
                          {" "}
                          ({publicacion.año_inicio ?? "?"}–{publicacion.año_fin ?? "?"})
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
