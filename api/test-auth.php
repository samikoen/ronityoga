<?php
// Test authentication directly
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<!DOCTYPE html><html><head><title>Auth Test</title></head><body>";
echo "<h2>🔐 Authentication Test</h2>";
echo "<hr>";

// Manual env loading
$envPath = '/home/ronityog/public_html/.env';
if (file_exists($envPath)) {
    $lines = file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        $parts = explode('=', $line, 2);
        if (count($parts) == 2) {
            $key = trim($parts[0]);
            $value = trim($parts[1]);
            $_ENV[$key] = $value;
        }
    }
}

// Database connection
try {
    $dsn = "mysql:host=" . $_ENV['DB_HOST'] . ";dbname=" . $_ENV['DB_NAME'] . ";charset=utf8mb4";
    $pdo = new PDO($dsn, $_ENV['DB_USER'], $_ENV['DB_PASS'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);
    
    echo "✅ Database connected<br><hr>";
    
    // Get user info
    $stmt = $pdo->prepare("SELECT id, username, password FROM admin_users WHERE username = ?");
    $stmt->execute(['ronit']);
    $user = $stmt->fetch();
    
    if ($user) {
        echo "<h3>👤 User Found</h3>";
        echo "ID: " . $user['id'] . "<br>";
        echo "Username: " . $user['username'] . "<br>";
        echo "Password Hash: " . $user['password'] . "<br>";
        echo "Hash Length: " . strlen($user['password']) . "<br>";
        echo "Hash starts with: " . substr($user['password'], 0, 10) . "...<br>";
        echo "<hr>";
        
        // Test password verification
        echo "<h3>🔑 Password Tests</h3>";
        
        $testPasswords = ['admin123', 'alenroy11'];
        
        foreach ($testPasswords as $testPass) {
            echo "Testing password: '$testPass'<br>";
            
            if (password_verify($testPass, $user['password'])) {
                echo "✅ Password '$testPass' MATCHES!<br>";
            } else {
                echo "❌ Password '$testPass' does not match<br>";
            }
            echo "<br>";
        }
        
        // Check if it's bcrypt
        echo "<hr>";
        echo "<h3>🔍 Hash Analysis</h3>";
        if (preg_match('/^\$2[axy]\$/', $user['password'])) {
            echo "✅ Hash is bcrypt format<br>";
        } else {
            echo "❌ Hash is NOT bcrypt format<br>";
        }
        
        // Try to hash admin123 and compare
        echo "<hr>";
        echo "<h3>🧪 Hash Test</h3>";
        $newHash = password_hash('admin123', PASSWORD_BCRYPT, ['cost' => 12]);
        echo "New hash for 'admin123': " . $newHash . "<br>";
        echo "Verification test: " . (password_verify('admin123', $newHash) ? "✅ Works" : "❌ Failed") . "<br>";
        
    } else {
        echo "❌ User 'ronit' not found!<br>";
        
        // Show all users
        $stmt = $pdo->query("SELECT id, username FROM admin_users");
        $users = $stmt->fetchAll();
        echo "Available users:<br>";
        foreach ($users as $u) {
            echo "- ID: {$u['id']}, Username: {$u['username']}<br>";
        }
    }
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "<br>";
}

echo "</body></html>";
?>