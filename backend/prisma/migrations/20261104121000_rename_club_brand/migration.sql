ALTER TABLE `club_settings`
MODIFY `club_name` VARCHAR(160) NOT NULL DEFAULT 'Biker Girls 85';

UPDATE `club_settings`
SET `club_name` = 'Biker Girls 85'
WHERE `club_name` = 'Biker 85 Girls';
