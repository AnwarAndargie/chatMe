/*
  Warnings:

  - You are about to drop the column `isFromAI` on the `messages` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "messages" DROP COLUMN "isFromAI",
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "editedAt" TIMESTAMP(3),
ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isEdited" BOOLEAN NOT NULL DEFAULT false;
