import { cx } from '@/components/ui';

/**
 * Pill de estado 2FA + nota de que el flag es solo local en la UI.
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
        {twoFactorEnabled ? '2FA activo (UI)' : '2FA inactivo (UI)'}
      </span>
      <p className="text-xs text-on-surface-variant">
        El estado es local hasta que `/me` exponga el flag real.
      </p>
    </div>
  );
}
