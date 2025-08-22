-- YouTube videolarım tablosu
CREATE TABLE IF NOT EXISTS youtube_videos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    youtube_url VARCHAR(500) NOT NULL,
    youtube_id VARCHAR(50),
    description TEXT,
    category ENUM('yoga', 'meditation', 'lifestyle', 'tips') DEFAULT 'yoga',
    thumbnail_url VARCHAR(500),
    duration VARCHAR(20),
    view_count INT DEFAULT 0,
    is_active TINYINT(1) DEFAULT 1,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- İndeksler
    INDEX idx_category (category),
    INDEX idx_is_active (is_active),
    INDEX idx_display_order (display_order),
    INDEX idx_youtube_id (youtube_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Örnek veriler (isteğe bağlı)
INSERT INTO youtube_videos (title, youtube_url, youtube_id, description, category, thumbnail_url) VALUES
('Yoga Dersi - Gün Batımı Pratiği', 'https://youtu.be/cm0sS5wy_7g?si=q6KXQBLt1Dx9akkf', 'cm0sS5wy_7g', 'Günün stresini atmak ve bedeni rahatlatmak için ideal yoga dersi', 'yoga', 'https://img.youtube.com/vi/cm0sS5wy_7g/maxresdefault.jpg'),
('10 Dakikalık Sabah Meditasyonu', 'https://www.youtube.com/watch?v=EXAMPLE2', 'EXAMPLE2', 'Güne huzurlu başlamak için kısa meditasyon', 'meditation', 'https://img.youtube.com/vi/EXAMPLE2/maxresdefault.jpg')
ON DUPLICATE KEY UPDATE title = VALUES(title);