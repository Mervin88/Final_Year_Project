-- EventSync Corporate Venues Dataset
-- Target: 'venues' table in database 'eventsync'
-- Copy and execute inside phpMyAdmin SQL tab to populate the venue listings.

-- Clear existing entries first to avoid duplicates
TRUNCATE TABLE `venues`;

INSERT INTO `venues` (
    `name`, 
    `location`, 
    `capacity`, 
    `type`, 
    `price`, 
    `description`, 
    `parking_available`, 
    `wifi_available`, 
    `projector_available`, 
    `catering_available`, 
    `sound_system_available`, 
    `stage_setup_available`, 
    `status`, 
    `uploaded_by`
) VALUES
-- Kuala Lumpur Venues
('Kuala Lumpur Convention Centre (KLCC)', 'Kuala Lumpur', 5000, 'Indoor', 15000.00, 'Malaysia premier award-winning convention centre, offering state-of-the-art halls adjacent to the Petronas Twin Towers.', 1, 1, 1, 1, 1, 1, 'Approved', 'System Catalog'),
('EQ Hotel Grand Ballroom', 'Kuala Lumpur', 800, 'Indoor', 9500.00, 'Ultra-luxury ballroom in central KL featuring stunning high-resolution LED screens, advanced audio-visual controls, and premium catering.', 1, 1, 1, 1, 1, 1, 'Approved', 'System Catalog'),
('MITEC Kuala Lumpur', 'Kuala Lumpur', 8000, 'Indoor', 22000.00, 'Malaysias largest exhibition centre, boasting massive column-free halls, high ceilings, and comprehensive heavy-machinery loading bays.', 1, 1, 1, 1, 1, 1, 'Approved', 'System Catalog'),
('Mandarin Oriental Grand Ballroom', 'Kuala Lumpur', 1200, 'Indoor', 18000.00, 'Elegant ballroom overlooking the KLCC Park. Offers customizable crystal chandeliers, carpeted floors, and fine dining menus.', 1, 1, 1, 1, 1, 1, 'Approved', 'System Catalog'),
('W Kuala Lumpur Great Room', 'Kuala Lumpur', 700, 'Indoor', 14000.00, 'Vibrant and modern ballroom featuring high-ceiling colorful LED light pillars, perfect for high-profile product launches and corporate galas.', 1, 1, 1, 1, 1, 1, 'Approved', 'System Catalog'),
('The Majestic Hotel Ballroom', 'Kuala Lumpur', 1000, 'Indoor', 11000.00, 'Classic colonial-style ballroom offering retro-chic heritage styling, gold-leaf ceilings, and classic butler service.', 1, 1, 1, 1, 1, 1, 'Approved', 'System Catalog'),
('Hilton KL Grand Ballroom', 'Kuala Lumpur', 900, 'Indoor', 10000.00, 'Premium venue situated next to KL Sentral. Equipped with customizable mood lighting and professional event tech assistants.', 1, 1, 1, 1, 1, 1, 'Approved', 'System Catalog'),
('Perdana Botanical Garden Lawn', 'Kuala Lumpur', 500, 'Outdoor', 4500.00, 'Open-air lush green botanical gardens, ideal for outdoor corporate networking activities, team building, and garden dining.', 1, 0, 0, 0, 0, 0, 'Approved', 'System Catalog'),

