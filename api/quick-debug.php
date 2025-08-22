<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "Auth Debug:<br>";

try {
    // Check if files exist
    echo "config.php exists: " . (file_exists(__DIR__ . '/config.php') ? "YES" : "NO") . "<br>";
    echo "auth.php exists: " . (file_exists(__DIR__ . '/auth.php') ? "YES" : "NO") . "<br>";
    echo "auth-functions.php exists: " . (file_exists(__DIR__ . '/auth-functions.php') ? "YES" : "NO") . "<br>";
    
    // Try to include config
    require_once __DIR__ . '/config.php';
    echo "Config loaded successfully<br>";
    
    // Check database
    if (isset($db)) {
        echo "Database connection: OK<br>";
    } else {
        echo "Database connection: FAILED<br>";
    }
    
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "<br>";
    echo "File: " . $e->getFile() . "<br>";
    echo "Line: " . $e->getLine() . "<br>";
}
?>