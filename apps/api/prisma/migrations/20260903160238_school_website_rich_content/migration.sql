-- AlterTable
ALTER TABLE "school_websites" ADD COLUMN     "campuses" JSONB,
ADD COLUMN     "highlights" JSONB,
ADD COLUMN     "philosophyImageUrl" TEXT,
ADD COLUMN     "philosophyText" TEXT,
ADD COLUMN     "programs" JSONB,
ADD COLUMN     "stats" JSONB;