-- Selangor Venues
('Sunway Pyramid Convention Centre (SPCC)', 'Selangor', 3500, 'Indoor', 13500.00, 'Conveniently linked to Sunway Resort Hotel and Sunway Pyramid mall, offering flexible configurations for large-scale corporate summits.', 1, 1, 1, 1, 1, 1, 'Approved', 'System Catalog'),
('Setia City Convention Centre (SCCC)', 'Selangor', 2000, 'Hybrid', 8000.00, 'Eco-friendly convention center in Setia Alam featuring modern architectural panels and a scenic outdoor garden backdrop.', 1, 1, 1, 1, 1, 1, 'Approved', 'System Catalog'),
('Palace of the Golden Horses Royal Ballroom', 'Selangor', 1500, 'Indoor', 9000.00, 'Stately ballroom with Moorish architecture and hand-carved solid wood features, overlooking a scenic recreational lake.', 1, 1, 1, 1, 1, 1, 'Approved', 'System Catalog'),
('Cyberview Resort & Spa Garden', 'Selangor', 400, 'Hybrid', 6000.00, 'Tranquil resort grounds in Cyberjaya featuring landscaped gardens, tropical chalets, and private outdoor event spaces.', 1, 1, 0, 1, 1, 0, 'Approved', 'System Catalog'),
('Mines International Exhibition Centre (MIECC)', 'Selangor', 6000, 'Indoor', 16000.00, 'Huge venue ideal for trade shows, industrial expos, corporate training seminars, and large public gatherings.', 1, 1, 1, 1, 1, 1, 'Approved', 'System Catalog'),
('Glenmarie Golf Resort Hall', 'Selangor', 500, 'Indoor', 5500.00, 'Overlooks beautiful championship golf course fairways. Perfect for corporate golf tournament dinners and business forums.', 1, 1, 1, 1, 1, 1, 'Approved', 'System Catalog'),

-- Penang Venues
('Setia SPICE Convention Centre', 'Penang', 4000, 'Indoor', 12500.00, 'The world s first hybrid solar-powered convention center, located in Bayan Lepas, offering eco-certified meeting spaces.', 1, 1, 1, 1, 1, 1, 'Approved', 'System Catalog'),
('Eastern & Oriental (E&O) Hotel Hall', 'Penang', 600, 'Indoor', 9500.00, 'UNESCO heritage-zone luxury hotel offering classic colonial architecture, sea breezes, and white-glove dining setups.', 1, 1, 1, 1, 1, 1, 'Approved', 'System Catalog'),
('Gurney Paragon Exhibition Hall', 'Penang', 1000, 'Indoor', 7000.00, 'Modern indoor space integrated inside Gurney Paragon Mall, convenient for consumer product launches and media previews.', 1, 1, 1, 0, 1, 1, 'Approved', 'System Catalog'),

-- Johor Venues
('Persada Johor International Convention Centre', 'Johor', 3000, 'Indoor', 9000.00, 'Located in the heart of Johor Bahru, this convention center is the premier destination for regional business events and summits.', 1, 1, 1, 1, 1, 1, 'Approved', 'System Catalog'),
('KSL Hotel & Resort Ballroom', 'Johor', 1000, 'Indoor', 6500.00, 'Spacious ballroom located centrally in Johor Bahru. Offers modern lighting, stage rigs, and proximity to city center shopping.', 1, 1, 1, 1, 1, 1, 'Approved', 'System Catalog'),
('Thistle Johor Bahru Grand Ballroom', 'Johor', 800, 'Indoor', 5500.00, 'Features panoramic views of the Straits of Johor, with contemporary styling and customizable corporate delegate packages.', 1, 1, 1, 1, 1, 1, 'Approved', 'System Catalog'),

-- Sabah Venues
('Sabah International Convention Centre (SICC)', 'Sabah', 5000, 'Indoor', 14000.00, 'State-of-the-art waterfront convention centre in Kota Kinabalu, offering column-free halls and panoramic views of the South China Sea.', 1, 1, 1, 1, 1, 1, 'Approved', 'System Catalog'),
('The Magellan Sutera Resort Grand Ballroom', 'Sabah', 1000, 'Indoor', 8500.00, 'Part of the luxurious Sutera Harbour Resort, offering Magellan-themed grand setups, excellent catering, and garden walkways.', 1, 1, 1, 1, 1, 1, 'Approved', 'System Catalog'),

-- Sarawak Venues
('Borneo Convention Centre Kuching (BCCK)', 'Sarawak', 3000, 'Indoor', 11000.00, 'The first purpose-built convention centre in Sarawak, known for its eco-friendly architecture and massive exhibition spaces.', 1, 1, 1, 1, 1, 1, 'Approved', 'System Catalog'),
('Pullman Kuching Grand Ballroom', 'Sarawak', 1500, 'Indoor', 9000.00, 'Located atop Hills Shopping Mall, this ballroom offers panoramic views of Kuching city and the Sarawak River.', 1, 1, 1, 1, 1, 1, 'Approved', 'System Catalog'),

