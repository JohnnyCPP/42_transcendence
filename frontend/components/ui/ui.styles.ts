/**
 * Constantes de clases Tailwind reutilizadas en la UI.
 *
 * Criterio: solo patrones que se repetían **más de dos veces** en el front.
 * Los componentes de `components/ui/` las consumen; las páginas también
 * pueden importarlas directamente cuando no hace falta un componente
 * (p. ej. `uiStyles.pageContent` en boards/dashboard/workspace).
 *
 * Cómo extender:
 * 1. Si una combinación de clases aparece ≥3 veces → añadirla aquí.
 * 2. Si además tiene markup/props reutilizables → crear o ampliar un componente
 *    (`Button`, `EmptyState`, etc.) que lea de este archivo.
 * 3. No meter utilidades genéricas (`flex gap-2`) ni el CSS del kanban
 *    (eso vive en `app/globals.css` como `.kanban-*`).
 *
 * @see FRONTEND_DOCS.md §17 (sistema de estilos UI)
 */
export const uiStyles = {
  /** Variantes del botón compartido (`Button` / `buttonClassName`). */
  button: {
    base: 'inline-flex items-center justify-center rounded-xl transition-colors',
    primary:
      'bg-primary px-4 font-semibold text-white hover:bg-primary-container',
    secondary:
      'border border-outline-variant px-4 font-medium text-on-surface hover:bg-surface-container',
    ghost:
      'px-4 font-medium text-on-surface-variant hover:bg-surface-container-high',
    danger: 'bg-error px-4 font-semibold text-white hover:bg-error/90',
    size: {
      sm: 'py-2 text-sm',
      md: 'py-2',
      lg: 'py-3',
    },
    fullWidth: 'w-full',
    disabled: 'disabled:cursor-not-allowed disabled:opacity-60',
  },
  /** Campo de texto estándar (login, signup, forgot-password, dialogs…). */
  input:
    'w-full rounded-xl border border-outline-variant bg-surface-bright px-4 py-3 text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20',
  /** Tamaños de Material Symbols Outlined (`Icon`). */
  icon: {
    base: 'material-symbols-outlined',
    sm: 'text-[14px]',
    md: 'text-[18px]',
    lg: 'text-[20px]',
    xl: 'text-[28px]',
  },
  /** Panel dashed de loading / error / vacío (`EmptyState`). */
  emptyState:
    'rounded-2xl border border-dashed border-outline-variant bg-surface-container-lowest p-8 text-center',
  /** Card blanca redondeada de auth / marketing (`AuthCard`). */
  authCard:
    'rounded-[28px] border border-outline-variant bg-white p-6 shadow-sm md:p-8',
  /** Fondo + centrado de páginas públicas (`AuthCard` shell, login). */
  authShell:
    'min-h-screen bg-surface-bright px-4 py-10 text-on-surface md:px-8 flex items-center justify-center',
  /** Pill con icono encima del título (signup, 404, projects/new…). */
  pageBadge:
    'inline-flex items-center gap-2 rounded-full border border-outline-variant bg-surface-container-low px-3 py-1 text-sm text-on-surface-variant',
  /** Eyebrow uppercase (Boards, Workspace, TaskFlow…). */
  pageKicker:
    'text-sm font-semibold uppercase tracking-[0.24em] text-primary',
  /** Título H1 de página de producto / auth. */
  pageTitle:
    'text-3xl font-bold tracking-tight text-on-surface md:text-4xl',
  /** Lead / subtítulo bajo el título. */
  pageLead: 'text-sm text-on-surface-variant md:text-base',
  /** Contenedor scrollable dentro de `AppShell`. */
  pageContent: 'flex-1 overflow-y-auto p-6 md:p-8 space-y-6',
  /** Mensaje informativo (éxito / hint) en formularios. */
  infoCallout:
    'rounded-xl border border-primary/20 bg-primary/10 p-3 text-sm text-primary',
  /** Fila de menú contextual (columnas / tarjetas kanban). */
  dropdownItem:
    'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-on-surface transition-colors hover:bg-surface-container',
  /** Misma fila en tono destructivo (eliminar). */
  dropdownItemDanger:
    'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-error transition-colors hover:bg-error/10',
  /** Label de formulario asociado a inputs. */
  formLabel: 'block text-sm font-medium text-on-surface',
} as const;

/**
 * Une classNames omitiendo valores falsy (`false`, `null`, `undefined`, `''`).
 *
 * Sustituto mínimo de `clsx` sin dependencia extra.
 * No hace merge inteligente de clases Tailwind en conflicto: si hace falta
 * sobrescribir, no combines clases rivales (p. ej. usa `dropdownItemDanger`
 * en lugar de `dropdownItem` + `text-error`).
 *
 * @example
 * cx(uiStyles.button.base, fullWidth && uiStyles.button.fullWidth, className)
 */
export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}
