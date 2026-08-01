-- NOVIGO Brain — intelligence décisionnelle universelle (chapitre 15).
-- Missions service-agnostiques, décisions explicables, livre de connaissances.

CREATE TYPE "MissionStatus" AS ENUM ('PENDING', 'DISPATCHING', 'ASSIGNED', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'FAILED');
CREATE TYPE "DecisionKind" AS ENUM ('ASSIGNMENT', 'PRICING', 'ROUTE', 'BATCH', 'TRUST', 'FRAUD', 'LEARNING');

CREATE TABLE "ServicePolicy" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "family" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "providerKind" TEXT NOT NULL DEFAULT 'DRIVER',
    "requiresVehicle" BOOLEAN NOT NULL DEFAULT false,
    "skills" TEXT[],
    "equipment" TEXT[],
    "pricing" JSONB NOT NULL,
    "constraints" JSONB NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ServicePolicy_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ServicePolicy_key_key" ON "ServicePolicy"("key");

CREATE TABLE "Mission" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "serviceKey" TEXT NOT NULL,
    "status" "MissionStatus" NOT NULL DEFAULT 'PENDING',
    "clientId" TEXT NOT NULL,
    "providerId" TEXT,
    "providerKind" TEXT,
    "orderId" TEXT,
    "storeId" TEXT,
    "city" TEXT,
    "zone" TEXT,
    "pickupLat" DOUBLE PRECISION,
    "pickupLng" DOUBLE PRECISION,
    "dropoffLat" DOUBLE PRECISION,
    "dropoffLng" DOUBLE PRECISION,
    "distanceMeters" INTEGER,
    "etaMinutes" INTEGER,
    "priceAmount" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'XOF',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "batchId" TEXT,
    "scheduledAt" TIMESTAMP(3),
    "assignedAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "actualMinutes" INTEGER,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Mission_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Mission_reference_key" ON "Mission"("reference");
CREATE UNIQUE INDEX "Mission_orderId_key" ON "Mission"("orderId");
CREATE INDEX "Mission_status_idx" ON "Mission"("status");
CREATE INDEX "Mission_serviceKey_idx" ON "Mission"("serviceKey");
CREATE INDEX "Mission_providerId_idx" ON "Mission"("providerId");
CREATE INDEX "Mission_clientId_idx" ON "Mission"("clientId");
CREATE INDEX "Mission_batchId_idx" ON "Mission"("batchId");

CREATE TABLE "MissionEvent" (
    "id" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "actorId" TEXT,
    "data" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MissionEvent_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "MissionEvent_missionId_idx" ON "MissionEvent"("missionId");
CREATE INDEX "MissionEvent_type_idx" ON "MissionEvent"("type");
ALTER TABLE "MissionEvent" ADD CONSTRAINT "MissionEvent_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "Mission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "BrainDecision" (
    "id" TEXT NOT NULL,
    "kind" "DecisionKind" NOT NULL,
    "engine" TEXT NOT NULL,
    "engineVersion" TEXT NOT NULL DEFAULT '1.0.0',
    "serviceKey" TEXT,
    "missionId" TEXT,
    "subjectId" TEXT,
    "input" JSONB NOT NULL,
    "output" JSONB NOT NULL,
    "reasons" TEXT[],
    "candidates" JSONB,
    "score" DOUBLE PRECISION,
    "confidence" DOUBLE PRECISION,
    "balance" JSONB,
    "latencyMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BrainDecision_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "BrainDecision_missionId_idx" ON "BrainDecision"("missionId");
CREATE INDEX "BrainDecision_kind_idx" ON "BrainDecision"("kind");
CREATE INDEX "BrainDecision_createdAt_idx" ON "BrainDecision"("createdAt");
ALTER TABLE "BrainDecision" ADD CONSTRAINT "BrainDecision_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "Mission"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "TrustScore" (
    "id" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "subjectType" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL DEFAULT 50,
    "missions" INTEGER NOT NULL DEFAULT 0,
    "successes" INTEGER NOT NULL DEFAULT 0,
    "cancellations" INTEGER NOT NULL DEFAULT 0,
    "incidents" INTEGER NOT NULL DEFAULT 0,
    "factors" JSONB,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TrustScore_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "TrustScore_subjectId_subjectType_key" ON "TrustScore"("subjectId", "subjectType");

CREATE TABLE "FraudSignal" (
    "id" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "subjectType" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "severity" INTEGER NOT NULL DEFAULT 1,
    "missionId" TEXT,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FraudSignal_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "FraudSignal_subjectId_idx" ON "FraudSignal"("subjectId");
CREATE INDEX "FraudSignal_kind_idx" ON "FraudSignal"("kind");

CREATE TABLE "KnowledgeEntry" (
    "id" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "metric" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "samples" INTEGER NOT NULL DEFAULT 0,
    "meta" JSONB,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "KnowledgeEntry_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "KnowledgeEntry_scope_key_metric_key" ON "KnowledgeEntry"("scope", "key", "metric");
CREATE INDEX "KnowledgeEntry_scope_metric_idx" ON "KnowledgeEntry"("scope", "metric");

-- Dernière position connue du livreur (critère de proximité du Service Decision Engine).
ALTER TABLE "Driver" ADD COLUMN "lastLat" DOUBLE PRECISION;
ALTER TABLE "Driver" ADD COLUMN "lastLng" DOUBLE PRECISION;
ALTER TABLE "Driver" ADD COLUMN "lastSeenAt" TIMESTAMP(3);
