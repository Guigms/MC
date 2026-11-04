ALTER TABLE `club_settings`
MODIFY `tagline` VARCHAR(255) NOT NULL DEFAULT 'Moto Grupo';

UPDATE `club_settings`
SET `tagline` = 'Moto Grupo'
WHERE `tagline` = 'Moto Club';
