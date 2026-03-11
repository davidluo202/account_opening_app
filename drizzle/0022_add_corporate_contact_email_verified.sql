-- Add contactEmailVerified to corporate_basic_info
ALTER TABLE `corporate_basic_info`
  ADD COLUMN `contactEmailVerified` boolean NOT NULL DEFAULT false;
