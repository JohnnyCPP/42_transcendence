import Link from 'next/link';

interface BoardPlaceholderPageProps {
  params: Promise<{
    boardId: string;
  }>;
}

function formatBoardName(boardId: string) {
  return boardId
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export default async function BoardPlaceholderPage({ params }: BoardPlaceholderPageProps) {
  const { boardId } = await params;
  const boardName = formatBoardName(boardId);

  return (
    <main className="min-h-screen bg-surface-bright px-4 py-10 text-on-surface md:px-8 flex items-center justify-center">
      <section className="w-full max-w-2xl rounded-[28px] border border-outline-variant bg-white p-6 shadow-sm md:p-8 text-center space-y-5">
        <div className="inline-flex items-center gap-2 rounded-full border border-outline-variant bg-surface-container-low px-3 py-1 text-sm text-on-surface-variant">
          <span className="material-symbols-outlined text-[18px] text-primary">dashboard</span>
          Board placeholder
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">{boardName}</h1>
          <p className="text-sm text-on-surface-variant md:text-base">
            Este board todavía no tiene una experiencia dedicada en el frontend. Por ahora,
            la navegación ya está preparada para que la UI no tenga tarjetas mudas.
          </p>
        </div>

        <div className="rounded-2xl border border-outline-variant bg-surface-container-low px-5 py-4 text-left text-sm text-on-surface-variant">
          Cuando llegue el momento de integrarlo, esta ruta puede reutilizar el layout del board
          principal y cargar su propio conjunto de listas y tareas.
        </div>

        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/boards"
            className="inline-flex items-center justify-center rounded-xl border border-outline-variant px-4 py-3 font-medium text-on-surface transition-colors hover:bg-surface-container"
          >
            Volver a todos los boards
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-3 font-semibold text-white transition-colors hover:bg-primary-container"
          >
            Ir al dashboard
          </Link>
        </div>
      </section>
    </main>
  );
}