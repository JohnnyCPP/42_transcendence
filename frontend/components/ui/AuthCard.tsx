import React from 'react';
import Icon from './Icon';
import { cx, uiStyles } from './ui.styles';

export type AuthCardProps = {
  /** Icono del badge superior (Material Symbols). */
  badgeIcon?: string;
  /** Texto del badge (ej. “Crear acceso”, “Error 404”). */
  badgeLabel?: string;
  /** Título H1 de la card. */
  title?: string;
  /** Lead bajo el título (acepta nodos React). */
  description?: React.ReactNode;
  /** Contenido principal (formulario, CTAs…). */
  children: React.ReactNode;
  /** Clases extra del `<main>` shell. */
  shellClassName?: string;
  /** Clases extra de la card. */
  className?: string;
  /** Ancho máximo Tailwind de la card. Default `max-w-xl`. */
  maxWidthClassName?: string;
  /** Contenido debajo de la card (p. ej. `LegalLinks`). */
  footer?: React.ReactNode;
  /**
   * Si `false`, no envuelve en el shell de página completa
   * (útil en 404, que ya tiene su propio contenedor).
   */
  withShell?: boolean;
  /** Centra el badge horizontalmente. */
  badgeCentered?: boolean;
};

/**
 * Shell + card de páginas auth / marketing.
 *
 * Une `uiStyles.authShell`, `authCard`, `pageBadge`, `pageTitle` y `pageLead`.
 * Usado en signup, forgot-password, projects/new y not-found.
 * El login usa `authShell` / `authCard` por separado (cabecera propia).
 *
 * @example
 * <AuthCard badgeIcon="lock_reset" badgeLabel="Recuperación" title="…" description="…">
 *   <form>…</form>
 * </AuthCard>
 */
export default function AuthCard({
  badgeIcon,
  badgeLabel,
  title,
  description,
  children,
  shellClassName,
  className,
  maxWidthClassName = 'max-w-xl',
  footer,
  withShell = true,
  badgeCentered = false,
}: AuthCardProps) {
  const card = (
    <section
      className={cx(
        'w-full space-y-5',
        maxWidthClassName,
        uiStyles.authCard,
        className
      )}
    >
      {(badgeIcon || badgeLabel) && (
        <div
          className={cx(
            uiStyles.pageBadge,
            badgeCentered && 'mx-auto'
          )}
        >
          {badgeIcon && (
            <Icon name={badgeIcon} size="md" className="text-primary" />
          )}
          {badgeLabel}
        </div>
      )}

      {(title || description) && (
        <div className="space-y-2">
          {title && <h1 className={uiStyles.pageTitle}>{title}</h1>}
          {description && (
            <p className={uiStyles.pageLead}>{description}</p>
          )}
        </div>
      )}

      {children}
    </section>
  );

  if (!withShell) {
    return (
      <>
        {card}
        {footer}
      </>
    );
  }

  return (
    <main className={cx(uiStyles.authShell, shellClassName)}>
      {card}
      {footer}
    </main>
  );
}
