/*
  Warnings:

  - A unique constraint covering the columns `[fdId]` on the table `Match` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[externalId]` on the table `Team` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[fdId]` on the table `Team` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Match" ADD COLUMN     "fdId" INTEGER;

-- AlterTable
ALTER TABLE "Team" ADD COLUMN     "fdId" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "Match_fdId_key" ON "Match"("fdId");

-- CreateIndex
CREATE UNIQUE INDEX "Team_externalId_key" ON "Team"("externalId");

-- CreateIndex
CREATE UNIQUE INDEX "Team_fdId_key" ON "Team"("fdId");
