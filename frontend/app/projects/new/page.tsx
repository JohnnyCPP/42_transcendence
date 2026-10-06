'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function NewProjectPage() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState('private');
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!name.trim()) {
      setMessage('Añade al menos un nombre para preparar el proyecto.');
      return;
    }

    setMessage('La base del flujo ya está lista. El siguiente paso será conectar este formulario con la creación real del proyecto.');
  };

  return (
    <main className="min-h-screen bg-surface-bright px-4 py-10 text-on-surface md:px-8 flex items-center justify-center">
      <section className="w-full max-w-2xl rounded-[28px] border border-outline-variant bg-white p-6 shadow-sm md:p-8 space-y-5">
        <div className="inline-flex items-center gap-2 rounded-full border border-outline-variant bg-surface-container-low px-3 py-1 text-sm text-on-surface-variant">
          <span className="material-symbols-outlined text-[18px] text-primary">library_add</span>
          Nuevo proyecto
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Organiza un nuevo espacio de trabajo</h1>
          <p className="text-sm text-on-surface-variant md:text-base">
            Prepara el contexto inicial del proyecto para que después resulte más fácil añadir miembros, boards y flujos de trabajo.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Nombre del proyecto"
            className="w-full rounded-xl border border-outline-variant bg-surface-bright px-4 py-3 text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Describe brevemente el objetivo del proyecto"
            rows={4}
            className="w-full rounded-xl border border-outline-variant bg-surface-bright px-4 py-3 text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <select
            value={visibility}
            onChange={(event) => setVisibility(event.target.value)}
            className="w-full rounded-xl border border-outline-variant bg-surface-bright px-4 py-3 text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="private">Privado</option>
            <option value="team">Equipo</option>
          </select>

          {message && (
            <div className="rounded-xl border border-primary/20 bg-primary/10 p-3 text-sm text-primary">
              {message}
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-3 font-semibold text-white transition-colors hover:bg-primary-container"
            >
              Continuar
            </button>
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-xl border border-outline-variant px-4 py-3 font-medium text-on-surface transition-colors hover:bg-surface-container"
            >
              Volver al dashboard
            </Link>
          </div>
        </form>
      </section>
    </main>
  );
}