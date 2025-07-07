<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Config'i dahil et
require_once 'config.php';

echo "<h2>Auth Debug</h2>";

// 1. POST verilerini kontrol et
echo "<h3>1. POST Verileri:</h3>";
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    echo "Username: " . ($_POST['username'] ?? 'YOK') . "<br>";
    echo "Password: " . ($_POST['password'] ?? 'YOK') . "<br>";
} else {
    echo "POST verisi yok, GET ile test:<br>";
    $_POST['username'] = 'ronityog_ronit';
    $_POST['password'] = 'alenroy11';
    echo "Test Username: " . $_POST['username'] . "<br>";
    echo "Test Password: " . $_POST['password'] . "<br>";
}

// 2. Veritabanı kontrolü
echo "<h3>2. Veritabanı Kontrolü:</h3>";
try {
    $stmt = $db->prepare("SELECT * FROM admin_users WHERE username = ?");
    $stmt->execute([$_POST['username']]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($user) {
        echo "✅ Kullanıcı bulundu!<br>";
        echo "ID: " . $user['id'] . "<br>";
        echo "Username: " . $user['username'] . "<br>";
        echo "DB Password: " . $user['password'] . "<br>";
        echo "Girilen Password: " . $_POST['password'] . "<br>";
        
        // Şifre kontrolü
        if ($user['password'] === $_POST['password']) {
            echo "✅ Şifre doğru! (Plain text match)<br>";
            
            // Session test
            $_SESSION['admin_logged_in'] = true;
            $_SESSION['admin_id'] = $user['id'];
            echo "✅ Session oluşturuldu!<br>";
            echo "Session ID: " . session_id() . "<br>";
            
        } else {
            echo "❌ Şifre yanlış!<br>";
        }
    } else {
        echo "❌ Kullanıcı bulunamadı!<br>";
    }
    
} catch(PDOException $e) {
    echo "❌ Veritabanı hatası: " . $e->getMessage();
}

// 3. Session kontrolü
echo "<h3>3. Session Durumu:</h3>";
echo "Session ID: " . session_id() . "<br>";
echo "Session Data: <pre>" . print_r($_SESSION, true) . "</pre>";
?>