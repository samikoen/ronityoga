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
        // Get all site content
        try {
            $stmt = $db->prepare("SELECT section, content FROM site_content");
            $stmt->execute();
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            $content = [];
            foreach ($results as $row) {
                $content[$row['section']] = json_decode($row['content'], true);
            }
            
            echo json_encode($content);
            
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to fetch content']);
        }
        break;
        
    case 'POST':
    case 'PUT':
        // Update site content - temporarily disable auth for testing
        // if (!isset($_SESSION['admin_logged_in'])) {
        //     http_response_code(401);
        //     echo json_encode(['error' => 'Unauthorized']);
        //     exit;
        // }
        
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($input['section']) || !isset($input['content'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Section and content are required']);
            exit;
        }
        
        $section = $input['section'];
        $content = json_encode($input['content']);
        
        try {
            $stmt = $db->prepare("
                INSERT INTO site_content (section, content) 
                VALUES (?, ?)
                ON DUPLICATE KEY UPDATE 
                content = VALUES(content),
                updated_at = CURRENT_TIMESTAMP
            ");
            
            $stmt->execute([$section, $content]);
            
            echo json_encode([
                'success' => true,
                'message' => 'Content updated successfully'
            ]);
            
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to update content']);
        }
        break;
        
    case 'DELETE':
        // Delete content section - temporarily disable auth for testing
        // if (!isset($_SESSION['admin_logged_in'])) {
        //     http_response_code(401);
        //     echo json_encode(['error' => 'Unauthorized']);
        //     exit;
        // }
        
        $section = $_GET['section'] ?? null;
        if (!$section) {
            http_response_code(400);
            echo json_encode(['error' => 'Section parameter required']);
            exit;
        }
        
        try {
            $stmt = $db->prepare("DELETE FROM site_content WHERE section = ?");
            $stmt->execute([$section]);
            
            echo json_encode([
                'success' => true,
                'message' => 'Content section deleted'
            ]);
            
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to delete content']);
        }
        break;
        
    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        break;
}
?>