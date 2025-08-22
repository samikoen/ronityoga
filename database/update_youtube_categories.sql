-- YouTube videolarım tablosuna yeni kategori sistemi güncelleme
-- Mevcut category sütununu yeni kategorilerle güncelle

-- Önce mevcut category sütununu yedekle
ALTER TABLE youtube_videos 
ADD COLUMN category_old VARCHAR(50) DEFAULT NULL;

UPDATE youtube_videos 
SET category_old = category;

-- Category sütununu yeni ENUM değerleriyle güncelle
ALTER TABLE youtube_videos 
MODIFY COLUMN category ENUM(
    'beginner',      -- Başlangıç seviyesi
    'intermediate',  -- Orta seviye
    'advanced',      -- İleri seviye
    'yoga_related',  -- Yoga'ya dair
    'breathing',     -- Nefes çalışmaları
    'stretching',    -- Esneme
    'mini_flows',    -- Mini yoga flows
    'pose_tutorials' -- Poz anlatımları
) DEFAULT 'yoga_related';

-- Mevcut verileri yeni kategorilere eşle
UPDATE youtube_videos 
SET category = CASE 
    WHEN category_old = 'yoga' THEN 'yoga_related'
    WHEN category_old = 'meditation' THEN 'breathing'
    WHEN category_old = 'lifestyle' THEN 'yoga_related'
    WHEN category_old = 'tips' THEN 'pose_tutorials'
    ELSE 'yoga_related'
END;

-- Eski yedek sütunu sil
ALTER TABLE youtube_videos 
DROP COLUMN category_old;

-- İndeksi yeniden oluştur
DROP INDEX IF EXISTS idx_category ON youtube_videos;
CREATE INDEX idx_category ON youtube_videos(category);