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
        $search = $_GET['search'] ?? '';
        $limit = min((int)($_GET['limit'] ?? 20), 50);
        $offset = (int)($_GET['offset'] ?? 0);
        $pose_id = $_GET['id'] ?? '';
        
        if ($pose_id) {
            // Get single pose with full details
            $stmt = $db->prepare("
                SELECT p.*, 
                       au.full_name as created_by_name,
                       (SELECT COUNT(*) FROM user_progress up WHERE up.activity_type = 'pose_practice' AND up.activity_id = p.id) as practice_count
                FROM yoga_poses p 
                LEFT JOIN admin_users au ON p.created_by = au.id 
                WHERE p.id = ? AND p.is_active = TRUE
            ");
            $stmt->execute([$pose_id]);
            $pose = $stmt->fetch();
            
            if ($pose) {
                // Update view count
                $updateStmt = $db->prepare("UPDATE yoga_poses SET view_count = view_count + 1 WHERE id = ?");
                $updateStmt->execute([$pose_id]);
                
                // Decode JSON fields
                $jsonFields = ['benefits', 'contraindications', 'muscle_groups', 'chakras', 'preparation_poses', 'counter_poses', 'modifications', 'props_needed', 'step_by_step_images'];
                foreach ($jsonFields as $field) {
                    if ($pose[$field]) {
                        $pose[$field] = json_decode($pose[$field], true);
                    }
                }
                
                echo json_encode($pose);
            } else {
                http_response_code(404);
                echo json_encode(['error' => 'Pose not found']);
            }
            return;
        }
        
        // Build query for pose listing
        $whereConditions = ['p.is_active = TRUE'];
        $params = [];
        
        if ($category) {
            $whereConditions[] = 'p.category = ?';
            $params[] = $category;
        }
        
        if ($difficulty) {
            $whereConditions[] = 'p.difficulty_level = ?';
            $params[] = $difficulty;
        }
        
        if ($search) {
            $whereConditions[] = '(p.name_turkish LIKE ? OR p.name_english LIKE ? OR p.name_sanskrit LIKE ? OR p.description_turkish LIKE ?)';
            $searchTerm = '%' . $search . '%';
            $params = array_merge($params, [$searchTerm, $searchTerm, $searchTerm, $searchTerm]);
        }
        
        $whereClause = implode(' AND ', $whereConditions);
        
        // Get total count
        $countStmt = $db->prepare("SELECT COUNT(*) as total FROM yoga_poses p WHERE $whereClause");
        $countStmt->execute($params);
        $total = $countStmt->fetch()['total'];
        
        // Get poses
        $stmt = $db->prepare("
            SELECT p.id, p.name_turkish, p.name_english, p.name_sanskrit, p.category, p.difficulty_level,
                   p.duration_min, p.duration_max, p.description_turkish, p.featured_image,
                   p.view_count, p.rating_average, p.rating_count,
                   JSON_EXTRACT(p.benefits, '$[0]') as primary_benefit,
                   JSON_EXTRACT(p.muscle_groups, '$[0]') as primary_muscle_group
            FROM yoga_poses p 
            WHERE $whereClause 
            ORDER BY p.rating_average DESC, p.view_count DESC, p.created_at DESC
            LIMIT ? OFFSET ?
        ");
        
        $params[] = $limit;
        $params[] = $offset;
        $stmt->execute($params);
        $poses = $stmt->fetchAll();
        
        // Get categories for filters
        $categoriesStmt = $db->query("
            SELECT category, COUNT(*) as count 
            FROM yoga_poses 
            WHERE is_active = TRUE 
            GROUP BY category 
            ORDER BY category
        ");
        $categories = $categoriesStmt->fetchAll();
        
        echo json_encode([
            'poses' => $poses,
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
        $required = ['name_turkish', 'name_english', 'category', 'difficulty_level', 'description_turkish'];
        foreach ($required as $field) {
            if (empty($data[$field])) {
                http_response_code(400);
                echo json_encode(['error' => "Required field missing: $field"]);
                return;
            }
        }
        
        // Prepare JSON fields
        $jsonFields = ['benefits', 'contraindications', 'muscle_groups', 'chakras', 'preparation_poses', 'counter_poses', 'modifications', 'props_needed', 'step_by_step_images'];
        foreach ($jsonFields as $field) {
            if (isset($data[$field])) {
                $data[$field] = json_encode($data[$field]);
            }
        }
        
        $stmt = $db->prepare("
            INSERT INTO yoga_poses (
                name_turkish, name_english, name_sanskrit, category, difficulty_level,
                duration_min, duration_max, description_turkish, description_english,
                benefits, contraindications, muscle_groups, chakras, preparation_poses,
                counter_poses, modifications, props_needed, featured_image,
                step_by_step_images, video_url, audio_instruction_url, created_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        
        $result = $stmt->execute([
            $data['name_turkish'],
            $data['name_english'] ?? '',
            $data['name_sanskrit'] ?? '',
            $data['category'],
            $data['difficulty_level'],
            $data['duration_min'] ?? 30,
            $data['duration_max'] ?? 60,
            $data['description_turkish'],
            $data['description_english'] ?? '',
            $data['benefits'] ?? null,
            $data['contraindications'] ?? null,
            $data['muscle_groups'] ?? null,
            $data['chakras'] ?? null,
            $data['preparation_poses'] ?? null,
            $data['counter_poses'] ?? null,
            $data['modifications'] ?? null,
            $data['props_needed'] ?? null,
            $data['featured_image'] ?? '',
            $data['step_by_step_images'] ?? null,
            $data['video_url'] ?? '',
            $data['audio_instruction_url'] ?? '',
            $_SESSION['admin_id'] ?? null
        ]);
        
        if ($result) {
            echo json_encode(['success' => true, 'id' => $db->lastInsertId()]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to create pose']);
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
        $pose_id = $data['id'] ?? null;
        
        if (!$pose_id) {
            http_response_code(400);
            echo json_encode(['error' => 'Pose ID required']);
            return;
        }
        
        // Prepare JSON fields
        $jsonFields = ['benefits', 'contraindications', 'muscle_groups', 'chakras', 'preparation_poses', 'counter_poses', 'modifications', 'props_needed', 'step_by_step_images'];
        foreach ($jsonFields as $field) {
            if (isset($data[$field])) {
                $data[$field] = json_encode($data[$field]);
            }
        }
        
        $stmt = $db->prepare("
            UPDATE yoga_poses SET
                name_turkish = ?, name_english = ?, name_sanskrit = ?, category = ?, difficulty_level = ?,
                duration_min = ?, duration_max = ?, description_turkish = ?, description_english = ?,
                benefits = ?, contraindications = ?, muscle_groups = ?, chakras = ?, preparation_poses = ?,
                counter_poses = ?, modifications = ?, props_needed = ?, featured_image = ?,
                step_by_step_images = ?, video_url = ?, audio_instruction_url = ?, is_active = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        ");
        
        $result = $stmt->execute([
            $data['name_turkish'],
            $data['name_english'] ?? '',
            $data['name_sanskrit'] ?? '',
            $data['category'],
            $data['difficulty_level'],
            $data['duration_min'] ?? 30,
            $data['duration_max'] ?? 60,
            $data['description_turkish'],
            $data['description_english'] ?? '',
            $data['benefits'] ?? null,
            $data['contraindications'] ?? null,
            $data['muscle_groups'] ?? null,
            $data['chakras'] ?? null,
            $data['preparation_poses'] ?? null,
            $data['counter_poses'] ?? null,
            $data['modifications'] ?? null,
            $data['props_needed'] ?? null,
            $data['featured_image'] ?? '',
            $data['step_by_step_images'] ?? null,
            $data['video_url'] ?? '',
            $data['audio_instruction_url'] ?? '',
            $data['is_active'] ?? true,
            $pose_id
        ]);
        
        if ($result) {
            echo json_encode(['success' => true]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to update pose']);
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
        $pose_id = $_GET['id'] ?? null;
        
        if (!$pose_id) {
            http_response_code(400);
            echo json_encode(['error' => 'Pose ID required']);
            return;
        }
        
        // Soft delete by setting is_active to FALSE
        $stmt = $db->prepare("UPDATE yoga_poses SET is_active = FALSE WHERE id = ?");
        $result = $stmt->execute([$pose_id]);
        
        if ($result) {
            echo json_encode(['success' => true]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to delete pose']);
        }
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
    }
}
?>