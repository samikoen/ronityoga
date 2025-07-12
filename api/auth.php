<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Session başlat
session_start();

// Basit DB bağlantısı
try {
    $db = new PDO("mysql:host=localhost;dbname=ronityog_db;charset=utf8", "ronityog_ronit", "alenroy11.");
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $e) {
    header('Content-Type: application/json');
    die(json_encode(['success' => false, 'error' => 'DB Error: ' . $e->getMessage()]));
}

// JSON header
header('Content-Type: application/json');

// POST kontrolü
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    die(json_encode(['success' => false, 'error' => 'Method not allowed']));
}

// Değişkenleri al
$username = isset($_POST['username']) ? $_POST['username'] : '';
$password = isset($_POST['password']) ? $_POST['password'] : '';

// Boş kontrol
if (empty($username) || empty($password)) {
    die(json_encode(['success' => false, 'error' => 'Kullanıcı adı ve şifre gerekli']));
}

try {
    // Kullanıcıyı sorgula
    $stmt = $db->prepare("SELECT * FROM admin_users WHERE username = ?");
    $stmt->execute([$username]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($user && $password === $user['password']) {
        // Başarılı giriş
        $_SESSION['admin_logged_in'] = true;
        $_SESSION['admin_id'] = $user['id'];
        $_SESSION['admin_username'] = $user['username'];
        
        echo json_encode(['success' => true]);
    } else {
        // Hatalı giriş
        echo json_encode(['success' => false, 'error' => 'Kullanıcı adı veya şifre hatalı']);
    }
    
} catch(Exception $e) {
    echo json_encode(['success' => false, 'error' => 'Server error: ' . $e->getMessage()]);
}
?>