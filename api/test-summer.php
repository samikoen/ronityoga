<?php
header('Content-Type: application/json; charset=utf-8');

try {
    require_once 'config.php';
    
    echo json_encode([
        'success' => true,
        'message' => 'Config loaded successfully',
        'db_connected' => isset($db) ? 'yes' : 'no'
    ]);
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine()
    ]);
}
?>