-- Melaka Venues
('Hatten Hotel Melaka Grand Ballroom', 'Melaka', 800, 'Indoor', 6000.00, 'Centrally located in the heart of historical Melaka, perfect for medium-sized corporate meetings and seminars.', 1, 1, 1, 1, 1, 1, 'Approved', 'System Catalog'),
('A Famosa Resort Exhibition Hall', 'Melaka', 1500, 'Hybrid', 7500.00, 'Spacious hybrid exhibition facility ideal for large team-building events, sports days, and corporate dinners.', 1, 1, 1, 1, 1, 1, 'Approved', 'System Catalog'),

-- Kedah (Langkawi) Venues
('Langkawi International Convention Centre (LICC)', 'Kedah', 1000, 'Indoor', 9500.00, 'World-class convention facility surrounded by tropical rainforests and scenic shorelines, ideal for high-level summits.', 1, 1, 1, 1, 1, 1, 'Approved', 'System Catalog'),
('The Westin Langkawi Resort Ballroom', 'Kedah', 400, 'Hybrid', 7000.00, 'Offers beachfront event planning and state-of-the-art indoor meeting spaces with standard business amenities.', 1, 1, 1, 1, 1, 1, 'Approved', 'System Catalog'),

-- Perak Venues
('Hotel Casuarina @ Meru Convention Centre', 'Perak', 2500, 'Indoor', 8000.00, 'Ipoh largest convention facility, strategically located in Meru Raya and fully equipped for exhibitions and conferences.', 1, 1, 1, 1, 1, 1, 'Approved', 'System Catalog'),
('Pangkor Laut Resort Emerald Lawn', 'Perak', 200, 'Outdoor', 5000.00, 'Exclusive outdoor private island venue surrounded by ancient rainforest and emerald waters, perfect for intimate corporate retreats.', 1, 0, 0, 1, 1, 0, 'Approved', 'System Catalog'),

-- Pahang Venues
('Genting International Convention Centre (GICC)', 'Pahang', 2000, 'Indoor', 12000.00, 'Located at high altitudes with cooler weather, featuring massive halls and integrated entertainment resorts.', 1, 1, 1, 1, 1, 1, 'Approved', 'System Catalog'),
('The Zenith Hotel Al-Hana Grand Ballroom', 'Pahang', 1200, 'Indoor', 7500.00, 'Kuantan premier premium ballroom with state-of-the-art acoustics, stage setups, and central city convenience.', 1, 1, 1, 1, 1, 1, 'Approved', 'System Catalog'),

-- Negeri Sembilan Venues
('d Tempat Country Club Grand Ballroom', 'Negeri Sembilan', 1500, 'Indoor', 7000.00, 'Premium venue located in Bandar Sri Sendayan, Seremban, featuring high ceilings, grand lights, and extensive club amenities.', 1, 1, 1, 1, 1, 1, 'Approved', 'System Catalog'),
('Klana Resort Seremban Hall', 'Negeri Sembilan', 600, 'Indoor', 4500.00, 'Budget-friendly business resort hall nestled in a lush green environment, suitable for workshops and annual meetings.', 1, 1, 1, 1, 1, 1, 'Approved', 'System Catalog'),

-- Terengganu Venues
('Duyong Marina & Resort Convention Hall', 'Terengganu', 800, 'Hybrid', 5500.00, 'Unique waterfront heritage resort in Kuala Terengganu, ideal for traditional dining, seminars, and networking events.', 1, 1, 1, 1, 1, 1, 'Approved', 'System Catalog'),

-- Kelantan Venues
('Grand Riverview Hotel Ballroom', 'Kelantan', 1000, 'Indoor', 6000.00, 'Located alongside the Kelantan River in Kota Bharu, offering traditional hospitality and functional event configurations.', 1, 1, 1, 1, 1, 1, 'Approved', 'System Catalog'),

-- Perlis Venues
('Putra Regency Hotel Hall', 'Perlis', 600, 'Indoor', 4000.00, 'Kangar premier hotel hall offering standard conference facilities and classic local catering options.', 1, 1, 1, 1, 1, 1, 'Approved', 'System Catalog'),

