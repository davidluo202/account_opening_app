ALTER TABLE `bank_accounts` ADD `accountType` enum('saving','current','others');--> statement-breakpoint
ALTER TABLE `employment_details` ADD `liquidAsset` varchar(50);--> statement-breakpoint
ALTER TABLE `occupation_info` ADD `officeFaxNo` varchar(50);--> statement-breakpoint
ALTER TABLE `personal_detailed_info` ADD `faxNo` varchar(50);