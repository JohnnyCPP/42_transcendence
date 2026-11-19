import { z } from "zod";
import { GLOBAL_ROLES } from "../authorization/roles.js";
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

//            SWAGGER UI             //
// ---- Shared response schemas ---- //

export const userSchema = z.object({
	id: z.string(),
	username: z.string(),
	email: z.string().nullable(),
	displayName: z.string().nullable(),
	role: z.enum(GLOBAL_ROLES),
	status: z.enum(["active", "disabled", "deleted"]),
	createdAt: z.date(),
	updatedAt: z.date()
});

export const userErrorSchema = z.object({
	error: z.string(),
	message: z.string()
});

export const usersPageSchema = z.object({
	users: z.array(userSchema),
	pagination: z.object({
		limit: z.number().int(),
		offset: z.number().int(),
		total: z.number().int()
	})
});

const userParams = z.object({
	id: z.string().min(1)
});

const listPagination = z.object({
	limit: z.coerce.number().int().min(1).max(100).default(50),
	offset: z.coerce.number().int().min(0).default(0)
});

//            SWAGGER UI                       //
// ---- Per-endpoint documentation blocks ---- //

export	const	getMeDocs = {

	tags: ["Users"],

	summary: "Get the current user",

	description:
		"Returns the authenticated user's profile. Available to any authenticated user regardless of role.",

	response: {
		200: z.object({ user: userSchema }).describe("The caller's profile."),
		401: userErrorSchema.describe("Authentication required.")
	},

	security: []
} as const;

export	const	listAdminUsersDocs = {

	tags: ["Users", "Administration"],

	summary: "List users (admin view)",

	description:
		"Paginated list of all users regardless of role or status. " +
		"Requires the `admin` global role. For a filtered moderation view, use `GET /users`.",

	querystring: listPagination,

	response: {
		200: usersPageSchema.describe("Paginated list of users."),
		401: userErrorSchema.describe("Authentication required."),
		403: userErrorSchema.describe("Insufficient global role (admin required).")
	},

	security: []
} as const;

export	const	listUsersDocs = {

	tags: ["Users", "Moderation"],

	summary: "List users with filters",

	description:
		"Paginated, filterable list of users. Supports filtering by global `role` and account `status` " +
		"(`active`, `disabled`, `deleted`). Deleted users are excluded by default. " +
		"Requires the `moderator` or `admin` global role.",

	querystring: listPagination.extend({
		role: z.enum(GLOBAL_ROLES).optional(),
		status: z.enum(["active", "disabled", "deleted"]).optional()
	}),

	response: {
		200: usersPageSchema.describe("Paginated, filtered list of users."),
		401: userErrorSchema.describe("Authentication required."),
		403: userErrorSchema.describe("Insufficient global role (moderator or admin required).")
	},

	security: []
} as const;

export	const	getUserDocs = {

	tags: ["Users", "Moderation"],

	summary: "Get a user by id",

	description:
		"Returns a single user's profile. Deleted users are treated as not found. " +
		"Requires the `moderator` or `admin` global role.",

	params: userParams,

	response: {
		200: z.object({ user: userSchema }).describe("The user."),
		401: userErrorSchema.describe("Authentication required."),
		403: userErrorSchema.describe("Insufficient global role."),
		404: userErrorSchema.describe("User not found.")
	},

	security: []
} as const;

export	const	updateUserDocs = {

	tags: ["Users", "Administration"],

	summary: "Update a user",

	description:
		"Updates a user's `displayName`, `email`, global `role`, or `status`. " +
		"Requires the `admin` global role. " +
		"Admins cannot change their own role or disable themselves (403 `SELF_ROLE_CHANGE` / `SELF_STATUS_CHANGE`). " +
		"The last active admin cannot be demoted or disabled (409 `LAST_ADMIN`). " +
		"Duplicate emails are rejected with 409 `CONFLICT`.",

	params: userParams,

	body: z.object({
		displayName: z.string().trim().min(1).max(100).nullable().optional(),
		email: z.string().email().max(254).nullable().optional(),
		role: z.enum(GLOBAL_ROLES).optional(),
		status: z.enum(["active", "disabled"]).optional()
	}).refine((value) => Object.keys(value).length > 0, {
		message: "At least one field must be provided"
	}),

	response: {
		200: z.object({ user: userSchema }).describe("The updated user."),
		400: userErrorSchema.describe("Validation error or invalid role."),
		401: userErrorSchema.describe("Authentication required."),
		403: userErrorSchema.describe("Insufficient role or self-modification attempt."),
		404: userErrorSchema.describe("User not found."),
		409: userErrorSchema.describe("Email conflict or last active admin.")
	},

	security: []
} as const;

export	const	deleteUserDocs = {

	tags: ["Users", "Administration"],

	summary: "Soft-delete a user",

	description:
		"Soft-deletes a user by setting their status to `deleted`. " +
		"Requires the `admin` global role. " +
		"An admin cannot delete their own account (403 `SELF_DELETE`). " +
		"The last active admin cannot be deleted (409 `LAST_ADMIN`).",

	params: userParams,

	response: {
		200: z.object({ user: userSchema }).describe("The deleted user (status = deleted)."),
		401: userErrorSchema.describe("Authentication required."),
		403: userErrorSchema.describe("Insufficient role or self-deletion attempt."),
		404: userErrorSchema.describe("User not found."),
		409: userErrorSchema.describe("Cannot delete the last active admin.")
	},

	security: []
} as const;
