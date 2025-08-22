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
        $search = $_GET['search'] ?? '';
        $min_price = $_GET['min_price'] ?? '';
        $max_price = $_GET['max_price'] ?? '';
        $brand = $_GET['brand'] ?? '';
        $sort = $_GET['sort'] ?? 'newest';
        $limit = min((int)($_GET['limit'] ?? 20), 50);
        $offset = (int)($_GET['offset'] ?? 0);
        $product_id = $_GET['id'] ?? '';
        
        if ($product_id) {
            // Get single product with full details and reviews
            $stmt = $db->prepare("
                SELECT p.*, 
                       au.full_name as created_by_name,
                       (SELECT COUNT(*) FROM product_reviews pr WHERE pr.product_id = p.id AND pr.is_approved = TRUE) as review_count,
                       (SELECT AVG(rating) FROM product_reviews pr WHERE pr.product_id = p.id AND pr.is_approved = TRUE) as avg_rating
                FROM products p 
                LEFT JOIN admin_users au ON p.created_by = au.id 
                WHERE p.id = ? AND p.is_active = TRUE
            ");
            $stmt->execute([$product_id]);
            $product = $stmt->fetch();
            
            if ($product) {
                // Update view count
                $updateStmt = $db->prepare("UPDATE products SET view_count = view_count + 1 WHERE id = ?");
                $updateStmt->execute([$product_id]);
                
                // Decode JSON fields
                $jsonFields = ['dimensions', 'colors', 'sizes', 'materials', 'features', 'images', 'tags'];
                foreach ($jsonFields as $field) {
                    if ($product[$field]) {
                        $product[$field] = json_decode($product[$field], true);
                    }
                }
                
                // Get product reviews
                $reviewsStmt = $db->prepare("
                    SELECT pr.*, u.first_name, u.last_name
                    FROM product_reviews pr 
                    LEFT JOIN users u ON pr.user_id = u.id 
                    WHERE pr.product_id = ? AND pr.is_approved = TRUE 
                    ORDER BY pr.created_at DESC 
                    LIMIT 10
                ");
                $reviewsStmt->execute([$product_id]);
                $product['reviews'] = $reviewsStmt->fetchAll();
                
                // Get related products
                $relatedStmt = $db->prepare("
                    SELECT id, name, price, sale_price, featured_image, rating_average 
                    FROM products 
                    WHERE category = ? AND id != ? AND is_active = TRUE 
                    ORDER BY rating_average DESC 
                    LIMIT 4
                ");
                $relatedStmt->execute([$product['category'], $product_id]);
                $product['related_products'] = $relatedStmt->fetchAll();
                
                echo json_encode($product);
            } else {
                http_response_code(404);
                echo json_encode(['error' => 'Product not found']);
            }
            return;
        }
        
        // Build query for product listing
        $whereConditions = ['p.is_active = TRUE'];
        $params = [];
        
        if ($category) {
            $whereConditions[] = 'p.category = ?';
            $params[] = $category;
        }
        
        if ($brand) {
            $whereConditions[] = 'p.brand = ?';
            $params[] = $brand;
        }
        
        if ($min_price) {
            $whereConditions[] = 'p.price >= ?';
            $params[] = $min_price;
        }
        
        if ($max_price) {
            $whereConditions[] = 'p.price <= ?';
            $params[] = $max_price;
        }
        
        if ($search) {
            $whereConditions[] = '(p.name LIKE ? OR p.description LIKE ? OR p.short_description LIKE ?)';
            $searchTerm = '%' . $search . '%';
            $params = array_merge($params, [$searchTerm, $searchTerm, $searchTerm]);
        }
        
        $whereClause = implode(' AND ', $whereConditions);
        
        // Define sort options
        $sortOptions = [
            'newest' => 'p.created_at DESC',
            'oldest' => 'p.created_at ASC',
            'price_low' => 'p.price ASC',
            'price_high' => 'p.price DESC',
            'rating' => 'p.rating_average DESC',
            'popular' => 'p.view_count DESC',
            'name' => 'p.name ASC'
        ];
        
        $orderBy = $sortOptions[$sort] ?? $sortOptions['newest'];
        
        // Get total count
        $countStmt = $db->prepare("SELECT COUNT(*) as total FROM products p WHERE $whereClause");
        $countStmt->execute($params);
        $total = $countStmt->fetch()['total'];
        
        // Get products
        $stmt = $db->prepare("
            SELECT p.id, p.name, p.short_description, p.category, p.brand, p.sku,
                   p.price, p.sale_price, p.currency, p.stock_quantity, p.low_stock_threshold,
                   p.rating_average, p.rating_count, p.view_count, p.is_featured, p.is_digital,
                   JSON_EXTRACT(p.images, '$[0]') as featured_image,
                   JSON_EXTRACT(p.colors, '$[0]') as primary_color,
                   CASE WHEN p.stock_quantity <= p.low_stock_threshold THEN 1 ELSE 0 END as is_low_stock
            FROM products p 
            WHERE $whereClause 
            ORDER BY p.is_featured DESC, $orderBy
            LIMIT ? OFFSET ?
        ");
        
        $params[] = $limit;
        $params[] = $offset;
        $stmt->execute($params);
        $products = $stmt->fetchAll();
        
        // Get filter options
        $categoriesStmt = $db->query("
            SELECT category, COUNT(*) as count 
            FROM products 
            WHERE is_active = TRUE 
            GROUP BY category 
            ORDER BY category
        ");
        $categories = $categoriesStmt->fetchAll();
        
        $brandsStmt = $db->query("
            SELECT brand, COUNT(*) as count 
            FROM products 
            WHERE is_active = TRUE AND brand IS NOT NULL AND brand != ''
            GROUP BY brand 
            ORDER BY brand
        ");
        $brands = $brandsStmt->fetchAll();
        
        $priceRangeStmt = $db->query("
            SELECT MIN(price) as min_price, MAX(price) as max_price 
            FROM products 
            WHERE is_active = TRUE
        ");
        $priceRange = $priceRangeStmt->fetch();
        
        echo json_encode([
            'products' => $products,
            'pagination' => [
                'total' => $total,
                'limit' => $limit,
                'offset' => $offset,
                'has_more' => ($offset + $limit) < $total
            ],
            'filters' => [
                'categories' => $categories,
                'brands' => $brands,
                'price_range' => $priceRange,
                'sort_options' => [
                    ['value' => 'newest', 'label' => 'En Yeni'],
                    ['value' => 'price_low', 'label' => 'Fiyat: Düşükten Yükseğe'],
                    ['value' => 'price_high', 'label' => 'Fiyat: Yüksekten Düşüğe'],
                    ['value' => 'rating', 'label' => 'En Çok Beğenilen'],
                    ['value' => 'popular', 'label' => 'En Popüler'],
                    ['value' => 'name', 'label' => 'İsim (A-Z)']
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
        $required = ['name', 'description', 'category', 'price'];
        foreach ($required as $field) {
            if (empty($data[$field])) {
                http_response_code(400);
                echo json_encode(['error' => "Required field missing: $field"]);
                return;
            }
        }
        
        // Generate SKU if not provided
        if (empty($data['sku'])) {
            $data['sku'] = strtoupper(substr($data['category'], 0, 3) . '-' . uniqid());
        }
        
        // Prepare JSON fields
        $jsonFields = ['dimensions', 'colors', 'sizes', 'materials', 'features', 'images', 'tags'];
        foreach ($jsonFields as $field) {
            if (isset($data[$field])) {
                $data[$field] = json_encode($data[$field]);
            }
        }
        
        $stmt = $db->prepare("
            INSERT INTO products (
                name, description, short_description, category, brand, sku, price, sale_price,
                currency, stock_quantity, low_stock_threshold, weight_kg, dimensions, colors,
                sizes, materials, care_instructions, features, images, video_url, is_digital,
                digital_file_url, is_featured, meta_title, meta_description, tags, created_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        
        $result = $stmt->execute([
            $data['name'],
            $data['description'],
            $data['short_description'] ?? '',
            $data['category'],
            $data['brand'] ?? '',
            $data['sku'],
            $data['price'],
            $data['sale_price'] ?? null,
            $data['currency'] ?? 'TRY',
            $data['stock_quantity'] ?? 0,
            $data['low_stock_threshold'] ?? 5,
            $data['weight_kg'] ?? null,
            $data['dimensions'] ?? null,
            $data['colors'] ?? null,
            $data['sizes'] ?? null,
            $data['materials'] ?? null,
            $data['care_instructions'] ?? '',
            $data['features'] ?? null,
            $data['images'] ?? null,
            $data['video_url'] ?? '',
            $data['is_digital'] ?? false,
            $data['digital_file_url'] ?? '',
            $data['is_featured'] ?? false,
            $data['meta_title'] ?? '',
            $data['meta_description'] ?? '',
            $data['tags'] ?? null,
            $_SESSION['admin_id'] ?? null
        ]);
        
        if ($result) {
            echo json_encode(['success' => true, 'id' => $db->lastInsertId()]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to create product']);
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
        $product_id = $data['id'] ?? null;
        
        if (!$product_id) {
            http_response_code(400);
            echo json_encode(['error' => 'Product ID required']);
            return;
        }
        
        // Prepare JSON fields
        $jsonFields = ['dimensions', 'colors', 'sizes', 'materials', 'features', 'images', 'tags'];
        foreach ($jsonFields as $field) {
            if (isset($data[$field])) {
                $data[$field] = json_encode($data[$field]);
            }
        }
        
        $stmt = $db->prepare("
            UPDATE products SET
                name = ?, description = ?, short_description = ?, category = ?, brand = ?,
                sku = ?, price = ?, sale_price = ?, currency = ?, stock_quantity = ?,
                low_stock_threshold = ?, weight_kg = ?, dimensions = ?, colors = ?, sizes = ?,
                materials = ?, care_instructions = ?, features = ?, images = ?, video_url = ?,
                is_digital = ?, digital_file_url = ?, is_featured = ?, is_active = ?,
                meta_title = ?, meta_description = ?, tags = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        ");
        
        $result = $stmt->execute([
            $data['name'],
            $data['description'],
            $data['short_description'] ?? '',
            $data['category'],
            $data['brand'] ?? '',
            $data['sku'],
            $data['price'],
            $data['sale_price'] ?? null,
            $data['currency'] ?? 'TRY',
            $data['stock_quantity'] ?? 0,
            $data['low_stock_threshold'] ?? 5,
            $data['weight_kg'] ?? null,
            $data['dimensions'] ?? null,
            $data['colors'] ?? null,
            $data['sizes'] ?? null,
            $data['materials'] ?? null,
            $data['care_instructions'] ?? '',
            $data['features'] ?? null,
            $data['images'] ?? null,
            $data['video_url'] ?? '',
            $data['is_digital'] ?? false,
            $data['digital_file_url'] ?? '',
            $data['is_featured'] ?? false,
            $data['is_active'] ?? true,
            $data['meta_title'] ?? '',
            $data['meta_description'] ?? '',
            $data['tags'] ?? null,
            $product_id
        ]);
        
        if ($result) {
            echo json_encode(['success' => true]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to update product']);
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
        $product_id = $_GET['id'] ?? null;
        
        if (!$product_id) {
            http_response_code(400);
            echo json_encode(['error' => 'Product ID required']);
            return;
        }
        
        // Soft delete by setting is_active to FALSE
        $stmt = $db->prepare("UPDATE products SET is_active = FALSE WHERE id = ?");
        $result = $stmt->execute([$product_id]);
        
        if ($result) {
            echo json_encode(['success' => true]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to delete product']);
        }
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
    }
}
?>