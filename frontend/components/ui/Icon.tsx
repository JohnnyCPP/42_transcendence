import React from 'react';
import { cx, uiStyles } from './ui.styles';

/** Tamaños mapeados a `uiStyles.icon` (14 / 18 / 20 / 28 px). */
export type IconSize = 'sm' | 'md' | 'lg' | 'xl';

export type IconProps = {
  /**
   * Nombre del glifo Material Symbols Outlined
   * (ej. `"close"`, `"edit"`, `"progress_activity"`).
   */
  name: string;
  /** Default `md` (18px). */
  size?: IconSize;
  /** Añade `animate-pulse` (estados de carga). */
  pulse?: boolean;
  /** Clases extra (color: `text-primary`, `text-outline`…). */
  className?: string;
  /** Activa FILL=1 (p. ej. estrella favorita del board). */
  filled?: boolean;
};

/**
 * Icono Material Symbols Outlined.
 *
 * La fuente se carga en `app/layout.tsx`. El span lleva `aria-hidden`:
 * el significado accesible debe ir en el control padre (`aria-label`, texto visible…).
 *
 * @example
 * <Icon name="add" size="lg" />
 * <Icon name="progress_activity" size="xl" pulse className="text-outline" />
 */
export default function Icon({
  name,
  size = 'md',
  pulse = false,
  className,
  filled = false,
}: IconProps) {
  return (
    <span
      className={cx(
        uiStyles.icon.base,
        uiStyles.icon[size],
        pulse && 'animate-pulse',
        className
      )}
      style={filled ? { fontVariationSettings: "'FILL' 1" } : undefined}
      aria-hidden
    >
      {name}
    </span>
  );
}
