<?php
// Authentication functions only - no direct execution

// Check if admin is logged in
function isAdmin() {
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }
    
    return isset($_SESSION['admin_logged_in']) && $_SESSION['admin_logged_in'] === true;
}

// Check authentication
function checkAuth() {
    if (!isAdmin()) {
        header('Content-Type: application/json');
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Unauthorized access']);
        exit;
    }
}
?>