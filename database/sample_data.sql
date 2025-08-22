-- Sample Data for Ronit Yoga Website
-- Run this after creating the comprehensive schema

-- Insert sample yoga poses
INSERT INTO yoga_poses (
    name_turkish, name_english, name_sanskrit, category, difficulty_level,
    duration_min, duration_max, description_turkish, description_english,
    benefits, contraindications, muscle_groups, props_needed, featured_image, is_active
) VALUES 
(
    'Köpek Pozu', 'Downward-Facing Dog', 'Adho Mukha Svanasana', 'standing', 'beginner',
    30, 60, 
    'Bu poz tüm vücudu uzatır ve güçlendirir. Eller ve ayaklar yerde, kalçalar yukarı kaldırılır.',
    'This pose stretches and strengthens the entire body. Hands and feet on the ground, hips lifted up.',
    '["Omurga esnekliğini artırır", "Bacak kaslarını güçlendirir", "Stres azaltır", "Kan dolaşımını iyileştirir"]',
    '["Karpal tünel sendromu", "Yüksek tansiyon", "Hamilelik son trimester"]',
    '["Bacak kasları", "Omuz kasları", "Karın kasları", "Sırt kasları"]',
    '["Yoga matı"]',
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
    TRUE
),
(
    'Çocuk Pozu', 'Child''s Pose', 'Balasana', 'relaxation', 'beginner',
    60, 120,
    'Rahatlatıcı bir poz. Dizler üzerine çökerek öne doğru eğilin, kollar uzatılır.',
    'A relaxing pose. Kneel down and fold forward, arms extended.',
    '["Stres azaltır", "Zihnin sakinleşmesini sağlar", "Alt sırt ağrısını rahatlatır", "Sindirim sistemini destekler"]',
    '["Diz yaralanmaları", "Hamilelik", "İshal"]',
    '["Kalça kasları", "Alt sırt kasları", "Omuz kasları"]',
    '["Yoga matı", "Yoga yastığı (opsiyonel)"]',
    'https://images.unsplash.com/photo-1588286840104-8957b019727f?w=400&h=300&fit=crop',
    TRUE
),
(
    'Dağ Pozu', 'Mountain Pose', 'Tadasana', 'standing', 'beginner',
    30, 60,
    'Temel duruş pozu. Ayaklar kalça genişliğinde, vücut dik ve dengeli.',
    'Basic standing pose. Feet hip-width apart, body straight and balanced.',
    '["Duruş bozukluğunu düzeltir", "Dengeyi geliştirir", "Farkındalığı artırır", "Temel güç sağlar"]',
    '["Baş dönmesi", "Düşük tansiyon"]',
    '["Tüm vücut kasları", "Core kasları", "Bacak kasları"]',
    '["Yoga matı"]',
    'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&h=300&fit=crop',
    TRUE
),
(
    'Kobra Pozu', 'Cobra Pose', 'Bhujangasana', 'backbends', 'intermediate',
    20, 45,
    'Yüzüstü yatarak ellerin desteğiyle göğsü kaldırma pozu. Omurga esnekliğini artırır.',
    'Lying face down, lift the chest with arm support. Increases spinal flexibility.',
    '["Omurga esnekliğini artırır", "Göğüs kaslarını açar", "Sırt kaslarını güçlendirir", "Sindirim sistemini destekler"]',
    '["Alt sırt yaralanmaları", "Karpal tünel sendromu", "Hamilelik"]',
    '["Sırt kasları", "Göğüs kasları", "Kol kasları", "Karın kasları"]',
    '["Yoga matı"]',
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop',
    TRUE
),
(
    'Savaşçı I', 'Warrior I', 'Virabhadrasana I', 'standing', 'intermediate',
    30, 60,
    'Güçlü bir duruş pozu. Bir bacak öne, diğeri arkaya, kollar yukarı kaldırılır.',
    'Strong standing pose. One leg forward, other back, arms raised up.',
    '["Bacak kaslarını güçlendirir", "Dengeyi geliştirir", "Kalça esnekliğini artırır", "Özgüven kazandırır"]',
    '["Kalça yaralanmaları", "Yüksek tansiyon", "Boyun yaralanmaları"]',
    '["Bacak kasları", "Kalça kasları", "Core kasları", "Omuz kasları"]',
    '["Yoga matı"]',
    'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=300&fit=crop',
    TRUE
);

