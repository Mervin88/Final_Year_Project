CREATE DATABASE IF NOT EXISTS `eventsync`;
USE `eventsync`;

CREATE TABLE IF NOT EXISTS `users` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `fullname` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) UNIQUE NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `role` VARCHAR(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS `events` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `created_by` VARCHAR(255) NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `title` VARCHAR(255) NOT NULL,
    `category` VARCHAR(100) NOT NULL,
    `description` TEXT,
    `event_date` DATE NOT NULL,
    `start_time` TIME NOT NULL,
    `end_time` TIME NOT NULL,
    `participants` INT NOT NULL,
    `preferred_location` VARCHAR(255),
    `budget` DECIMAL(10,2),
    `venue_type` VARCHAR(100),
    `required_capacity` INT NOT NULL,
    `parking_required` TINYINT(1) DEFAULT 0,
    `wifi_required` TINYINT(1) DEFAULT 0,
    `projector_required` TINYINT(1) DEFAULT 0,
    `catering_required` TINYINT(1) DEFAULT 0,
    `sound_system_required` TINYINT(1) DEFAULT 0,
    `stage_setup_required` TINYINT(1) DEFAULT 0,
    `other_requirements` TEXT,
    `selected_venue` VARCHAR(255),
    `timeline` TEXT NULL,
    `status` VARCHAR(50) DEFAULT 'Pending Review',
    `rejection_feedback` TEXT NULL
);

CREATE TABLE IF NOT EXISTS `venues` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL,
    `location` VARCHAR(255) NOT NULL,
    `capacity` INT NOT NULL,
    `type` VARCHAR(100) NOT NULL,
    `price` DECIMAL(10,2) NOT NULL,
    `description` TEXT,
    `parking_available` TINYINT(1) DEFAULT 0,
    `wifi_available` TINYINT(1) DEFAULT 0,
    `projector_available` TINYINT(1) DEFAULT 0,
    `catering_available` TINYINT(1) DEFAULT 0,
    `sound_system_available` TINYINT(1) DEFAULT 0,
    `stage_setup_available` TINYINT(1) DEFAULT 0,
    `status` VARCHAR(50) DEFAULT 'Pending Review',
    `rejection_feedback` TEXT NULL,
    `document_url` VARCHAR(555) NULL,
    `uploaded_by` VARCHAR(255) NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS `notifications` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `message` VARCHAR(255) NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


