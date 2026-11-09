import React from 'react';
import { cx, uiStyles } from './ui.styles';

/** Variante visual del botón. */
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

/** Altura / padding vertical. */
export type ButtonSize = 'sm' | 'md' | 'lg';

/**
 * Props del botón compartido.
 *
 * Extiende los atributos nativos de `<button>` (onClick, type, disabled…).
 */
export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  /** Estilo: primary (CTA), secondary (outline), ghost (cancel), danger. */
  variant?: ButtonVariant;
  /** `sm` (py-2 text-sm), `md` (py-2), `lg` (py-3). Default `md`. */
  size?: ButtonSize;
  /** Añade `w-full` (formularios de login). */
  fullWidth?: boolean;
};

/**
 * Botón de la design system.
 *
 * Las clases viven en `uiStyles.button`. Usar este componente en dialogs,
 * formularios y CTAs; para `<Link>` u otros elementos usar `buttonClassName`.
 *
 * @example
 * <Button variant="primary" size="lg" onClick={save}>Guardar</Button>
 * <Button variant="ghost" onClick={onClose}>Cancelar</Button>
 */
export default function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className,
  type = 'button',
  disabled,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={cx(
        uiStyles.button.base,
        uiStyles.button[variant],
        uiStyles.button.size[size],
        fullWidth && uiStyles.button.fullWidth,
        uiStyles.button.disabled,
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

/**
 * Misma paleta que `Button`, pero como string de clases.
 *
 * Sirve cuando el elemento no puede ser `<button>` (p. ej. `next/link`).
 *
 * @example
 * <Link href="/login" className={buttonClassName({ variant: 'secondary', size: 'lg' })}>
 *   Volver
 * </Link>
 */
export function buttonClassName({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  className?: string;
} = {}): string {
  return cx(
    uiStyles.button.base,
    uiStyles.button[variant],
    uiStyles.button.size[size],
    fullWidth && uiStyles.button.fullWidth,
    className
  );
}
