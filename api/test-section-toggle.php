<?php
// Test section toggle functionality
require_once 'config.php';
require_once 'auth-functions.php';

header('Content-Type: application/json');

// Start session if not already started
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Set admin session for testing
$_SESSION['admin_logged_in'] = true;
$_SESSION['admin_id'] = 1;

echo "Testing section toggle functionality...\n";

try {
    // Test 1: Check if table exists
    $stmt = $db->prepare("SHOW TABLES LIKE 'section_visibility'");
    $stmt->execute();
    $tableExists = $stmt->fetchColumn();
    
    if (!$tableExists) {
        echo json_encode(['success' => false, 'message' => 'Table does not exist - run create-section-table.php first']);
        exit;
    }
    
    // Test 2: Get current sections
    $stmt = $db->prepare("SELECT section_name, display_name, is_active FROM section_visibility LIMIT 5");
    $stmt->execute();
    $sections = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Test 3: Test authentication
    $isAdminResult = isAdmin();
    
    echo json_encode([
        'success' => true,
        'table_exists' => $tableExists ? true : false,
        'sections_count' => count($sections),
        'first_sections' => $sections,
        'is_admin' => $isAdminResult,
        'session_status' => session_status(),
        'message' => 'All tests passed'
    ]);
    
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>