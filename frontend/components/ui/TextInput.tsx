import { cx, uiStyles } from './ui.styles';

/** Shape de ejemplo para formularios de auth (signup). */
export type FormValues = {
  username: string;
  email: string;
  password: string;
};

export type TextInputProps = {
  id: string;
  name: string;
  label?: string;
  type?: 'text' | 'email' | 'password';
  value: string;
  placeholder?: string;
  disabled?: boolean;
  /** Si hay error, borde/ring en tono error + mensaje debajo. */
  error?: string | null;
  onChange: (value: string) => void;
  /** Clases extra sobre `uiStyles.input`. */
  className?: string;
  autoFocus?: boolean;
};

/**
 * Input de texto controlado con label y mensaje de error opcionales.
 *
 * Usa `uiStyles.input` / `formLabel`. Exportado desde el barrel `components/ui`.
 * También lo consume `TextInputDialog`.
 *
 * @example
 * <TextInput
 *   id="email"
 *   name="email"
 *   type="email"
 *   label="Correo"
 *   value={email}
 *   onChange={setEmail}
 * />
 */
export default function TextInput({
  id,
  name,
  label,
  type = 'text',
  value,
  placeholder,
  disabled,
  error,
  onChange,
  className,
  autoFocus,
}: TextInputProps) {
  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={id} className={uiStyles.formLabel}>
          {label}
        </label>
      )}
      <input
        id={id}
        name={name}
        type={type}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value)}
        className={cx(
          uiStyles.input,
          error && 'border-error focus:ring-error/30',
          className
        )}
      />
      {error && <p className="text-sm font-medium text-error">{error}</p>}
    </div>
  );
}
