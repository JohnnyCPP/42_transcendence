import { cx } from '@/components/ui';

/**
 * Pill de estado 2FA (enabled / disabled) para la sección de settings.
 */
export function TwoFactorStatusBadge({
  twoFactorEnabled,
}: {
  twoFactorEnabled: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span
        className={cx(
          'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold',
          twoFactorEnabled
            ? 'bg-primary/10 text-primary'
            : 'bg-surface-container text-on-surface-variant'
        )}
      >
        {twoFactorEnabled ? '2FA activo' : '2FA inactivo'}
      </span>
    </div>
  );
}
