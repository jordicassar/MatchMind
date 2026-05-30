/*
  Warnings:

  - A unique constraint covering the columns `[externalId]` on the table `Player` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Player_externalId_key" ON "Player"("externalId");
