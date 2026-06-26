"use client";

import "leaflet/dist/leaflet.css";
import { useMemo, useState } from "react";
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

type Grupo = { lat: number; lng: number; ciudad: string; publicaciones: Publication[] };

// Agrupa las revistas por ciudad (mismas coordenadas exactas) para mostrar
// un único marcador con todas ellas en vez de superponer varios círculos
// idénticos. Cada revista puede tener hasta dos ubicaciones.
function agruparPorCiudad(publicaciones: Publication[]) {
  const grupos = new Map<string, Grupo>();

  function añadir(pub: Publication, lat: number, lng: number, ciudad: string | null) {
    const clave = `${lat},${lng}`;
    const grupo = grupos.get(clave) ?? { lat, lng, ciudad: ciudad ?? "Ciudad desconocida", publicaciones: [] };
    if (!grupo.publicaciones.includes(pub)) grupo.publicaciones.push(pub);
    grupos.set(clave, grupo);
  }

  for (const pub of publicaciones) {
    if (pub.latitud !== null && pub.longitud !== null)
      añadir(pub, pub.latitud, pub.longitud, pub.lugar_publicacion);
    if (pub.latitud_2 !== null && pub.longitud_2 !== null)
      añadir(pub, pub.latitud_2, pub.longitud_2, pub.lugar_publicacion_2);
  }

  return Array.from(grupos.values());
}

export function MapaClient({ publicaciones }: { publicaciones: Publication[] }) {
  const [seleccionada, setSeleccionada] = useState<string>("");

  const filtradas = useMemo(
    () => seleccionada ? publicaciones.filter((p) => p.slug === seleccionada) : publicaciones,
    [publicaciones, seleccionada]
  );

  const grupos = useMemo(() => agruparPorCiudad(filtradas), [filtradas]);

  if (publicaciones.length === 0) {
    return (
      <p className="text-zinc-500">
        No hay revistas con una ciudad de publicación reconocida todavía.
      </p>
    );
  }

  const centro: LatLngExpression = [40.0, -4.0];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <label htmlFor="filtro-revista" className="shrink-0 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Revista
        </label>
        <select
          id="filtro-revista"
          value={seleccionada}
          onChange={(e) => setSeleccionada(e.target.value)}
          className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 shadow-sm focus:border-teja focus:outline-none focus:ring-1 focus:ring-teja dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
        >
          <option value="">Todas las revistas</option>
          {publicaciones.map((p) => (
            <option key={p.slug} value={p.slug}>
              {p.titulo}
            </option>
          ))}
        </select>
      </div>

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
    </div>
  );
}
