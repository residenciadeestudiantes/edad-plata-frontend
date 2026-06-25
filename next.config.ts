import type { NextConfig } from "next";

// En producción NEXT_PUBLIC_STRAPI_URL es la URL pública real del backend
// (p. ej. https://api.tu-dominio.com); en desarrollo, por defecto,
// localhost. El patrón de imágenes remotas se deriva de ahí para no
// duplicar el dominio en dos sitios.
const strapiUrl = new URL(process.env.NEXT_PUBLIC_STRAPI_URL ?? "http://localhost:1337");

const nextConfig: NextConfig = {
  // Necesario para el Dockerfile de producción: genera un .next/standalone
  // autocontenido (solo los node_modules realmente usados) en vez de
  // depender de copiar todo node_modules a la imagen final.
  output: "standalone",
  turbopack: {
    root: __dirname,
  },
  images: {
    remotePatterns: [
      {
        protocol: strapiUrl.protocol.replace(":", "") as "http" | "https",
        hostname: strapiUrl.hostname,
        port: strapiUrl.port,
        pathname: "/uploads/**",
      },
    ],
    // Next 16 blocks optimizing images from local IPs/hosts by default;
    // the Strapi backend runs on localhost in development.
    dangerouslyAllowLocalIP: true,
  },
};

export default nextConfig;