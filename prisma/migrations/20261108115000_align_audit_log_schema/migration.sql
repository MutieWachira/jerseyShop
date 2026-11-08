BEGIN;

DO $$
BEGIN
  CREATE TYPE "AuditLevel" AS ENUM ('INFO', 'WARN', 'ERROR');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

ALTER TABLE "AuditLog" RENAME COLUMN "userId" TO "actorId";
ALTER TABLE "AuditLog" RENAME COLUMN "event" TO "action";
ALTER TABLE "AuditLog" RENAME COLUMN "resource" TO "resourceType";

ALTER TABLE "AuditLog"
  ADD COLUMN "actorType" TEXT,
  ADD COLUMN "resourceId" TEXT,
  ADD COLUMN "level" "AuditLevel" NOT NULL DEFAULT 'INFO';

UPDATE "AuditLog"
SET "metadata" = COALESCE("metadata", '{}'::jsonb) || jsonb_build_object(
  'description', "description",
  'ip', "ip",
  'userAgent', "userAgent"
);

UPDATE "AuditLog" AS audit
SET "actorType" = CASE WHEN "User"."role" = 'ADMIN' THEN 'ADMIN' ELSE 'USER' END
FROM "User"
WHERE audit."actorId" = "User"."id";

ALTER TABLE "AuditLog"
  DROP COLUMN "description",
  DROP COLUMN "ip",
  DROP COLUMN "userAgent";

ALTER INDEX "AuditLog_userId_idx" RENAME TO "AuditLog_actorId_idx";
DROP INDEX IF EXISTS "AuditLog_resource_idx";
DROP INDEX IF EXISTS "AuditLog_event_idx";
CREATE INDEX "AuditLog_resourceType_resourceId_idx"
  ON "AuditLog"("resourceType", "resourceId");

COMMIT;
