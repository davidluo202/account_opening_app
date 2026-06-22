-- BCAN (Broker-to-Client Assigned Number) support
-- 投资者识别码系统支持
-- CID = 客户号 (668XXX), BCAN = BSU667 + CID

-- Add client ID and BCAN fields to applications table
ALTER TABLE `applications` ADD COLUMN `clientId` VARCHAR(20) DEFAULT NULL;
ALTER TABLE `applications` ADD COLUMN `bcanCode` VARCHAR(30) DEFAULT NULL;
ALTER TABLE `applications` ADD COLUMN `bcanGeneratedAt` TIMESTAMP DEFAULT NULL;

-- Add BCAN consent to regulatory declarations
ALTER TABLE `regulatory_declarations` ADD COLUMN `bcanConsentAccepted` BOOLEAN NOT NULL DEFAULT FALSE;

-- Create CID/BCAN sequence tracker
CREATE TABLE IF NOT EXISTS `bcan_sequences` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `lastSequence` INT NOT NULL DEFAULT 0,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Initialize sequence (starting from 0, first client will be 668001)
INSERT INTO `bcan_sequences` (`lastSequence`) VALUES (0);

-- Add unique indexes
CREATE UNIQUE INDEX `idx_applications_client_id` ON `applications` (`clientId`);
CREATE UNIQUE INDEX `idx_applications_bcan` ON `applications` (`bcanCode`);
