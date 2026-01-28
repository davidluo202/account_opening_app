CREATE TABLE `account_selections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`applicationId` int NOT NULL,
	`customerType` enum('individual','joint','corporate') NOT NULL,
	`accountType` enum('cash','margin','derivatives') NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `account_selections_id` PRIMARY KEY(`id`),
	CONSTRAINT `account_selections_applicationId_unique` UNIQUE(`applicationId`)
);
--> statement-breakpoint
CREATE TABLE `applications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`applicationNumber` varchar(50),
	`status` enum('draft','submitted','under_review','approved','rejected') NOT NULL DEFAULT 'draft',
	`currentStep` int NOT NULL DEFAULT 1,
	`completedSteps` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`submittedAt` timestamp,
	CONSTRAINT `applications_id` PRIMARY KEY(`id`),
	CONSTRAINT `applications_applicationNumber_unique` UNIQUE(`applicationNumber`)
);
--> statement-breakpoint
CREATE TABLE `bank_accounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`applicationId` int NOT NULL,
	`bankName` varchar(200) NOT NULL,
	`accountCurrency` varchar(10) NOT NULL,
	`accountNumber` varchar(100) NOT NULL,
	`accountHolderName` varchar(200) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bank_accounts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `email_verification_codes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`code` varchar(6) NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`verified` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `email_verification_codes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `employment_details` (
	`id` int AUTO_INCREMENT NOT NULL,
	`applicationId` int NOT NULL,
	`incomeSource` varchar(100) NOT NULL,
	`annualIncome` varchar(50) NOT NULL,
	`netWorth` varchar(50) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `employment_details_id` PRIMARY KEY(`id`),
	CONSTRAINT `employment_details_applicationId_unique` UNIQUE(`applicationId`)
);
--> statement-breakpoint
CREATE TABLE `face_verification` (
	`id` int AUTO_INCREMENT NOT NULL,
	`applicationId` int NOT NULL,
	`verified` boolean NOT NULL DEFAULT false,
	`verificationData` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `face_verification_id` PRIMARY KEY(`id`),
	CONSTRAINT `face_verification_applicationId_unique` UNIQUE(`applicationId`)
);
--> statement-breakpoint
CREATE TABLE `financial_and_investment` (
	`id` int AUTO_INCREMENT NOT NULL,
	`applicationId` int NOT NULL,
	`investmentObjectives` text NOT NULL,
	`investmentExperience` text NOT NULL,
	`riskTolerance` varchar(50) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `financial_and_investment_id` PRIMARY KEY(`id`),
	CONSTRAINT `financial_and_investment_applicationId_unique` UNIQUE(`applicationId`)
);
--> statement-breakpoint
CREATE TABLE `occupation_info` (
	`id` int AUTO_INCREMENT NOT NULL,
	`applicationId` int NOT NULL,
	`employmentStatus` enum('employed','self_employed','student','unemployed') NOT NULL,
	`companyName` varchar(200),
	`position` varchar(100),
	`yearsOfService` int,
	`industry` varchar(100),
	`companyAddress` text,
	`officePhone` varchar(50),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `occupation_info_id` PRIMARY KEY(`id`),
	CONSTRAINT `occupation_info_applicationId_unique` UNIQUE(`applicationId`)
);
--> statement-breakpoint
CREATE TABLE `personal_basic_info` (
	`id` int AUTO_INCREMENT NOT NULL,
	`applicationId` int NOT NULL,
	`chineseName` varchar(100) NOT NULL,
	`englishName` varchar(200) NOT NULL,
	`gender` enum('male','female','other') NOT NULL,
	`dateOfBirth` varchar(10) NOT NULL,
	`placeOfBirth` varchar(200) NOT NULL,
	`nationality` varchar(100) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `personal_basic_info_id` PRIMARY KEY(`id`),
	CONSTRAINT `personal_basic_info_applicationId_unique` UNIQUE(`applicationId`)
);
--> statement-breakpoint
CREATE TABLE `personal_detailed_info` (
	`id` int AUTO_INCREMENT NOT NULL,
	`applicationId` int NOT NULL,
	`idType` varchar(50) NOT NULL,
	`idNumber` varchar(100) NOT NULL,
	`idIssuingPlace` varchar(200) NOT NULL,
	`idExpiryDate` varchar(10),
	`idIsPermanent` boolean NOT NULL DEFAULT false,
	`maritalStatus` varchar(50) NOT NULL,
	`educationLevel` varchar(50) NOT NULL,
	`email` varchar(320) NOT NULL,
	`phoneCountryCode` varchar(10) NOT NULL,
	`phoneNumber` varchar(50) NOT NULL,
	`residentialAddress` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `personal_detailed_info_id` PRIMARY KEY(`id`),
	CONSTRAINT `personal_detailed_info_applicationId_unique` UNIQUE(`applicationId`)
);
--> statement-breakpoint
CREATE TABLE `regulatory_declarations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`applicationId` int NOT NULL,
	`isPEP` boolean NOT NULL,
	`isUSPerson` boolean NOT NULL,
	`agreementRead` boolean NOT NULL DEFAULT false,
	`agreementAccepted` boolean NOT NULL DEFAULT false,
	`signatureName` varchar(200) NOT NULL,
	`electronicSignatureConsent` boolean NOT NULL DEFAULT false,
	`amlComplianceConsent` boolean NOT NULL DEFAULT false,
	`signedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `regulatory_declarations_id` PRIMARY KEY(`id`),
	CONSTRAINT `regulatory_declarations_applicationId_unique` UNIQUE(`applicationId`)
);
--> statement-breakpoint
CREATE TABLE `tax_info` (
	`id` int AUTO_INCREMENT NOT NULL,
	`applicationId` int NOT NULL,
	`taxResidency` varchar(100) NOT NULL,
	`taxIdNumber` varchar(100) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tax_info_id` PRIMARY KEY(`id`),
	CONSTRAINT `tax_info_applicationId_unique` UNIQUE(`applicationId`)
);
--> statement-breakpoint
CREATE TABLE `uploaded_documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`applicationId` int NOT NULL,
	`documentType` varchar(50) NOT NULL,
	`fileKey` varchar(500) NOT NULL,
	`fileUrl` varchar(1000) NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`mimeType` varchar(100),
	`fileSize` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `uploaded_documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `emailVerified` boolean DEFAULT false NOT NULL;