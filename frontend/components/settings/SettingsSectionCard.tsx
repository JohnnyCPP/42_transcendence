import type { ReactNode } from 'react';

type SettingsSectionCardProps = {
  step: string;
  title: string;
  description: string;
  children: ReactNode;
  className?: string;
};

/**
 * Card de sección en `/settings` (reauth, password, 2FA).
 */
export function SettingsSectionCard({
  step,
  title,
  description,
  children,
  className,
}: SettingsSectionCardProps) {
  return (
    <section
      className={`rounded-2xl border border-outline-variant bg-white p-5 shadow-sm md:p-6 ${className ?? ''}`}
    >
      <div className="mb-5 flex items-start gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
          {step}
        </span>
        <div className="min-w-0 space-y-1">
          <h2 className="text-lg font-semibold text-on-surface">{title}</h2>
          <p className="text-sm text-on-surface-variant">{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}
