<?php
require_once 'api/config.php';

try {
    // Üyeler tablosu
    $sql = "CREATE TABLE IF NOT EXISTS members (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        is_active BOOLEAN DEFAULT TRUE,
        last_login TIMESTAMP NULL,
        INDEX idx_email (email),
        INDEX idx_active (is_active)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
    
    $db->exec($sql);
    echo "✓ Üyeler tablosu oluşturuldu\n";
    
    // Oturum tablosu
    $sql = "CREATE TABLE IF NOT EXISTS member_sessions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        member_id INT NOT NULL,
        session_token VARCHAR(64) UNIQUE NOT NULL,
        ip_address VARCHAR(45),
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP NOT NULL,
        FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
        INDEX idx_token (session_token),
        INDEX idx_expires (expires_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
    
    $db->exec($sql);
    echo "✓ Oturum tablosu oluşturuldu\n";
    
    // Üye rezervasyonları tablosu
    $sql = "CREATE TABLE IF NOT EXISTS member_reservations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        member_id INT NOT NULL,
        class_date DATE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status ENUM('active', 'cancelled') DEFAULT 'active',
        cancelled_at TIMESTAMP NULL,
        FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
        UNIQUE KEY unique_member_class (member_id, class_date, status),
        INDEX idx_class_date (class_date),
        INDEX idx_member_date (member_id, class_date)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
    
    $db->exec($sql);
    echo "✓ Üye rezervasyonları tablosu oluşturuldu\n";
    
    // summer_class_attendance tablosunu güncelle (üye desteği ekle)
    $sql = "ALTER TABLE summer_class_attendance 
            ADD COLUMN member_id INT NULL AFTER id,
            ADD FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE SET NULL,
            ADD INDEX idx_member (member_id)";
    
    try {
        $db->exec($sql);
        echo "✓ summer_class_attendance tablosu güncellendi\n";
    } catch (PDOException $e) {
        if (strpos($e->getMessage(), 'Duplicate column name') === false) {
            throw $e;
        }
        echo "! member_id sütunu zaten mevcut\n";
    }
    
    echo "\n✓ Tüm tablolar başarıyla oluşturuldu!\n";
    
} catch (PDOException $e) {
    die("Hata: " . $e->getMessage() . "\n");
}
?>