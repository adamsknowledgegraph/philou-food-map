PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS "Place" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "normalizedName" TEXT NOT NULL,
  "address" TEXT,
  "normalizedAddress" TEXT,
  "city" TEXT,
  "neighborhood" TEXT,
  "arrondissement" TEXT,
  "country" TEXT,
  "latitude" REAL,
  "longitude" REAL,
  "cuisineType" TEXT,
  "foodType" TEXT DEFAULT '[]',
  "priceRange" TEXT,
  "estimatedPricePerPerson" INTEGER,
  "tags" TEXT DEFAULT '[]',
  "googleMapsUrl" TEXT,
  "instagramUrl" TEXT,
  "websiteUrl" TEXT,
  "bookingUrl" TEXT,
  "status" TEXT NOT NULL DEFAULT 'active',
  "confidenceScore" REAL NOT NULL DEFAULT 0.5,
  "needsReview" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS "Source" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "platform" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "title" TEXT,
  "author" TEXT,
  "date" DATETIME,
  "rawText" TEXT,
  "rawJsonPath" TEXT,
  "processedStatus" TEXT NOT NULL DEFAULT 'pending',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS "Recommendation" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "placeId" TEXT NOT NULL,
  "influencerName" TEXT NOT NULL,
  "influencerHandle" TEXT NOT NULL,
  "sourceId" TEXT,
  "sourcePlatform" TEXT NOT NULL,
  "sourceUrl" TEXT NOT NULL,
  "sourceTitle" TEXT,
  "sourceDate" DATETIME,
  "originalTextSnippet" TEXT,
  "recommendedItems" TEXT DEFAULT '[]',
  "reasonRecommended" TEXT,
  "mentionedOnly" BOOLEAN NOT NULL DEFAULT false,
  "confidenceScore" REAL NOT NULL DEFAULT 0.5,
  "needsReview" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  FOREIGN KEY ("placeId") REFERENCES "Place" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY ("sourceId") REFERENCES "Source" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "Evidence" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "sourceId" TEXT NOT NULL,
  "placeId" TEXT NOT NULL,
  "evidenceType" TEXT NOT NULL,
  "evidenceText" TEXT NOT NULL,
  "confidenceScore" REAL NOT NULL DEFAULT 0.5,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("sourceId") REFERENCES "Source" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY ("placeId") REFERENCES "Place" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "ReviewLog" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT NOT NULL,
  "oldValue" TEXT,
  "newValue" TEXT,
  "reason" TEXT,
  "reviewedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "DuplicateCandidate" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "placeId1" TEXT NOT NULL,
  "placeId2" TEXT NOT NULL,
  "matchReason" TEXT NOT NULL,
  "similarityScore" REAL NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("placeId1") REFERENCES "Place" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY ("placeId2") REFERENCES "Place" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "Source_url_key" ON "Source"("url");
CREATE UNIQUE INDEX IF NOT EXISTS "DuplicateCandidate_placeId1_placeId2_key" ON "DuplicateCandidate"("placeId1", "placeId2");
