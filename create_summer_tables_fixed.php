<?php
require_once __DIR__ . '/api/config.php';

try {
    // SQL strict mode'u devre dışı bırak
    $db->exec("SET sql_mode = ''");
    
    // Önce tabloları sil (eğer varsa)
    $db->exec("DROP TABLE IF EXISTS summer_class_attendance");
    $db->exec("DROP TABLE IF EXISTS summer_class_schedule");
    
    // Yaz dönemi ders katılımları tablosu
    $sql = "CREATE TABLE summer_class_attendance (
        id INT AUTO_INCREMENT PRIMARY KEY,
        class_date DATE NOT NULL,
        class_day VARCHAR(20) NOT NULL,
        class_time TIME NOT NULL DEFAULT '08:30:00',
        participant_name VARCHAR(255) NOT NULL,
        participant_email VARCHAR(255) NOT NULL,
        participant_phone VARCHAR(20),
        participant_level VARCHAR(50) NOT NULL DEFAULT 'Tüm Seviyeler',
        registration_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        attendance_status VARCHAR(20) NOT NULL DEFAULT 'Kayıtlı',
        notes TEXT,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        INDEX idx_class_date (class_date),
        INDEX idx_class_day (class_day),
        INDEX idx_participant_email (participant_email),
        INDEX idx_attendance_status (attendance_status),
        
        UNIQUE KEY unique_participant_date (participant_email, class_date)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
    
    $db->exec($sql);
    echo "✅ summer_class_attendance tablosu oluşturuldu.\n";
    
    // Yaz dönemi ders programı tablosu
    $sql = "CREATE TABLE summer_class_schedule (
        id INT AUTO_INCREMENT PRIMARY KEY,
        class_date DATE NOT NULL,
        class_day VARCHAR(20) NOT NULL,
        class_time TIME NOT NULL DEFAULT '08:30:00',
        max_capacity INT NOT NULL DEFAULT 20,
        current_registrations INT NOT NULL DEFAULT 0,
        is_active TINYINT(1) NOT NULL DEFAULT 1,
        special_notes TEXT,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        INDEX idx_class_date (class_date),
        INDEX idx_is_active (is_active),
        
        UNIQUE KEY unique_class_date (class_date)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
    
    $db->exec($sql);
    echo "✅ summer_class_schedule tablosu oluşturuldu.\n";
    
    // Yaz dönemi için programı otomatik oluştur
    $scheduleData = [
        // Haziran 2025
        ['2025-06-03', 'Salı'],
        ['2025-06-05', 'Perşembe'],
        ['2025-06-10', 'Salı'],
        ['2025-06-12', 'Perşembe'],
        ['2025-06-17', 'Salı'],
        ['2025-06-19', 'Perşembe'],
        ['2025-06-24', 'Salı'],
        ['2025-06-26', 'Perşembe'],
        
        // Temmuz 2025
        ['2025-07-01', 'Salı'],
        ['2025-07-03', 'Perşembe'],
        ['2025-07-08', 'Salı'],
        ['2025-07-10', 'Perşembe'],
        ['2025-07-15', 'Salı'],
        ['2025-07-17', 'Perşembe'],
        ['2025-07-22', 'Salı'],
        ['2025-07-24', 'Perşembe'],
        ['2025-07-29', 'Salı'],
        ['2025-07-31', 'Perşembe'],
        
        // Ağustos 2025
        ['2025-08-05', 'Salı'],
        ['2025-08-07', 'Perşembe'],
        ['2025-08-12', 'Salı'],
        ['2025-08-14', 'Perşembe'],
        ['2025-08-19', 'Salı'],
        ['2025-08-21', 'Perşembe'],
        ['2025-08-26', 'Salı'],
        ['2025-08-28', 'Perşembe']
    ];
    
    $stmt = $db->prepare("INSERT INTO summer_class_schedule (class_date, class_day, class_time, max_capacity, is_active) VALUES (?, ?, '08:30:00', 20, 1)");
    
    foreach ($scheduleData as $schedule) {
        $stmt->execute($schedule);
    }
    
    echo "✅ Yaz dönemi ders programı oluşturuldu.\n";
    echo "✅ Toplam " . count($scheduleData) . " ders tarihi eklendi.\n";
    
    echo "\n🎉 Tüm tablolar başarıyla oluşturuldu!\n";
    echo "📋 Oluşturulan tablolar:\n";
    echo "   - summer_class_attendance (katılım kayıtları)\n";
    echo "   - summer_class_schedule (ders programı)\n";
    
    echo "\n🚀 Artık sistemi kullanabilirsiniz!\n";
    echo "   - Ana sayfa: Derslerimiz bölümü\n";
    echo "   - Admin panel: Yaz Dönemi Katılımları\n";
    
} catch (Exception $e) {
    echo "❌ Hata: " . $e->getMessage() . "\n";
    echo "📞 Destek için geliştiriciye ulaşın.\n";
}
?>