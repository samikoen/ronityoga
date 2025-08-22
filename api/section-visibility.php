<?php
// Prevent any HTML output
ob_start();

// Set headers early
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-cache, must-revalidate');

// Turn off error display
error_reporting(0);
ini_set('display_errors', 0);

try {
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }
    require_once 'config.php';
    require_once 'auth-functions.php';
    
    // Clean any output buffer
    if (ob_get_level()) {
        ob_clean();
    }
    
    // Admin authentication check
    if (!isAdmin()) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Unauthorized access']);
        exit;
    }
} catch (Exception $e) {
    if (ob_get_level()) {
        ob_clean();
    }
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Initialization error: ' . $e->getMessage()]);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($method) {
        case 'GET':
            getSectionVisibility();
            break;
        case 'POST':
            updateSectionVisibility();
            break;
        default:
            echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    }
} catch (Exception $e) {
    if (ob_get_level()) {
        ob_clean();
    }
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'API Error: ' . $e->getMessage()]);
}

// End output buffering
if (ob_get_level()) {
    ob_end_flush();
}

function getSectionVisibility() {
    global $db;
    
    try {
        // Check if table exists
        $stmt = $db->prepare("SHOW TABLES LIKE 'section_visibility'");
        $stmt->execute();
        $tableExists = $stmt->fetchColumn();
        
        if (!$tableExists) {
            echo json_encode(['success' => false, 'message' => 'Table section_visibility does not exist. Please run create-section-table.php first']);
            return;
        }
        
        $stmt = $db->prepare("SELECT * FROM section_visibility ORDER BY menu_order ASC");
        $stmt->execute();
        $sections = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode(['success' => true, 'sections' => $sections]);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
}

function updateSectionVisibility() {
    global $db;
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($input['section_name']) || !isset($input['is_active'])) {
        echo json_encode(['success' => false, 'message' => 'Missing required fields', 'debug' => $input]);
        return;
    }
    
    $sectionName = $input['section_name'];
    $isActive = $input['is_active'] ? 1 : 0;
    $menuOrder = $input['menu_order'] ?? 0;
    
    try {
        // Check if table exists
        $stmt = $db->prepare("SHOW TABLES LIKE 'section_visibility'");
        $stmt->execute();
        $tableExists = $stmt->fetchColumn();
        
        if (!$tableExists) {
            echo json_encode(['success' => false, 'message' => 'Table section_visibility does not exist. Please run create-section-table.php first']);
            return;
        }
        
        // Check if section exists
        $checkStmt = $db->prepare("SELECT COUNT(*) FROM section_visibility WHERE section_name = ?");
        $checkStmt->execute([$sectionName]);
        $exists = $checkStmt->fetchColumn();
        
        if (!$exists) {
            echo json_encode(['success' => false, 'message' => 'Section not found', 'section' => $sectionName]);
            return;
        }
        
        $stmt = $db->prepare("UPDATE section_visibility SET is_active = ?, menu_order = ?, updated_at = NOW() WHERE section_name = ?");
        
        if ($stmt->execute([$isActive, $menuOrder, $sectionName])) {
            echo json_encode(['success' => true, 'message' => 'Section visibility updated successfully']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Failed to update section visibility', 'error' => $stmt->errorInfo()]);
        }
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
}

// Helper function to get active sections for frontend
function getActiveSections() {
    global $db;
    $pdo = $db;
    
    $stmt = $pdo->prepare("SELECT section_name FROM section_visibility WHERE is_active = 1 ORDER BY menu_order ASC");
    $stmt->execute();
    $sections = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    return $sections;
}

// Helper function to check if a section is active
function isSectionActive($sectionName) {
    global $db;
    $pdo = $db;
    
    $stmt = $pdo->prepare("SELECT is_active FROM section_visibility WHERE section_name = ?");
    $stmt->execute([$sectionName]);
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    
    return $result ? (bool)$result['is_active'] : false;
}
?>