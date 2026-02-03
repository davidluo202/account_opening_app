ALTER TABLE `applications` ADD `firstApprovalIsProfessionalInvestor` boolean;--> statement-breakpoint
ALTER TABLE `applications` ADD `firstApprovalRiskProfile` enum('R1','R2','R3','R4','R5');