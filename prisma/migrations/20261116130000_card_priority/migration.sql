CREATE TYPE "CardPriority" AS ENUM ('Low', 'Medium', 'Urgent', 'Enhancement', 'Complete');
ALTER TABLE "cards" ADD COLUMN "priority" "CardPriority" NOT NULL DEFAULT 'Low';
