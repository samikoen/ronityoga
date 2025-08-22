<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<h2>Veritabanı Bağlantı Testi</h2>";

// Test 1: Noktalı şifre
echo "Test 1: Şifre = 'alenroy11.'<br>";
try {
    $db = new PDO("mysql:host=localhost;dbname=ronityog_db", "ronityog_ronit", "alenroy11.");
    echo "✅ BAĞLANTI BAŞARILI!<br>";
    
    $stmt = $db->query("SELECT * FROM admin_users");
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "Admin kullanıcıları:<br>";
    foreach($users as $user) {
        echo "- Username: {$user['username']}, Password: {$user['password']}<br>";
    }
    
} catch(PDOException $e) {
    echo "❌ HATA: " . $e->getMessage() . "<br><br>";
}

// Test 2: Noktasız şifre
echo "<br>Test 2: Şifre = 'alenroy11'<br>";
try {
    $db = new PDO("mysql:host=localhost;dbname=ronityog_db", "ronityog_ronit", "alenroy11");
    echo "✅ BAĞLANTI BAŞARILI!<br>";
} catch(PDOException $e) {
    echo "❌ HATA: " . $e->getMessage() . "<br>";
}
?>