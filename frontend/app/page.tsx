import { redirect } from 'next/navigation';

/**
 * Entrada de la app (`/`).
 *
 * Redirige al dashboard: el kanban vive en `/boards/[boardId]`,
 * accesible desde Panel / Tableros. El switcher de org es `/workspace`.
 */
export default function Home() {
  redirect('/dashboard');
}
