/**
 * Configuración de Next.js.
 *
 * Reenvía cualquier petición a /api/* al contenedor fastify sin cambiar
 * la ruta, así el navegador solo habla con nextjs por HTTPS.
 * La dirección interna del backend viene de INTERNAL_API_URL.
 */

import type { NextConfig } from "next";

const internalApiUrl = process.env.INTERNAL_API_URL ?? "http://fastify:3000";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${internalApiUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
