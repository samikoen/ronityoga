<?php
// Create section_visibility table
require_once 'config.php';

header('Content-Type: application/json');

try {
    // Create table
    $sql = "CREATE TABLE IF NOT EXISTS section_visibility (
        id INT AUTO_INCREMENT PRIMARY KEY,
        section_name VARCHAR(100) NOT NULL UNIQUE,
        display_name VARCHAR(200) NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        menu_order INT DEFAULT 0,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )";
    
    $db->exec($sql);
    
    // Insert default sections
    $defaultSections = [
        ['home', 'Ana Sayfa', 1, 1, 'Ana sayfa hero bölümü'],
        ['about', 'Hakkımda', 1, 2, 'Hakkımda bölümü'],
        ['classes', 'Dersler', 1, 3, 'Yoga dersleri bölümü'],
        ['videos', 'Yoga\'ya dair', 1, 4, 'Video içerikleri bölümü'],
        ['blog', 'Blog', 1, 5, 'Blog yazıları bölümü'],
        ['gallery', 'Galeri', 1, 6, 'Fotoğraf galerisi bölümü'],
        ['community', 'Topluluğumuz', 1, 7, 'Topluluk ve deneyimler bölümü'],
        ['newsletter', 'Haftalık İpuçları', 1, 8, 'Newsletter kayıt bölümü'],
        ['reservation', 'Rezervasyon', 0, 9, 'Rezervasyon sistemi (şu anda kapalı)'],
        ['meditation', 'Meditasyon Serisi', 1, 10, 'Meditasyon içerikleri sayfası'],
        ['poses', 'Yoga Pozları', 1, 11, 'Yoga pozları rehberi sayfası'],
        ['shop', 'Mağaza', 1, 12, 'Yoga ekipmanları mağazası'],
        ['cart', 'Sepet', 1, 13, 'Alışveriş sepeti fonksiyonu'],
        ['footer_social', 'Sosyal Medya Linkleri', 1, 20, 'Footer sosyal medya ikonları'],
        ['footer_contact', 'İletişim Bilgileri', 1, 21, 'Footer iletişim bilgileri'],
        ['hero_carousel', 'Hero Carousel', 1, 22, 'Ana sayfa hero carousel'],
        ['contact_form', 'İletişim Formu', 1, 23, 'İletişim formu']
    ];
    
    $stmt = $db->prepare("INSERT INTO section_visibility (section_name, display_name, is_active, menu_order, description) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE display_name = VALUES(display_name), menu_order = VALUES(menu_order), description = VALUES(description)");
    
    foreach ($defaultSections as $section) {
        $stmt->execute($section);
    }
    
    echo json_encode(['success' => true, 'message' => 'Section visibility table created and populated successfully']);
    
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
}
?>