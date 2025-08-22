-- Section Visibility Management System
-- Bu tablo ana sayfadaki bölümlerin görünürlüğünü kontrol eder

CREATE TABLE IF NOT EXISTS section_visibility (
    id INT AUTO_INCREMENT PRIMARY KEY,
    section_name VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(200) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    menu_order INT DEFAULT 0,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Varsayılan bölümleri ekle
INSERT INTO section_visibility (section_name, display_name, is_active, menu_order, description) VALUES
('home', 'Ana Sayfa', TRUE, 1, 'Ana sayfa hero bölümü'),
('about', 'Hakkımda', TRUE, 2, 'Hakkımda bölümü'),
('classes', 'Dersler', TRUE, 3, 'Yoga dersleri bölümü'),
('videos', 'Yoga\'ya dair', TRUE, 4, 'Video içerikleri bölümü'),
('blog', 'Blog', TRUE, 5, 'Blog yazıları bölümü'),
('gallery', 'Galeri', TRUE, 6, 'Fotoğraf galerisi bölümü'),
('community', 'Topluluğumuz', TRUE, 7, 'Topluluk ve deneyimler bölümü'),
('newsletter', 'Haftalık İpuçları', TRUE, 8, 'Newsletter kayıt bölümü'),
('reservation', 'Rezervasyon', FALSE, 9, 'Rezervasyon sistemi (şu anda kapalı)')
ON DUPLICATE KEY UPDATE
    display_name = VALUES(display_name),
    menu_order = VALUES(menu_order),
    description = VALUES(description);

-- Sekonder sayfalar için bölümler
INSERT INTO section_visibility (section_name, display_name, is_active, menu_order, description) VALUES
('meditation', 'Meditasyon Serisi', TRUE, 10, 'Meditasyon içerikleri sayfası'),
('poses', 'Yoga Pozları', TRUE, 11, 'Yoga pozları rehberi sayfası'),
('shop', 'Mağaza', TRUE, 12, 'Yoga ekipmanları mağazası'),
('cart', 'Sepet', TRUE, 13, 'Alışveriş sepeti fonksiyonu')
ON DUPLICATE KEY UPDATE
    display_name = VALUES(display_name),
    menu_order = VALUES(menu_order),
    description = VALUES(description);

-- Site geneli özellikler
INSERT INTO section_visibility (section_name, display_name, is_active, menu_order, description) VALUES
('footer_social', 'Sosyal Medya Linkleri', TRUE, 20, 'Footer sosyal medya ikonları'),
('footer_contact', 'İletişim Bilgileri', TRUE, 21, 'Footer iletişim bilgileri'),
('hero_carousel', 'Hero Carousel', TRUE, 22, 'Ana sayfa hero carousel'),
('contact_form', 'İletişim Formu', TRUE, 23, 'İletişim formu')
ON DUPLICATE KEY UPDATE
    display_name = VALUES(display_name),
    menu_order = VALUES(menu_order),
    description = VALUES(description);