import { z } from "zod";
import type { User } from "../users/users.types.js";

export	type	PasswordCredential = {
	userId: string;
	passwordHash: string;
	passwordUpdatedAt: Date;
};

export	type	LoginResult =
	| {
		status: "authenticated";
		user: User;
		sessionToken: string;
		sessionExpiresAt: Date;
	}
	| {
		status: "requires_2fa";
		challengeToken: string;
		expiresAt: Date;
	};

export const authenticationUserSchema = z.object({

	id: z.string(),

	username: z.string(),
	email: z.string().nullable(),
	displayName: z.string().nullable(),
	role: z.string(),
	status: z.string(),

	createdAt: z.date(),
	updatedAt: z.date()
});

export const loginResultSchema = z.discriminatedUnion("status", [
	z.object({
		status: z.literal("authenticated"),
		user: authenticationUserSchema,
		sessionExpiresAt: z.date()
	}),
	z.object({
		status: z.literal("requires_2fa"),
		challengeToken: z.string(),
		expiresAt: z.date()
	})
]);

export const authenticationErrorSchema = z.object({
	error: z.string(),
	message: z.string()
});

export const okSchema = z.object({ ok: z.literal(true) });

export	const	registerDocs = {

	tags: ["Authentication"],

	summary: "Register a new account",

	description:
		"Creates a user account and immediately issues a session cookie. " +
		"Passwords must be 12–128 characters. " +
		"If the account has 2FA enabled, the response will instead be `{ status: 'requires_2fa' }` " +
		"and the client must complete the flow via `POST /api/v1/two-factor/login`.",

	body: z.object({
		username: z.string().min(3).max(32),
		email: z.string().email().max(254).optional(),
		password: z.string().min(12).max(128)
	}),

	response: {
		200: loginResultSchema.describe("Authenticated immediately, or a 2FA challenge if required."),
		400: authenticationErrorSchema.describe("Validation error (e.g. password too short)."),
		409: authenticationErrorSchema.describe("Username or email already exists.")
	}
} as const;

export	const	loginDocs = {

	tags: ["Authentication"],

	summary: "Log in with username and password",

	description:
		"Verifies credentials. On success issues a session cookie. " +
		"If the account has 2FA enabled, returns `{ status: 'requires_2fa', challengeToken }`, " +
		"the token must be sent to `POST /api/v1/two-factor/login` along with a TOTP code or recovery code. " +
		"Repeated failures are rate-limited per identity and per IP.",

	body: z.object({
		username: z.string().min(3).max(32),
		password: z.string().min(1).max(128)
	}),

	response: {
		200: loginResultSchema.describe("Authenticated, or a 2FA challenge if the account has 2FA."),
		400: authenticationErrorSchema.describe("Validation error."),
		401: authenticationErrorSchema.describe("Invalid credentials."),
		429: authenticationErrorSchema.describe("Too many failed login attempts.")
	}
} as const;

export	const	twoFactorLoginDocs = {

	tags: ["Authentication"],

	summary: "Complete 2FA login",

	description:
		"Completes a login that returned `requires_2fa` by verifying a TOTP code or a one-time recovery code. " +
		"The `challengeToken` is single-use and expires; concurrent submissions race safely, only one succeeds. " +
		"On success issues a session cookie.",

	body: z.discriminatedUnion("method", [
		z.object({
			challengeToken: z.string().length(43),
			code: z.string().regex(/^\d{6}$/),
			method: z.literal("totp")
		}),
		z.object({
			challengeToken: z.string().length(43),
			code: z.string().trim().regex(/^[A-Za-z0-9_-]{12}$/),
			method: z.literal("recovery_code")
		})
	]),

	response: {
		200: loginResultSchema.describe("Authenticated session."),
		400: authenticationErrorSchema.describe("Validation error."),
		401: authenticationErrorSchema.describe("Invalid or expired challenge, or invalid second factor."),
		429: authenticationErrorSchema.describe("Too many failed 2FA attempts.")
	}
} as const;

export	const	logoutDocs = {

	tags: ["Authentication"],

	summary: "Log out",

	description:
		"Revokes the current session (if any) and clears the session cookie. " +
		"Returns `{ ok: true }` regardless of whether a session was present, safe to call idempotently.",

	response: {
		200: okSchema.describe("Session revoked and cookie cleared.")
	}
} as const;

export	const	reauthenticateDocs = {

	tags: ["Authentication"],

	summary: "Reauthenticate the current session",

	description:
		"Elevates the current session for a short TTL so sensitive actions (e.g. password change) can proceed. " +
		"Requires the user's password and, if 2FA is enabled, a valid second factor. " +
		"After success, `POST /api/v1/change-password` is permitted within the sensitive-action window.",

	body: z.object({
		password: z.string().min(1).max(128),
		secondFactorCode: z.string().min(1).max(64).optional(),
		secondFactorMethod: z.enum(["totp", "recovery_code"]).optional()
	}),

	response: {
		200: okSchema.describe("Session marked as recently reauthenticated."),
		400: authenticationErrorSchema.describe("Validation error."),
		401: authenticationErrorSchema.describe("Invalid credentials or second factor."),
		429: authenticationErrorSchema.describe("Too many reauthentication attempts.")
	}
} as const;

export	const	changePasswordDocs = {

	tags: ["Authentication"],

	summary: "Change the account password",

	description:
		"Requires the session to be recently reauthenticated. " +
		"If the reauthentication window has expired, returns `403 REAUTHENTICATION_REQUIRED`, " +
		"the client must call `/reauthenticate` and retry. " +
		"On success, all other sessions for the user are revoked; the current session remains valid.",

	body: z.object({ newPassword: z.string().min(12).max(128) }),

	response: {
		200: okSchema.describe("Password changed; other sessions revoked."),
		400: authenticationErrorSchema.describe("Validation error."),
		401: authenticationErrorSchema.describe("Authentication required."),
		403: authenticationErrorSchema.describe("Recent reauthentication required.")
	}
} as const;
