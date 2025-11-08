-- ETAP 3: Działy/Grafiki (Departments)
-- Manual migration to be executed in Supabase SQL Editor

-- 1. Create Department table
CREATE TABLE "Department" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "roleTag" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#3B82F6',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

-- 2. Add departmentId to Membership table
ALTER TABLE "Membership" ADD COLUMN "departmentId" TEXT;

-- 3. Add departmentId to Shift table
ALTER TABLE "Shift" ADD COLUMN "departmentId" TEXT;

-- 4. Create foreign key constraints
ALTER TABLE "Department" ADD CONSTRAINT "Department_restaurantId_fkey" 
    FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Membership" ADD CONSTRAINT "Membership_departmentId_fkey" 
    FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Shift" ADD CONSTRAINT "Shift_departmentId_fkey" 
    FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 5. Create indexes
CREATE UNIQUE INDEX "Department_restaurantId_roleTag_key" ON "Department"("restaurantId", "roleTag");
CREATE INDEX "Department_restaurantId_idx" ON "Department"("restaurantId");
CREATE INDEX "Membership_departmentId_idx" ON "Membership"("departmentId");
CREATE INDEX "Shift_departmentId_idx" ON "Shift"("departmentId");

-- 6. Create trigger for updatedAt
CREATE OR REPLACE FUNCTION update_department_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER department_updated_at
    BEFORE UPDATE ON "Department"
    FOR EACH ROW
    EXECUTE FUNCTION update_department_updated_at();

-- Migration complete! 
-- Next: Run `pnpm prisma generate` in terminal to update Prisma Client
