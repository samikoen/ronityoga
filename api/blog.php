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
        // Get all blog posts
        try {
            // Blog tablosunun varlığını kontrol et
            $check = $db->query("SHOW TABLES LIKE 'blog_posts'");
            if ($check->rowCount() == 0) {
                echo json_encode(['success' => false, 'message' => 'Blog feature not initialized']);
                exit;
            }
            
            $page = $_GET['page'] ?? 1;
            $limit = $_GET['limit'] ?? 10;
            $offset = ($page - 1) * $limit;
            
            $category = $_GET['category'] ?? '';
            $search = $_GET['search'] ?? '';
            $status = $_GET['status'] ?? 'all';
            
            $where_conditions = [];
            $params = [];
            
            if ($category) {
                $where_conditions[] = "category = ?";
                $params[] = $category;
            }
            
            if ($search) {
                $where_conditions[] = "(title LIKE ? OR content LIKE ?)";
                $params[] = "%$search%";
                $params[] = "%$search%";
            }
            
            if ($status !== 'all') {
                $where_conditions[] = "status = ?";
                $params[] = $status;
            }
            
            $where_clause = $where_conditions ? 'WHERE ' . implode(' AND ', $where_conditions) : '';
            
            // Get total count
            $count_stmt = $db->prepare("SELECT COUNT(*) as total FROM blog_posts $where_clause");
            $count_stmt->execute($params);
            $total = $count_stmt->fetch()['total'];
            
            // Get blog posts
            $stmt = $db->prepare("
                SELECT id, title, excerpt, content, featured_image, category, status, 
                       created_at, updated_at, views, tags
                FROM blog_posts 
                $where_clause 
                ORDER BY created_at DESC 
                LIMIT ? OFFSET ?
            ");
            
            // PDO::execute() için parametreleri doğru şekilde bind et
            $all_params = array_merge($params, [(int)$limit, (int)$offset]);
            $stmt->execute($all_params);
            $posts = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Parse tags for each post
            foreach ($posts as &$post) {
                $post['tags'] = $post['tags'] ? explode(',', $post['tags']) : [];
            }
            
            echo json_encode([
                'posts' => $posts,
                'total' => $total,
                'page' => $page,
                'limit' => $limit,
                'pages' => ceil($total / $limit)
            ]);
            
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to fetch blog posts']);
        }
        break;
        
    case 'POST':
        // Create new blog post - requires admin authentication
        if (!isset($_SESSION['admin_logged_in'])) {
            http_response_code(401);
            echo json_encode(['error' => 'Unauthorized']);
            exit;
        }
        
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($input['title']) || !isset($input['content'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Title and content are required']);
            exit;
        }
        
        try {
            $stmt = $db->prepare("
                INSERT INTO blog_posts (title, excerpt, content, featured_image, category, 
                                      status, tags, meta_title, meta_description) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            
            $tags = isset($input['tags']) && is_array($input['tags']) ? implode(',', $input['tags']) : '';
            
            $stmt->execute([
                $input['title'],
                $input['excerpt'] ?? '',
                $input['content'],
                $input['featured_image'] ?? '',
                $input['category'] ?? 'Genel',
                $input['status'] ?? 'draft',
                $tags,
                $input['meta_title'] ?? $input['title'],
                $input['meta_description'] ?? $input['excerpt'] ?? ''
            ]);
            
            echo json_encode([
                'success' => true,
                'message' => 'Blog post created successfully',
                'id' => $db->lastInsertId()
            ]);
            
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to create blog post']);
        }
        break;
        
    case 'PUT':
        // Update blog post - requires admin authentication
        if (!isset($_SESSION['admin_logged_in'])) {
            http_response_code(401);
            echo json_encode(['error' => 'Unauthorized']);
            exit;
        }
        
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($input['id']) || !isset($input['title']) || !isset($input['content'])) {
            http_response_code(400);
            echo json_encode(['error' => 'ID, title and content are required']);
            exit;
        }
        
        try {
            $stmt = $db->prepare("
                UPDATE blog_posts 
                SET title = ?, excerpt = ?, content = ?, featured_image = ?, category = ?, 
                    status = ?, tags = ?, meta_title = ?, meta_description = ?, 
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            ");
            
            $tags = isset($input['tags']) && is_array($input['tags']) ? implode(',', $input['tags']) : '';
            
            $stmt->execute([
                $input['title'],
                $input['excerpt'] ?? '',
                $input['content'],
                $input['featured_image'] ?? '',
                $input['category'] ?? 'Genel',
                $input['status'] ?? 'draft',
                $tags,
                $input['meta_title'] ?? $input['title'],
                $input['meta_description'] ?? $input['excerpt'] ?? '',
                $input['id']
            ]);
            
            echo json_encode([
                'success' => true,
                'message' => 'Blog post updated successfully'
            ]);
            
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to update blog post']);
        }
        break;
        
    case 'DELETE':
        // Delete blog post - requires admin authentication
        if (!isset($_SESSION['admin_logged_in'])) {
            http_response_code(401);
            echo json_encode(['error' => 'Unauthorized']);
            exit;
        }
        
        $id = $_GET['id'] ?? null;
        if (!$id) {
            http_response_code(400);
            echo json_encode(['error' => 'ID parameter required']);
            exit;
        }
        
        try {
            $stmt = $db->prepare("DELETE FROM blog_posts WHERE id = ?");
            $stmt->execute([$id]);
            
            echo json_encode([
                'success' => true,
                'message' => 'Blog post deleted successfully'
            ]);
            
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to delete blog post']);
        }
        break;
        
    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        break;
}
?>