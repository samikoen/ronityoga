<?php
// Hata raporlamayı kapat - sadece JSON döndürsün
error_reporting(0);
ini_set('display_errors', 0);

// Veritabanı bilgileri
define('DB_HOST', 'localhost');
define('DB_NAME', 'ronityog_db');
define('DB_USER', 'ronityog_ronit');
define('DB_PASS', 'alenroy11.');  // MySQL şifresi noktalı!

// Veritabanı bağlantısı
try {
    // PDO options ile charset ayarla
    $options = [
        PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci"
    ];
    
    $db = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4", DB_USER, DB_PASS, $options);
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $db->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
    
    // Ek charset ayarları
    $db->exec("SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci");
    $db->exec("SET CHARACTER SET utf8mb4");
    $db->exec("SET SESSION collation_connection = 'utf8mb4_unicode_ci'");
} catch(PDOException $e) {
    header('Content-Type: application/json; charset=utf-8');
    http_response_code(500);
    die(json_encode(['error' => 'Database connection failed']));
}

// Session başlat
if (session_status() == PHP_SESSION_NONE) {
    session_start();
}

// JSON header
header('Content-Type: application/json; charset=utf-8');
?>