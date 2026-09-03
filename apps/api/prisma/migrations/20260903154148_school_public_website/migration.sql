-- CreateTable
CREATE TABLE "school_websites" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "tagline" TEXT,
    "heroImageUrl" TEXT,
    "aboutText" TEXT,
    "admissionsText" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "address" TEXT,
    "themeColor" TEXT NOT NULL DEFAULT '#2563eb',
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "school_websites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "school_announcements" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "websiteId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "school_announcements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "school_websites_schoolId_key" ON "school_websites"("schoolId");

-- CreateIndex
CREATE INDEX "school_announcements_schoolId_publishedAt_idx" ON "school_announcements"("schoolId", "publishedAt");

-- AddForeignKey
ALTER TABLE "school_websites" ADD CONSTRAINT "school_websites_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "school_announcements" ADD CONSTRAINT "school_announcements_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "school_announcements" ADD CONSTRAINT "school_announcements_websiteId_fkey" FOREIGN KEY ("websiteId") REFERENCES "school_websites"("id") ON DELETE CASCADE ON UPDATE CASCADE;
