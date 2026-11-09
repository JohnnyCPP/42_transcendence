-- Enum casts preserve existing values and fail if the database contains an
-- undocumented role or status; correct those rows before retrying migration.
CREATE TYPE "GlobalRole" AS ENUM ('user', 'moderator', 'admin');
CREATE TYPE "OrganizationRole" AS ENUM ('member', 'admin', 'owner');
CREATE TYPE "BoardRole" AS ENUM ('observer', 'member', 'admin');
CREATE TYPE "UserStatus" AS ENUM ('active', 'disabled', 'deleted');

ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "users" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "users" ALTER COLUMN "role" TYPE "GlobalRole" USING ("role"::"GlobalRole");
ALTER TABLE "users" ALTER COLUMN "status" TYPE "UserStatus" USING ("status"::"UserStatus");
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'user';
ALTER TABLE "users" ALTER COLUMN "status" SET DEFAULT 'active';
ALTER TABLE "organization_members" ALTER COLUMN "role" TYPE "OrganizationRole" USING ("role"::"OrganizationRole");
ALTER TABLE "board_members" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "board_members" ALTER COLUMN "role" TYPE "BoardRole" USING ("role"::"BoardRole");
ALTER TABLE "board_members" ALTER COLUMN "role" SET DEFAULT 'member';
