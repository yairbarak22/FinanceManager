-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Liability" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "totalAmount" REAL NOT NULL,
    "monthlyPayment" REAL NOT NULL,
    "interestRate" REAL NOT NULL DEFAULT 0,
    "loanTermMonths" INTEGER NOT NULL DEFAULT 0,
    "startDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "remainingAmount" REAL,
    "loanMethod" TEXT NOT NULL DEFAULT 'spitzer',
    "hasInterestRebate" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Liability" ("createdAt", "id", "monthlyPayment", "name", "totalAmount", "type", "updatedAt") SELECT "createdAt", "id", "monthlyPayment", "name", "totalAmount", "type", "updatedAt" FROM "Liability";
DROP TABLE "Liability";
ALTER TABLE "new_Liability" RENAME TO "Liability";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
