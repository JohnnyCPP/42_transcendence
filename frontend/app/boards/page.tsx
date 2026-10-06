'use client';

import { useMemo, useState } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import BoardCard from '@/components/dashboard/BoardCard';
import { mockDashboardBoards } from '@/data/mockDashboardBoards';

export default function BoardsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const filteredBoards = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    if (!normalizedQuery) {
      return mockDashboardBoards;
    }

    return mockDashboardBoards.filter((board) =>
      board.title.toLowerCase().includes(normalizedQuery)
    );
  }, [searchQuery]);

  return (
    <>
      <Sidebar
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <Header
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        />

        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
          <section className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">
              Boards
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-on-surface md:text-4xl">
              Todos los boards disponibles
            </h1>
            <p className="max-w-2xl text-sm text-on-surface-variant md:text-base">
              Esta vista centraliza los boards demo del frontend. El board de Website Redesign
              ya tiene una experiencia más completa; el resto se mantiene como placeholder navegable.
            </p>
          </section>

          {filteredBoards.length > 0 ? (
            <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredBoards.map((board) => (
                <BoardCard key={board.title} {...board} />
              ))}
            </section>
          ) : (
            <section className="rounded-2xl border border-dashed border-outline-variant bg-surface-container-lowest p-8 text-center">
              <span className="material-symbols-outlined text-[28px] text-outline">search_off</span>
              <h2 className="mt-3 text-lg font-semibold text-on-surface">No hay boards que coincidan</h2>
              <p className="mt-2 text-sm text-on-surface-variant">
                Ajusta la búsqueda del header para encontrar otro board.
              </p>
            </section>
          )}
        </div>
      </main>
    </>
  );
}