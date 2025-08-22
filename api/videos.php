<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit(0);
}

try {
    $pdo = new PDO("mysql:host=localhost;dbname=ronityog_db;charset=utf8", "ronityog_ronit", "alenroy11.");
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $e) {
    echo json_encode(['success' => false, 'error' => 'Database connection failed']);
    exit;
}

// Video tablosunu oluştur veya güncelle
try {
    // Önce tabloyu oluştur
    $createTable = "CREATE TABLE IF NOT EXISTS videos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT
    )";
    $pdo->exec($createTable);
    
    // Sonra eksik sütunları ekle
    $stmt = $pdo->query("SHOW COLUMNS FROM videos");
    $columns = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    if (!in_array('file_path', $columns)) {
        $pdo->exec("ALTER TABLE videos ADD COLUMN file_path VARCHAR(500) AFTER description");
    }
    
    if (!in_array('target_audience', $columns)) {
        $pdo->exec("ALTER TABLE videos ADD COLUMN target_audience ENUM('beginner', 'intermediate', 'advanced', 'all') DEFAULT 'all' AFTER file_path");
    }
    
    if (!in_array('difficulty', $columns)) {
        $pdo->exec("ALTER TABLE videos ADD COLUMN difficulty ENUM('easy', 'medium', 'hard') DEFAULT 'medium' AFTER target_audience");
    }
    
    if (!in_array('created_at', $columns)) {
        $pdo->exec("ALTER TABLE videos ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP AFTER difficulty");
    }
    
    if (!in_array('updated_at', $columns)) {
        $pdo->exec("ALTER TABLE videos ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at");
    }
    
} catch(PDOException $e) {
    echo json_encode(['success' => false, 'error' => 'Table setup failed: ' . $e->getMessage()]);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        if (isset($_GET['id'])) {
            // Tek video getir
            $id = $_GET['id'];
            $stmt = $pdo->prepare("SELECT * FROM videos WHERE id = ?");
            $stmt->execute([$id]);
            $video = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($video) {
                echo json_encode($video);
            } else {
                echo json_encode(['success' => false, 'error' => 'Video not found']);
            }
        } else {
            // Tüm videoları getir
            $stmt = $pdo->prepare("SELECT * FROM videos ORDER BY created_at DESC");
            $stmt->execute();
            $videos = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode($videos);
        }
        break;
        
    case 'POST':
        // Video ekle
        if (!isset($_POST['title']) || !isset($_POST['description']) || !isset($_POST['target_audience']) || !isset($_POST['difficulty'])) {
            echo json_encode(['success' => false, 'error' => 'Missing required fields']);
            exit;
        }
        
        $title = $_POST['title'];
        $description = $_POST['description'];
        $target_audience = $_POST['target_audience'];
        $difficulty = $_POST['difficulty'];
        $file_path = null;
        
        // Video dosyası yükleme
        if (isset($_FILES['video']) && $_FILES['video']['error'] === UPLOAD_ERR_OK) {
            $uploadDir = '../uploads/videos/';
            if (!is_dir($uploadDir)) {
                mkdir($uploadDir, 0755, true);
            }
            
            $fileExtension = pathinfo($_FILES['video']['name'], PATHINFO_EXTENSION);
            $fileName = uniqid() . '_' . time() . '.' . $fileExtension;
            $filePath = $uploadDir . $fileName;
            
            if (move_uploaded_file($_FILES['video']['tmp_name'], $filePath)) {
                $file_path = 'uploads/videos/' . $fileName;
            } else {
                echo json_encode(['success' => false, 'error' => 'File upload failed']);
                exit;
            }
        }
        
        try {
            $stmt = $pdo->prepare("INSERT INTO videos (title, description, file_path, target_audience, difficulty) VALUES (?, ?, ?, ?, ?)");
            $stmt->execute([$title, $description, $file_path, $target_audience, $difficulty]);
            echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
        } catch(PDOException $e) {
            echo json_encode(['success' => false, 'error' => 'Database error: ' . $e->getMessage()]);
        }
        break;
        
    case 'PUT':
        // Video güncelle
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($input['id']) || !isset($input['title']) || !isset($input['description'])) {
            echo json_encode(['success' => false, 'error' => 'Missing required fields']);
            exit;
        }
        
        $id = $input['id'];
        $title = $input['title'];
        $description = $input['description'];
        $target_audience = $input['target_audience'] ?? 'all';
        $difficulty = $input['difficulty'] ?? 'medium';
        
        try {
            $stmt = $pdo->prepare("UPDATE videos SET title = ?, description = ?, target_audience = ?, difficulty = ? WHERE id = ?");
            $stmt->execute([$title, $description, $target_audience, $difficulty, $id]);
            
            if ($stmt->rowCount() > 0) {
                echo json_encode(['success' => true]);
            } else {
                echo json_encode(['success' => false, 'error' => 'Video not found or no changes made']);
            }
        } catch(PDOException $e) {
            echo json_encode(['success' => false, 'error' => 'Database error: ' . $e->getMessage()]);
        }
        break;
        
    case 'DELETE':
        // Video sil
        if (!isset($_GET['id'])) {
            echo json_encode(['success' => false, 'error' => 'Video ID is required']);
            exit;
        }
        
        $id = $_GET['id'];
        
        try {
            // Önce video dosyasını al
            $stmt = $pdo->prepare("SELECT file_path FROM videos WHERE id = ?");
            $stmt->execute([$id]);
            $video = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($video && $video['file_path']) {
                $filePath = '../' . $video['file_path'];
                if (file_exists($filePath)) {
                    unlink($filePath);
                }
            }
            
            // Veritabanından sil
            $stmt = $pdo->prepare("DELETE FROM videos WHERE id = ?");
            $stmt->execute([$id]);
            
            if ($stmt->rowCount() > 0) {
                echo json_encode(['success' => true]);
            } else {
                echo json_encode(['success' => false, 'error' => 'Video not found']);
            }
        } catch(PDOException $e) {
            echo json_encode(['success' => false, 'error' => 'Database error: ' . $e->getMessage()]);
        }
        break;
        
    default:
        echo json_encode(['success' => false, 'error' => 'Method not allowed']);
        break;
}
?>