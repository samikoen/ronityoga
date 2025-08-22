<?php
// Debug script - no session, no auth, just test
header('Content-Type: application/json');

try {
    require_once 'config.php';
    
    echo json_encode([
        'success' => true,
        'message' => 'Config loaded successfully',
        'db_connected' => isset($db) ? 'yes' : 'no',
        'timestamp' => date('Y-m-d H:i:s')
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Error: ' . $e->getMessage()
    ]);
}
?>