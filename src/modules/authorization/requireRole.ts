import type { FastifyReply, FastifyRequest } from 'fastify';
import { forbidden, unauthorized } from '../../shared/errors/httpErrors.js';
import type { UserRole } from '../users/users.types.js';
import './currentUser.js';

export function requireRole(...roles: UserRole[])
{
  return async (request: FastifyRequest, _reply: FastifyReply) => {
    if (!request.currentUser) throw unauthorized();
    if (!roles.includes(request.currentUser.role)) throw forbidden('Insufficient global role', 'INSUFFICIENT_GLOBAL_ROLE');
  };
}

