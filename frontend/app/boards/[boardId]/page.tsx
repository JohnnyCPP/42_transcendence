import BoardPageClient from './BoardPageClient';

interface BoardPageProps {
  params: Promise<{
    boardId: string;
  }>;
}

/**
 * Ruta dinámica de un tablero.
 *
 * Resuelve el `boardId` en servidor y delega la UI interactiva
 * al cliente (`BoardPageClient`).
 */
export default async function BoardPage({ params }: BoardPageProps) {
  const { boardId } = await params;
  return <BoardPageClient boardId={boardId} />;
}
