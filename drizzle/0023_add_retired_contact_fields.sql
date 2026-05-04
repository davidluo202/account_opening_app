-- Migration: 0023_add_retired_contact_fields
-- Description: Add mobilePhone and correspondenceAddress to occupation_info for retired/homemaker/others

ALTER TABLE `occupation_info` ADD COLUMN `mobilePhone` VARCHAR(50) NULL AFTER `officeFaxNo`;
ALTER TABLE `occupation_info` ADD COLUMN `correspondenceAddress` TEXT NULL AFTER `mobilePhone`;
ALTER TABLE `occupation_info` MODIFY COLUMN `employmentStatus` ENUM('employed','self_employed','retired','student','housewife','others') NOT NULL;