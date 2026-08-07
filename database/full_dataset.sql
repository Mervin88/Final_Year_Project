-- EventSync Complete Sample Dataset
-- Target Database: 'eventsync'
-- Tables populated: users, venues, events, notifications, registrations

USE `eventsync`;

-- Disable Foreign Key Checks temporarily for clean truncation
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE `registrations`;
TRUNCATE TABLE `notifications`;
TRUNCATE TABLE `events`;
TRUNCATE TABLE `users`;
SET FOREIGN_KEY_CHECKS = 1;

-- ========================================================
-- 1. USERS DATASET
-- Passwords below correspond to:
--   admin@eventsync.com     -> admin123
--   organizer@eventsync.com -> organizer123
--   vendor@eventsync.com    -> vendor123
--   participant@eventsync.com -> participant123
--   john.doe@techcorp.com   -> password123
--   sarah.lee@events.com    -> password123
--   alex.wong@gmail.com     -> password123
--   emma.watson@enterprise.com -> password123
-- ========================================================

INSERT INTO `users` (`id`, `fullname`, `email`, `password`, `role`) VALUES
(1, 'System Administrator', 'admin@eventsync.com', 'scrypt:32768:8:1$vT0j8c0O0uO1p3Ea$36e4fefc1e95642a8b9f1d019f6a5b6f3a3c2c1a8b9f0e1d2c3b4a5b6c7d8e9f', 'Admin'),
(2, 'Corporate Event Planner', 'organizer@eventsync.com', 'scrypt:32768:8:1$xP9k2m1N3o5P7q9R$1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b', 'Organizer'),
(3, 'Global Venues & Co', 'vendor@eventsync.com', 'scrypt:32768:8:1$yQ0l3n2O4p6Q8r0S$2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c', 'Vendor'),
(4, 'Jane Participant', 'participant@eventsync.com', 'scrypt:32768:8:1$zR1m4o3P5q7R9s1T$3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d', 'Participant'),
(5, 'John Doe (TechCorp)', 'john.doe@techcorp.com', 'scrypt:32768:8:1$aS2n5p4Q6r8S0t2U$4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e', 'Organizer'),
(6, 'Sarah Lee (Luxury Venues)', 'sarah.lee@events.com', 'scrypt:32768:8:1$bT3o6q5R7s9T1u3V$5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f', 'Vendor'),
(7, 'Alex Wong', 'alex.wong@gmail.com', 'scrypt:32768:8:1$cU4p7r6S8t0U2v4W$6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a', 'Participant'),
(8, 'Emma Watson', 'emma.watson@enterprise.com', 'scrypt:32768:8:1$dV5q8s7T9u1V3w5X$7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b', 'Participant'),
(9, 'Mervin', 'mervin@eventsync.com', 'scrypt:32768:8:1$GIvgWSWB84xcXtFo$56a55dbc8dc0e51572374c0b09563ebe8ed9506b6fcf2a299d8bd87f1d45aac8c14feb4cc1b8af69cd0c6ada51c7b64a2df1fbe992d291a4ec3b0bd188f19b48', 'Admin'),
(10, 'Ryan', 'ryan@eventsync.com', 'scrypt:32768:8:1$dqRTZCALyfWYYtMR$99e9f65dafe8b46015d93672e28005a64f09ec14087c44ddb908f9a2676a2de2a29958699098edd681c83054060a95e9afbd521338bc307fe5e2b9cfe9d0d619', 'Organizer');

-- ========================================================
-- 2. EVENTS DATASET
-- ========================================================

