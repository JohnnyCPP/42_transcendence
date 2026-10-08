'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import DashboardHero from '@/components/dashboard/DashboardHero';
import BoardCard from '@/components/dashboard/BoardCard';
import VelocityWidget from '@/components/dashboard/VelocityWidget';
import ActivityFeed from '@/components/dashboard/ActivityFeed';
import { InfoDialog } from '@/components/ui';
import { DashboardBoardItem, mockDashboardBoards } from '@/data/mockDashboardBoards';
import { getLocalProjects, mapLocalProjectToBoardCard } from '@/data/localProjects';

/**
 * Dashboard de resumen.
 *
 * Esta pantalla agrupa métricas, tarjetas de boards y actividad reciente.
 * Usa contenido mock para mostrar la dirección visual del producto mientras
 * se termina la integración real con datos de backend.
 */
export default function DashboardPage() {
  // Filtro compartido por el header.
  const [searchQuery, setSearchQuery] = useState('');
  // Control de navegación lateral en mobile.
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [activeDialog, setActiveDialog] = useState<'new-task' | null>(null);
  const [dashboardBoards, setDashboardBoards] = useState<DashboardBoardItem[]>(mockDashboardBoards);

  useEffect(() => {
    const localBoards = getLocalProjects().map(mapLocalProjectToBoardCard);
    setDashboardBoards([...localBoards, ...mockDashboardBoards]);
  }, []);

  const filteredBoards = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    if (!normalizedQuery) {
      return dashboardBoards;
    }

    return dashboardBoards.filter((board) => board.title.toLowerCase().includes(normalizedQuery));
  }, [dashboardBoards, searchQuery]);

  return (
    <>
      {/* Sidebar persistente para navegar entre áreas de la app. */}
      <Sidebar
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Estructura principal del dashboard. */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header común reutilizado en varias pantallas. */}
        <Header
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          onOpenNewTaskModal={() => setActiveDialog('new-task')}
        />

        {/* Contenido desplazable del dashboard. */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
          {/* Hero con saludo y contexto general del usuario. */}
          <DashboardHero
            title="Buenos días, Jane"
            subtitle="Este es el estado actual de tus proyectos y tareas para hoy."
          />

          {/* Layout en dos columnas: boards activos + widgets laterales. */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <section>
                {/* Sección principal con las tarjetas de boards. */}
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-[18px] font-semibold text-on-surface flex items-center gap-2">
                    <span className="material-symbols-outlined text-outline">
                      view_cozy
                    </span>
                    Tableros activos
                  </h3>
                  <Link href="/boards" className="text-primary font-medium text-[13px] hover:underline cursor-pointer">
                    Ver todos
                  </Link>
                </div>

                {filteredBoards.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filteredBoards.map((board) => (
                      <BoardCard key={`${board.title}-${board.href}`} {...board} />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-outline-variant bg-surface-container-lowest p-8 text-center">
                    <span className="material-symbols-outlined text-[28px] text-outline">search_off</span>
                    <h4 className="mt-3 text-base font-semibold text-on-surface">No hay tableros para esta búsqueda</h4>
                    <p className="mt-2 text-sm text-on-surface-variant">
                      Ajusta el texto de búsqueda o crea un nuevo proyecto para verlo aquí.
                    </p>
                    <Link
                      href="/projects/new"
                      className="mt-4 inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-container"
                    >
                      Crear proyecto
                    </Link>
                  </div>
                )}
              </section>
            </div>

            {/* Widgets auxiliares: métricas y actividad reciente. */}
            <div className="space-y-6">
              <VelocityWidget />
              <ActivityFeed />
            </div>
          </div>
        </div>
      </main>

      <InfoDialog
        isOpen={activeDialog === 'new-task'}
        title="Nueva tarea desde dashboard"
        description="Puedes crear tareas directamente desde cada board para mantener el flujo de trabajo por columnas."
        onClose={() => setActiveDialog(null)}
      />

    </>
  );
}
