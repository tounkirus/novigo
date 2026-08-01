-- Annonces vocales (Voice Dispatch) : préférences du prestataire + journal des annonces.

CREATE TABLE "VoiceSettings" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "language" TEXT NOT NULL DEFAULT 'fr',
    "voice" TEXT NOT NULL DEFAULT 'FEMALE',
    "speed" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "volume" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "repeatCount" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "VoiceSettings_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "VoiceSettings_partnerId_key" ON "VoiceSettings"("partnerId");

CREATE TABLE "VoiceAnnouncement" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "missionId" TEXT,
    "orderId" TEXT,
    "kind" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SENT',
    "responseSeconds" INTEGER,
    "error" TEXT,
    "playedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VoiceAnnouncement_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "VoiceAnnouncement_partnerId_idx" ON "VoiceAnnouncement"("partnerId");
CREATE INDEX "VoiceAnnouncement_missionId_idx" ON "VoiceAnnouncement"("missionId");
CREATE INDEX "VoiceAnnouncement_createdAt_idx" ON "VoiceAnnouncement"("createdAt");
