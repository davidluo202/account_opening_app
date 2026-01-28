CREATE TABLE `application_number_sequences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`date` varchar(6) NOT NULL,
	`lastSequence` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `application_number_sequences_id` PRIMARY KEY(`id`),
	CONSTRAINT `application_number_sequences_date_unique` UNIQUE(`date`)
);
