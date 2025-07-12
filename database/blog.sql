-- Blog Posts Table
CREATE TABLE IF NOT EXISTS blog_posts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    excerpt TEXT,
    content LONGTEXT NOT NULL,
    featured_image VARCHAR(500),
    category VARCHAR(100) DEFAULT 'Genel',
    status ENUM('draft', 'published', 'archived') DEFAULT 'draft',
    tags TEXT,
    meta_title VARCHAR(255),
    meta_description TEXT,
    views INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status (status),
    INDEX idx_category (category),
    INDEX idx_created_at (created_at)
);

-- Blog Categories Table
CREATE TABLE IF NOT EXISTS blog_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    color VARCHAR(7) DEFAULT '#3498db',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default categories
INSERT IGNORE INTO blog_categories (name, description, color) VALUES
('Yoga Pozları', 'Farklı yoga pozları ve teknikleri', '#e74c3c'),
('Meditasyon', 'Meditasyon teknikleri ve rehberleri', '#9b59b6'),
('Yaşam Tarzı', 'Sağlıklı yaşam ve wellness ipuçları', '#2ecc71'),
('Başlangıç', 'Yogaya yeni başlayanlar için rehber', '#f39c12'),
('İleri Seviye', 'Deneyimli yogiler için teknikler', '#34495e'),
('Genel', 'Genel yoga ve wellness içerikleri', '#3498db');

-- Sample blog posts
INSERT IGNORE INTO blog_posts (title, excerpt, content, category, status, tags, featured_image) VALUES
(
    'Yoga\'ya Başlangıç: İlk Adımlarınız',
    'Yoga dünyasına adım atmak isteyenler için temel rehber ve ipuçları.',
    '<p>Yoga, hem fiziksel hem de mental sağlığımız için harika bir uygulama. Bu rehberde yogaya nasıl başlayacağınızı öğreneceksiniz.</p><h3>Temel Pozlar</h3><p>Başlangıç için en uygun pozlar şunlardır:</p><ul><li>Çocuk Pozu (Balasana)</li><li>Köpek Pozu (Adho Mukha Svanasana)</li><li>Dağ Pozu (Tadasana)</li></ul>',
    'Başlangıç',
    'published',
    'başlangıç,temel pozlar,yoga',
    'https://images.unsplash.com/photo-1506126613408-eca07ce68773'
),
(
    'Stres Azaltmada Meditasyonun Gücü',
    'Günlük hayatın stresinden kurtulmak için meditasyon tekniklerini keşfedin.',
    '<p>Modern yaşamın getirdiği stres, hem bedenimizi hem de ruhumuzu olumsuz etkiler. Meditasyon, bu stresle başa çıkmak için güçlü bir araçtır.</p><h3>Başlangıç Teknikleri</h3><p>Meditasyona başlamak için:</p><ol><li>Sessiz bir alan bulun</li><li>Rahat bir pozisyon alın</li><li>Nefes alma ritminize odaklanın</li></ol>',
    'Meditasyon',
    'published',
    'meditasyon,stres,rahatlama',
    'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b'
),
(
    'Ev Yogası İçin En İyi Pozlar',
    'Evde yoga yapmak isteyenler için önerilen pozlar ve düzenlemeler.',
    '<p>Evde yoga yapmak, hem pratik hem de ekonomik bir çözüm. Bu yazıda evde rahatlıkla yapabileceğiniz pozları bulacaksınız.</p><h3>Gerekli Malzemeler</h3><ul><li>Yoga matı</li><li>Yoga bloğu (opsiyonel)</li><li>Rahat kıyafetler</li></ul>',
    'Yoga Pozları',
    'draft',
    'ev yogası,pozlar,malzemeler',
    'https://images.unsplash.com/photo-1588286840104-8957b019727f'
);