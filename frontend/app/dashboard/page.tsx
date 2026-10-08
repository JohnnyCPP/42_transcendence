'use client';

import Link from 'next/link';
import { useState } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import DashboardHero from '@/components/dashboard/DashboardHero';
import BoardCard from '@/components/dashboard/BoardCard';
import VelocityWidget from '@/components/dashboard/VelocityWidget';
import ActivityFeed from '@/components/dashboard/ActivityFeed';
import { InfoDialog } from '@/components/ui';
import { mockDashboardBoards } from '@/data/mockDashboardBoards';

/**
 * Dashboard de resumen.
 *
 * Esta pantalla agrupa métricas, tarjetas de boards y actividad reciente.
 * Usa contenido mock para mostrar la dirección visual del producto mientras
 * se termina la integración real con datos de backend.
 */
export default function DashboardPage() {
  // Filtro compartido por el header; de momento actúa como UI de ejemplo.
  const [searchQuery, setSearchQuery] = useState('');
  // Control de navegación lateral en mobile.
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [activeDialog, setActiveDialog] = useState<'new-task' | null>(null);

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

                {/* Mock data temporal hasta conectar con el backend. */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {mockDashboardBoards.map((board) => (
                    <BoardCard key={board.title} {...board} />
                  ))}
                </div>
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
        description="La creación de tareas desde el dashboard todavía no está conectada; por ahora se hace desde cada board."
        onClose={() => setActiveDialog(null)}
      />

    </>
  );
}
