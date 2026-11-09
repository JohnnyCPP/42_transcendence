'use client';

import { FormEvent, useState } from 'react';

type CreateOrganizationFormProps = {
  isSubmitting?: boolean;
  error?: string | null;
  onSubmit: (name: string, slug?: string) => Promise<void>;
};

/**
 * Formulario mínimo para crear un workspace (org en el API).
 *
 * La lógica de API queda fuera: el padre pasa `onSubmit`
 * (normalmente `createOrganization` de `useOrg`).
 */
export function CreateOrganizationForm({
  isSubmitting = false,
  error = null,
  onSubmit,
}: CreateOrganizationFormProps) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLocalError(null);

    const trimmedName = name.trim();
    if (trimmedName.length < 2) {
      setLocalError('El nombre debe tener al menos 2 caracteres.');
      return;
    }

    const trimmedSlug = slug.trim();
    await onSubmit(trimmedName, trimmedSlug || undefined);
    setName('');
    setSlug('');
  };

  const displayError = localError ?? error;

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-surface-container-highest bg-surface-container-lowest p-5 space-y-4"
    >
      <div>
        <h3 className="text-[16px] font-semibold text-on-surface">
          Nuevo workspace
        </h3>
        <p className="mt-1 text-[13px] text-on-surface-variant">
          Crea un espacio de trabajo para agrupar tableros y miembros.
        </p>
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="org-name"
          className="block text-[12px] font-medium text-on-surface-variant"
        >
          Nombre
        </label>
        <input
          id="org-name"
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Mi equipo"
          disabled={isSubmitting}
          className="w-full rounded-lg border border-surface-container-highest bg-white px-3 py-2.5 text-sm text-on-surface outline-none transition-colors focus:border-primary disabled:opacity-60"
        />
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="org-slug"
          className="block text-[12px] font-medium text-on-surface-variant"
        >
          Slug (opcional)
        </label>
        <input
          id="org-slug"
          type="text"
          value={slug}
          onChange={(event) => setSlug(event.target.value)}
          placeholder="mi-equipo"
          disabled={isSubmitting}
          className="w-full rounded-lg border border-surface-container-highest bg-white px-3 py-2.5 text-sm text-on-surface outline-none transition-colors focus:border-primary disabled:opacity-60"
        />
      </div>

      {displayError && (
        <p className="text-[13px] text-error" role="alert">
          {displayError}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-primary-container disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? 'Creando…' : 'Crear organización'}
      </button>
    </form>
  );
}
