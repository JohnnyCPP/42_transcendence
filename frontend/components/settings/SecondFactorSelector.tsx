import { cx, uiStyles } from '@/components/ui';
import type { SecondFactorMethod } from '@/lib/securityApi';

type SecondFactorSelectorProps = {
  value: SecondFactorMethod | '';
  disabled?: boolean;
  onChange: (method: SecondFactorMethod | '') => void;
};

/**
 * Select de método 2FA opcional (TOTP o recovery) para reautenticación.
 */
export function SecondFactorSelector({
  value,
  disabled = false,
  onChange,
}: SecondFactorSelectorProps) {
  return (
    <div className="space-y-1">
      <label htmlFor="reauth-method" className={uiStyles.formLabel}>
        Método 2FA (opcional)
      </label>
      <select
        id="reauth-method"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value as SecondFactorMethod | '')}
        className={cx(uiStyles.input, 'cursor-pointer')}
      >
        <option value="">Sin segundo factor</option>
        <option value="totp">Autenticador (TOTP)</option>
        <option value="recovery_code">Código de recuperación</option>
      </select>
    </div>
  );
}
