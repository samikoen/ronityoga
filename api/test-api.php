<?php
header('Content-Type: application/json; charset=utf-8');

try {
    echo json_encode([
        'success' => true,
        'message' => 'API is working',
        'timestamp' => date('Y-m-d H:i:s')
    ]);
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>