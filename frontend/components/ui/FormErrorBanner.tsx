import Icon from './Icon';
import { cx } from './ui.styles';

type FormErrorBannerProps = {
  /** Si es false o null, no renderiza nada. */
  error?: string | null;
  className?: string;
};

/**
 * Banner de error de formulario (borde + icono + mensaje).
 *
 * Usar en login, settings, workspace, etc. en lugar de duplicar el markup.
 */
export default function FormErrorBanner({
  error,
  className,
}: FormErrorBannerProps) {
  if (!error) return null;

  return (
    <div
      role="alert"
      className={cx(
        'rounded-lg border border-error/20 bg-error/10 p-3 text-sm text-error',
        className
      )}
    >
      <div className="flex items-start gap-2">
        <Icon name="error" size="md" className="mt-0.5 shrink-0" />
        <span>{error}</span>
      </div>
    </div>
  );
}