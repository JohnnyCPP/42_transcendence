'use client';

import type { FormEvent } from 'react';
import { Button, TextInput, uiStyles } from '@/components/ui';
import type { AssignableOrganizationRole } from './org.types';

type AddOrganizationMemberFormProps = {
  username: string;
  email: string;
  role: AssignableOrganizationRole;
  /** Owner puede asignar admin; admin de org solo member. */
  canAssignAdmin: boolean;
  isBusy: boolean;
  onUsernameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onRoleChange: (role: AssignableOrganizationRole) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

/**
 * Formulario de alta de miembro (username obligatorio; email opcional si BE lo soporta).
 *
 * Contrato esperado:
 * `POST /organizations/:id/members`
 * Body: `{ username, role }` y, si hay correo, también `email`.
 */
export function AddOrganizationMemberForm({
  username,
  email,
  role,
  canAssignAdmin,
  isBusy,
  onUsernameChange,
  onEmailChange,
  onRoleChange,
  onSubmit,
}: AddOrganizationMemberFormProps) {
  return (
    <form
      onSubmit={onSubmit}
      className="space-y-4 rounded-xl border border-outline-variant bg-white p-4"
    >
      <div className="space-y-1">
        <h3 className="text-base font-semibold text-on-surface">
          Añadir miembro
        </h3>
        <p className="text-sm text-on-surface-variant">
          Busca un usuario existente por username. El correo es opcional si el
          backend lo admite.
        </p>
      </div>

      <TextInput
        id="add-member-username"
        name="username"
        label="Username"
        value={username}
        disabled={isBusy}
        onChange={onUsernameChange}
        placeholder="ana"
      />

      <TextInput
        id="add-member-email"
        name="email"
        type="email"
        label="Correo (opcional)"
        value={email}
        disabled={isBusy}
        onChange={onEmailChange}
        placeholder="ana@ejemplo.com"
      />

      <div className="space-y-1">
        <label htmlFor="add-member-role" className={uiStyles.formLabel}>
          Rol
        </label>
        <select
          id="add-member-role"
          className={uiStyles.input}
          value={role}
          disabled={isBusy}
          onChange={(event) =>
            onRoleChange(event.target.value as AssignableOrganizationRole)
          }
        >
          <option value="member">Miembro</option>
          {canAssignAdmin && <option value="admin">Admin</option>}
        </select>
      </div>

      <Button
        type="submit"
        variant="primary"
        disabled={isBusy || !username.trim()}
      >
        {isBusy ? 'Añadiendo…' : 'Añadir al workspace'}
      </Button>
    </form>
  );
}
