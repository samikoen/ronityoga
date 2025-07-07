<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        // Admin kontrolü
        if (!isset($_SESSION['admin_logged_in'])) {
            die(json_encode(['error' => 'Yetkisiz erişim']));
        }
        
        // Rezervasyonları listele
        $stmt = $db->query("
            SELECT r.*, c.name as class_name 
            FROM reservations r 
            LEFT JOIN classes c ON r.class_id = c.id 
            ORDER BY r.created_at DESC
        ");
        $reservations = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode($reservations);
        break;
        
    case 'POST':
        // Yeni rezervasyon (public)
        $data = json_decode(file_get_contents('php://input'), true);
        
        $stmt = $db->prepare("INSERT INTO reservations (name, email, phone, class_id, reservation_date) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute([
            $data['name'],
            $data['email'],
            $data['phone'] ?? '',
            $data['class_id'],
            $data['reservation_date']
        ]);
        
        echo json_encode(['success' => true, 'id' => $db->lastInsertId()]);
        break;
        
    case 'PUT':
        // Rezervasyon durumunu güncelle
        if (!isset($_SESSION['admin_logged_in'])) {
            die(json_encode(['error' => 'Yetkisiz erişim']));
        }
        
        $data = json_decode(file_get_contents('php://input'), true);
        
        $stmt = $db->prepare("UPDATE reservations SET status = ? WHERE id = ?");
        $stmt->execute([$data['status'], $data['id']]);
        
        echo json_encode(['success' => true]);
        break;
}
?>