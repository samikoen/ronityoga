<?php
// Veritabanı bilgileri
define('DB_HOST', 'localhost');
define('DB_NAME', 'ronityog_db');
define('DB_USER', 'ronityog_ronit');
define('DB_PASS', 'alenroy11.');  // MySQL şifresi noktalı!

// Veritabanı bağlantısı
try {
    $db = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8", DB_USER, DB_PASS);
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $db->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
} catch(PDOException $e) {
    header('Content-Type: application/json; charset=utf-8');
    die(json_encode(['error' => 'Veritabanı bağlantı hatası: ' . $e->getMessage()]));
}

// Session başlat
if (session_status() == PHP_SESSION_NONE) {
    session_start();
}

// JSON header
header('Content-Type: application/json; charset=utf-8');
?>