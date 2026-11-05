ALTER TABLE `users`
ADD COLUMN `has_food_restriction` BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN `food_restriction_details` VARCHAR(1000) NOT NULL DEFAULT '';
