import { z } from "zod";

export type TotpRecord = {
  id: string;
  userId: string;
  secretEncrypted: string;
  enabledAt: Date | null;
  confirmedAt: Date | null;
  lastUsedTimeStep: number | null;
  createdAt: Date;
  updatedAt: Date;
};

export type RecoveryCodeRecord = {
  id: string;
  userId: string;
  codeHash: string;
  createdAt: Date;
  usedAt: Date | null;
  replacedAt: Date | null;
};

export type TotpSetup = {
  provisioningUri: string;
  manualEntryKey: string;
};

//            SWAGGER UI             //
// ---- Shared response schemas ---- //

export const totpSetupSchema = z.object({
	provisioningUri: z.string().describe("otpauth:// URI for QR-code generation")
});

export const totpConfirmResultSchema = z.object({
	recoveryCodes: z.array(z.string()).describe("One-time recovery codes. Displayed once; not retrievable later.")
});

export const twoFactorErrorSchema = z.object({
	error: z.string(),
	message: z.string()
});

//            SWAGGER UI                       //
// ---- Per-endpoint documentation blocks ---- //

export	const	beginTotpDocs = {

	tags: ["Two-Factor Authentication"],

	summary: "Begin TOTP enrollment",

	description:
		"Generates a TOTP secret and returns its `otpauth://` provisioning URI. " +
		"The secret is stored pending (not yet enabled) until confirmed via `POST /two-factor/confirm`. " +
		"Requires recent reauthentication (403 `REAUTHENTICATION_REQUIRED` otherwise). " +
		"Returns 400 if TOTP is already enabled.",

	response: {
		200: totpSetupSchema.describe("The provisioning URI."),
		400: twoFactorErrorSchema.describe("TOTP already enabled."),
		401: twoFactorErrorSchema.describe("Authentication required."),
		403: twoFactorErrorSchema.describe("Recent reauthentication required.")
	},

	security: []
} as const;

export	const	confirmTotpDocs = {

	tags: ["Two-Factor Authentication"],

	summary: "Confirm TOTP enrollment",

	description:
		"Verifies a 6-digit TOTP code against the pending secret, enables 2FA, and generates recovery codes. " +
		"The recovery codes are returned exactly once — store them securely. " +
		"Requires recent reauthentication (403 `REAUTHENTICATION_REQUIRED` otherwise). " +
		"Returns 400 if there is no pending enrollment, 401 if the code is wrong.",

	body: z.object({
		code: z.string().regex(/^\d{6}$/, "6-digit TOTP code")
	}),

	response: {
		200: totpConfirmResultSchema.describe("Recovery codes."),
		400: twoFactorErrorSchema.describe("No pending TOTP setup."),
		401: twoFactorErrorSchema.describe("Authentication required or invalid TOTP code."),
		403: twoFactorErrorSchema.describe("Recent reauthentication required.")
	},

	security: []
} as const;

export	const	regenerateRecoveryCodesDocs = {

	tags: ["Two-Factor Authentication"],

	summary: "Regenerate recovery codes",

	description:
		"Replaces all existing unused recovery codes with a fresh set. " +
		"Old codes are marked replaced and immediately cease to work. " +
		"Requires recent reauthentication (403 `REAUTHENTICATION_REQUIRED` otherwise). " +
		"Returns 400 if 2FA is not enabled.",

	response: {
		200: totpConfirmResultSchema.describe("New recovery codes."),
		400: twoFactorErrorSchema.describe("TOTP is not enabled."),
		401: twoFactorErrorSchema.describe("Authentication required."),
		403: twoFactorErrorSchema.describe("Recent reauthentication required.")
	},

	security: []
} as const;

export	const	disableTwoFactorDocs = {

	tags: ["Two-Factor Authentication"],

	summary: "Disable two-factor authentication",

	description:
		"Removes the TOTP secret and invalidates all recovery codes. " +
		"All other active sessions for this user are revoked as a precaution. " +
		"Requires recent reauthentication (403 `REAUTHENTICATION_REQUIRED` otherwise).",

	response: {
		200: z.object({ ok: z.literal(true) }).describe("Two-factor authentication was disabled."),
		401: twoFactorErrorSchema.describe("Authentication required."),
		403: twoFactorErrorSchema.describe("Recent reauthentication required.")
	},

	security: []
} as const;

export	const	twoFactorStatusDocs = {

	tags: ["Two-Factor Authentication"],

	summary: "Get two-factor authentication status",

	description:
		"Returns whether TOTP two-factor authentication is enabled for the authenticated user, " +
		"and, when enabled, the timestamp at which it was confirmed. " +
		"Use this endpoint to decide whether to show enrollment, disable, or regenerate controls in the UI.",

	response: {
		200: z.object({
			enabled: z.boolean().describe("Whether TOTP two-factor authentication is active."),
			confirmedAt: z.date().optional().describe("When the factor was confirmed. Present only when `enabled` is `true`.")
		}).describe("The caller's two-factor authentication status."),
		401: twoFactorErrorSchema.describe("Authentication required.")
	},

	security: []
} as const;

export	const	remainingRecoveryCodesDocs = {

	tags: ["Two-Factor Authentication"],

	summary: "Count remaining recovery codes",

	description:
		"Returns the number of unused recovery codes for the authenticated user. " +
		"The value decreases each time a recovery code is consumed at login. " +
		"A value of `0` is valid and means all codes have been used, the user should regenerate them. " +
		"When two-factor authentication is disabled, the count is `0`.",

	response: {
		200: z.object({
			remaining: z.number().int().min(0).describe("Number of unused recovery codes.")
		}).describe("Remaining recovery-code count."),
		401: twoFactorErrorSchema.describe("Authentication required.")
	},

	security: []
} as const;
