import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { securityConfig } from '../../config/security.js';
import { forbidden } from '../../shared/errors/httpErrors.js';
import { requireAuth } from '../authorization/requireAuth.js';
import type { SessionsService } from '../sessions/sessions.service.js';
import type { TwoFactorService } from './twoFactor.service.js';
import { InMemoryRateLimiter, rateLimitKey } from '../../shared/http/rateLimit.js';
import type { AuthenticationsService } from '../authentications/authentications.service.js';

const confirmTotpSchema = z.object({ code: z.string().regex(/^\d{6}$/) });
const disableSchema = z.discriminatedUnion('method', [
  z.object({ method: z.literal('totp'), code: z.string().regex(/^\d{6}$/), password: z.string().min(1).max(128).optional() }),
  z.object({ method: z.literal('recovery_code'), code: z.string().trim().regex(/^[A-Za-z0-9_-]{12}$/), password: z.string().min(1).max(128).optional() })
]);

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
  sessionsService: SessionsService,
  authService: AuthenticationsService
) {
  const typedApp = app.withTypeProvider<ZodTypeProvider>();
  const disableLimiter = new InMemoryRateLimiter(5, 15 * 60 * 1000);

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

  for (const path of ['/auth/2fa/recovery-codes/regenerate', '/2fa/recovery-codes/regenerate']) app.post(path, { preHandler: requireAuth(sessionsService) }, async (request, reply) => {
    assertRecentReauthentication(request.currentSession!.reauthenticatedAt);
    reply.header('Cache-Control', 'no-store');
    const recoveryCodes = await twoFactorService.regenerateRecoveryCodes(request.currentUser!.id);
    return { recoveryCodes };
  });

  app.get('/auth/2fa/recovery-codes/remaining', { preHandler: requireAuth(sessionsService) }, async (request, reply) => {
    reply.header('Cache-Control', 'no-store');
    return { remaining: await twoFactorService.remainingRecoveryCodes(request.currentUser!.id) };
  });

  typedApp.post('/auth/2fa/disable', { preHandler: requireAuth(sessionsService), schema: { body: disableSchema } }, async (request) => {
    const key = rateLimitKey('2fa-disable', request.currentUser!.id);
    disableLimiter.assertAllowed(key);
    try {
      if (request.body.password !== undefined) {
        await authService.verifyPasswordForSensitiveAction(request.currentUser!.id, request.currentSession!.id, request.body.password);
        await twoFactorService.disableWithSingleFactor(request.currentUser!.id, request.body.code, request.body.method);
      } else {
        assertRecentReauthentication(request.currentSession!.reauthenticatedAt);
        await twoFactorService.disableTwoFactor(request.currentUser!.id, request.body.code, request.body.method);
      }
    } catch (error) {
      disableLimiter.recordFailure(key);
      throw error;
    }
    disableLimiter.reset(key);
    await sessionsService.revokeOtherUserSessions(request.currentUser!.id, request.currentSession!.id);
    return { ok: true };
  });
}
