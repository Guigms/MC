ALTER TABLE `applications`
ADD COLUMN `has_medication_allergy` BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN `medication_allergy_details` VARCHAR(1000) NOT NULL DEFAULT '';
