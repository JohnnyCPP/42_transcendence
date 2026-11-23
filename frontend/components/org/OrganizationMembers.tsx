'use client';

import { Button, ConfirmDialog, FormErrorBanner } from '@/components/ui';
import { AddOrganizationMemberForm } from './AddOrganizationMemberForm';
import { useOrganizationMembers } from './useOrganizationMembers';
import { ORGANIZATION_ROLE_LABELS } from './org.types';

/**
 * Lista de miembros del workspace activo + acciones según rol + alta.
 *
 * - GET `/organizations/:id/members`
 * - POST `/organizations/:id/members` `{ username, role, email? }` (BE pendiente)
 * - PUT `/organizations/:id/members/:userId` (cambiar rol; solo owner)
 * - DELETE `/organizations/:id/members/:userId` (retirar)
 *
 * El propietario no se puede retirar ni cambiar de rol (UI + BE).
 */
export function OrganizationMembers() {
  const form = useOrganizationMembers();

  if (!form.activeOrganization) return null;

  return (
    <>
      <section className="space-y-4 rounded-xl border border-outline-variant bg-surface-container-lowest p-5">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-on-surface">
            Miembros de {form.activeOrganization.name}
          </h2>
          <p className="text-sm text-on-surface-variant">
            Roles y acciones disponibles según tu permiso en el workspace.
          </p>
        </div>

        <FormErrorBanner error={form.error} />

        {form.canAddMember && (
          <AddOrganizationMemberForm
            username={form.addUsername}
            email={form.addEmail}
            role={form.addRole}
            canAssignAdmin={form.canManageOrgAdmins}
            isBusy={form.isBusy}
            onUsernameChange={form.setAddUsername}
            onEmailChange={form.setAddEmail}
            onRoleChange={form.setAddRole}
            onSubmit={form.handleAddMember}
          />
        )}

        <ul className="divide-y divide-outline-variant">
          {form.members.map((member) => {
            const displayName =
              member.user?.displayName ||
              member.user?.username ||
              'Usuario';
            const isOwnerRow = member.role === 'owner';

            return (
              <li
                key={member.userId}
                className="flex flex-wrap items-center gap-3 py-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-on-surface">
                    {displayName}
                  </p>
                  {member.user?.username && (
                    <p className="truncate text-xs text-on-surface-variant">
                      @{member.user.username}
                    </p>
                  )}
                </div>

                <span className="text-sm text-on-surface-variant">
                  {ORGANIZATION_ROLE_LABELS[member.role]}
                </span>

                <div className="flex flex-wrap items-center gap-2">
                  {form.canChangeRole(member) && (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      disabled={form.isBusy}
                      onClick={() => {
                        void form.handleToggleRole(member);
                      }}
                    >
                      {member.role === 'admin'
                        ? 'Bajar a miembro'
                        : 'Subir a admin'}
                    </Button>
                  )}

                  {form.canRemoveMember(member) && (
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      disabled={form.isBusy}
                      onClick={() => form.requestRemove(member)}
                    >
                      Retirar
                    </Button>
                  )}

                  {isOwnerRow && (
                    <p className="text-xs text-on-surface-variant">
                      El propietario no se puede retirar ni cambiar de rol.
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>

        {form.members.length === 0 && !form.error && (
          <p className="text-sm text-on-surface-variant">
            No hay miembros para mostrar.
          </p>
        )}
      </section>

      <ConfirmDialog
        isOpen={Boolean(form.memberToRemove)}
        title="Retirar miembro"
        description={`Vas a retirar a «${form.removeLabel}» de este workspace. Podrás volver a añadirlo más adelante.`}
        confirmLabel="Retirar"
        tone="danger"
        onConfirm={() => {
          void form.handleConfirmRemove();
        }}
        onClose={form.closeRemove}
      />
    </>
  );
}
