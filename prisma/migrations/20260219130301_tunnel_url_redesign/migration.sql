/*
  Warnings:

  - You are about to drop the column `assignedPort` on the `FrpEndpoint` table. All the data in the column will be lost.
  - You are about to drop the column `token` on the `FrpEndpoint` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "FrpEndpoint_assignedPort_key";

-- DropIndex
DROP INDEX "FrpEndpoint_token_key";

-- AlterTable
ALTER TABLE "FrpEndpoint" DROP COLUMN "assignedPort",
DROP COLUMN "token",
ADD COLUMN     "tunnelUrl" TEXT NOT NULL DEFAULT '';
