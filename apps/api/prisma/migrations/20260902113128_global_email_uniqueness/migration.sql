-- Email must be unique across the whole platform, not per school, so
-- login can resolve a session from email alone (architecture §05).
DROP INDEX "users_schoolId_email_key";
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
