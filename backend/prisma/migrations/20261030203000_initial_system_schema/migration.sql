-- CreateTable
CREATE TABLE IF NOT EXISTS `users` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `email` VARCHAR(254) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `role` VARCHAR(20) NOT NULL DEFAULT 'member',
    `nickname` VARCHAR(120) NOT NULL DEFAULT '',
    `phone` VARCHAR(30) NOT NULL DEFAULT '',
    `motorcycle` VARCHAR(120) NOT NULL DEFAULT '',
    `blood_type` VARCHAR(4) NOT NULL DEFAULT '',
    `birth_date` VARCHAR(30) NOT NULL DEFAULT '',
    `active` BOOLEAN NOT NULL DEFAULT true,
    `joined_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `users_email_key`(`email`),
    INDEX `users_role_active_idx`(`role`, `active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `login_attempts` (
    `identifier` VARCHAR(254) NOT NULL,
    `count` INTEGER NOT NULL DEFAULT 0,
    `locked_until` DATETIME(3) NULL,
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`identifier`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `club_settings` (
    `id` VARCHAR(32) NOT NULL DEFAULT 'club',
    `club_name` VARCHAR(160) NOT NULL DEFAULT 'Biker 85 Girls',
    `tagline` VARCHAR(255) NOT NULL DEFAULT 'Moto Club',
    `hero_title` VARCHAR(255) NOT NULL DEFAULT 'Mulheres, motores e estrada sem fim',
    `hero_subtitle` TEXT NOT NULL,
    `about_text` TEXT NOT NULL,
    `logo_url` MEDIUMTEXT NOT NULL,
    `hero_image` TEXT NOT NULL,
    `primary_color` VARCHAR(20) NOT NULL DEFAULT '#e85a9b',
    `accent_color` VARCHAR(20) NOT NULL DEFAULT '#ff2a85',
    `monthly_fee` DECIMAL(10, 2) NOT NULL DEFAULT 30.00,
    `city` VARCHAR(160) NOT NULL DEFAULT '',
    `founded_year` VARCHAR(20) NOT NULL DEFAULT '',
    `contact_email` VARCHAR(254) NOT NULL DEFAULT '',
    `contact_phone` VARCHAR(40) NOT NULL DEFAULT '',
    `instagram` VARCHAR(255) NOT NULL DEFAULT '',
    `whatsapp` VARCHAR(40) NOT NULL DEFAULT '',
    `gallery` JSON NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `events` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `type` VARCHAR(30) NOT NULL DEFAULT 'evento',
    `date` VARCHAR(30) NOT NULL,
    `location` VARCHAR(255) NOT NULL DEFAULT '',
    `description` TEXT NOT NULL,
    `image_url` MEDIUMTEXT NOT NULL,
    `created_by` VARCHAR(120) NOT NULL DEFAULT '',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `events_date_idx`(`date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `event_rsvps` (
    `event_id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `event_rsvps_user_id_idx`(`user_id`),
    PRIMARY KEY (`event_id`, `user_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `payments` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `year` INTEGER NOT NULL,
    `month` INTEGER NOT NULL,
    `paid` BOOLEAN NOT NULL DEFAULT false,
    `amount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `paid_at` DATETIME(3) NULL,

    INDEX `payments_year_month_paid_idx`(`year`, `month`, `paid`),
    UNIQUE INDEX `payments_user_id_year_month_key`(`user_id`, `year`, `month`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `applications` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `email` VARCHAR(254) NOT NULL,
    `whatsapp` VARCHAR(30) NOT NULL,
    `age` INTEGER NULL,
    `height` VARCHAR(20) NOT NULL DEFAULT '',
    `blood_type` VARCHAR(4) NOT NULL DEFAULT '',
    `city` VARCHAR(120) NOT NULL,
    `profession` VARCHAR(120) NOT NULL DEFAULT '',
    `instagram` VARCHAR(80) NOT NULL DEFAULT '',
    `has_motorcycle` BOOLEAN NOT NULL DEFAULT false,
    `motorcycle_model` VARCHAR(120) NOT NULL DEFAULT '',
    `riding_since` VARCHAR(80) NOT NULL DEFAULT '',
    `styles` JSON NOT NULL,
    `frequency` VARCHAR(80) NOT NULL DEFAULT '',
    `other_group` BOOLEAN NOT NULL DEFAULT false,
    `reason` TEXT NOT NULL,
    `commit_events` BOOLEAN NOT NULL DEFAULT false,
    `has_cnh_a` BOOLEAN NOT NULL DEFAULT false,
    `status` VARCHAR(20) NOT NULL DEFAULT 'pending',
    `note` TEXT NOT NULL,
    `reviewed_by` VARCHAR(120) NOT NULL DEFAULT '',
    `reviewed_at` DATETIME(3) NULL,
    `user_id` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `applications_user_id_key`(`user_id`),
    INDEX `applications_email_status_idx`(`email`, `status`),
    INDEX `applications_status_created_at_idx`(`status`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `products` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `description` TEXT NOT NULL,
    `image_url` MEDIUMTEXT NOT NULL,
    `price` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `sizes` JSON NOT NULL,
    `deadline` VARCHAR(10) NOT NULL DEFAULT '',
    `active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `products_active_created_at_idx`(`active`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `product_orders` (
    `id` VARCHAR(191) NOT NULL,
    `product_id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `want` BOOLEAN NOT NULL DEFAULT false,
    `size` VARCHAR(40) NOT NULL DEFAULT '',
    `quantity` INTEGER NOT NULL DEFAULT 0,
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `product_orders_user_id_idx`(`user_id`),
    UNIQUE INDEX `product_orders_product_id_user_id_key`(`product_id`, `user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `event_rsvps` ADD CONSTRAINT `event_rsvps_event_id_fkey` FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `event_rsvps` ADD CONSTRAINT `event_rsvps_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payments` ADD CONSTRAINT `payments_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `applications` ADD CONSTRAINT `applications_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `product_orders` ADD CONSTRAINT `product_orders_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `product_orders` ADD CONSTRAINT `product_orders_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
