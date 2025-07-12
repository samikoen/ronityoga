<?php
session_start();
header('Content-Type: application/json');

// Giriş kontrolü
if (!isset($_SESSION['admin_logged_in'])) {
    die(json_encode(['error' => 'Yetkisiz erişim']));
}

// DB bağlantısı
try {
    $db = new PDO("mysql:host=localhost;dbname=ronityog_db", "ronityog_ronit", "alenroy11.");
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $e) {
    die(json_encode(['error' => 'DB Error']));
}

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        $stmt = $db->query("SELECT * FROM gallery ORDER BY uploaded_at DESC");
        $images = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode($images);
        break;
        
    case 'POST':
        $data = json_decode(file_get_contents('php://input'), true);
        $stmt = $db->prepare("INSERT INTO gallery (image_url, title) VALUES (?, ?)");
        $stmt->execute([$data['image_url'], $data['title'] ?? '']);
        echo json_encode(['success' => true, 'id' => $db->lastInsertId()]);
        break;
}
?>