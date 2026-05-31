-- CreateEnum
CREATE TYPE "ChildAgeRange" AS ENUM ('new_infant', 'early_infant', 'growing_infant', 'infant', 'young_toddler', 'toddler', 'early_childhood', 'school_age_6_plus');

-- CreateEnum
CREATE TYPE "Weekday" AS ENUM ('monday', 'tuesday', 'wednesday', 'thursday', 'friday');

-- CreateTable
CREATE TABLE "Child" (
    "id" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ageRange" "ChildAgeRange" NOT NULL,
    "educationalDays" "Weekday"[],
    "educationalStartTime" TEXT,
    "educationalEndTime" TEXT,
    "wakeupTime" TEXT,
    "napWindowFrom" TEXT,
    "napWindowTo" TEXT,
    "bedtimeFrom" TEXT,
    "bedtimeTo" TEXT,
    "restrictions" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Child_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Child_parentId_idx" ON "Child"("parentId");

-- AddForeignKey
ALTER TABLE "Child" ADD CONSTRAINT "Child_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
