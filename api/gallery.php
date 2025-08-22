<?php
session_start();
header('Content-Type: application/json');

// Giriş kontrolü
if (!isset($_SESSION['admin_logged_in'])) {
    die(json_encode(['error' => 'Yetkisiz erişim']));
}

// Upload fonksiyonu
function uploadFile($file, $folder = 'gallery') {
    try {
        // Dosya yükleme kontrolü
        if ($file['error'] !== UPLOAD_ERR_OK) {
            throw new Exception('Dosya yükleme hatası');
        }

        // Dosya tipini kontrol et
        $allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        
        if (!in_array($file['type'], $allowedTypes)) {
            throw new Exception('Geçersiz dosya tipi. Sadece resim dosyaları kabul edilir.');
        }

        // Dosya boyutu kontrolü (5MB)
        $maxSize = 5 * 1024 * 1024;
        if ($file['size'] > $maxSize) {
            throw new Exception('Dosya boyutu 5MB\'dan büyük olamaz');
        }

        // Upload klasörü oluştur
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

        // URL oluştur
        $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http';
        $host = $_SERVER['HTTP_HOST'];
        $relativePath = 'uploads/' . $folder . '/' . $filename;
        $fullUrl = $protocol . '://' . $host . '/' . $relativePath;

        return [
            'success' => true,
            'url' => $fullUrl,
            'path' => $relativePath,
            'filename' => $filename
        ];

    } catch (Exception $e) {
        return [
            'success' => false,
            'error' => $e->getMessage()
        ];
    }
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
        // Form data ile resim yükleme (upload.php ile entegre)
        if (isset($_FILES['file'])) {
            // Upload.php çağır
            $title = $_POST['title'] ?? '';
            $folder = $_POST['folder'] ?? 'gallery';
            
            // Upload işlemi
            $uploadResult = uploadFile($_FILES['file'], $folder);
            
            if ($uploadResult['success']) {
                // Veritabanına kaydet
                $stmt = $db->prepare("INSERT INTO gallery (image_url, title, uploaded_at) VALUES (?, ?, NOW())");
                $stmt->execute([$uploadResult['url'], $title]);
                echo json_encode(['success' => true, 'id' => $db->lastInsertId(), 'url' => $uploadResult['url']]);
            } else {
                echo json_encode(['success' => false, 'error' => $uploadResult['error']]);
            }
        } else {
            // JSON data ile resim ekleme
            $data = json_decode(file_get_contents('php://input'), true);
            $stmt = $db->prepare("INSERT INTO gallery (image_url, title, uploaded_at) VALUES (?, ?, NOW())");
            $stmt->execute([$data['image_url'], $data['title'] ?? '']);
            echo json_encode(['success' => true, 'id' => $db->lastInsertId()]);
        }
        break;
        
    case 'DELETE':
        $id = $_GET['id'] ?? null;
        if ($id) {
            // Önce resim URL'ini al
            $stmt = $db->prepare("SELECT image_url FROM gallery WHERE id = ?");
            $stmt->execute([$id]);
            $image = $stmt->fetch();
            
            if ($image) {
                // Veritabanından sil
                $stmt = $db->prepare("DELETE FROM gallery WHERE id = ?");
                $stmt->execute([$id]);
                
                // Fiziksel dosyayı sil
                $imagePath = str_replace($_SERVER['HTTP_HOST'] . '/', '../', $image['image_url']);
                $imagePath = parse_url($image['image_url'], PHP_URL_PATH);
                $imagePath = '..' . $imagePath;
                
                if (file_exists($imagePath)) {
                    unlink($imagePath);
                }
                
                echo json_encode(['success' => true]);
            } else {
                echo json_encode(['success' => false, 'error' => 'Resim bulunamadı']);
            }
        } else {
            echo json_encode(['success' => false, 'error' => 'ID eksik']);
        }
        break;
}
?>