import Link from 'next/link';

export default function NewProjectPage() {
  return (
    <main className="min-h-screen bg-surface-bright px-4 py-10 text-on-surface md:px-8 flex items-center justify-center">
      <section className="w-full max-w-2xl rounded-[28px] border border-outline-variant bg-white p-6 shadow-sm md:p-8 space-y-5">
        <div className="inline-flex items-center gap-2 rounded-full border border-outline-variant bg-surface-container-low px-3 py-1 text-sm text-on-surface-variant">
          <span className="material-symbols-outlined text-[18px] text-primary">library_add</span>
          Project placeholder
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Crear proyecto</h1>
          <p className="text-sm text-on-surface-variant md:text-base">
            Esta ruta deja preparada la navegación para el flujo de creación de proyectos.
            De momento funciona como placeholder y evita depender de un diálogo temporal.
          </p>
        </div>

        <div className="rounded-2xl border border-outline-variant bg-surface-container-low px-5 py-4 text-sm text-on-surface-variant">
          Aquí podrás añadir más adelante el formulario de nombre, descripción, miembros y permisos
          iniciales del proyecto sin tener que rehacer la navegación principal.
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-xl border border-outline-variant px-4 py-3 font-medium text-on-surface transition-colors hover:bg-surface-container"
          >
            Volver al dashboard
          </Link>
          <Link
            href="/boards"
            className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-3 font-semibold text-white transition-colors hover:bg-primary-container"
          >
            Ver boards disponibles
          </Link>
        </div>
      </section>
    </main>
  );
}