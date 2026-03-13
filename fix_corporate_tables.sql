-- Run this SQL in your Railway MySQL database to fix the missing tables error

-- Create corporate_financial_info table
CREATE TABLE IF NOT EXISTS `corporate_financial_info` (
  `id` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `applicationId` int NOT NULL UNIQUE,
  `authorizedShareCapital` text NOT NULL,
  `issuedShareCapital` text NOT NULL,
  `initialSourceOfWealth` text NOT NULL,
  `netAssetValue` varchar(100) NOT NULL,
  `netAssetAuditDate` varchar(20) DEFAULT NULL,
  `profitAfterTax` varchar(100) NOT NULL,
  `profitAuditDate` varchar(20) DEFAULT NULL,
  `assetItems` text NOT NULL,
  `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updatedAt` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  INDEX `idx_applicationId` (`applicationId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create corporate_related_parties table
CREATE TABLE IF NOT EXISTS `corporate_related_parties` (
  `id` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `applicationId` int NOT NULL UNIQUE,
  `relatedParties` text NOT NULL,
  `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updatedAt` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  INDEX `idx_applicationId` (`applicationId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
