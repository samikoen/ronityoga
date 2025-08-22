-- Yaz dönemi ders katılımları tablosu
CREATE TABLE IF NOT EXISTS summer_class_attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    class_date DATE NOT NULL,
    class_day ENUM('Salı', 'Perşembe') NOT NULL,
    class_time TIME DEFAULT '08:30:00',
    participant_name VARCHAR(255) NOT NULL,
    participant_email VARCHAR(255) NOT NULL,
    participant_phone VARCHAR(20),
    participant_level ENUM('Başlangıç', 'Orta', 'İleri', 'Tüm Seviyeler') DEFAULT 'Tüm Seviyeler',
    registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    attendance_status ENUM('Kayıtlı', 'Katıldı', 'Katılmadı') DEFAULT 'Kayıtlı',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- İndeksler
    INDEX idx_class_date (class_date),
    INDEX idx_class_day (class_day),
    INDEX idx_participant_email (participant_email),
    INDEX idx_attendance_status (attendance_status),
    
    -- Aynı kişi aynı güne birden fazla kayıt olmasın
    UNIQUE KEY unique_participant_date (participant_email, class_date)
);

-- Yaz dönemi ders programı tablosu
CREATE TABLE IF NOT EXISTS summer_class_schedule (
    id INT AUTO_INCREMENT PRIMARY KEY,
    class_date DATE NOT NULL,
    class_day ENUM('Salı', 'Perşembe') NOT NULL,
    class_time TIME DEFAULT '08:30:00',
    max_capacity INT DEFAULT 20,
    current_registrations INT DEFAULT 0,
    is_active TINYINT(1) DEFAULT 1,
    special_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- İndeksler
    INDEX idx_class_date (class_date),
    INDEX idx_is_active (is_active),
    
    -- Aynı gün için sadece bir kayıt
    UNIQUE KEY unique_class_date (class_date)
);

-- Yaz dönemi için programı otomatik oluşturalım (Haziran-Ağustos 2025)
INSERT INTO summer_class_schedule (class_date, class_day, class_time, max_capacity, is_active) 
VALUES 
-- Haziran 2025
('2025-06-03', 'Salı', '08:30:00', 20, 1),
('2025-06-05', 'Perşembe', '08:30:00', 20, 1),
('2025-06-10', 'Salı', '08:30:00', 20, 1),
('2025-06-12', 'Perşembe', '08:30:00', 20, 1),
('2025-06-17', 'Salı', '08:30:00', 20, 1),
('2025-06-19', 'Perşembe', '08:30:00', 20, 1),
('2025-06-24', 'Salı', '08:30:00', 20, 1),
('2025-06-26', 'Perşembe', '08:30:00', 20, 1),

-- Temmuz 2025
('2025-07-01', 'Salı', '08:30:00', 20, 1),
('2025-07-03', 'Perşembe', '08:30:00', 20, 1),
('2025-07-08', 'Salı', '08:30:00', 20, 1),
('2025-07-10', 'Perşembe', '08:30:00', 20, 1),
('2025-07-15', 'Salı', '08:30:00', 20, 1),
('2025-07-17', 'Perşembe', '08:30:00', 20, 1),
('2025-07-22', 'Salı', '08:30:00', 20, 1),
('2025-07-24', 'Perşembe', '08:30:00', 20, 1),
('2025-07-29', 'Salı', '08:30:00', 20, 1),
('2025-07-31', 'Perşembe', '08:30:00', 20, 1),

-- Ağustos 2025
('2025-08-05', 'Salı', '08:30:00', 20, 1),
('2025-08-07', 'Perşembe', '08:30:00', 20, 0),
('2025-08-12', 'Salı', '08:30:00', 20, 1),
('2025-08-14', 'Perşembe', '08:30:00', 20, 1),
('2025-08-19', 'Salı', '08:30:00', 20, 1),
('2025-08-21', 'Perşembe', '08:30:00', 20, 1),
('2025-08-26', 'Salı', '08:30:00', 20, 1),
('2025-08-28', 'Perşembe', '08:30:00', 20, 1)

ON DUPLICATE KEY UPDATE 
    max_capacity = VALUES(max_capacity),
    is_active = VALUES(is_active);