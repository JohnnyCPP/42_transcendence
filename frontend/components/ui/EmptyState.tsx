import React from 'react';
import Icon from './Icon';
import { cx, uiStyles } from './ui.styles';

export type EmptyStateProps = {
  /** Nombre del icono Material Symbols (obligatorio). */
  icon: string;
  /** Título opcional (loading suele omitirlo). */
  title?: string;
  /** Texto de apoyo / error / hint de carga. */
  description?: string;
  /** Pulso en el icono (loading). */
  pulse?: boolean;
  /** Slot para CTAs (p. ej. Link “Crear proyecto”). */
  children?: React.ReactNode;
  /** Clases extra del panel (p. ej. `rounded-xl`, anchos fijos en kanban). */
  className?: string;
  /** Override del estilo del título (dashboard usa `text-base`). */
  titleClassName?: string;
};

/**
 * Panel dashed reutilizado para loading, error y listas vacías.
 *
 * Usado en boards, dashboard, workspace y búsqueda vacía del kanban.
 * Estilos base: `uiStyles.emptyState`.
 *
 * @example
 * <EmptyState icon="view_kanban" title="Aún no hay tableros" description="Crea el primero.">
 *   <Link href="/projects/new" className={buttonClassName({ size: 'sm' })}>Crear</Link>
 * </EmptyState>
 */
export default function EmptyState({
  icon,
  title,
  description,
  pulse = false,
  children,
  className,
  titleClassName = 'mt-3 text-lg font-semibold text-on-surface',
}: EmptyStateProps) {
  return (
    <section className={cx(uiStyles.emptyState, className)}>
      <Icon name={icon} size="xl" pulse={pulse} className="text-outline" />
      {title && <h2 className={titleClassName}>{title}</h2>}
      {description && (
        <p
          className={
            title
              ? 'mt-2 text-sm text-on-surface-variant'
              : 'mt-3 text-sm text-on-surface-variant'
          }
        >
          {description}
        </p>
      )}
      {children}
    </section>
  );
}
