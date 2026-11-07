import type { GlobalRole } from '../authorization/roles.js';

export type UserRole = GlobalRole;
export type UserStatus = 'active' | 'disabled' | 'deleted';

export type UserFilters = { role?: UserRole; status?: UserStatus };
export type UserChanges = { displayName?: string | null; email?: string | null; role?: UserRole; status?: UserStatus };

export type User = {
  id: string;
  username: string;
  email: string | null;
  displayName: string | null;
  role: UserRole;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateUserInput = {
  username: string;
  email?: string | null;
  displayName?: string | null;
};

