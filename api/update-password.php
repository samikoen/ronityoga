<?php
// Update password for ronit user
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<!DOCTYPE html><html><head><title>Password Update</title></head><body>";
echo "<h2>🔧 Password Update</h2>";
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

try {
    // Database connection
    $dsn = "mysql:host=" . $_ENV['DB_HOST'] . ";dbname=" . $_ENV['DB_NAME'] . ";charset=utf8mb4";
    $pdo = new PDO($dsn, $_ENV['DB_USER'], $_ENV['DB_PASS'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);
    
    echo "✅ Database connected<br>";
    
    // Generate new hash for alenroy11
    $newPassword = 'alenroy11';
    $newHash = password_hash($newPassword, PASSWORD_BCRYPT, ['cost' => 12]);
    
    echo "New password: $newPassword<br>";
    echo "New hash: $newHash<br>";
    echo "Hash verification: " . (password_verify($newPassword, $newHash) ? "✅ OK" : "❌ Failed") . "<br>";
    echo "<hr>";
    
    // Update user password
    $stmt = $pdo->prepare("UPDATE admin_users SET password = ? WHERE username = ?");
    $result = $stmt->execute([$newHash, 'ronit']);
    
    if ($result) {
        echo "✅ Password updated successfully!<br>";
        echo "Rows affected: " . $stmt->rowCount() . "<br>";
        
        // Verify the update
        $stmt = $pdo->prepare("SELECT username, password FROM admin_users WHERE username = ?");
        $stmt->execute(['ronit']);
        $user = $stmt->fetch();
        
        if ($user) {
            echo "<hr>";
            echo "<h3>✅ Verification</h3>";
            echo "Username: " . $user['username'] . "<br>";
            echo "New hash in DB: " . $user['password'] . "<br>";
            echo "Password 'alenroy11' test: " . (password_verify('alenroy11', $user['password']) ? "✅ WORKS!" : "❌ Failed") . "<br>";
        }
        
    } else {
        echo "❌ Password update failed!<br>";
    }
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "<br>";
}

echo "<hr>";
echo "<h3>🎯 Next Step</h3>";
echo "Now try to login with:<br>";
echo "Username: <strong>ronit</strong><br>";
echo "Password: <strong>alenroy11</strong><br>";
echo "</body></html>";
?>