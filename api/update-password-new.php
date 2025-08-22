<?php
// Update password for ronit user
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<!DOCTYPE html><html><head><title>Password Update</title></head><body>";
echo "<h2>🔧 Password Update to alenroy22</h2>";
echo "<hr>";

// Load config
try {
    require_once __DIR__ . '/config.php';
    
    echo "✅ Config loaded successfully<br>";
    echo "✅ Database connected<br>";
    
    // Generate new hash for alenroy11
    $newPassword = 'alenroy11';
    $newHash = password_hash($newPassword, PASSWORD_BCRYPT, ['cost' => 12]);
    
    echo "New password: $newPassword<br>";
    echo "New hash: $newHash<br>";
    echo "Hash verification: " . (password_verify($newPassword, $newHash) ? "✅ OK" : "❌ Failed") . "<br>";
    echo "<hr>";
    
    // Update user password
    $stmt = $db->prepare("UPDATE admin_users SET password = ? WHERE username = ?");
    $result = $stmt->execute([$newHash, 'ronit']);
    
    if ($result) {
        echo "✅ Password updated successfully!<br>";
        echo "Rows affected: " . $stmt->rowCount() . "<br>";
        
        // Verify the update
        $stmt = $db->prepare("SELECT username, password FROM admin_users WHERE username = ?");
        $stmt->execute(['ronit']);
        $user = $stmt->fetch();
        
        if ($user) {
            echo "<hr>";
            echo "<h3>✅ Verification</h3>";
            echo "Username: " . $user['username'] . "<br>";
            echo "New hash in DB: " . substr($user['password'], 0, 20) . "...<br>";
            echo "Password 'alenroy11' test: " . (password_verify('alenroy11', $user['password']) ? "✅ WORKS!" : "❌ Failed") . "<br>";
        }
        
    } else {
        echo "❌ Password update failed!<br>";
    }
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "<br>";
    echo "File: " . $e->getFile() . "<br>";
    echo "Line: " . $e->getLine() . "<br>";
}

echo "<hr>";
echo "<h3>🎯 Next Step</h3>";
echo "Now login with:<br>";
echo "Username: <strong>ronit</strong><br>";
echo "Password: <strong>alenroy11</strong><br>";
echo "</body></html>";
?>