-- Insert sample meditation series
INSERT INTO meditation_series (
    title, description, category, difficulty_level, duration_minutes,
    audio_file_url, featured_image, benefits, preparation_instructions, is_active
) VALUES 
(
    'Başlangıç İçin Nefes Meditasyonu', 
    'Meditasyona yeni başlayanlar için basit nefes odaklı meditasyon. Zihinsel berraklık ve rahatlama sağlar.',
    'breathing', 'beginner', 10,
    '/uploads/audio/beginner-breathing-meditation.mp3',
    'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=300&fit=crop',
    '["Stresi azaltır", "Zihinsel berraklık sağlar", "Uyku kalitesini artırır", "Kan basıncını düşürür"]',
    'Rahat bir yerde oturun. Gözlerinizi kapatın ve nefes alışverişinize odaklanın.',
    TRUE
),
(
    'Vücut Tarama Meditasyonu',
    'Vücudunuzun her bölümüne odaklanarak farkındalık geliştiren meditasyon tekniği.',
    'body_scan', 'intermediate', 20,
    '/uploads/audio/body-scan-meditation.mp3',
    'https://images.unsplash.com/photo-1588286840104-8957b019727f?w=400&h=300&fit=crop',
    '["Vücut farkındalığını artırır", "Kas gerginliğini azaltır", "Uyku kalitesini iyileştirir", "Ağrı yönetimi"]',
    'Sırtüstü uzanın. Vücudunuzu rahatlatın ve her bölümüne tek tek odaklanmaya hazırlanın.',
    TRUE
),
(
    'Sevgi-Merhamet Meditasyonu',
    'Kendinize ve başkalarına karşı sevgi ve merhamet geliştiren kalp odaklı meditasyon.',
    'loving_kindness', 'intermediate', 15,
    '/uploads/audio/loving-kindness-meditation.mp3',
    'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&h=300&fit=crop',
    '["Empatiyi geliştirir", "İlişkileri iyileştirir", "Öfkeyi azaltır", "İç huzur sağlar"]',
    'Kalbinizin bölgesine odaklanın. Sevgi ve merhamet duygularını hissetmeye açık olun.',
    TRUE
),
(
    'Çakra Dengeleme Meditasyonu',
    'Yedi ana çakranızı dengeleyerek enerji akışını harmonize eden ileri seviye meditasyon.',
    'chakra', 'advanced', 30,
    '/uploads/audio/chakra-balancing-meditation.mp3',
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop',
    '["Enerji dengesini sağlar", "Çakraları aktive eder", "Ruhsal gelişimi destekler", "İçsel güç verir"]',
    'Lotus pozisyonunda oturun. Omurganızın dik olduğundan emin olun. Her çakraya odaklanmaya hazırlanın.',
    TRUE
);

-- Insert sample products
INSERT INTO products (
    name, description, short_description, category, brand, sku, price, sale_price,
    stock_quantity, images, colors, sizes, features, is_featured, is_active
) VALUES 
(
    'Premium Yoga Matı - Kaymaz',
    'Yüksek kaliteli doğal kauçuktan üretilen profesyonel yoga matı. Mükemmel tutuş ve konfor sağlar.',
    'Profesyonel kalitede kaymaz yoga matı',
    'mats', 'YogaPro', 'MAT-001', 299.99, 249.99,
    25,
    '["https://images.unsplash.com/photo-1588286840104-8957b019727f?w=500&h=500&fit=crop"]',
    '["Mor", "Mavi", "Yeşil", "Pembe", "Siyah"]',
    '["180cm x 60cm", "185cm x 65cm"]',
    '["Kaymaz yüzey", "6mm kalınlık", "Doğal kauçuk", "Eco-friendly"]',
    TRUE, TRUE
),
(
    'Yoga Blok Seti (2 Adet)',
    'Pozları desteklemek ve esnekliği artırmak için tasarlanmış yüksek yoğunluklu köpük bloklar.',
    'Yüksek kaliteli yoga blok seti',
    'blocks', 'YogaPro', 'BLOCK-001', 89.99, NULL,
    40,
    '["https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=500&h=500&fit=crop"]',
    '["Mor", "Mavi", "Yeşil"]',
    '["23cm x 15cm x 10cm"]',
    '["Yüksek yoğunluklu köpük", "Hafif ağırlık", "Dayanıklı", "2 adet set"]',
    FALSE, TRUE
),
(
    'Yoga Kemeri - Ayarlanabilir',
    'Esnekliği artırmak ve pozları derinleştirmek için kullanılan ayarlanabilir yoga kemeri.',
    'Ayarlanabilir yoga kemeri',
    'straps', 'FlexiYoga', 'STRAP-001', 49.99, 39.99,
    60,
    '["https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=500&h=500&fit=crop"]',
    '["Siyah", "Mavi", "Kırmızı"]',
    '["180cm", "240cm"]',
    '["Dayanıklı pamuk", "Metal toka", "Ayarlanabilir", "Makine yıkama"]',
    FALSE, TRUE
),
(
    'Meditation Bolster Yastık',
    'Meditasyon ve restoratif yoga için özel tasarlanmış destekleyici yastık.',
    'Meditasyon için destekleyici yastık',
    'bolsters', 'ZenComfort', 'BOLSTER-001', 159.99, NULL,
    20,
    '["https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=500&h=500&fit=crop"]',
    '["Bej", "Lacivert", "Kahverengi"]',
    '["65cm x 23cm"]',
    '["Organik pamuk kılıf", "Soba kabuğu dolgusu", "Çıkarılabilir kılıf", "Ergonomik tasarım"]',
    TRUE, TRUE
),
(
    'Yoga Kıyafet Seti - Kadın',
    'Esnek ve nefes alabilen kumaştan üretilen profesyonel yoga kıyafet seti.',
    'Profesyonel yoga kıyafet seti',
    'clothing', 'YogaStyle', 'CLOTHING-001', 199.99, 159.99,
    30,
    '["https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500&h=500&fit=crop"]',
    '["Siyah", "Lacivert", "Gri", "Mor"]',
    '["XS", "S", "M", "L", "XL"]',
    '["Nefes alabilen kumaş", "4-way stretch", "Nem emici", "Üst + Alt takım"]',
    TRUE, TRUE
),
(
    'Yoga Başlangıç Kitabı',
    'Yoga pratiğine başlayanlar için kapsamlı rehber kitap. Pozlar, nefes teknikleri ve felsefe.',
    'Yogaya başlangıç rehber kitabı',
    'books', 'YogaWisdom', 'BOOK-001', 79.99, 69.99,
    50,
    '["https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=500&h=500&fit=crop"]',
    '["Beyaz"]',
    '["21cm x 14cm"]',
    '["300 sayfa", "Renkli resimler", "Türkçe", "Başlangıç seviyesi"]',
    FALSE, TRUE
);

