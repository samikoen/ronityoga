<?php
session_start();
header('Content-Type: application/json; charset=utf-8');

// DB bağlantısı
try {
    $db = new PDO("mysql:host=localhost;dbname=ronityog_db;charset=utf8", "ronityog_ronit", "alenroy11.");
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $db->exec("SET NAMES 'utf8'");
} catch(PDOException $e) {
    die(json_encode(['error' => 'DB Error: ' . $e->getMessage()]));
}

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        // GET - Herkes okuyabilir (public)
        try {
            $stmt = $db->query("SELECT * FROM classes ORDER BY id DESC");
            $classes = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode($classes);
        } catch(Exception $e) {
            echo json_encode(['error' => $e->getMessage()]);
        }
        break;
        
    case 'POST':
        // POST - Sadece admin ekleyebilir/güncelleyebilir
        if (!isset($_SESSION['admin_logged_in'])) {
            die(json_encode(['error' => 'Yetkisiz erişim']));
        }
        
        try {
            $input = file_get_contents('php://input');
            $data = json_decode($input, true);
            
            if (!$data) {
                die(json_encode(['error' => 'Geçersiz veri']));
            }
            
            // ID varsa güncelle, yoksa ekle
            if (isset($data['id']) && $data['id']) {
                $stmt = $db->prepare("UPDATE classes SET name = ?, description = ?, level = ?, duration = ?, capacity = ? WHERE id = ?");
                $result = $stmt->execute([
                    $data['name'],
                    $data['description'],
                    $data['level'],
                    $data['duration'],
                    $data['capacity'],
                    $data['id']
                ]);
                
                echo json_encode(['success' => $result]);
            } else {
                $stmt = $db->prepare("INSERT INTO classes (name, description, level, duration, capacity) VALUES (?, ?, ?, ?, ?)");
                $result = $stmt->execute([
                    $data['name'],
                    $data['description'],
                    $data['level'],
                    $data['duration'],
                    $data['capacity']
                ]);
                
                echo json_encode(['success' => true, 'id' => $db->lastInsertId()]);
            }
        } catch(Exception $e) {
            echo json_encode(['error' => $e->getMessage()]);
        }
        break;
}
?>