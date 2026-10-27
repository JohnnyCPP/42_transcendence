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
  error?: string | null;
  onChange: (value: string) => void;
};


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
}: TextInputProps) {
  return (
    <div className="space-y-1">
      {label && <label htmlFor={id}>{label}</label>}
      <input
        id={id}
        name={name}
        type={type}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-outline-variant bg-surface-bright px-4 py-3 text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
      />
      {error && <p>{error}</p>}
    </div>
  );
}
