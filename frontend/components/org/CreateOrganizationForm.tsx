'use client';

import { FormEvent, useState } from 'react';
import { Button, FormErrorBanner, TextInput } from '@/components/ui';

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
      className="space-y-4 rounded-xl border border-surface-container-highest bg-surface-container-lowest p-5"
    >
      <div>
        <h3 className="text-base font-semibold text-on-surface">
          Nuevo workspace
        </h3>
        <p className="mt-1 text-sm text-on-surface-variant">
          Crea un espacio de trabajo para agrupar tableros y miembros.
        </p>
      </div>

      <TextInput
        id="org-name"
        name="name"
        label="Nombre"
        value={name}
        disabled={isSubmitting}
        onChange={setName}
        placeholder="Mi equipo"
      />

      <TextInput
        id="org-slug"
        name="slug"
        label="Slug (opcional)"
        value={slug}
        disabled={isSubmitting}
        onChange={setSlug}
        placeholder="mi-equipo"
      />

      <FormErrorBanner error={displayError} />

      <Button type="submit" variant="primary" disabled={isSubmitting}>
        {isSubmitting ? 'Creando…' : 'Crear organización'}
      </Button>
    </form>
  );
}