-- Insert sample class types
INSERT INTO class_types (
    name, description, category, difficulty_level, duration_minutes,
    max_capacity, price, benefits, equipment_needed, is_online, is_active
) VALUES 
(
    'Hatha Yoga - Başlangıç',
    'Yavaş tempolu, pozları uzun süre tutmaya odaklanan klasik yoga dersi. Yeni başlayanlar için ideal.',
    'hatha', 'beginner', 60,
    15, 80.00,
    '["Esnekliği artırır", "Dengeyi geliştirir", "Stresi azaltır", "Kas gücünü artırır"]',
    '["Yoga matı", "Yoga bloğu"]',
    FALSE, TRUE
),
(
    'Vinyasa Flow - Orta Seviye',
    'Dinamik akışkan hareketlerle nefesi koordine eden enerji dolu yoga dersi.',
    'vinyasa', 'intermediate', 75,
    12, 100.00,
    '["Kardiyovasküler sağlığı destekler", "Koordinasyonu geliştirir", "Güç ve esneklik", "Zihinsel odaklanma"]',
    '["Yoga matı", "Su şişesi"]',
    FALSE, TRUE
),
(
    'Yin Yoga - Rahatlatıcı',
    'Pozları uzun süre tutarak derin rahatlama sağlayan pasif yoga pratiği.',
    'yin', 'all_levels', 90,
    10, 90.00,
    '["Derin rahatlama", "Esnekliği artırır", "Stres azaltır", "Uyku kalitesini iyileştirir"]',
    '["Yoga matı", "Yoga bloğu", "Yoga kemeri", "Battaniye"]',
    FALSE, TRUE
),
(
    'Online Meditasyon Seansı',
    'Evden katılabileceğiniz canlı yönlendirilmiş meditasyon seansı.',
    'meditation', 'beginner', 30,
    20, 40.00,
    '["Zihinsel berraklık", "Stres azaltır", "Odaklanma artar", "İç huzur"]',
    '["Sessiz mekan", "Yoga matı veya yastık"]',
    TRUE, TRUE
),
(
    'Prenatal Yoga',
    'Hamile kadınlar için özel tasarlanmış güvenli ve destekleyici yoga dersi.',
    'prenatal', 'beginner', 60,
    8, 120.00,
    '["Hamilelik rahatsızlıklarını azaltır", "Doğuma hazırlık", "Esnekliği korur", "Stresi azaltır"]',
    '["Yoga matı", "Yoga bloğu", "Yoga kemeri", "Yastık"]',
    FALSE, TRUE
);

