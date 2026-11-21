import { ORG_ROLES } from "../authorization/roles.js";
import { z } from "zod";
import type { OrganizationRole } from '../authorization/roles.js';
export type { OrganizationRole } from '../authorization/roles.js';

export type Organization = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  createdByUserId: string;
  createdAt: Date;
  updatedAt: Date;
  archivedAt: Date | null;
};

export type OrganizationMember = {
  organizationId: string;
  userId: string;
  role: OrganizationRole;
  joinedAt: Date;
};

export type OrganizationWithRole = Organization & {
  role: OrganizationRole;
};

export type CreateOrganizationInput = {
  name: string;
  slug?: string;
  description?: string | null;
  createdByUserId: string;
};

export type UpdateOrganizationInput = {
  organizationId: string;
  actorUserId: string;
  name?: string;
  slug?: string;
  description?: string | null;
};

export type SetOrganizationMemberInput = {
  organizationId: string;
  userId: string;
  role: Exclude<OrganizationRole, 'owner'>;
};

//            SWAGGER UI             //
// ---- Shared response schemas ---- //

export const organizationSchema = z.object({
	id: z.string(),
	name: z.string(),
	slug: z.string(),
	description: z.string().nullable(),
	createdByUserId: z.string(),
	createdAt: z.date(),
	updatedAt: z.date(),
	archivedAt: z.date().nullable()
});

export const organizationWithRoleSchema = organizationSchema.extend({
	role: z.enum(ORG_ROLES)
});

export const organizationMemberSchema = z.object({
	organizationId: z.string(),
	userId: z.string(),
	role: z.enum(ORG_ROLES),
	joinedAt: z.date()
});

export const organizationErrorSchema = z.object({
	error: z.string(),
	message: z.string()
});

//            SWAGGER UI                       //
// ---- Per-endpoint documentation blocks ---- //

export	const	createOrganizationDocs = {

	tags: ["Organizations"],

	summary: "Create an organization",

	description:
		"Creates a new organization and makes the caller its owner. " +
		"If `slug` is omitted, it is derived from `name` (lowercased, non-alphanumerics replaced by `-`). " +
		"Returns 409 `ORGANIZATION_SLUG_EXISTS` if the slug is already taken.",

	body: z.object({
		name: z.string().trim().min(2).max(80),
		slug: z.string().trim().min(2).max(80).optional(),
		description: z.string().trim().max(5000).nullable().optional()
	}),

	response: {
		200: z.object({ organization: organizationWithRoleSchema }).describe("The created organization, with the caller's role."),
		400: organizationErrorSchema.describe("Validation error."),
		401: organizationErrorSchema.describe("Authentication required."),
		409: organizationErrorSchema.describe("Organization slug already exists.")
	},

	security: []
} as const;

export	const	listOrganizationsDocs = {

	tags: ["Organizations"],

	summary: "List your organizations",

	description:
		"Returns every non-archived organization the caller is a member of, newest first, " +
		"with the caller's role in each. Paginated.",

	querystring: z.object({
		limit: z.coerce.number().int().min(1).max(100).default(50),
		offset: z.coerce.number().int().min(0).default(0)
	}),

	response: {
		200: z.object({
			organizations: z.array(organizationWithRoleSchema),
			pagination: z.object({
				limit: z.number().int(),
				offset: z.number().int(),
				total: z.number().int()
			})
		}).describe("Paginated list of organizations."),
		401: organizationErrorSchema.describe("Authentication required.")
	},

	security: []
} as const;

export	const	getOrganizationDocs = {

	tags: ["Organizations"],

	summary: "Get an organization",

	description:
		"Returns a single organization the caller belongs to. " +
		"Returns 404 `ORGANIZATION_NOT_FOUND` if the organization does not exist " +
		"or the caller is not a member (existence is not leaked).",

	params: z.object({
		organizationId: z.string().min(1)
	}),

	response: {
		200: z.object({ organization: organizationWithRoleSchema }).describe("The organization, with the caller's role."),
		401: organizationErrorSchema.describe("Authentication required."),
		404: organizationErrorSchema.describe("Organization not found or not accessible.")
	},

	security: []
} as const;

export	const	updateOrganizationDocs = {

	tags: ["Organizations"],

	summary: "Update an organization",

	description:
		"Updates the name, slug and/or description of an organization. Requires owner or admin role. " +
		"An empty body is a successful no-op. " +
		"Returns 409 `ORGANIZATION_SLUG_EXISTS` if the new slug is taken by another organization.",

	params: z.object({
		organizationId: z.string().min(1)
	}),

	body: z.object({
		name: z.string().trim().min(2).max(80).optional(),
		slug: z.string().trim().min(2).max(80).optional(),
		description: z.string().trim().max(5000).nullable().optional()
	}),

	response: {
		200: z.object({ organization: organizationSchema }).describe("The updated organization."),
		400: organizationErrorSchema.describe("Validation error."),
		401: organizationErrorSchema.describe("Authentication required."),
		403: organizationErrorSchema.describe("Admin or owner role required."),
		404: organizationErrorSchema.describe("Organization not found or not accessible."),
		409: organizationErrorSchema.describe("Organization slug already exists.")
	},

	security: []
} as const;

export	const	setOrganizationMemberRoleDocs = {

	tags: ["Organizations"],

	summary: "Set a member's role",

	description:
		"Sets the role of a user in the organization. Requires owner or admin role. " +
		"Rules: only an owner can promote/demote admins; " +
		"the owner role itself is immutable (returns 403 `ORGANIZATION_OWNER_IMMUTABLE`). " +
		"Returns 404 if the target user does not exist.",

	params: z.object({
		organizationId: z.string().min(1),
		userId: z.string().min(1)
	}),

	body: z.object({
		role: z.enum([ORG_ROLES[1], ORG_ROLES[0]] as const)
	}),

	response: {
		200: z.object({ member: organizationMemberSchema }).describe("The updated membership."),
		400: organizationErrorSchema.describe("Invalid role."),
		401: organizationErrorSchema.describe("Authentication required."),
		403: organizationErrorSchema.describe("Insufficient role to perform this change."),
		404: organizationErrorSchema.describe("Organization or user not found.")
	},

	security: []
} as const;
