/**
 * Cliente HTTP compartido del frontend.
 *
 * Cuando el backend active el versionado, cambia solo `API_BASE`
 * (p. ej. a `/api/v1`) y ajusta el rewrite de `next.config.ts`.
 */
export const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? '/api';

/**
 * Construye la URL final anteponiendo `API_BASE` si hace falta.
 *
 * - `/me` → `/api/me`
 * - `/api/me` → `/api/me` (no duplica el prefijo)
 */
function resolveUrl(path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  if (path.startsWith(API_BASE)) {
    return path;
  }

  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE}${normalized}`;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly error: string,
    public readonly status: number
  ) {
    super(message);
    this.name = 'ApiError';
  }
}


/**
 * Wrapper de `fetch` para las llamadas a la API.
 *
 * Reglas:
 * - Incluye cookies de sesión (`credentials: 'include'`)
 * - Fuerza JSON en cabeceras
 * - Unifica el manejo de errores HTTP
 * - Usa `API_BASE` como prefijo de rutas relativas
 */
export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(resolveUrl(path), {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    let message = `La petición falló con estado ${response.status}`;
    let error = 'REQUEST_FAILED';

    try {
      const payload = (await response.json()) as {
        error?: string;
        message?: string;
      };
      if (payload?.message) message = payload.message;
      if (payload?.error) error = payload.error;
    } catch {
      // Cuerpo no JSON: dejamos message/error por defecto.
    }

    throw new ApiError(message, error, response.status);
  }

  // 204 = sin cuerpo; devolvemos undefined tipado.
  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}
