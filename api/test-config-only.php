<?php
// Test config.php without env.php dependency
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<h3>Config Test (without env.php)</h3>";

try {
    // Test config_new.php loading
    require_once __DIR__ . '/config_new.php';
    
    echo "✅ Config.php loaded successfully<br>";
    echo "DB_HOST: " . (defined('DB_HOST') ? DB_HOST : 'NOT DEFINED') . "<br>";
    echo "DB_NAME: " . (defined('DB_NAME') ? DB_NAME : 'NOT DEFINED') . "<br>";
    echo "Database connection: " . (isset($db) ? "✅ SUCCESS" : "❌ FAILED") . "<br>";
    
    // Test a simple query
    if (isset($db)) {
        $stmt = $db->query("SELECT 1 as test");
        $result = $stmt->fetch();
        echo "Database query test: " . ($result['test'] == 1 ? "✅ SUCCESS" : "❌ FAILED") . "<br>";
    }
    
} catch (Exception $e) {
    echo "❌ ERROR: " . $e->getMessage() . "<br>";
    echo "File: " . $e->getFile() . "<br>";
    echo "Line: " . $e->getLine() . "<br>";
}
?>