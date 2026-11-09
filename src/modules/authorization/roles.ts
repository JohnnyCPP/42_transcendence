export const GLOBAL_ROLES = ['user', 'moderator', 'admin'] as const;
export const ORG_ROLES = ['member', 'admin', 'owner'] as const;
export const BOARD_ROLES = ['observer', 'member', 'admin'] as const;
export const GLOBAL_ROLE = { USER: GLOBAL_ROLES[0], MODERATOR: GLOBAL_ROLES[1], ADMIN: GLOBAL_ROLES[2] } as const;
export const ORG_ROLE = { MEMBER: ORG_ROLES[0], ADMIN: ORG_ROLES[1], OWNER: ORG_ROLES[2] } as const;
export const BOARD_ROLE = { OBSERVER: BOARD_ROLES[0], MEMBER: BOARD_ROLES[1], ADMIN: BOARD_ROLES[2] } as const;

export type GlobalRole = typeof GLOBAL_ROLES[number];
export type OrganizationRole = typeof ORG_ROLES[number];
export type BoardRole = typeof BOARD_ROLES[number];
