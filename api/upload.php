<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

// Debug kapalı
$debug = false;

try {
    // POST kontrolü
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception('Sadece POST metodu desteklenir');
    }

    // Dosya yükleme kontrolü
    if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
        throw new Exception('Dosya yükleme hatası');
    }

    $file = $_FILES['file'];
    $folder = isset($_POST['folder']) ? $_POST['folder'] : 'uploads';

    // Dosya tipini kontrol et
    $allowedTypes = [
        // Resim dosyaları
        'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
        // Video dosyaları
        'video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/flv', 
        'video/webm', 'video/mkv', 'video/quicktime', 'video/x-msvideo'
    ];
    
    if (!in_array($file['type'], $allowedTypes)) {
        throw new Exception('Geçersiz dosya tipi. Sadece resim ve video dosyaları kabul edilir.');
    }

    // Dosya boyutu kontrolü (resimler için 5MB, videolar için 50MB)
    $maxSize = (strpos($file['type'], 'video/') === 0) ? 50 * 1024 * 1024 : 5 * 1024 * 1024;
    if ($file['size'] > $maxSize) {
        $maxSizeText = (strpos($file['type'], 'video/') === 0) ? '50MB' : '5MB';
        throw new Exception('Dosya boyutu ' . $maxSizeText . '\'dan büyük olamaz');
    }

    // Upload klasörü oluştur - ESKİ KODDAN AYNEN
    $uploadDir = '../uploads/' . $folder . '/';
    if (!file_exists($uploadDir)) {
        if (!mkdir($uploadDir, 0755, true)) {
            throw new Exception('Upload klasörü oluşturulamadı');
        }
    }

    // Dosya adını güvenli hale getir
    $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
    $filename = uniqid() . '_' . time() . '.' . $extension;
    $filepath = $uploadDir . $filename;

    // Dosyayı taşı
    if (!move_uploaded_file($file['tmp_name'], $filepath)) {
        throw new Exception('Dosya taşınamadı');
    }

    // URL oluştur - ESKİ KODDAN AYNEN
    $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http';
    $host = $_SERVER['HTTP_HOST'];
    $relativePath = 'uploads/' . $folder . '/' . $filename;
    $fullUrl = $protocol . '://' . $host . '/' . $relativePath;

    // Başarı yanıtı - DEBUG EKLENDI
    echo json_encode([
        'success' => true,
        'url' => $fullUrl,        // ESKİ KODDA BU VAR
        'path' => $relativePath,  // ESKİ KODDA BU VAR  
        'filename' => $filename,   // ESKİ KODDA BU VAR
        'debug_fullUrl' => $fullUrl,    // DEBUG
        'debug_relativePath' => $relativePath  // DEBUG
    ]);

} catch (Exception $e) {
    // Hata yanıtı
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>