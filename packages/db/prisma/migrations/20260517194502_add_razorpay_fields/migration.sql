/*
  Warnings:

  - You are about to drop the `Merchant` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "OnRampTransaction" ADD COLUMN     "razorpayPaymentId" TEXT,
ADD COLUMN     "razorpaySignature" TEXT;

-- DropTable
DROP TABLE "Merchant";

-- DropEnum
DROP TYPE "AuthType";
