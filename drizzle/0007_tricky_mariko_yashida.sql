CREATE TABLE `approval_records` (
	`id` int AUTO_INCREMENT NOT NULL,
	`applicationId` int NOT NULL,
	`approverId` int NOT NULL,
	`action` enum('approved','rejected','returned') NOT NULL,
	`comments` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `approval_records_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `approvers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`employeeName` varchar(200) NOT NULL,
	`ceNumber` varchar(50) NOT NULL,
	`role` varchar(50) NOT NULL DEFAULT 'approver',
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `approvers_id` PRIMARY KEY(`id`),
	CONSTRAINT `approvers_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
ALTER TABLE `applications` MODIFY COLUMN `status` enum('draft','submitted','under_review','approved','rejected','returned') NOT NULL DEFAULT 'draft';