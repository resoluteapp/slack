/*
  Warnings:

  - A unique constraint covering the columns `[resoluteId,teamId]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "User_resoluteId_key";

-- CreateIndex
CREATE UNIQUE INDEX "User_resoluteId_teamId_key" ON "User"("resoluteId", "teamId");
