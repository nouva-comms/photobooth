-- CreateTable
CREATE TABLE "frames" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "imagePath" TEXT NOT NULL,
    "previewPath" TEXT,
    "slotCount" INTEGER NOT NULL DEFAULT 4,
    "aspectRatio" TEXT NOT NULL DEFAULT '4x6',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionCode" TEXT NOT NULL,
    "frameId" TEXT,
    "paymentStatus" TEXT NOT NULL DEFAULT 'UNPAID',
    "paymentAmount" INTEGER NOT NULL DEFAULT 35000,
    "paymentMethod" TEXT,
    "finalImagePath" TEXT,
    "userEmail" TEXT,
    "emailSent" BOOLEAN NOT NULL DEFAULT false,
    "printStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "printCount" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "sessions_frameId_fkey" FOREIGN KEY ("frameId") REFERENCES "frames" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "photos" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "photoOrder" INTEGER NOT NULL,
    "filterApplied" TEXT NOT NULL DEFAULT 'NORMAL',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "photos_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "sessions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "settings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
    "storageDir" TEXT NOT NULL,
    "countdownSec" INTEGER NOT NULL DEFAULT 3,
    "printerName" TEXT,
    "smtpHost" TEXT,
    "smtpPort" INTEGER,
    "smtpUser" TEXT,
    "smtpPass" TEXT,
    "qrisMerchantId" TEXT,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "sessions_sessionCode_key" ON "sessions"("sessionCode");
