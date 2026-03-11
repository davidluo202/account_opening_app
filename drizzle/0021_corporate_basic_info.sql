-- Migration: 0021_corporate_basic_info
-- Description: Add corporate_basic_info table for institutional account applications

CREATE TABLE IF NOT EXISTS `corporate_basic_info` (
  `id` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `applicationId` int NOT NULL UNIQUE,
  `companyEnglishName` varchar(255) NOT NULL,
  `companyChineseName` varchar(255),
  `natureOfEntity` varchar(100) NOT NULL,
  `natureOfBusiness` varchar(100) NOT NULL,
  `countryOfIncorporation` varchar(100) NOT NULL,
  `dateOfIncorporation` varchar(10) NOT NULL,
  `certificateOfIncorporationNo` varchar(100) NOT NULL,
  `businessRegistrationNo` varchar(100),
  `registeredAddress` text NOT NULL,
  `businessAddress` text NOT NULL,
  `officeNo` varchar(50) NOT NULL,
  `facsimileNo` varchar(50),
  `contactName` varchar(100) NOT NULL,
  `contactTitle` varchar(100) NOT NULL,
  `contactPhone` varchar(50) NOT NULL,
  `contactEmail` varchar(320) NOT NULL,
  `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updatedAt` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  INDEX `idx_applicationId` (`applicationId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
