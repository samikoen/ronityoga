<?php
/**
 * RonitYoga Secure Configuration
 * Independent configuration without env.php dependency
 */

// Load environment variables with improved error handling
function loadEnv($path) {
    if (!file_exists($path)) {
        throw new Exception('.env file not found at: ' . $path);
    }
    
    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        // Skip comments
        if (strpos(trim($line), '#') === 0) continue;
        
        // Parse key=value
        $parts = explode('=', $line, 2);
        if (count($parts) == 2) {
            $key = trim($parts[0]);
            $value = trim($parts[1]);
            
            // Remove quotes if present
            $value = trim($value, '"\'');
            
            $_ENV[$key] = $value;
            
            // Also set as environment variable if not exists
            if (!getenv($key)) {
                putenv("$key=$value");
            }
        }
    }
}

// Helper function to get environment variables
function env($key, $default = null) {
    // Check in order: $_ENV, getenv()
    if (isset($_ENV[$key])) {
        return $_ENV[$key];
    }
    
    $value = getenv($key);
    if ($value !== false) {
        return $value;
    }
    
    return $default;
}

// Load .env file
$envPath = dirname(__DIR__) . '/.env';
if (!file_exists($envPath)) {
    $envPath = $_SERVER['DOCUMENT_ROOT'] . '/.env';
}
loadEnv($envPath);

// Error reporting based on environment
if (env('APP_ENV', 'production') === 'production') {
    error_reporting(0);
    ini_set('display_errors', 0);
} else {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
}

// Veritabanı bilgileri - Environment variables'dan al
define('DB_HOST', env('DB_HOST', 'localhost'));
define('DB_NAME', env('DB_NAME', 'ronityog_db'));
define('DB_USER', env('DB_USER', 'ronityog_ronit'));
define('DB_PASS', env('DB_PASS', ''));

// Validate required configuration
if (!DB_PASS) {
    header('Content-Type: application/json; charset=utf-8');
    http_response_code(500);
    die(json_encode(['error' => 'Database configuration missing. Please check .env file']));
}

// Veritabanı bağlantısı
try {
    // PDO options ile charset ayarla
    $options = [
        PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci",
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false, // Disable emulation for true prepared statements
    ];
    
    $db = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4", DB_USER, DB_PASS, $options);
    
    // Ek charset ayarları
    $db->exec("SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci");
    $db->exec("SET CHARACTER SET utf8mb4");
    $db->exec("SET SESSION collation_connection = 'utf8mb4_unicode_ci'");
} catch(PDOException $e) {
    header('Content-Type: application/json; charset=utf-8');
    http_response_code(500);
    
    // Don't expose detailed error in production
    if (env('APP_ENV', 'production') === 'production') {
        die(json_encode(['error' => 'Database connection failed']));
    } else {
        die(json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]));
    }
}

// Session configuration
ini_set('session.cookie_httponly', 1);
ini_set('session.use_only_cookies', 1);
ini_set('session.cookie_samesite', 'Strict');

if (env('SESSION_SECURE', 'true') === 'true' && isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on') {
    ini_set('session.cookie_secure', 1);
}

// Session başlat
if (session_status() == PHP_SESSION_NONE) {
    session_start();
}

// Set default JSON header
header('Content-Type: application/json; charset=utf-8');

// Security headers
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('X-XSS-Protection: 1; mode=block');
header('Referrer-Policy: strict-origin-when-cross-origin');
?>