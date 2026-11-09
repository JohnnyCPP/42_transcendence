import type { CreateUserInput, User, UserChanges, UserFilters } from './users.types.js';
import { badRequest, forbidden, notFound } from '../../shared/errors/httpErrors.js';
import { GLOBAL_ROLES } from '../authorization/roles.js';
import type { UsersRepository } from './users.repository.js';
import { defaultPagination, type Page, type PaginationInput } from '../../shared/pagination.js';

export class UsersService 
{
  constructor(private readonly usersRepository: UsersRepository) {}

  createUser(input: CreateUserInput): Promise<User> 
  {
    return this.usersRepository.create(input);
  }

  findById(id: string): Promise<User | null> 
  {
    return this.usersRepository.findById(id);
  }

  findByUsername(username: string): Promise<User | null> 
  {
    return this.usersRepository.findByUsername(username);
  }

  findByEmail(email: string): Promise<User | null> 
  {
    return this.usersRepository.findByEmail(email);
  }

  listUsers(pagination: PaginationInput = defaultPagination, filters: UserFilters = {}): Promise<Page<User>>
  {
    return this.usersRepository.list(pagination, filters);
  }

  async getManagedUser(id: string): Promise<User> {
    const user = await this.usersRepository.findById(id);
    if (!user || user.status === 'deleted') throw notFound('User not found', 'USER_NOT_FOUND');
    return user;
  }

  async updateManagedUser(actorId: string, id: string, changes: UserChanges): Promise<User> {
    if (changes.role !== undefined && !GLOBAL_ROLES.includes(changes.role))
      throw badRequest('Invalid global role', 'INVALID_ROLE');
    if (actorId === id && changes.role !== undefined)
      throw forbidden('Cannot change your own role', 'SELF_ROLE_CHANGE');
    if (actorId === id && changes.status !== undefined && changes.status !== 'active')
      throw forbidden('Cannot disable your own account', 'SELF_STATUS_CHANGE');
    await this.getManagedUser(id);
    const updated = await this.usersRepository.updateManaged(id, changes);
    if (!updated) throw notFound('User not found', 'USER_NOT_FOUND');
    return updated;
  }

  async deleteManagedUser(actorId: string, id: string): Promise<User> {
    if (actorId === id) throw forbidden('Cannot delete your own account', 'SELF_DELETE');
    return this.updateManagedUser(actorId, id, { status: 'deleted' });
  }
}
