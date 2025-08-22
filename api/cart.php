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
        $user_id = $_SESSION['user_id'] ?? null;
        $session_id = session_id();
        
        // Get cart items
        $whereClause = $user_id ? 'sc.user_id = ?' : 'sc.session_id = ?';
        $param = $user_id ?? $session_id;
        
        $stmt = $db->prepare("
            SELECT sc.*, p.name, p.description, p.price, p.sale_price, p.stock_quantity, p.is_active,
                   JSON_EXTRACT(p.images, '$[0]') as image_url,
                   JSON_EXTRACT(p.colors, '$') as available_colors,
                   JSON_EXTRACT(p.sizes, '$') as available_sizes,
                   CASE 
                       WHEN p.sale_price IS NOT NULL AND p.sale_price > 0 THEN p.sale_price 
                       ELSE p.price 
                   END as current_price
            FROM shopping_cart sc
            JOIN products p ON sc.product_id = p.id
            WHERE $whereClause AND p.is_active = TRUE
            ORDER BY sc.created_at DESC
        ");
        $stmt->execute([$param]);
        $cartItems = $stmt->fetchAll();
        
        // Calculate totals
        $subtotal = 0;
        $totalItems = 0;
        
        foreach ($cartItems as &$item) {
            $item['available_colors'] = json_decode($item['available_colors'], true) ?? [];
            $item['available_sizes'] = json_decode($item['available_sizes'], true) ?? [];
            $item['line_total'] = $item['current_price'] * $item['quantity'];
            $subtotal += $item['line_total'];
            $totalItems += $item['quantity'];
        }
        
        echo json_encode([
            'items' => $cartItems,
            'summary' => [
                'total_items' => $totalItems,
                'subtotal' => $subtotal,
                'currency' => 'TRY'
            ]
        ]);
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
    }
}

