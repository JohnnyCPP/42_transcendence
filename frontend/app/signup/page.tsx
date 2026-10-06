import Link from 'next/link';

export default function SignupPage() {
  return (
    <main className="min-h-screen bg-surface-bright px-4 py-10 text-on-surface md:px-8 flex items-center justify-center">
      <section className="w-full max-w-xl rounded-[28px] border border-outline-variant bg-white p-6 shadow-sm md:p-8 text-center space-y-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-outline-variant bg-surface-container-low px-3 py-1 text-sm text-on-surface-variant">
          <span className="material-symbols-outlined text-[18px] text-primary">construction</span>
          Pantalla en preparación
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Signup aún no disponible</h1>
          <p className="text-sm text-on-surface-variant md:text-base">
            Esta ruta existe para evitar enlaces rotos mientras terminamos el flujo de registro.
          </p>
        </div>

        <Link
          href="/login"
          className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-3 font-semibold text-white transition-colors hover:bg-primary-container"
        >
          Volver al login
        </Link>
      </section>
    </main>
  );
}