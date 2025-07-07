<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

// Veritabanı bağlantısı
$db = new mysqli('localhost', 'ronityog_ronit', 'alenroy11.', 'ronityog_db');
$db->set_charset("utf8mb4");

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Tüm aktif hero image'leri getir
    $result = $db->query("SELECT * FROM hero_images WHERE is_active = 1 ORDER BY order_index ASC, id DESC");
    $images = [];
    
    while ($row = $result->fetch_assoc()) {
        $images[] = $row;
    }
    
    echo json_encode($images);
    
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (isset($data['image_url'])) {
        $image_url = $db->real_escape_string($data['image_url']);
        $title = isset($data['title']) ? $db->real_escape_string($data['title']) : '';
        $order_index = isset($data['order_index']) ? (int)$data['order_index'] : 0;
        
        $db->query("INSERT INTO hero_images (image_url, title, order_index) 
                    VALUES ('$image_url', '$title', $order_index)");
        
        echo json_encode(['success' => true, 'id' => $db->insert_id]);
    } else {
        echo json_encode(['success' => false, 'error' => 'image_url gerekli']);
    }
    
} elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    if (isset($_GET['id'])) {
        $id = (int)$_GET['id'];
        
        // Önce resmi al
        $result = $db->query("SELECT image_url FROM hero_images WHERE id = $id");
        if ($row = $result->fetch_assoc()) {
            // Resmi sil
            $db->query("DELETE FROM hero_images WHERE id = $id");
            
            // Dosyayı da sil (opsiyonel)
            $file_path = '../' . $row['image_url'];
            if (file_exists($file_path)) {
                unlink($file_path);
            }
            
            echo json_encode(['success' => true]);
        } else {
            echo json_encode(['success' => false, 'error' => 'Resim bulunamadı']);
        }
    } else {
        echo json_encode(['success' => false, 'error' => 'ID belirtilmedi']);
    }
}
?>