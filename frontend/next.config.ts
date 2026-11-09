/**
 * Configuración de Next.js.
 *
 * Reenvía /api/* al contenedor fastify eliminando el prefijo /api,
 * así el navegador solo habla con nextjs por HTTPS.
 * La dirección interna del backend viene de INTERNAL_API_URL.
 */

import type { NextConfig } from "next";

const internalApiUrl = process.env.INTERNAL_API_URL ?? "http://fastify:3000";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${internalApiUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;
