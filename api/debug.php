<?php
// RonitYoga Debug Script
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<!DOCTYPE html><html><head><title>Debug Info</title></head><body>";
echo "<h2>🔍 RonitYoga Debug Info</h2>";
echo "<hr>";

// Basic PHP info
echo "<h3>📋 System Info</h3>";
echo "PHP Version: " . phpversion() . "<br>";
echo "Current Time: " . date('Y-m-d H:i:s') . "<br>";
echo "Document Root: " . $_SERVER['DOCUMENT_ROOT'] . "<br>";
echo "Script Path: " . __DIR__ . "<br>";
echo "<hr>";

// Check .env file
echo "<h3>🔧 Environment Check</h3>";
$envPaths = [
    dirname(__DIR__) . '/.env',
    $_SERVER['DOCUMENT_ROOT'] . '/.env',
    '/home/ronityog/public_html/.env'
];

foreach ($envPaths as $path) {
    echo "Checking: " . $path . "<br>";
    if (file_exists($path)) {
        echo "✅ Found at: " . $path . "<br>";
        echo "Size: " . filesize($path) . " bytes<br>";
        echo "Readable: " . (is_readable($path) ? "YES" : "NO") . "<br>";
        break;
    } else {
        echo "❌ Not found<br>";
    }
}
echo "<hr>";

// Try to load config
echo "<h3>⚙️ Configuration Test</h3>";
try {
    // Manual env loading test
    $envContent = '';
    foreach ($envPaths as $path) {
        if (file_exists($path)) {
            $envContent = file_get_contents($path);
            echo "✅ .env content loaded (" . strlen($envContent) . " chars)<br>";
            break;
        }
    }
    
    if (empty($envContent)) {
        throw new Exception("No .env file found");
    }
    
    // Parse env manually
    $lines = explode("\n", $envContent);
    $envVars = [];
    foreach ($lines as $line) {
        $line = trim($line);
        if (empty($line) || strpos($line, '#') === 0) continue;
        
        $parts = explode('=', $line, 2);
        if (count($parts) == 2) {
            $key = trim($parts[0]);
            $value = trim($parts[1]);
            $envVars[$key] = $value;
            $_ENV[$key] = $value;
            putenv("$key=$value");
        }
    }
    
    echo "✅ Environment variables loaded: " . count($envVars) . "<br>";
    echo "DB_HOST: " . ($_ENV['DB_HOST'] ?? 'not found') . "<br>";
    echo "DB_NAME: " . ($_ENV['DB_NAME'] ?? 'not found') . "<br>";
    echo "DB_USER: " . ($_ENV['DB_USER'] ?? 'not found') . "<br>";
    echo "<hr>";
    
    // Test database connection
    echo "<h3>🗄️ Database Connection Test</h3>";
    $dsn = "mysql:host=" . $_ENV['DB_HOST'] . ";dbname=" . $_ENV['DB_NAME'] . ";charset=utf8mb4";
    
    echo "DSN: " . $dsn . "<br>";
    
    $pdo = new PDO($dsn, $_ENV['DB_USER'], $_ENV['DB_PASS'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);
    
    echo "✅ Database connection successful<br>";
    
    // Test query
    $stmt = $pdo->query("SELECT NOW() as db_time, DATABASE() as db_name");
    $result = $stmt->fetch();
    echo "Database time: " . $result['db_time'] . "<br>";
    echo "Connected to: " . $result['db_name'] . "<br>";
    
    // Check admin_users table
    echo "<hr>";
    echo "<h3>👤 Admin Users Check</h3>";
    try {
        $stmt = $pdo->query("SHOW TABLES LIKE 'admin_users'");
        if ($stmt->rowCount() > 0) {
            echo "✅ admin_users table exists<br>";
            
            // First check table structure
            $stmt = $pdo->query("DESCRIBE admin_users");
            $columns = $stmt->fetchAll();
            echo "Table columns: ";
            foreach ($columns as $col) {
                echo $col['Field'] . " (" . $col['Type'] . "), ";
            }
            echo "<br><br>";
            
            // Get users with available columns
            $stmt = $pdo->query("SELECT id, username, SUBSTRING(password, 1, 10) as pass_preview FROM admin_users");
            $users = $stmt->fetchAll();
            echo "Users found: " . count($users) . "<br>";
            
            foreach ($users as $user) {
                echo "- ID: {$user['id']}, Username: {$user['username']}, Password: {$user['pass_preview']}...<br>";
            }
        } else {
            echo "❌ admin_users table not found<br>";
        }
    } catch (Exception $e) {
        echo "❌ Error checking admin_users: " . $e->getMessage() . "<br>";
    }
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "<br>";
    echo "File: " . $e->getFile() . "<br>";
    echo "Line: " . $e->getLine() . "<br>";
    echo "Trace: <pre>" . $e->getTraceAsString() . "</pre>";
}

echo "<hr>";
echo "<h3>🔄 Test Complete</h3>";
echo "Time: " . date('Y-m-d H:i:s') . "<br>";
echo "</body></html>";
?>