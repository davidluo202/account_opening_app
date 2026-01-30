ALTER TABLE `applications` ADD `signatureName` varchar(200);--> statement-breakpoint
ALTER TABLE `applications` ADD `signatureTimestamp` timestamp;--> statement-breakpoint
ALTER TABLE `applications` ADD `signatureMethod` enum('typed','iamsmart');