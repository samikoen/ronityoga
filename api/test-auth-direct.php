<?php
// Test auth.php directly
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<h3>Auth.php Test</h3>";

// Simulate POST request to auth.php
$_SERVER['REQUEST_METHOD'] = 'POST';
$_POST['username'] = 'ronit';
$_POST['password'] = 'alenroy11';

echo "Testing auth.php with ronit/alenroy11<br><hr>";

try {
    // Capture output
    ob_start();
    include __DIR__ . '/auth.php';
    $output = ob_get_clean();
    
    echo "Auth output: " . $output . "<br>";
    
} catch (Exception $e) {
    echo "ERROR in auth.php: " . $e->getMessage() . "<br>";
    echo "File: " . $e->getFile() . "<br>";
    echo "Line: " . $e->getLine() . "<br>";
    echo "Trace: <pre>" . $e->getTraceAsString() . "</pre>";
} catch (Error $e) {
    echo "FATAL ERROR in auth.php: " . $e->getMessage() . "<br>";
    echo "File: " . $e->getFile() . "<br>";
    echo "Line: " . $e->getLine() . "<br>";
}
?>