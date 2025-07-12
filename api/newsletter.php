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
        // Get all subscribers - requires admin authentication
        if (!isset($_SESSION['admin_logged_in'])) {
            http_response_code(401);
            echo json_encode(['error' => 'Unauthorized']);
            exit;
        }
        
        $page = $_GET['page'] ?? 1;
        $limit = $_GET['limit'] ?? 50;
        $offset = ($page - 1) * $limit;
        
        $status_filter = $_GET['status'] ?? 'all';
        $search = $_GET['search'] ?? '';
        
        $where_conditions = [];
        $params = [];
        
        if ($status_filter !== 'all') {
            $where_conditions[] = "status = ?";
            $params[] = $status_filter;
        }
        
        if ($search) {
            $where_conditions[] = "email LIKE ?";
            $params[] = "%$search%";
        }
        
        $where_clause = $where_conditions ? 'WHERE ' . implode(' AND ', $where_conditions) : '';
        
        // Get total count
        $count_stmt = $db->prepare("SELECT COUNT(*) as total FROM newsletter_subscribers $where_clause");
        $count_stmt->execute($params);
        $total = $count_stmt->fetch()['total'];
        
        // Get subscribers
        $stmt = $db->prepare("
            SELECT id, email, subscribed_at, status, ip_address 
            FROM newsletter_subscribers 
            $where_clause 
            ORDER BY subscribed_at DESC 
            LIMIT ? OFFSET ?
        ");
        
        $params[] = $limit;
        $params[] = $offset;
        $stmt->execute($params);
        $subscribers = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'subscribers' => $subscribers,
            'total' => $total,
            'page' => $page,
            'limit' => $limit,
            'pages' => ceil($total / $limit)
        ]);
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