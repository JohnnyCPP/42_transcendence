import {
	beginTotpDocs,
	confirmTotpDocs,
	disableTwoFactorDocs,
	regenerateRecoveryCodesDocs
} from './twoFactor.types.js';
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

  typedApp.post('/api/v1/two-factor/begin', { preHandler: requireAuth(sessionsService), 
		schema: {
			tags: beginTotpDocs.tags,
			summary: beginTotpDocs.summary,
			description: beginTotpDocs.description,
			response: beginTotpDocs.response,
			security: beginTotpDocs.security
		}
  }, async (request) => {
    assertRecentReauthentication(request.currentSession!.reauthenticatedAt);
    return twoFactorService.beginTotpSetup(request.currentUser!.id);
  });

  typedApp.post('/api/v1/two-factor/confirm', {
    preHandler: requireAuth(sessionsService),
		schema: {
			tags: confirmTotpDocs.tags,
			summary: confirmTotpDocs.summary,
			description: confirmTotpDocs.description,
			body: confirmTotpDocs.body,
			response: confirmTotpDocs.response,
			security: confirmTotpDocs.security
		}
  }, async (request) => {
    assertRecentReauthentication(request.currentSession!.reauthenticatedAt);
    const body = request.body;
    const recoveryCodes = await twoFactorService.confirmTotpSetup(request.currentUser!.id, body.code);
    return { recoveryCodes };
  });

  typedApp.post('/api/v1/two-factor/regenerate', { preHandler: requireAuth(sessionsService),
		schema: {
			tags: regenerateRecoveryCodesDocs.tags,
			summary: regenerateRecoveryCodesDocs.summary,
			description: regenerateRecoveryCodesDocs.description,
			response: regenerateRecoveryCodesDocs.response,
			security: regenerateRecoveryCodesDocs.security
		}
  }, async (request) => {
    assertRecentReauthentication(request.currentSession!.reauthenticatedAt);
    const recoveryCodes = await twoFactorService.regenerateRecoveryCodes(request.currentUser!.id);
    return { recoveryCodes };
  });

  typedApp.delete('/api/v1/two-factor', { preHandler: requireAuth(sessionsService),
		schema: {
			tags: disableTwoFactorDocs.tags,
			summary: disableTwoFactorDocs.summary,
			description: disableTwoFactorDocs.description,
			response: disableTwoFactorDocs.response,
			security: disableTwoFactorDocs.security
		}
  }, async (request) => {
    assertRecentReauthentication(request.currentSession!.reauthenticatedAt);
    await twoFactorService.disableTwoFactor(request.currentUser!.id);
    await sessionsService.revokeOtherUserSessions(request.currentUser!.id, request.currentSession!.id);
    return { ok: true } as const;
  });
}
