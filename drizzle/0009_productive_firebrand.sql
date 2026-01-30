ALTER TABLE `applications` ADD `isProfessionalInvestor` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `applications` ADD `approvedRiskProfile` enum('low','medium','high');--> statement-breakpoint
ALTER TABLE `approval_records` ADD `rejectReason` text;--> statement-breakpoint
ALTER TABLE `approval_records` ADD `returnReason` text;