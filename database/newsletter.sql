-- Newsletter email subscription table
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('active', 'unsubscribed') DEFAULT 'active',
    ip_address VARCHAR(45),
    user_agent TEXT,
    INDEX idx_email (email),
    INDEX idx_status (status),
    INDEX idx_subscribed_at (subscribed_at)
);

-- Site content management tables
CREATE TABLE IF NOT EXISTS site_content (
    id INT AUTO_INCREMENT PRIMARY KEY,
    section VARCHAR(100) NOT NULL UNIQUE,
    content JSON,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_section (section)
);

-- Insert default content
INSERT INTO site_content (section, content) VALUES 
('hero_quote', '{"quote": "Yoga, kendini bulma sanatıdır", "enabled": true}'),
('story_section', '{
    "title": "Hikayemiz",
    "intro": "Yoga ile tanışmam 11 yıl önce, hayatımın en zorlu döneminde gerçekleşti.",
    "content": [
        "Stresli iş hayatı ve günlük koşuşturmaca arasında kendimi kaybetmiş hissediyordum. Bir arkadaşımın önerisiyle katıldığım ilk yoga dersinde, nefesime odaklandığım o an, hayatım değişti.",
        "Hindistan''da aldığım 300 saatlik yoga eğitimi sadece teknik bilgi değil, aynı zamanda içsel bir dönüşüm yaşamamı sağladı. O günden beri amacım, bu dönüştürücü gücü sizlerle paylaşmak.",
        "Her öğrencimle kurduğum bağ, onların kendilerini keşfetme yolculuğunda rehber olmak benim için en değerli deneyim."
    ],
    "stats": [
        {"number": "11", "label": "Yıl Deneyim"},
        {"number": "500+", "label": "Mutlu Öğrenci"},
        {"number": "300", "label": "Saat Eğitim"}
    ],
    "image": "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=800&fit=crop"
}'),
('community_testimonials', '{
    "testimonials": [
        {
            "text": "Ronit''in dersleriyle hayatım tamamen değişti. Artık daha huzurlu ve dengeli hissediyorum.",
            "author": "Ayşe K."
        },
        {
            "text": "11 aydır Ronit ile yoga yapıyorum. Hem fiziksel hem de ruhsal olarak kendimi çok daha iyi hissediyorum.",
            "author": "Mehmet T."
        }
    ]
}'),
('community_features', '{
    "features": [
        {
            "icon": "🧘‍♀️",
            "title": "Günlük Pratik",
            "description": "Her gün yeni pratik önerileri ve rehberlik"
        },
        {
            "icon": "💫",
            "title": "Kişisel Gelişim",
            "description": "Kendini keşfetme ve dönüşüm yolculuğu"
        },
        {
            "icon": "🤝",
            "title": "Destekleyici Topluluk",
            "description": "Aynı yolda yürüyen arkadaşlarla bağlantı"
        }
    ]
}')
ON DUPLICATE KEY UPDATE 
content = VALUES(content),
updated_at = CURRENT_TIMESTAMP;