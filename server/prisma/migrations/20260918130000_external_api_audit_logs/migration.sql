CREATE TABLE "externalApiAuditLogs" (
    "audit_id" TEXT NOT NULL,
    "provider_name" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "request_payload" JSONB NOT NULL,
    "response_payload" JSONB NOT NULL,
    "status_code" INTEGER NOT NULL,
    "latency_ms" INTEGER NOT NULL,
    "user_id" TEXT,
    "payload_sha256" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "externalApiAuditLogs_pkey" PRIMARY KEY ("audit_id")
);

CREATE INDEX "externalApiAuditLogs_provider_name_created_at_idx"
    ON "externalApiAuditLogs"("provider_name", "created_at");

CREATE INDEX "externalApiAuditLogs_user_id_created_at_idx"
    ON "externalApiAuditLogs"("user_id", "created_at");

ALTER TABLE "externalApiAuditLogs"
    ADD CONSTRAINT "externalApiAuditLogs_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("user_id")
    ON DELETE RESTRICT ON UPDATE RESTRICT;

CREATE FUNCTION prevent_external_api_audit_log_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    RAISE EXCEPTION 'External API audit logs are immutable';
END;
$$;

CREATE TRIGGER "externalApiAuditLogs_immutable"
BEFORE UPDATE OR DELETE ON "externalApiAuditLogs"
FOR EACH ROW
EXECUTE FUNCTION prevent_external_api_audit_log_mutation();
