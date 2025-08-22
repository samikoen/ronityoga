<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        handleGet();
        break;
    case 'POST':
        handlePost();
        break;
    case 'PUT':
        handlePut();
        break;
    case 'DELETE':
        handleDelete();
        break;
    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        break;
}

function handleGet() {
    global $db;
    
    try {
        $category = $_GET['category'] ?? '';
        $difficulty = $_GET['difficulty'] ?? '';
        $duration = $_GET['duration'] ?? '';
        $search = $_GET['search'] ?? '';
        $limit = min((int)($_GET['limit'] ?? 20), 50);
        $offset = (int)($_GET['offset'] ?? 0);
        $meditation_id = $_GET['id'] ?? '';
        
        if ($meditation_id) {
            // Get single meditation with full details
            $stmt = $db->prepare("
                SELECT m.*, 
                       au.full_name as created_by_name,
                       (SELECT COUNT(*) FROM user_progress up WHERE up.activity_type = 'meditation' AND up.activity_id = m.id) as session_count
                FROM meditation_series m 
                LEFT JOIN admin_users au ON m.created_by = au.id 
                WHERE m.id = ? AND m.is_active = TRUE
            ");
            $stmt->execute([$meditation_id]);
            $meditation = $stmt->fetch();
            
            if ($meditation) {
                // Update play count
                $updateStmt = $db->prepare("UPDATE meditation_series SET play_count = play_count + 1 WHERE id = ?");
                $updateStmt->execute([$meditation_id]);
                
                // Decode JSON fields
                $jsonFields = ['benefits'];
                foreach ($jsonFields as $field) {
                    if ($meditation[$field]) {
                        $meditation[$field] = json_decode($meditation[$field], true);
                    }
                }
                
                echo json_encode($meditation);
            } else {
                http_response_code(404);
                echo json_encode(['error' => 'Meditation not found']);
            }
            return;
        }
        
        // Build query for meditation listing
        $whereConditions = ['m.is_active = TRUE'];
        $params = [];
        
        if ($category) {
            $whereConditions[] = 'm.category = ?';
            $params[] = $category;
        }
        
        if ($difficulty) {
            $whereConditions[] = 'm.difficulty_level = ?';
            $params[] = $difficulty;
        }
        
        if ($duration) {
            switch ($duration) {
                case 'short':
                    $whereConditions[] = 'm.duration_minutes <= 10';
                    break;
                case 'medium':
                    $whereConditions[] = 'm.duration_minutes BETWEEN 11 AND 20';
                    break;
                case 'long':
                    $whereConditions[] = 'm.duration_minutes > 20';
                    break;
            }
        }
        
        if ($search) {
            $whereConditions[] = '(m.title LIKE ? OR m.description LIKE ?)';
            $searchTerm = '%' . $search . '%';
            $params = array_merge($params, [$searchTerm, $searchTerm]);
        }
        
        $whereClause = implode(' AND ', $whereConditions);
        
        // Get total count
        $countStmt = $db->prepare("SELECT COUNT(*) as total FROM meditation_series m WHERE $whereClause");
        $countStmt->execute($params);
        $total = $countStmt->fetch()['total'];
        
        // Get meditations
        $stmt = $db->prepare("
            SELECT m.id, m.title, m.description, m.category, m.difficulty_level, m.duration_minutes,
                   m.series_order, m.featured_image, m.play_count, m.rating_average, m.rating_count,
                   m.is_premium, m.audio_file_url,
                   JSON_EXTRACT(m.benefits, '$[0]') as primary_benefit
            FROM meditation_series m 
            WHERE $whereClause 
            ORDER BY m.series_order ASC, m.rating_average DESC, m.play_count DESC
            LIMIT ? OFFSET ?
        ");
        
        $params[] = $limit;
        $params[] = $offset;
        $stmt->execute($params);
        $meditations = $stmt->fetchAll();
        
        // Get categories for filters
        $categoriesStmt = $db->query("
            SELECT category, COUNT(*) as count 
            FROM meditation_series 
            WHERE is_active = TRUE 
            GROUP BY category 
            ORDER BY category
        ");
        $categories = $categoriesStmt->fetchAll();
        
        echo json_encode([
            'meditations' => $meditations,
            'pagination' => [
                'total' => $total,
                'limit' => $limit,
                'offset' => $offset,
                'has_more' => ($offset + $limit) < $total
            ],
            'filters' => [
                'categories' => $categories,
                'difficulties' => [
                    ['value' => 'beginner', 'label' => 'Başlangıç'],
                    ['value' => 'intermediate', 'label' => 'Orta'],
                    ['value' => 'advanced', 'label' => 'İleri']
                ],
                'durations' => [
                    ['value' => 'short', 'label' => '5-10 dakika'],
                    ['value' => 'medium', 'label' => '11-20 dakika'],
                    ['value' => 'long', 'label' => '20+ dakika']
                ]
            ]
        ]);
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
    }
}

function handlePost() {
    global $db;
    
    // Check admin authentication
    if (!isset($_SESSION['admin_logged_in'])) {
        http_response_code(401);
        echo json_encode(['error' => 'Unauthorized access']);
        return;
    }
    
    try {
        $data = json_decode(file_get_contents('php://input'), true);
        
        // Validate required fields
        $required = ['title', 'description', 'category', 'difficulty_level', 'duration_minutes', 'audio_file_url'];
        foreach ($required as $field) {
            if (empty($data[$field])) {
                http_response_code(400);
                echo json_encode(['error' => "Required field missing: $field"]);
                return;
            }
        }
        
        // Prepare JSON fields
        if (isset($data['benefits'])) {
            $data['benefits'] = json_encode($data['benefits']);
        }
        
        $stmt = $db->prepare("
            INSERT INTO meditation_series (
                title, description, category, difficulty_level, duration_minutes, series_order,
                audio_file_url, background_music_url, transcript_turkish, transcript_english,
                featured_image, benefits, preparation_instructions, is_premium, created_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        
        $result = $stmt->execute([
            $data['title'],
            $data['description'],
            $data['category'],
            $data['difficulty_level'],
            $data['duration_minutes'],
            $data['series_order'] ?? 1,
            $data['audio_file_url'],
            $data['background_music_url'] ?? '',
            $data['transcript_turkish'] ?? '',
            $data['transcript_english'] ?? '',
            $data['featured_image'] ?? '',
            $data['benefits'] ?? null,
            $data['preparation_instructions'] ?? '',
            $data['is_premium'] ?? false,
            $_SESSION['admin_id'] ?? null
        ]);
        
        if ($result) {
            echo json_encode(['success' => true, 'id' => $db->lastInsertId()]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to create meditation']);
        }
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
    }
}

function handlePut() {
    global $db;
    
    // Check admin authentication
    if (!isset($_SESSION['admin_logged_in'])) {
        http_response_code(401);
        echo json_encode(['error' => 'Unauthorized access']);
        return;
    }
    
    try {
        $data = json_decode(file_get_contents('php://input'), true);
        $meditation_id = $data['id'] ?? null;
        
        if (!$meditation_id) {
            http_response_code(400);
            echo json_encode(['error' => 'Meditation ID required']);
            return;
        }
        
        // Prepare JSON fields
        if (isset($data['benefits'])) {
            $data['benefits'] = json_encode($data['benefits']);
        }
        
        $stmt = $db->prepare("
            UPDATE meditation_series SET
                title = ?, description = ?, category = ?, difficulty_level = ?, duration_minutes = ?,
                series_order = ?, audio_file_url = ?, background_music_url = ?, transcript_turkish = ?,
                transcript_english = ?, featured_image = ?, benefits = ?, preparation_instructions = ?,
                is_premium = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        ");
        
        $result = $stmt->execute([
            $data['title'],
            $data['description'],
            $data['category'],
            $data['difficulty_level'],
            $data['duration_minutes'],
            $data['series_order'] ?? 1,
            $data['audio_file_url'],
            $data['background_music_url'] ?? '',
            $data['transcript_turkish'] ?? '',
            $data['transcript_english'] ?? '',
            $data['featured_image'] ?? '',
            $data['benefits'] ?? null,
            $data['preparation_instructions'] ?? '',
            $data['is_premium'] ?? false,
            $data['is_active'] ?? true,
            $meditation_id
        ]);
        
        if ($result) {
            echo json_encode(['success' => true]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to update meditation']);
        }
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
    }
}

function handleDelete() {
    global $db;
    
    // Check admin authentication
    if (!isset($_SESSION['admin_logged_in'])) {
        http_response_code(401);
        echo json_encode(['error' => 'Unauthorized access']);
        return;
    }
    
    try {
        $meditation_id = $_GET['id'] ?? null;
        
        if (!$meditation_id) {
            http_response_code(400);
            echo json_encode(['error' => 'Meditation ID required']);
            return;
        }
        
        // Soft delete by setting is_active to FALSE
        $stmt = $db->prepare("UPDATE meditation_series SET is_active = FALSE WHERE id = ?");
        $result = $stmt->execute([$meditation_id]);
        
        if ($result) {
            echo json_encode(['success' => true]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to delete meditation']);
        }
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
    }
}
?>