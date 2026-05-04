-- Migration: 0024_add_personal_client_declarations
-- Description: Add personal_client_declarations table for individual account declaration

CREATE TABLE IF NOT EXISTS `personal_client_declarations` (
  `id` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `applicationId` int NOT NULL UNIQUE,
  `qAUltimateBeneficialOwner` varchar(10) NOT NULL DEFAULT '',
  `qAOwnerName` varchar(200) DEFAULT '',
  `qAIdPassportNo` varchar(100) DEFAULT '',
  `qACountryOfIssue` varchar(100) DEFAULT '',
  `qAAddress` text,
  `qBSfcRegistration` varchar(10) NOT NULL DEFAULT '',
  `qBInstitutionName` varchar(200) DEFAULT '',
  `nationality` varchar(100) NOT NULL DEFAULT '',
  `birthCountry` varchar(100) NOT NULL DEFAULT '',
  `taxCountry` varchar(100) NOT NULL DEFAULT '',
  `qDPEP` varchar(10) NOT NULL DEFAULT '',
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;