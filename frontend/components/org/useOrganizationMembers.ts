'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { apiFetch } from '@/lib/apiClient';
import { useRoles } from '@/lib/useRoles';
import { useOrg } from './useOrg';
import type {
  AssignableOrganizationRole,
  OrganizationRole,
} from './org.types';

export type OrganizationMemberRow = {
  userId: string;
  role: OrganizationRole;
  user: { username: string; displayName: string | null } | null;
};

/**
 * Estado y handlers de miembros del workspace activo.
 *
 * - GET/PUT/DELETE `/organizations/:id/members[/:userId]`
 * - POST `/organizations/:id/members` body `{ username, role, email? }`
 *   (pendiente de BE; el FE ya llama este contrato)
 */
export function useOrganizationMembers() {
  const { activeOrganization } = useOrg();
  const { canManageOrganization, canManageOrgAdmins } = useRoles();

  const [members, setMembers] = useState<OrganizationMemberRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [memberToRemove, setMemberToRemove] =
    useState<OrganizationMemberRow | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  const [addUsername, setAddUsername] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [addRole, setAddRole] =
    useState<AssignableOrganizationRole>('member');

  const organizationId = activeOrganization?.id;
  const canAddMember = canManageOrganization;

  const loadMembers = useCallback(async () => {
    if (!organizationId) {
      setMembers([]);
      return;
    }

    try {
      const result = await apiFetch<{ members: OrganizationMemberRow[] }>(
        `/organizations/${organizationId}/members`
      );
      setMembers(result.members);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'No se pudieron cargar los miembros'
      );
    }
  }, [organizationId]);

  useEffect(() => {
    void loadMembers();
  }, [loadMembers]);

  useEffect(() => {
    if (!canManageOrgAdmins && addRole === 'admin') {
      setAddRole('member');
    }
  }, [canManageOrgAdmins, addRole]);

  const canChangeRole = useCallback(
    (member: OrganizationMemberRow) =>
      canManageOrgAdmins && member.role !== 'owner',
    [canManageOrgAdmins]
  );

  const canRemoveMember = useCallback(
    (member: OrganizationMemberRow) => {
      if (member.role === 'owner') return false;
      if (canManageOrgAdmins) return true;
      return canManageOrganization && member.role === 'member';
    },
    [canManageOrganization, canManageOrgAdmins]
  );

  const handleToggleRole = useCallback(
    async (member: OrganizationMemberRow) => {
      if (!organizationId || !canChangeRole(member) || isBusy) return;

      const nextRole = member.role === 'admin' ? 'member' : 'admin';
      setIsBusy(true);
      setError(null);
      try {
        await apiFetch(
          `/organizations/${organizationId}/members/${member.userId}`,
          {
            method: 'PUT',
            body: JSON.stringify({ role: nextRole }),
          }
        );
        await loadMembers();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'No se pudo cambiar el rol'
        );
      } finally {
        setIsBusy(false);
      }
    },
    [organizationId, canChangeRole, isBusy, loadMembers]
  );

  const handleConfirmRemove = useCallback(async () => {
    if (!organizationId || !memberToRemove || isBusy) return;

    setIsBusy(true);
    setError(null);
    try {
      await apiFetch(
        `/organizations/${organizationId}/members/${memberToRemove.userId}`,
        { method: 'DELETE' }
      );
      setMemberToRemove(null);
      await loadMembers();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'No se pudo retirar al miembro'
      );
    } finally {
      setIsBusy(false);
    }
  }, [organizationId, memberToRemove, isBusy, loadMembers]);

  const handleAddMember = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!organizationId || !canAddMember || isBusy) return;

      const username = addUsername.trim();
      const email = addEmail.trim();
      if (!username) {
        setError('Introduce un username para añadir al miembro.');
        return;
      }

      const role: AssignableOrganizationRole =
        canManageOrgAdmins && addRole === 'admin' ? 'admin' : 'member';

      setIsBusy(true);
      setError(null);
      try {
        await apiFetch(`/organizations/${organizationId}/members`, {
          method: 'POST',
          body: JSON.stringify({
            username,
            role,
            ...(email ? { email } : {}),
          }),
        });
        setAddUsername('');
        setAddEmail('');
        setAddRole('member');
        await loadMembers();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'No se pudo añadir al miembro'
        );
      } finally {
        setIsBusy(false);
      }
    },
    [
      organizationId,
      canAddMember,
      isBusy,
      addUsername,
      addEmail,
      addRole,
      canManageOrgAdmins,
      loadMembers,
    ]
  );

  const requestRemove = useCallback((member: OrganizationMemberRow) => {
    setMemberToRemove(member);
  }, []);

  const closeRemove = useCallback(() => {
    if (!isBusy) setMemberToRemove(null);
  }, [isBusy]);

  const removeLabel =
    memberToRemove?.user?.displayName ||
    memberToRemove?.user?.username ||
    'este miembro';

  return {
    activeOrganization,
    members,
    error,
    isBusy,
    memberToRemove,
    removeLabel,
    canAddMember,
    canManageOrgAdmins,
    canChangeRole,
    canRemoveMember,
    handleToggleRole,
    handleConfirmRemove,
    requestRemove,
    closeRemove,
    addUsername,
    setAddUsername,
    addEmail,
    setAddEmail,
    addRole,
    setAddRole,
    handleAddMember,
  };
}
