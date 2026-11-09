import { Icon, uiStyles } from '@/components/ui';

export function LoginHeader() {
  return (
    <section className="text-center space-y-4">
      <div className="inline-flex items-center gap-3 rounded-full border border-outline-variant bg-white px-4 py-2 text-sm text-on-surface-variant shadow-sm">
        <Icon name="lock" size="md" className="text-primary" />
        Acceso seguro al espacio de trabajo
      </div>
      <div>
        <p className={uiStyles.pageKicker}>TaskFlow</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">
          Inicia sesión para continuar.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base text-on-surface-variant md:text-lg">
          Accede a tu espacio de trabajo y revisa el estado de tus boards, tareas y actividad reciente.
        </p>
      </div>
    </section>
  );
}
