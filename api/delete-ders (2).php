<?php
session_start();
header('Content-Type: application/json; charset=utf-8');

// Giriş kontrolü
if (!isset($_SESSION['admin_logged_in'])) {
    die(json_encode(['error' => 'Yetkisiz erişim']));
}

// ID kontrolü
$id = isset($_GET['id']) ? intval($_GET['id']) : 0;
if ($id <= 0) {
    die(json_encode(['error' => 'Geçersiz ID']));
}

// DB bağlantısı
try {
    $db = new PDO("mysql:host=localhost;dbname=ronityog_db;charset=utf8", "ronityog_ronit", "alenroy11.");
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Silme işlemi
    $stmt = $db->prepare("DELETE FROM classes WHERE id = ?");
    $result = $stmt->execute([$id]);
    
    if ($result) {
        echo json_encode(['success' => true, 'message' => 'Ders silindi']);
    } else {
        echo json_encode(['success' => false, 'error' => 'Silinemedi']);
    }
    
} catch(Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>