ALTER TABLE `applications` ADD `firstApprovalStatus` enum('pending','approved','rejected') DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE `applications` ADD `firstApprovalBy` varchar(200);--> statement-breakpoint
ALTER TABLE `applications` ADD `firstApprovalByName` varchar(200);--> statement-breakpoint
ALTER TABLE `applications` ADD `firstApprovalByCeNo` varchar(20);--> statement-breakpoint
ALTER TABLE `applications` ADD `firstApprovalAt` timestamp;--> statement-breakpoint
ALTER TABLE `applications` ADD `firstApprovalComments` text;--> statement-breakpoint
ALTER TABLE `applications` ADD `secondApprovalStatus` enum('pending','approved','rejected') DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE `applications` ADD `secondApprovalBy` varchar(200);--> statement-breakpoint
ALTER TABLE `applications` ADD `secondApprovalByName` varchar(200);--> statement-breakpoint
ALTER TABLE `applications` ADD `secondApprovalByCeNo` varchar(20);--> statement-breakpoint
ALTER TABLE `applications` ADD `secondApprovalAt` timestamp;--> statement-breakpoint
ALTER TABLE `applications` ADD `secondApprovalComments` text;