-- Putrajaya Venues
('Putrajaya International Convention Centre (PICC)', 'Putrajaya', 3000, 'Indoor', 13000.00, 'Iconic architectural landmark located atop a hill in the federal administrative capital, offering VIP halls and panoramic city views.', 1, 1, 1, 1, 1, 1, 'Approved', 'System Catalog'),
('Marriott Putrajaya Grand Ballroom', 'Putrajaya', 1500, 'Indoor', 10000.00, 'Elegant, grand ballroom featuring Mediterranean-style interiors and high capacities, suitable for massive annual galas.', 1, 1, 1, 1, 1, 1, 'Approved', 'System Catalog'),

('Dorsett Grand Labuan Ballroom', 'Labuan', 500, 'Indoor', 5000.00, 'Labuan premier five-star hotel ballroom, catering to business summits and corporate banquets near the financial hub.', 1, 1, 1, 1, 1, 1, 'Approved', 'System Catalog'),

-- More Kuala Lumpur Venues
('Shangri-La Hotel Grand Ballroom', 'Kuala Lumpur', 1500, 'Indoor', 12000.00, 'Classic elegance in the heart of Kuala Lumpur. Features crystal chandeliers, high ceilings, and high-capacity luxury banquet dining.', 1, 1, 1, 1, 1, 1, 'Approved', 'System Catalog'),
('Le Meridien KL Sentral Ballroom', 'Kuala Lumpur', 600, 'Indoor', 8500.00, 'Strategically located at the transport hub, ideal for regional business meetings and fast-paced networking seminars.', 1, 1, 1, 1, 1, 1, 'Approved', 'System Catalog'),
('Tamarind Springs Lawn', 'Kuala Lumpur', 150, 'Outdoor', 3500.00, 'Nestled in Ampang natural forest reserve, offering a unique jungle-luxe outdoor dining and meeting atmosphere.', 1, 0, 0, 1, 1, 0, 'Approved', 'System Catalog'),

-- More Selangor Venues
('Sheraton Petaling Jaya Grand Ballroom', 'Selangor', 1000, 'Indoor', 9500.00, 'Ultra-modern ballroom with custom acoustic walls, high-speed fiber internet, and multi-cuisine corporate catering options.', 1, 1, 1, 1, 1, 1, 'Approved', 'System Catalog'),
('One World Hotel Imperial Ballroom', 'Selangor', 2000, 'Indoor', 11500.00, 'Massive prestigious ballroom located in Bandar Utama, featuring luxury carpets, giant LED screens, and heavy stage rigging.', 1, 1, 1, 1, 1, 1, 'Approved', 'System Catalog'),
('DoubleTree by Hilton Shah Alam i-City Ballroom', 'Selangor', 800, 'Indoor', 7000.00, 'Brand new ballroom situated in the tech hub of i-City Shah Alam, offering cutting-edge visual projection and smart controls.', 1, 1, 1, 1, 1, 1, 'Approved', 'System Catalog'),

-- More Penang Venues
('Hotel Jen Penang Ballroom', 'Penang', 500, 'Indoor', 5000.00, 'Centrally situated in George Town, offering flexible layouts for corporate seminars, training courses, and conferences.', 1, 1, 1, 1, 1, 1, 'Approved', 'System Catalog'),
('Shangri-La Rasa Sayang Resort Lawn', 'Penang', 300, 'Outdoor', 6500.00, 'Stunning beachfront grass lawn under century-old rain trees in Batu Ferringhi, perfect for outdoor networking dinners.', 1, 1, 0, 1, 1, 0, 'Approved', 'System Catalog'),

-- More Johor Venues
('DoubleTree by Hilton Johor Bahru Ballroom', 'Johor', 600, 'Indoor', 7500.00, 'Premium city hotel ballroom featuring state-of-the-art videoconferencing tools, ideal for cross-border meetings.', 1, 1, 1, 1, 1, 1, 'Approved', 'System Catalog'),
('Renaissance Johor Bahru Hotel Ballroom', 'Johor', 1000, 'Indoor', 8000.00, 'Elegant, modern venue in Permas Jaya with customized lighting setups, dynamic sound systems, and a large reception lobby.', 1, 1, 1, 1, 1, 1, 'Approved', 'System Catalog'),

