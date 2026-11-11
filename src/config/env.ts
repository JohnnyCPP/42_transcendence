import 'dotenv/config';
import { z } from 'zod';

const	booleanFromEnv = z.enum(["true", "false"])
							.transform((value) => value === "true")
							.optional();

const envSchema = z.object({

  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  HOST: z.string().default("127.0.0.1"),
  PORT: z.coerce.number().int().positive().default(3000),
  COOKIE_SECURE: booleanFromEnv,
  SESSION_COOKIE_NAME: z.string().default("sid"),
  SESSION_TTL_DAYS: z.coerce.number().int().positive().default(14),
  TOTP_ISSUER: z.string().default('Transcendence'),
  TOTP_ENCRYPTION_KEY_BASE64: z.string().min(1).optional(),
  DATABASE_URL: z.string().url().optional()

}).superRefine((value, ctx) => {

  if (value.NODE_ENV !== "test" && !value.DATABASE_URL) {

    ctx.addIssue({

      code: z.ZodIssueCode.custom,
      path: ["DATABASE_URL"],
      message: `DATABASE_URL is required when NODE_ENV is "${value.NODE_ENV}". ` +
               "The in-memory repositories are only permitted in NODE_ENV=test."
    });
  }
  if (value.NODE_ENV !== "test" && !value.TOTP_ENCRYPTION_KEY_BASE64) {

    ctx.addIssue({

      code: "custom",
	  path: ["TOTP_ENCRYPTION_KEY_BASE64"], 
	  message: "TOTP_ENCRYPTION_KEY_BASE64 is required outside the test environment" 
	});
  }
}).transform((config) => ({

  ...config,
  // Deterministic, non-secret key used only by isolated tests.
  TOTP_ENCRYPTION_KEY_BASE64: config.TOTP_ENCRYPTION_KEY_BASE64 ?? "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA="
}));

export const env = envSchema.parse(process.env);
