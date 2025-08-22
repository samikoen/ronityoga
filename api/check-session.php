<?php
// Check session status
error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once __DIR__ . '/config.php';

echo "<h3>Session Check</h3>";
echo "Session ID: " . session_id() . "<br>";
echo "Session started: " . (session_status() === PHP_SESSION_ACTIVE ? "YES" : "NO") . "<br>";
echo "<hr>";

echo "<h4>Session Variables:</h4>";
foreach ($_SESSION as $key => $value) {
    echo "$key: " . (is_array($value) ? json_encode($value) : $value) . "<br>";
}

echo "<hr>";
echo "<h4>Login Status:</h4>";
echo "admin_logged_in: " . (isset($_SESSION['admin_logged_in']) ? ($_SESSION['admin_logged_in'] ? "TRUE" : "FALSE") : "NOT SET") . "<br>";
echo "admin_id: " . ($_SESSION['admin_id'] ?? 'NOT SET') . "<br>";
echo "admin_username: " . ($_SESSION['admin_username'] ?? 'NOT SET') . "<br>";

echo "<hr>";
echo "<h4>Test Login Check:</h4>";
if (isset($_SESSION['admin_logged_in']) && $_SESSION['admin_logged_in'] === true) {
    echo "✅ User is logged in<br>";
} else {
    echo "❌ User is NOT logged in<br>";
}
?>