-- More Sabah Venues
('Shangri-La Rasa Ria Resort Garden', 'Sabah', 500, 'Outdoor', 7500.00, 'Lush seaside gardens overlooking the beach in Tuaran, perfect for natural breeze networking sessions and team builders.', 1, 1, 0, 1, 1, 0, 'Approved', 'System Catalog'),
('Hyatt Regency Kinabalu Ballroom', 'Sabah', 600, 'Indoor', 5500.00, 'Located in the downtown waterfront area, offering versatile partition setups for corporate seminars and board meetings.', 1, 1, 1, 1, 1, 1, 'Approved', 'System Catalog'),

-- More Sarawak Venues
('Imperial Hotel Kuching Hall', 'Sarawak', 1200, 'Indoor', 7000.00, 'Spacious and practical hall connected directly to Imperial Mall, offering extensive seating layout choices.', 1, 1, 1, 1, 1, 1, 'Approved', 'System Catalog'),
('Miri Marriott Resort Lawn', 'Sarawak', 300, 'Outdoor', 6000.00, 'Stunning sunset-view lawn located right by the South China Sea, suitable for corporate retreat mixers and garden galas.', 1, 1, 0, 1, 1, 0, 'Approved', 'System Catalog'),

-- More Melaka Venues
('DoubleTree by Hilton Melaka Ballroom', 'Melaka', 700, 'Indoor', 6500.00, 'Modern ballroom featuring high-speed connectivity, premium corporate seating, and direct access to Elements Mall.', 1, 1, 1, 1, 1, 1, 'Approved', 'System Catalog'),
('Philea Resort & Spa Forest Pavillion', 'Melaka', 300, 'Hybrid', 5500.00, 'Eco-friendly pavilion surrounded by lush green pine forests and waterfall streams, ideal for peaceful corporate getaways.', 1, 1, 0, 1, 1, 1, 'Approved', 'System Catalog'),

-- More Kedah Venues
('The Datai Langkawi Beachfront', 'Kedah', 150, 'Outdoor', 9000.00, 'Highly exclusive luxury resort beach venue, perfect for premium executive retreats and signature corporate dinners.', 1, 1, 0, 1, 1, 0, 'Approved', 'System Catalog'),
('Grand Alora Hotel Ballroom Alor Setar', 'Kedah', 1200, 'Indoor', 5500.00, 'Largest ballroom in Alor Setar, providing excellent lighting, staging systems, and local Kedahan catering options.', 1, 1, 1, 1, 1, 1, 'Approved', 'System Catalog'),

-- More Perak Venues
('Weil Hotel Ipoh Grand Ballroom', 'Perak', 1000, 'Indoor', 7500.00, 'Stylishly designed modern ballroom directly connected to Ipoh Parade Mall, featuring superior acoustics.', 1, 1, 1, 1, 1, 1, 'Approved', 'System Catalog'),
('Lost World of Tambun Hot Springs Garden', 'Perak', 400, 'Outdoor', 6000.00, 'Unique event lawn surrounded by prehistoric limestone hills and natural hot springs, ideal for thematic corporate mixers.', 1, 1, 0, 1, 1, 1, 'Approved', 'System Catalog'),

-- More Pahang Venues
('Swiss-Garden Beach Resort Kuantan Lawn', 'Pahang', 300, 'Outdoor', 4500.00, 'Scenic beach-facing lawn situated along Balok Beach, ideal for team bonding exercises and beach dinner parties.', 1, 1, 0, 1, 1, 0, 'Approved', 'System Catalog'),

-- More Negeri Sembilan Venues
('Grand Lexis Port Dickson Ballroom', 'Negeri Sembilan', 500, 'Hybrid', 6500.00, 'Features water chalet views and hybrid spaces for corporate team retreats and indoor business talks.', 1, 1, 1, 1, 1, 1, 'Approved', 'System Catalog'),

-- More Putrajaya Venues
('Le Meridien Putrajaya Ballroom', 'Putrajaya', 800, 'Indoor', 8500.00, 'Directly connected to IOI City Mall, presenting luxury carpeted floors, smart AV lighting, and professional catering.', 1, 1, 1, 1, 1, 1, 'Approved', 'System Catalog')
ON DUPLICATE KEY UPDATE id=id;
