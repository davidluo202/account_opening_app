CREATE TABLE `customer_declarations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`applicationId` int NOT NULL,
	`declaration_a_is_beneficial_owner` boolean NOT NULL,
	`declaration_a_owner_name` varchar(200),
	`declaration_a_owner_id` varchar(100),
	`declaration_a_owner_country` varchar(100),
	`declaration_a_owner_address` text,
	`declaration_b_is_employee` boolean NOT NULL,
	`declaration_b_institution_name` varchar(300),
	`declaration_c_is_cmf_employee` boolean NOT NULL,
	`declaration_d_is_relative` boolean NOT NULL,
	`declaration_d_employee_name` varchar(200),
	`declaration_d_relationship` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `customer_declarations_id` PRIMARY KEY(`id`),
	CONSTRAINT `customer_declarations_applicationId_unique` UNIQUE(`applicationId`)
);
--> statement-breakpoint
CREATE TABLE `risk_questionnaires` (
	`id` int AUTO_INCREMENT NOT NULL,
	`applicationId` int NOT NULL,
	`q1_current_investments` text,
	`q2_investment_period` varchar(50),
	`q3_price_volatility` varchar(50),
	`q4_investment_percentage` varchar(50),
	`q5_investment_attitude` varchar(100),
	`q6_derivatives_knowledge` text,
	`q7_age_group` varchar(50),
	`q8_education_level` varchar(50),
	`q9_investment_knowledge_sources` text,
	`q10_liquidity_needs` varchar(100),
	`totalScore` int,
	`riskLevel` varchar(50),
	`customerSignature` varchar(200),
	`signatureDate` varchar(10),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `risk_questionnaires_id` PRIMARY KEY(`id`),
	CONSTRAINT `risk_questionnaires_applicationId_unique` UNIQUE(`applicationId`)
);
--> statement-breakpoint
ALTER TABLE `personal_detailed_info` MODIFY COLUMN `phoneCountryCode` varchar(10);--> statement-breakpoint
ALTER TABLE `personal_detailed_info` MODIFY COLUMN `phoneNumber` varchar(50);--> statement-breakpoint
ALTER TABLE `personal_detailed_info` ADD `mobileCountryCode` varchar(10) NOT NULL;--> statement-breakpoint
ALTER TABLE `personal_detailed_info` ADD `mobileNumber` varchar(50) NOT NULL;--> statement-breakpoint
ALTER TABLE `personal_detailed_info` ADD `billingAddressType` enum('residential','office','other') NOT NULL;--> statement-breakpoint
ALTER TABLE `personal_detailed_info` ADD `billingAddressOther` text;--> statement-breakpoint
ALTER TABLE `personal_detailed_info` ADD `preferredLanguage` enum('chinese','english') NOT NULL;