-- Migration: 0025_add_objects_direct_marketing
-- Description: Add objectsDirectMarketing column to regulatory_declarations table

ALTER TABLE `regulatory_declarations`
  ADD COLUMN `objectsDirectMarketing` tinyint(1) NOT NULL DEFAULT 0
  AFTER `bcanConsentAccepted`;
