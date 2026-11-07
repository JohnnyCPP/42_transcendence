import { conflict } from '../../shared/errors/httpErrors.js';
import { randomToken } from '../../shared/crypto/randomToken.js';
import type { CreateUserInput, User, UserFilters, UserChanges } from './users.types.js';
import { paginateArray, type Page, type PaginationInput } from '../../shared/pagination.js';
import { GLOBAL_ROLE } from '../authorization/roles.js';

export interface UsersRepository 
{
  create(input: CreateUserInput): Promise<User>;
  findById(id: string): Promise<User | null>;
  findByUsername(username: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  list(pagination: PaginationInput, filters: UserFilters): Promise<Page<User>>;
  updateManaged(id: string, changes: UserChanges): Promise<User | null>;
}

export class InMemoryUsersRepository implements UsersRepository 
{
  private readonly users = new Map<string, User>();

  async create(input: CreateUserInput): Promise<User>
 {
    const normalizedUsername = input.username.trim().toLowerCase();
    for (const user of this.users.values()) 
    {
      if (user.username === normalizedUsername) throw conflict('Username already exists');
      if (input.email && user.email === input.email.toLowerCase()) throw conflict('Email already exists');
    }

    const now = new Date();
    const user: User = {
      id: randomToken(16),
      username: normalizedUsername,
      email: input.email?.toLowerCase() ?? null,
      displayName: input.displayName ?? null,
      role: GLOBAL_ROLE.USER,
      status: 'active',
      createdAt: now,
      updatedAt: now
    };
    this.users.set(user.id, user);
    return user;
  }

  async findById(id: string): Promise<User | null> 
  {
    return this.users.get(id) ?? null;
  }

  async findByUsername(username: string): Promise<User | null> 
  {
    const normalizedUsername = username.trim().toLowerCase();
    return [...this.users.values()].find((user) => user.username === normalizedUsername) ?? null;
  }

  async findByEmail(email: string): Promise<User | null> 
  {
    const normalizedEmail = email.trim().toLowerCase();
    return [...this.users.values()].find((user) => user.email === normalizedEmail) ?? null;
  }

  async list(pagination: PaginationInput, filters: UserFilters): Promise<Page<User>>
  {
    const users = [...this.users.values()]
      .filter((user) => (filters.role === undefined || user.role === filters.role) &&
        (filters.status === undefined ? user.status !== 'deleted' : user.status === filters.status))
      .sort((left, right) =>
        right.createdAt.getTime() - left.createdAt.getTime() || right.id.localeCompare(left.id)
      );
    return paginateArray(users, pagination);
  }

  async updateManaged(id: string, changes: UserChanges): Promise<User | null>
  {
    const user = this.users.get(id);
    if (!user || user.status === 'deleted') return null;
    if (user.role === GLOBAL_ROLE.ADMIN && (changes.role && changes.role !== GLOBAL_ROLE.ADMIN || changes.status && changes.status !== 'active')) {
      const activeAdmins = [...this.users.values()].filter((entry) => entry.role === GLOBAL_ROLE.ADMIN && entry.status === 'active');
      if (user.status === 'active' && activeAdmins.length <= 1)
        throw conflict('Cannot remove the last active admin', 'LAST_ADMIN');
    }
    if (changes.email !== undefined && changes.email !== null &&
      [...this.users.values()].some((entry) => entry.id !== id && entry.email === changes.email?.toLowerCase()))
      throw conflict('Email already exists');
    Object.assign(user, changes, { email: changes.email === undefined ? user.email : changes.email?.toLowerCase() ?? null, updatedAt: new Date() });
    return user;
  }
}
