-- CreateEnum
CREATE TYPE "StorageRoom" AS ENUM ('PRE_COOLING', 'COLD_A', 'COLD_B', 'REJECT', 'TRUCK');

-- CreateEnum
CREATE TYPE "AlertSeverity" AS ENUM ('INFO', 'WARNING', 'CRITICAL');

-- CreateEnum
CREATE TYPE "AlertStatus" AS ENUM ('ACTIVE', 'ACKNOWLEDGED', 'RESOLVED');

-- CreateEnum
CREATE TYPE "AiClass" AS ENUM ('CABAI_BUSUK_10', 'CABAI_BUSUK_5', 'CABAI_SEGAR');

-- CreateEnum
CREATE TYPE "LotStatus" AS ENUM ('RECEIVED', 'SORTED', 'STORED', 'RELEASED', 'REJECTED');

-- CreateTable
CREATE TABLE "SensorReading" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "room" "StorageRoom" NOT NULL,
    "temperature" DOUBLE PRECISION,
    "humidity" DOUBLE PRECISION,
    "co2" DOUBLE PRECISION,
    "ethylene" DOUBLE PRECISION,
    "oxygen" DOUBLE PRECISION,
    "pressurePa" DOUBLE PRECISION,
    "doorOpen" BOOLEAN,
    "powerKw" DOUBLE PRECISION,
    "energyKwh" DOUBLE PRECISION,
    "lux" DOUBLE PRECISION,
    "airflow" DOUBLE PRECISION,
    "vibration" DOUBLE PRECISION,
    "weightKg" DOUBLE PRECISION,
    "conveyorMs" DOUBLE PRECISION,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SensorReading_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Alert" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "severity" "AlertSeverity" NOT NULL,
    "status" "AlertStatus" NOT NULL DEFAULT 'ACTIVE',
    "room" "StorageRoom",
    "source" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "Alert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lot" (
    "id" TEXT NOT NULL,
    "lotCode" TEXT NOT NULL,
    "qrCode" TEXT NOT NULL,
    "origin" TEXT,
    "weightKg" DOUBLE PRECISION NOT NULL,
    "crateCount" INTEGER NOT NULL DEFAULT 1,
    "aiClass" "AiClass",
    "grade" TEXT,
    "confidence" DOUBLE PRECISION,
    "storageRoom" "StorageRoom",
    "rackCode" TEXT,
    "status" "LotStatus" NOT NULL DEFAULT 'RECEIVED',
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiDetection" (
    "id" TEXT NOT NULL,
    "lotId" TEXT,
    "modelName" TEXT NOT NULL,
    "classId" INTEGER NOT NULL,
    "className" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "x1" DOUBLE PRECISION,
    "y1" DOUBLE PRECISION,
    "x2" DOUBLE PRECISION,
    "y2" DOUBLE PRECISION,
    "imagePath" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiDetection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActuatorLog" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "room" "StorageRoom" NOT NULL,
    "actuator" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "triggeredBy" TEXT NOT NULL DEFAULT 'RULE_BASED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActuatorLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SensorReading_room_recordedAt_idx" ON "SensorReading"("room", "recordedAt");

-- CreateIndex
CREATE INDEX "SensorReading_deviceId_recordedAt_idx" ON "SensorReading"("deviceId", "recordedAt");

-- CreateIndex
CREATE INDEX "Alert_status_createdAt_idx" ON "Alert"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Lot_lotCode_key" ON "Lot"("lotCode");

-- CreateIndex
CREATE UNIQUE INDEX "Lot_qrCode_key" ON "Lot"("qrCode");

-- CreateIndex
CREATE INDEX "Lot_status_receivedAt_idx" ON "Lot"("status", "receivedAt");

-- CreateIndex
CREATE INDEX "AiDetection_createdAt_idx" ON "AiDetection"("createdAt");

-- AddForeignKey
ALTER TABLE "AiDetection" ADD CONSTRAINT "AiDetection_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "Lot"("id") ON DELETE SET NULL ON UPDATE CASCADE;
