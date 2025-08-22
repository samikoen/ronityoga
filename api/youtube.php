<?php
require_once 'config.php';
require_once 'auth-functions.php';

// PHP encoding ayarları
mb_internal_encoding('UTF-8');
ini_set('default_charset', 'UTF-8');

header('Content-Type: application/json; charset=utf-8');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

try {
    $method = $_SERVER['REQUEST_METHOD'];
    $input = json_decode(file_get_contents('php://input'), true);
    
    switch ($method) {
        case 'GET':
            if (isset($_GET['id'])) {
                getYouTubeVideo($_GET['id']);
            } else {
                getYouTubeVideos();
            }
            break;
            
        case 'POST':
            if (!isAdmin()) {
                http_response_code(401);
                echo json_encode(['success' => false, 'message' => 'Unauthorized'], JSON_UNESCAPED_UNICODE);
                exit;
            }
            createYouTubeVideo($input);
            break;
            
        case 'PUT':
            if (!isAdmin()) {
                http_response_code(401);
                echo json_encode(['success' => false, 'message' => 'Unauthorized'], JSON_UNESCAPED_UNICODE);
                exit;
            }
            updateYouTubeVideo($input);
            break;
            
        case 'DELETE':
            if (!isAdmin()) {
                http_response_code(401);
                echo json_encode(['success' => false, 'message' => 'Unauthorized'], JSON_UNESCAPED_UNICODE);
                exit;
            }
            deleteYouTubeVideo($input);
            break;
            
        default:
            throw new Exception('Method not allowed');
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()], JSON_UNESCAPED_UNICODE);
}

function getYouTubeVideos() {
    global $db;
    
    error_log('YouTube API called - GET request');
    
    $category = $_GET['category'] ?? '';
    $isAdmin = isset($_GET['admin']) && $_GET['admin'] === 'true';
    
    error_log('Category: ' . $category . ', Admin: ' . ($isAdmin ? 'true' : 'false'));
    
    $sql = "SELECT * FROM youtube_videos";
    $params = [];
    $conditions = [];
    
    if (!$isAdmin) {
        $conditions[] = "is_active = 1";
    }
    
    if ($category) {
        $conditions[] = "category = ?";
        $params[] = $category;
    }
    
    if (!empty($conditions)) {
        $sql .= " WHERE " . implode(" AND ", $conditions);
    }
    
    $sql .= " ORDER BY display_order ASC, created_at ASC";
    
    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    $videos = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'videos' => $videos
    ], JSON_UNESCAPED_UNICODE);
}

function getYouTubeVideo($id) {
    global $db;
    
    $stmt = $db->prepare("SELECT * FROM youtube_videos WHERE id = ?");
    $stmt->execute([$id]);
    $video = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($video) {
        // View count'u artır
        $updateStmt = $db->prepare("UPDATE youtube_videos SET view_count = view_count + 1 WHERE id = ?");
        $updateStmt->execute([$id]);
        
        echo json_encode([
            'success' => true,
            'video' => $video
        ], JSON_UNESCAPED_UNICODE);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Video not found'
        ], JSON_UNESCAPED_UNICODE);
    }
}

function createYouTubeVideo($input) {
    global $db;
    
    $title = $input['title'] ?? '';
    $youtube_url = $input['youtube_url'] ?? '';
    $description = $input['description'] ?? '';
    $category = $input['category'] ?? 'yoga_related';
    
    if (empty($title) || empty($youtube_url)) {
        throw new Exception('Title and YouTube URL are required');
    }
    
    // YouTube ID'yi URL'den çıkar
    $youtube_id = extractYouTubeId($youtube_url);
    if (!$youtube_id) {
        throw new Exception('Invalid YouTube URL');
    }
    
    // Thumbnail URL oluştur - farklı kaliteler dene
    $thumbnail_url = "https://img.youtube.com/vi/{$youtube_id}/hqdefault.jpg";
    
    // En yüksek display_order'ı bul
    $maxOrderStmt = $db->prepare("SELECT MAX(display_order) as max_order FROM youtube_videos");
    $maxOrderStmt->execute();
    $result = $maxOrderStmt->fetch(PDO::FETCH_ASSOC);
    $nextOrder = ($result['max_order'] ?? 0) + 1;
    
    $sql = "INSERT INTO youtube_videos (title, youtube_url, youtube_id, description, category, thumbnail_url, display_order) 
            VALUES (?, ?, ?, ?, ?, ?, ?)";
    
    $stmt = $db->prepare($sql);
    $stmt->execute([$title, $youtube_url, $youtube_id, $description, $category, $thumbnail_url, $nextOrder]);
    
    echo json_encode([
        'success' => true,
        'message' => 'YouTube video added successfully',
        'id' => $db->lastInsertId()
    ], JSON_UNESCAPED_UNICODE);
}

function updateYouTubeVideo($input) {
    global $db;
    
    $id = $input['id'] ?? 0;
    $title = $input['title'] ?? '';
    $youtube_url = $input['youtube_url'] ?? '';
    $description = $input['description'] ?? '';
    $category = $input['category'] ?? 'yoga_related';
    $is_active = $input['is_active'] ?? 1;
    $display_order = $input['display_order'] ?? 0;
    
    if (empty($id) || empty($title) || empty($youtube_url)) {
        throw new Exception('ID, title and YouTube URL are required');
    }
    
    // YouTube ID'yi URL'den çıkar
    $youtube_id = extractYouTubeId($youtube_url);
    if (!$youtube_id) {
        throw new Exception('Invalid YouTube URL');
    }
    
    // Thumbnail URL oluştur - farklı kaliteler dene
    $thumbnail_url = "https://img.youtube.com/vi/{$youtube_id}/hqdefault.jpg";
    
    $sql = "UPDATE youtube_videos 
            SET title = ?, youtube_url = ?, youtube_id = ?, description = ?, 
                category = ?, thumbnail_url = ?, is_active = ?, display_order = ?
            WHERE id = ?";
    
    $stmt = $db->prepare($sql);
    $stmt->execute([$title, $youtube_url, $youtube_id, $description, $category, 
                    $thumbnail_url, $is_active, $display_order, $id]);
    
    echo json_encode([
        'success' => true,
        'message' => 'YouTube video updated successfully'
    ], JSON_UNESCAPED_UNICODE);
}

function deleteYouTubeVideo($input) {
    global $db;
    
    $id = $input['id'] ?? 0;
    
    if (empty($id)) {
        throw new Exception('Video ID is required');
    }
    
    $stmt = $db->prepare("DELETE FROM youtube_videos WHERE id = ?");
    $stmt->execute([$id]);
    
    echo json_encode([
        'success' => true,
        'message' => 'YouTube video deleted successfully'
    ], JSON_UNESCAPED_UNICODE);
}

function extractYouTubeId($url) {
    $pattern = '/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i';
    
    if (preg_match($pattern, $url, $matches)) {
        return $matches[1];
    }
    
    return false;
}
?>