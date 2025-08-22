-- Tüm database charset sorunlarını çöz

-- 1. Database charset'ini kontrol et ve düzelt
ALTER DATABASE ronityog_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 2. section_visibility tablosunu düzelt
ALTER TABLE section_visibility CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 3. youtube_videos tablosunu düzelt (eğer hala sorun varsa)
ALTER TABLE youtube_videos CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 4. Diğer tablolari da düzelt (gerekirse)
ALTER TABLE blog_posts CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE class_schedule CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE gallery_images CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE newsletter_subscribers CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE reservations CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE settings CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE summer_class_attendance CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE videos CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 5. YouTube section'ını tekrar ekle (doğru charset ile)
DELETE FROM section_visibility WHERE section_name = 'youtube-videos';
INSERT INTO section_visibility (section_name, display_name, description, is_active, menu_order) 
VALUES ('youtube-videos', 'YouTube Videolarım', 'YouTube kanalında paylaşılan yoga videoları', 1, 5);

-- 6. YouTube videolarını tekrar ekle (doğru charset ile)
DELETE FROM youtube_videos;
INSERT INTO youtube_videos (title, youtube_url, youtube_id, description, category, thumbnail_url) VALUES
('Yoga Dersi - Gün Batımı Pratiği', 'https://youtu.be/cm0sS5wy_7g?si=q6KXQBLt1Dx9akkf', 'cm0sS5wy_7g', 'Günün stresini atmak ve bedeni rahatlatmak için ideal yoga dersi. Şükran ve huzur dolu pratik.', 'yoga', 'https://img.youtube.com/vi/cm0sS5wy_7g/maxresdefault.jpg'),
('10 Dakikalık Sabah Meditasyonu', 'https://www.youtube.com/watch?v=EXAMPLE2', 'EXAMPLE2', 'Güne huzurlu başlamak için kısa meditasyon. İç huzuru artırır.', 'meditation', 'https://img.youtube.com/vi/EXAMPLE2/maxresdefault.jpg');