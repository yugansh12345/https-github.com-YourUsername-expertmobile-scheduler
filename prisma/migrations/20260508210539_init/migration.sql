-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'BOOKER', 'INSTALLER');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('pending', 'confirmed', 'on_the_way', 'in_progress', 'completed', 'cancelled', 'no_show');

-- CreateEnum
CREATE TYPE "PhotoType" AS ENUM ('BEFORE', 'AFTER', 'ISSUE', 'EQUIPMENT_LABEL');

-- CreateEnum
CREATE TYPE "CustomerType" AS ENUM ('residential', 'commercial', 'industrial', 'fleet');

-- CreateEnum
CREATE TYPE "VehicleType" AS ENUM ('heavy_truck', 'light_truck', 'pickup', 'sedan', 'suv', 'rv', 'motorhome', 'fifth_wheel', 'boat', 'heavy_equipment', 'fleet_vehicle', 'atv_side_by_side', 'other');

-- CreateEnum
CREATE TYPE "EquipmentType" AS ENUM ('radio', 'booster', 'eld', 'gps_tracker', 'satellite', 'antenna', 'repeater', 'other');

-- CreateEnum
CREATE TYPE "ServiceCategory" AS ENUM ('two_way_radio', 'poc_radio', 'cell_booster', 'fleet_tracking_eld', 'satellite');

-- CreateEnum
CREATE TYPE "SkillType" AS ENUM ('radio', 'booster', 'eld', 'satellite', 'antenna', 'poc');

