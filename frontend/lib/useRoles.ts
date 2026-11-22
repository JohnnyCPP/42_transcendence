'use client';

import { useAuth } from '@/components/auth';
import { useOrg } from '@/components/org';

export type BoardAccess = {
  organizationRole: 'owner' | 'admin' | 'member';
  boardRole: 'admin' | 'member' | 'observer';
  canWrite: boolean;
  canArchive: boolean;
};

export function useRoles(boardAccess?: BoardAccess | null) {
  const { user } = useAuth();
  const { activeOrganization } = useOrg();
  const globalRole = user?.role;
  const organizationRole = boardAccess?.organizationRole ?? activeOrganization?.role;
  return {
    globalRole, organizationRole, boardRole: boardAccess?.boardRole,
    canReadUsers: globalRole === 'admin' || globalRole === 'moderator',
    canManageUsers: globalRole === 'admin',
    canCreateBoard: organizationRole === 'owner' || organizationRole === 'admin',
    canWriteBoard: boardAccess?.canWrite ?? false,
    canArchiveBoard: boardAccess?.canArchive ?? false,
  };
}
