<?php
/**
 * Password Migration Script for ronityoga.com.tr
 * Run this once to convert plain text passwords to hashed passwords
 * IMPORTANT: Delete this file after running!
 */

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/auth-functions.php';

// Allow browser access for hosting without SSH
// IMPORTANT: Remove this after migration!
$allowed_ips = ['127.0.0.1', $_SERVER['REMOTE_ADDR']]; // Add your IP for security
$is_authorized = in_array($_SERVER['REMOTE_ADDR'], $allowed_ips) || php_sapi_name() === 'cli';

if (!$is_authorized) {
    die("Unauthorized access. Migration can only be run by authorized users.\n");
}

// Show progress in browser
if (php_sapi_name() !== 'cli') {
    echo "<html><head><title>ronityoga.com.tr - Password Migration</title></head><body>";
    echo "<h2>🔐 RonitYoga Password Migration</h2>";
    echo "<div style='font-family: monospace; background: #f5f5f5; padding: 20px; border-radius: 5px;'>";
}

// Format output for browser
$br = (php_sapi_name() !== 'cli') ? "<br>\n" : "\n";
$bold_start = (php_sapi_name() !== 'cli') ? "<strong>" : "";
$bold_end = (php_sapi_name() !== 'cli') ? "</strong>" : "";

echo "Password Migration Script for ronityoga.com.tr{$br}";
echo "==============================================={$br}{$br}";

try {
    // Check if passwords are already hashed
    $stmt = $db->prepare("SELECT id, username, password FROM admin_users LIMIT 1");
    $stmt->execute();
    $user = $stmt->fetch();
    
    if ($user && password_get_info($user['password'])['algo'] !== 0) {
        echo "{$bold_start}⚠️ Passwords appear to be already hashed. Aborting.{$bold_end}{$br}";
        if (php_sapi_name() !== 'cli') {
            echo "</div><p><strong>Migration not needed. Passwords are already secure!</strong></p></body></html>";
        }
        exit(0);
    }
    
    // Get all users
    $stmt = $db->prepare("SELECT id, username, password FROM admin_users");
    $stmt->execute();
    $users = $stmt->fetchAll();
    
    echo "📊 Found " . count($users) . " users to migrate{$br}{$br}";
    
    // Begin transaction
    $db->beginTransaction();
    
    $migrated = 0;
    foreach ($users as $user) {
        echo "🔄 Migrating user: {$bold_start}" . htmlspecialchars($user['username']) . "{$bold_end}... ";
        
        // Hash the password
        $hashedPassword = hashPassword($user['password']);
        
        // Update the user
        $updateStmt = $db->prepare("UPDATE admin_users SET password = ? WHERE id = ?");
        $updateStmt->execute([$hashedPassword, $user['id']]);
        
        echo "✅ OK{$br}";
        $migrated++;
    }
    
    // Commit transaction
    $db->commit();
    
    echo "{$br}{$bold_start}✅ Successfully migrated {$migrated} users!{$bold_end}{$br}";
    echo "{$br}{$bold_start}⚠️ CRITICAL: Delete this file immediately!{$bold_end}{$br}";
    
    if (php_sapi_name() !== 'cli') {
        echo "</div>";
        echo "<div style='background: #ffe6e6; padding: 15px; margin: 20px 0; border: 2px solid #ff6b6b; border-radius: 5px;'>";
        echo "<h3>🚨 IMPORTANT SECURITY NOTICE</h3>";
        echo "<p><strong>You MUST delete this file immediately:</strong></p>";
        echo "<ol>";
        echo "<li>Go to cPanel File Manager</li>";
        echo "<li>Navigate to: <code>/public_html/ronityoga/api/</code></li>";
        echo "<li>Delete: <code>migrate-passwords.php</code></li>";
        echo "</ol>";
        echo "<p><strong>File location:</strong> <code>https://ronityoga.com.tr/api/migrate-passwords.php</code></p>";
        echo "</div>";
        echo "<div style='background: #e6ffe6; padding: 15px; border: 2px solid #4caf50; border-radius: 5px;'>";
        echo "<h3>✅ Migration Complete!</h3>";
        echo "<p>Your passwords are now securely hashed. You can continue with the next steps.</p>";
        echo "</div>";
        echo "</body></html>";
    } else {
        echo "File to delete: " . __FILE__ . "{$br}";
        echo "URL to delete: https://ronityoga.com.tr/api/migrate-passwords.php{$br}";
    }
    
} catch (Exception $e) {
    if ($db->inTransaction()) {
        $db->rollBack();
    }
    $error_msg = "❌ Error: " . $e->getMessage();
    echo "{$br}{$bold_start}{$error_msg}{$bold_end}{$br}";
    
    if (php_sapi_name() !== 'cli') {
        echo "</div>";
        echo "<div style='background: #ffe6e6; padding: 15px; border: 2px solid #f44336; border-radius: 5px;'>";
        echo "<h3>❌ Migration Failed</h3>";
        echo "<p>Error: " . htmlspecialchars($e->getMessage()) . "</p>";
        echo "<p>Please check your database connection and try again.</p>";
        echo "</div></body></html>";
    }
    exit(1);
}
?>