-- Insert sample reviews
INSERT INTO product_reviews (
    product_id, reviewer_name, reviewer_email, rating, title, comment, is_approved
) VALUES 
(1, 'Ayşe Demir', 'ayse@example.com', 5, 'Mükemmel kalite!', 'Bu yoga matını 6 aydır kullanıyorum. Kaymıyor ve çok rahat. Kesinlikle tavsiye ederim.', TRUE),
(1, 'Mehmet Yılmaz', 'mehmet@example.com', 4, 'Çok iyi ama pahalı', 'Kalitesi gerçekten çok iyi ama fiyatı biraz yüksek. Yine de memnunum.', TRUE),
(2, 'Zehra Kaya', 'zehra@example.com', 5, 'Harika bloklar', 'Pozlarımı desteklemek için aldım. Çok dayanıklı ve hafif. Başlangıç seviyesi için perfect.', TRUE),
(4, 'Fatma Öz', 'fatma@example.com', 5, 'Meditasyon için harika', 'Meditasyon yaparken çok rahat. Dolgusu çok kaliteli ve şeklini koruyor.', TRUE);

-- Insert sample challenges
INSERT INTO challenges (
    title, description, duration_days, category, difficulty_level,
    daily_activities, benefits, price, is_active
) VALUES 
(
    '30 Günlük Yoga Başlangıç Programı',
    'Yogaya yeni başlayanlar için 30 günlük kapsamlı program. Her gün farklı pozlar ve tekniklere odaklanır.',
    30, 'beginner_foundation', 'beginner',
    '[
        {"day": 1, "title": "Yoga Temelleri", "poses": ["Dağ Pozu", "Çocuk Pozu"], "duration": 20},
        {"day": 2, "title": "Nefes Teknikleri", "poses": ["Nefes Egzersizleri"], "duration": 15},
        {"day": 3, "title": "Temel Duruş Pozları", "poses": ["Dağ Pozu", "Ağaç Pozu"], "duration": 25}
    ]',
    '["Temel yoga bilgisi", "Esneklik artışı", "Güç gelişimi", "Stres azalması", "Düzenli pratik alışkanlığı"]',
    149.99, TRUE
),
(
    '21 Günlük Esneklik Programı',
    'Vücut esnekliğini sistematik olarak artırmak için tasarlanmış 21 günlük program.',
    21, 'flexibility', 'intermediate',
    '[
        {"day": 1, "title": "Kalça Açıcılar", "poses": ["Kelebek Pozu", "Güvercin Pozu"], "duration": 30},
        {"day": 2, "title": "Omurga Esnekliği", "poses": ["Kobra Pozu", "Kedi-İnek Pozu"], "duration": 30}
    ]',
    '["Daha iyi esneklik", "Hareket kabiliyeti artışı", "Ağrı azalması", "Daha iyi duruş"]',
    199.99, TRUE
);

-- Update existing tables with sample data
INSERT IGNORE INTO classes (name, description, level, duration, capacity) VALUES
('Hatha Yoga - Başlangıç', 'Yavaş tempolu klasik yoga dersi', 'Başlangıç', 60, 15),
('Vinyasa Flow', 'Dinamik akışkan yoga', 'Orta', 75, 12),
('Yin Yoga', 'Rahatlatıcı pasif yoga', 'Tüm Seviyeler', 90, 10),
('Meditasyon', 'Yönlendirilmiş meditasyon seansı', 'Başlangıç', 30, 20);

-- Insert sample admin user (password: admin123)
INSERT IGNORE INTO admin_users (username, email, password, full_name, role, status) VALUES
('admin', 'admin@ronityoga.com', '$2y$10$YourHashedPasswordHere', 'Site Yöneticisi', 'super_admin', 'active');

-- Insert sample system settings
INSERT IGNORE INTO system_settings (setting_key, setting_value, setting_type, category, description) VALUES
('site_name', 'Ronit Yoga Studio', 'string', 'general', 'Site adı'),
('contact_email', 'info@ronityoga.com', 'string', 'contact', 'İletişim e-postası'),
('contact_phone', '+90 555 123 4567', 'string', 'contact', 'İletişim telefonu'),
('business_address', 'Yoga Stüdyosu, İstanbul, Türkiye', 'string', 'contact', 'İş adresi'),
('currency', 'TRY', 'string', 'payment', 'Varsayılan para birimi'),
('timezone', 'Europe/Istanbul', 'string', 'general', 'Site saat dilimi'),
('class_booking_advance_days', '30', 'integer', 'booking', 'Kaç gün önceden rezervasyon alınabilir'),
('cancellation_window_hours', '24', 'integer', 'booking', 'İptal için son kaç saat'),
('loyalty_points_per_class', '10', 'integer', 'loyalty', 'Ders başına puan'),
('referral_discount_percentage', '20', 'integer', 'referral', 'Referans indirimi yüzdesi');