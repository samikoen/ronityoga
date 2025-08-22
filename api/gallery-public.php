<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');

// DB bağlantısı
try {
    $db = new PDO("mysql:host=localhost;dbname=ronityog_db", "ronityog_ronit", "alenroy11.");
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $e) {
    die(json_encode(['error' => 'DB Error']));
}

// Sadece GET metoduna izin ver (public okuma)
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $stmt = $db->query("SELECT id, image_url, title, uploaded_at FROM gallery ORDER BY uploaded_at DESC");
        $images = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode($images);
    } catch(PDOException $e) {
        echo json_encode(['error' => 'Galeri yüklenemedi']);
    }
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}
?>