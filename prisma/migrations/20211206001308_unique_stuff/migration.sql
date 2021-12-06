/*
  Warnings:

  - A unique constraint covering the columns `[resoluteId]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[slackId,teamId]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "User_resoluteId_key" ON "User"("resoluteId");

-- CreateIndex
CREATE UNIQUE INDEX "User_slackId_teamId_key" ON "User"("slackId", "teamId");
