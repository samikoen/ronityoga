<?php
// DEBUG MODE - Hataları göster
error_reporting(E_ALL);
ini_set('display_errors', 1);

session_start();
header('Content-Type: application/json; charset=utf-8');

// DB bağlantısı
try {
    $db = new PDO("mysql:host=localhost;dbname=ronityog_db;charset=utf8", "ronityog_ronit", "alenroy11.");
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $db->exec("SET NAMES 'utf8'");
    
    // Test newsletter table exists
    $stmt = $db->prepare("SHOW TABLES LIKE 'newsletter_subscribers'");
    $stmt->execute();
    if (!$stmt->fetch()) {
        // Create table if it doesn't exist
        $db->exec("
            CREATE TABLE newsletter_subscribers (
                id INT AUTO_INCREMENT PRIMARY KEY,
                email VARCHAR(255) NOT NULL UNIQUE,
                subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                status ENUM('active', 'unsubscribed') DEFAULT 'active',
                ip_address VARCHAR(45),
                user_agent TEXT,
                INDEX idx_email (email),
                INDEX idx_status (status),
                INDEX idx_subscribed_at (subscribed_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        ");
    }
} catch(PDOException $e) {
    http_response_code(500);
    die(json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]));
}

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'POST':
        // Subscribe to newsletter
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($input['email']) || !filter_var($input['email'], FILTER_VALIDATE_EMAIL)) {
            http_response_code(400);
            echo json_encode(['error' => 'Geçerli bir e-posta adresi gerekli']);
            exit;
        }
        
        $email = $input['email'];
        $ip_address = $_SERVER['REMOTE_ADDR'] ?? '';
        $user_agent = $_SERVER['HTTP_USER_AGENT'] ?? '';
        
        try {
            $stmt = $db->prepare("
                INSERT INTO newsletter_subscribers (email, ip_address, user_agent) 
                VALUES (?, ?, ?)
                ON DUPLICATE KEY UPDATE 
                status = 'active',
                subscribed_at = CURRENT_TIMESTAMP
            ");
            
            $stmt->execute([$email, $ip_address, $user_agent]);
            
            echo json_encode([
                'success' => true,
                'message' => 'Başarıyla abone oldunuz! Haftalık ipuçlarımızı e-postanızda bulacaksınız.'
            ]);
            
        } catch (PDOException $e) {
            if ($e->getCode() == 23000) {
                echo json_encode([
                    'success' => true,
                    'message' => 'Bu e-posta adresi zaten kayıtlı.'
                ]);
            } else {
                http_response_code(500);
                echo json_encode(['error' => 'Abonelik işlemi başarısız']);
            }
        }
        break;
        
    case 'GET':
        try {
            // Test database connection first
            $test_stmt = $db->query("SELECT 1");
            if (!$test_stmt) {
                throw new Exception("Database connection test failed");
            }
            
            // Try to get subscribers with simple query
            $stmt = $db->query("SELECT id, email, subscribed_at, status, ip_address FROM newsletter_subscribers ORDER BY subscribed_at DESC LIMIT 50");
            $subscribers = $stmt ? $stmt->fetchAll(PDO::FETCH_ASSOC) : [];
            
            // Get total count
            $count_stmt = $db->query("SELECT COUNT(*) as total FROM newsletter_subscribers");
            $total = $count_stmt ? (int)$count_stmt->fetch()['total'] : 0;
            
            echo json_encode([
                'subscribers' => $subscribers,
                'total' => $total,
                'page' => 1,
                'limit' => 50,
                'pages' => max(1, ceil($total / 50)),
                'debug' => 'Real data query successful'
            ]);
            
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'error' => 'Newsletter load error: ' . $e->getMessage(),
                'debug' => 'Exception caught in GET case'
            ]);
        }
        break;
        
    case 'DELETE':
        // Unsubscribe or delete subscriber - requires admin authentication
        if (!isset($_SESSION['admin_logged_in'])) {
            http_response_code(401);
            echo json_encode(['error' => 'Unauthorized']);
            exit;
        }
        
        $id = $_GET['id'] ?? null;
        if (!$id) {
            http_response_code(400);
            echo json_encode(['error' => 'ID gerekli']);
            exit;
        }
        
        $action = $_GET['action'] ?? 'unsubscribe';
        
        if ($action === 'delete') {
            $stmt = $db->prepare("DELETE FROM newsletter_subscribers WHERE id = ?");
        } else {
            $stmt = $db->prepare("UPDATE newsletter_subscribers SET status = 'unsubscribed' WHERE id = ?");
        }
        
        $stmt->execute([$id]);
        
        echo json_encode([
            'success' => true,
            'message' => $action === 'delete' ? 'Abone silindi' : 'Abonelik iptal edildi'
        ]);
        break;
        
    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        break;
}
?>