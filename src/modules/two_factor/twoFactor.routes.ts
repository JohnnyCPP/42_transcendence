import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { securityConfig } from '../../config/security.js';
import { forbidden } from '../../shared/errors/httpErrors.js';
import { requireAuth } from '../authorization/requireAuth.js';
import type { SessionsService } from '../sessions/sessions.service.js';
import type { TwoFactorService } from './twoFactor.service.js';

const confirmTotpSchema = z.object({ code: z.string().regex(/^\d{6}$/) });

function assertRecentReauthentication(reauthenticatedAt: Date | null): void 
{
  if (!reauthenticatedAt || Date.now() - reauthenticatedAt.getTime() > securityConfig.sensitiveActionTtlMs) 
  {
    throw forbidden('Recent reauthentication required', 'REAUTHENTICATION_REQUIRED');
  }
}

export async function registerTwoFactorRoutes(
  app: FastifyInstance,
  twoFactorService: TwoFactorService,
  sessionsService: SessionsService
) {
  const typedApp = app.withTypeProvider<ZodTypeProvider>();

  typedApp.post('/auth/2fa/setup', { preHandler: requireAuth(sessionsService) }, async (request, reply) => {
    assertRecentReauthentication(request.currentSession!.reauthenticatedAt);
    reply.header('Cache-Control', 'no-store');
    return twoFactorService.beginTotpSetup(request.currentUser!.id);
  });

  typedApp.post('/2fa/setup', { preHandler: requireAuth(sessionsService) }, async (request, reply) => {
    assertRecentReauthentication(request.currentSession!.reauthenticatedAt);
    reply.header('Cache-Control', 'no-store');
    const setup = await twoFactorService.beginTotpSetup(request.currentUser!.id);
    return { provisioningUri: setup.otpauthUri };
  });

  for (const path of ['/auth/2fa/verify-setup', '/2fa/confirm']) typedApp.post(path, {
    preHandler: requireAuth(sessionsService),
    schema: { body: confirmTotpSchema }
  }, async (request, reply) => {
    assertRecentReauthentication(request.currentSession!.reauthenticatedAt);
    reply.header('Cache-Control', 'no-store');
    const body = request.body;
    const recoveryCodes = await twoFactorService.confirmTotpSetup(request.currentUser!.id, body.code);
    return { recoveryCodes };
  });

  app.get('/auth/2fa/status', { preHandler: requireAuth(sessionsService) }, async (request, reply) => {
    reply.header('Cache-Control', 'no-store');
    return twoFactorService.status(request.currentUser!.id);
  });

  app.post('/2fa/recovery-codes/regenerate', { preHandler: requireAuth(sessionsService) }, async (request) => {
    assertRecentReauthentication(request.currentSession!.reauthenticatedAt);
    const recoveryCodes = await twoFactorService.regenerateRecoveryCodes(request.currentUser!.id);
    return { recoveryCodes };
  });

  app.delete('/2fa', { preHandler: requireAuth(sessionsService) }, async (request) => {
    assertRecentReauthentication(request.currentSession!.reauthenticatedAt);
    await twoFactorService.disableTwoFactor(request.currentUser!.id);
    await sessionsService.revokeOtherUserSessions(request.currentUser!.id, request.currentSession!.id);
    return { ok: true };
  });
}