-- CreateEnum
CREATE TYPE "TimeOffStatus" AS ENUM ('pending', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "AnnouncementAudience" AS ENUM ('ALL', 'INSTALLERS', 'BOOKERS');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "hashedPassword" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'BOOKER',
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT true,
    "twoFactorRequired" BOOLEAN NOT NULL DEFAULT false,
    "twoFactorSecret" TEXT,
    "twoFactorVerified" BOOLEAN NOT NULL DEFAULT false,
    "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
    "lastLoginAt" TIMESTAMP(3),
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Installer" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "serviceAreaPostalCodes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "skills" "SkillType"[] DEFAULT ARRAY[]::"SkillType"[],
    "vehicleAssigned" TEXT,
    "defaultWorkingHours" JSONB,
    "intrinsicallySafeCert" BOOLEAN NOT NULL DEFAULT false,
    "bio" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'America/Edmonton',

    CONSTRAINT "Installer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Booker" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "location" TEXT,

    CONSTRAINT "Booker_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordResetEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "resetByAdminId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "city" TEXT,
    "province" TEXT DEFAULT 'AB',
    "postalCode" TEXT,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "customerType" "CustomerType" NOT NULL DEFAULT 'residential',
    "accountNumber" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vehicle" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "vehicleType" "VehicleType" NOT NULL,
    "year" INTEGER,
    "make" TEXT,
    "model" TEXT,
    "trim" TEXT,
    "color" TEXT,
    "vin" TEXT,
    "licensePlate" TEXT,
    "fleetUnitNumber" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Equipment" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "vehicleId" TEXT,
    "equipmentType" "EquipmentType" NOT NULL,
    "brand" TEXT,
    "model" TEXT,
    "serialNumber" TEXT,
    "frequencies" TEXT,
    "installLocation" TEXT,
    "installedAt" TIMESTAMP(3),
    "bookingId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Equipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Service" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "ServiceCategory" NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "basePrice" DECIMAL(10,2) NOT NULL,
    "description" TEXT,
    "requiredSkills" "SkillType"[] DEFAULT ARRAY[]::"SkillType"[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "installerId" TEXT NOT NULL,
    "bookerId" TEXT NOT NULL,
    "vehicleId" TEXT,
    "scheduledStart" TIMESTAMP(3) NOT NULL,
    "scheduledEnd" TIMESTAMP(3) NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'pending',
    "notes" TEXT,
    "internalNotes" TEXT,
    "totalPrice" DECIMAL(10,2),
    "address" TEXT,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "isAfterHours" BOOLEAN NOT NULL DEFAULT false,
    "timezone" TEXT NOT NULL DEFAULT 'America/Edmonton',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingService" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "priceOverride" DECIMAL(10,2),

    CONSTRAINT "BookingService_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingPhoto" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" "PhotoType" NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookingPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingSignature" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "signatureUrl" TEXT NOT NULL,
    "signedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "signerName" TEXT,

    CONSTRAINT "BookingSignature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimeOff" (
    "id" TEXT NOT NULL,
    "installerId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" "TimeOffStatus" NOT NULL DEFAULT 'pending',
    "reason" TEXT,
    "reviewedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TimeOff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Holiday" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "name" TEXT NOT NULL,
    "province" TEXT NOT NULL DEFAULT 'AB',

    CONSTRAINT "Holiday_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessSettings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "businessStartTime" TEXT NOT NULL DEFAULT '08:00',
    "businessEndTime" TEXT NOT NULL DEFAULT '17:00',
    "slotIncrementMins" INTEGER NOT NULL DEFAULT 30,
    "bufferBetweenJobs" INTEGER NOT NULL DEFAULT 30,
    "travelMultiplier" DOUBLE PRECISION NOT NULL DEFAULT 1.5,
    "serviceAreaCodes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VehicleMakeCache" (
    "id" TEXT NOT NULL,
    "vehicleType" TEXT NOT NULL,
    "makeId" INTEGER NOT NULL,
    "makeName" TEXT NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VehicleMakeCache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VehicleModelCache" (
    "id" TEXT NOT NULL,
    "makeId" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "modelName" TEXT NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VehicleModelCache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Announcement" (
    "id" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "audience" "AnnouncementAudience" NOT NULL DEFAULT 'ALL',
    "createdById" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Supplier" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "brands" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "website" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_username_idx" ON "User"("username");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_isActive_idx" ON "User"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Installer_userId_key" ON "Installer"("userId");

-- CreateIndex
CREATE INDEX "Installer_userId_idx" ON "Installer"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Booker_userId_key" ON "Booker"("userId");

-- CreateIndex
CREATE INDEX "Booker_userId_idx" ON "Booker"("userId");

-- CreateIndex
CREATE INDEX "PasswordResetEvent_userId_idx" ON "PasswordResetEvent"("userId");

-- CreateIndex
CREATE INDEX "Customer_name_idx" ON "Customer"("name");

-- CreateIndex
CREATE INDEX "Customer_email_idx" ON "Customer"("email");

-- CreateIndex
CREATE INDEX "Customer_postalCode_idx" ON "Customer"("postalCode");

-- CreateIndex
CREATE INDEX "Customer_customerType_idx" ON "Customer"("customerType");

-- CreateIndex
CREATE INDEX "Vehicle_customerId_idx" ON "Vehicle"("customerId");

-- CreateIndex
CREATE INDEX "Vehicle_vin_idx" ON "Vehicle"("vin");

-- CreateIndex
CREATE INDEX "Vehicle_licensePlate_idx" ON "Vehicle"("licensePlate");

-- CreateIndex
CREATE INDEX "Equipment_customerId_idx" ON "Equipment"("customerId");

-- CreateIndex
CREATE INDEX "Equipment_vehicleId_idx" ON "Equipment"("vehicleId");

-- CreateIndex
CREATE INDEX "Equipment_serialNumber_idx" ON "Equipment"("serialNumber");

-- CreateIndex
CREATE INDEX "Equipment_equipmentType_idx" ON "Equipment"("equipmentType");

-- CreateIndex
CREATE INDEX "Service_category_idx" ON "Service"("category");

-- CreateIndex
CREATE INDEX "Service_isActive_idx" ON "Service"("isActive");

-- CreateIndex
CREATE INDEX "Booking_customerId_idx" ON "Booking"("customerId");

-- CreateIndex
CREATE INDEX "Booking_installerId_idx" ON "Booking"("installerId");

-- CreateIndex
CREATE INDEX "Booking_bookerId_idx" ON "Booking"("bookerId");

-- CreateIndex
CREATE INDEX "Booking_status_idx" ON "Booking"("status");

-- CreateIndex
CREATE INDEX "Booking_scheduledStart_idx" ON "Booking"("scheduledStart");

-- CreateIndex
CREATE INDEX "Booking_scheduledEnd_idx" ON "Booking"("scheduledEnd");

-- CreateIndex
CREATE INDEX "BookingService_bookingId_idx" ON "BookingService"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "BookingService_bookingId_serviceId_key" ON "BookingService"("bookingId", "serviceId");

-- CreateIndex
CREATE INDEX "BookingPhoto_bookingId_idx" ON "BookingPhoto"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "BookingSignature_bookingId_key" ON "BookingSignature"("bookingId");

-- CreateIndex
CREATE INDEX "TimeOff_installerId_idx" ON "TimeOff"("installerId");

-- CreateIndex
CREATE INDEX "TimeOff_status_idx" ON "TimeOff"("status");

-- CreateIndex
CREATE INDEX "TimeOff_startDate_idx" ON "TimeOff"("startDate");

-- CreateIndex
CREATE INDEX "Holiday_date_idx" ON "Holiday"("date");

-- CreateIndex
CREATE INDEX "Holiday_province_idx" ON "Holiday"("province");

-- CreateIndex
CREATE UNIQUE INDEX "Holiday_date_province_key" ON "Holiday"("date", "province");

-- CreateIndex
CREATE INDEX "VehicleMakeCache_vehicleType_idx" ON "VehicleMakeCache"("vehicleType");

-- CreateIndex
CREATE UNIQUE INDEX "VehicleMakeCache_vehicleType_makeId_key" ON "VehicleMakeCache"("vehicleType", "makeId");

-- CreateIndex
CREATE INDEX "VehicleModelCache_makeId_year_idx" ON "VehicleModelCache"("makeId", "year");

-- CreateIndex
CREATE UNIQUE INDEX "VehicleModelCache_makeId_year_modelName_key" ON "VehicleModelCache"("makeId", "year", "modelName");

-- CreateIndex
CREATE INDEX "Announcement_audience_idx" ON "Announcement"("audience");

-- CreateIndex
CREATE INDEX "Announcement_createdAt_idx" ON "Announcement"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Supplier_name_key" ON "Supplier"("name");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Installer" ADD CONSTRAINT "Installer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booker" ADD CONSTRAINT "Booker_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordResetEvent" ADD CONSTRAINT "PasswordResetEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordResetEvent" ADD CONSTRAINT "PasswordResetEvent_resetByAdminId_fkey" FOREIGN KEY ("resetByAdminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Equipment" ADD CONSTRAINT "Equipment_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Equipment" ADD CONSTRAINT "Equipment_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Equipment" ADD CONSTRAINT "Equipment_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_installerId_fkey" FOREIGN KEY ("installerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_bookerId_fkey" FOREIGN KEY ("bookerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingService" ADD CONSTRAINT "BookingService_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingService" ADD CONSTRAINT "BookingService_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingPhoto" ADD CONSTRAINT "BookingPhoto_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingPhoto" ADD CONSTRAINT "BookingPhoto_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingSignature" ADD CONSTRAINT "BookingSignature_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeOff" ADD CONSTRAINT "TimeOff_installerId_fkey" FOREIGN KEY ("installerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