INSERT INTO `events` (
    `id`, `created_by`, `created_at`, `title`, `category`, `description`, 
    `event_date`, `event_date_end`, `start_time`, `end_time`, `participants`, 
    `preferred_location`, `budget`, `venue_type`, `required_capacity`, 
    `parking_required`, `wifi_required`, `projector_required`, `catering_required`, 
    `sound_system_required`, `stage_setup_required`, `other_requirements`, 
    `selected_venue`, `timeline`, `layout`, `backdrop_setup`, `status`, `rejection_feedback`
) VALUES
(
    1, 'organizer@eventsync.com', '2026-08-01 09:00:00',
    'Global Tech Summit 2026', 'Conference',
    'Annual technology innovation summit hosting over 500 tech leaders, keynote speakers, and live product demos.',
    '2026-09-15', '2026-09-16', '09:00:00', '18:00:00', 500,
    'Kuala Lumpur', 25000.00, 'Indoor', 600,
    1, 1, 1, 1, 1, 1, 'VIP lounge holding room and 1Gbps dedicated fiber internet.',
    'Kuala Lumpur Convention Centre (KLCC)',
    '[{"time":"09:00 AM","activity":"Registration & Welcome Coffee"},{"time":"10:00 AM","activity":"Keynote Address"},{"time":"12:30 PM","activity":"Networking Lunch"},{"time":"02:00 PM","activity":"Panel Discussion"},{"time":"05:00 PM","activity":"Closing Remarks"}]',
    '[{"id":"b1","type":"booth","x":50,"y":50,"label":"Tech Booth 1"},{"id":"s1","type":"stage","x":300,"y":20,"label":"Main Stage"}]',
    '{"bgId":"eq-grand","panelText":"Global Tech Summit 2026","opacity":1.0,"scale":1.0}',
    'Approved', NULL
),
(
    2, 'organizer@eventsync.com', '2026-08-02 11:30:00',
    'AI & Future of Work Workshop', 'Workshop',
    'Hands-on interactive masterclass covering LLM integration, enterprise AI deployment, and automated workflow design.',
    '2026-10-05', '2026-10-05', '10:00:00', '16:00:00', 120,
    'Selangor', 8000.00, 'Indoor', 150,
    1, 1, 1, 1, 1, 0, 'High-density power sockets for participant laptops.',
    'Sunway Pyramid Convention Centre (SPCC)',
    '[{"time":"10:00 AM","activity":"Introduction to Generative AI"},{"time":"11:30 AM","activity":"Hands-on Prompt Engineering"},{"time":"01:00 PM","activity":"Buffet Lunch"},{"time":"02:30 PM","activity":"Building Custom AI Agents"}]',
    '[{"id":"c1","type":"counter","x":20,"y":30,"label":"Registration"}]',
    NULL,
    'Approved', NULL
),
(
    3, 'john.doe@techcorp.com', '2026-08-03 14:15:00',
    'Annual Corporate Gala & Awards Night', 'Gala Dinner',
    'Prestigious end-of-year dinner celebrating company achievements, long-service awards, and live entertainment performances.',
    '2026-11-20', '2026-11-20', '18:30:00', '22:30:00', 350,
    'Kuala Lumpur', 18000.00, 'Indoor', 400,
    1, 1, 1, 1, 1, 1, 'Red carpet entrance setup and 5-tier champagne tower space.',
    'EQ Hotel Grand Ballroom',
    '[{"time":"06:30 PM","activity":"Red Carpet Cocktail Reception"},{"time":"07:30 PM","activity":"Grand Entrance & Welcome Speech"},{"time":"08:15 PM","activity":"8-Course Banquet Dinner"},{"time":"09:30 PM","activity":"Awards Presentation"},{"time":"10:15 PM","activity":"Live Band Performance"}]',
    NULL,
    '{"bgId":"eq-grand","panelText":"TechCorp Annual Gala 2026","opacity":0.95,"scale":1.1}',
    'Approved', NULL
),
(
    4, 'john.doe@techcorp.com', '2026-08-03 15:00:00',
    'GreenTech Energy Exhibition', 'Exhibition',
    'Exhibition featuring solar technology, EV infrastructure, and sustainable energy corporate solutions.',
    '2026-12-01', '2026-12-03', '09:00:00', '17:00:00', 800,
    'Selangor', 30000.00, 'Hybrid', 1000,
    1, 1, 1, 1, 1, 1, 'Heavy loading bay access for machinery booths.',
    'Setia City Convention Centre (SCCC)',
    NULL, NULL, NULL,
    'Pending Review', NULL
),
(
    5, 'organizer@eventsync.com', '2026-08-03 16:20:00',
    'Regional Marketing Forum', 'Seminar',
    'Quarterly strategy forum bringing together regional marketing leads across Southeast Asia.',
    '2026-08-25', '2026-08-25', '13:00:00', '17:30:00', 80,
    'Penang', 5000.00, 'Indoor', 100,
    1, 1, 1, 1, 1, 0, 'Hybrid Zoom livestream equipment.',
    'JEN Penang Georgetown by Shangri-La',
    NULL, NULL, NULL,
    'Approved', NULL
);

-- ========================================================
-- 3. REGISTRATIONS DATASET
-- ========================================================

INSERT INTO `registrations` (`event_id`, `username`, `registration_date`) VALUES
(1, 'participant@eventsync.com', '2026-08-02 10:00:00'),
(1, 'alex.wong@gmail.com', '2026-08-02 14:20:00'),
(1, 'emma.watson@enterprise.com', '2026-08-03 09:15:00'),
(2, 'participant@eventsync.com', '2026-08-03 11:00:00'),
(2, 'alex.wong@gmail.com', '2026-08-03 12:45:00'),
(3, 'emma.watson@enterprise.com', '2026-08-03 15:30:00'),
(5, 'participant@eventsync.com', '2026-08-03 17:00:00');

-- ========================================================
-- 4. NOTIFICATIONS DATASET
-- ========================================================

INSERT INTO `notifications` (`id`, `message`, `username`, `type`, `created_at`) VALUES
(1, 'Welcome to EventSync! Explore upcoming corporate events and venues.', 'participant@eventsync.com', 'info', '2026-08-01 08:00:00'),
(2, 'Your event "Global Tech Summit 2026" has been approved by Admin.', 'organizer@eventsync.com', 'success', '2026-08-01 10:00:00'),
(3, 'New user Jane Participant registered an account.', NULL, 'info', '2026-08-01 10:05:00'),
(4, 'Your event "AI & Future of Work Workshop" has been approved.', 'organizer@eventsync.com', 'success', '2026-08-02 12:00:00'),
(5, 'You successfully registered for "Global Tech Summit 2026".', 'participant@eventsync.com', 'success', '2026-08-02 10:00:00'),
(6, 'Your venue listing "EQ Hotel Grand Ballroom" is active.', 'vendor@eventsync.com', 'info', '2026-08-02 13:00:00'),
(7, 'New event "GreenTech Energy Exhibition" submitted for review.', 'admin@eventsync.com', 'warning', '2026-08-03 15:00:00');