function handlePost() {
    global $db;
    
    try {
        $data = json_decode(file_get_contents('php://input'), true);
        
        $product_id = $data['product_id'] ?? null;
        $quantity = (int)($data['quantity'] ?? 1);
        $selected_color = $data['selected_color'] ?? null;
        $selected_size = $data['selected_size'] ?? null;
        
        if (!$product_id) {
            http_response_code(400);
            echo json_encode(['error' => 'Product ID required']);
            return;
        }
        
        if ($quantity <= 0) {
            http_response_code(400);
            echo json_encode(['error' => 'Quantity must be greater than 0']);
            return;
        }
        
        // Get product details and check availability
        $productStmt = $db->prepare("
            SELECT price, sale_price, stock_quantity, is_active 
            FROM products 
            WHERE id = ?
        ");
        $productStmt->execute([$product_id]);
        $product = $productStmt->fetch();
        
        if (!$product || !$product['is_active']) {
            http_response_code(404);
            echo json_encode(['error' => 'Product not found or inactive']);
            return;
        }
        
        if ($product['stock_quantity'] < $quantity) {
            http_response_code(400);
            echo json_encode(['error' => 'Insufficient stock']);
            return;
        }
        
        $user_id = $_SESSION['user_id'] ?? null;
        $session_id = session_id();
        $current_price = $product['sale_price'] ?? $product['price'];
        
        // Check if item already exists in cart
        $whereClause = $user_id ? 'user_id = ?' : 'session_id = ?';
        $param = $user_id ?? $session_id;
        
        $existingStmt = $db->prepare("
            SELECT id, quantity 
            FROM shopping_cart 
            WHERE $whereClause AND product_id = ? AND selected_color = ? AND selected_size = ?
        ");
        $existingStmt->execute([$param, $product_id, $selected_color, $selected_size]);
        $existing = $existingStmt->fetch();
        
        if ($existing) {
            // Update existing item
            $newQuantity = $existing['quantity'] + $quantity;
            
            if ($product['stock_quantity'] < $newQuantity) {
                http_response_code(400);
                echo json_encode(['error' => 'Insufficient stock for requested quantity']);
                return;
            }
            
            $updateStmt = $db->prepare("
                UPDATE shopping_cart 
                SET quantity = ?, price_at_time = ?, updated_at = CURRENT_TIMESTAMP 
                WHERE id = ?
            ");
            $result = $updateStmt->execute([$newQuantity, $current_price, $existing['id']]);
            
        } else {
            // Add new item
            $insertStmt = $db->prepare("
                INSERT INTO shopping_cart (user_id, session_id, product_id, quantity, selected_color, selected_size, price_at_time)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ");
            $result = $insertStmt->execute([$user_id, $session_id, $product_id, $quantity, $selected_color, $selected_size, $current_price]);
        }
        
        if ($result) {
            echo json_encode(['success' => true, 'message' => 'Item added to cart']);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to add item to cart']);
        }
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
    }
}

function handlePut() {
    global $db;
    
    try {
        $data = json_decode(file_get_contents('php://input'), true);
        
        $cart_item_id = $data['cart_item_id'] ?? null;
        $quantity = (int)($data['quantity'] ?? 1);
        
        if (!$cart_item_id) {
            http_response_code(400);
            echo json_encode(['error' => 'Cart item ID required']);
            return;
        }
        
        if ($quantity <= 0) {
            http_response_code(400);
            echo json_encode(['error' => 'Quantity must be greater than 0']);
            return;
        }
        
        $user_id = $_SESSION['user_id'] ?? null;
        $session_id = session_id();
        
        // Verify ownership of cart item
        $whereClause = $user_id ? 'sc.user_id = ?' : 'sc.session_id = ?';
        $param = $user_id ?? $session_id;
        
        $stmt = $db->prepare("
            SELECT sc.*, p.stock_quantity, p.price, p.sale_price
            FROM shopping_cart sc
            JOIN products p ON sc.product_id = p.id
            WHERE sc.id = ? AND $whereClause
        ");
        $stmt->execute([$cart_item_id, $param]);
        $cartItem = $stmt->fetch();
        
        if (!$cartItem) {
            http_response_code(404);
            echo json_encode(['error' => 'Cart item not found']);
            return;
        }
        
        if ($cartItem['stock_quantity'] < $quantity) {
            http_response_code(400);
            echo json_encode(['error' => 'Insufficient stock']);
            return;
        }
        
        // Update quantity and price
        $current_price = $cartItem['sale_price'] ?? $cartItem['price'];
        $updateStmt = $db->prepare("
            UPDATE shopping_cart 
            SET quantity = ?, price_at_time = ?, updated_at = CURRENT_TIMESTAMP 
            WHERE id = ?
        ");
        $result = $updateStmt->execute([$quantity, $current_price, $cart_item_id]);
        
        if ($result) {
            echo json_encode(['success' => true, 'message' => 'Cart updated']);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to update cart']);
        }
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
    }
}

function handleDelete() {
    global $db;
    
    try {
        $cart_item_id = $_GET['cart_item_id'] ?? null;
        $clear_all = $_GET['clear_all'] ?? false;
        
        $user_id = $_SESSION['user_id'] ?? null;
        $session_id = session_id();
        
        if ($clear_all) {
            // Clear entire cart
            $whereClause = $user_id ? 'user_id = ?' : 'session_id = ?';
            $param = $user_id ?? $session_id;
            
            $stmt = $db->prepare("DELETE FROM shopping_cart WHERE $whereClause");
            $result = $stmt->execute([$param]);
            
        } else {
            // Remove specific item
            if (!$cart_item_id) {
                http_response_code(400);
                echo json_encode(['error' => 'Cart item ID required']);
                return;
            }
            
            // Verify ownership
            $whereClause = $user_id ? 'user_id = ?' : 'session_id = ?';
            $param = $user_id ?? $session_id;
            
            $stmt = $db->prepare("DELETE FROM shopping_cart WHERE id = ? AND $whereClause");
            $result = $stmt->execute([$cart_item_id, $param]);
        }
        
        if ($result) {
            echo json_encode(['success' => true, 'message' => 'Item(s) removed from cart']);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to remove item(s) from cart']);
        }
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
    }
}

// Helper function to transfer cart from session to user when they log in
function transferCartToUser($user_id, $session_id) {
    global $db;
    
    try {
        // Update cart items to associate with user
        $stmt = $db->prepare("
            UPDATE shopping_cart 
            SET user_id = ?, session_id = NULL 
            WHERE session_id = ? AND user_id IS NULL
        ");
        return $stmt->execute([$user_id, $session_id]);
        
    } catch (Exception $e) {
        return false;
    }
}
?>