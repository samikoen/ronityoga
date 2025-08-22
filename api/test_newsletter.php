<?php
// Newsletter test sayfası
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<h1>Newsletter Test</h1>";

// DB bağlantısı
try {
    $db = new PDO("mysql:host=localhost;dbname=ronityog_db;charset=utf8", "ronityog_ronit", "alenroy11.");
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    echo "<p style='color: green;'>✓ Veritabanı bağlantısı başarılı</p>";
} catch(PDOException $e) {
    echo "<p style='color: red;'>✗ DB Bağlantı hatası: " . $e->getMessage() . "</p>";
    exit;
}

// Tablo var mı kontrol et
try {
    $result = $db->query("SHOW TABLES LIKE 'newsletter_subscribers'");
    if ($result->rowCount() > 0) {
        echo "<p style='color: green;'>✓ newsletter_subscribers tablosu mevcut</p>";
        
        // Tablo yapısını göster
        $columns = $db->query("DESCRIBE newsletter_subscribers");
        echo "<h3>Tablo Yapısı:</h3>";
        echo "<table border='1' style='border-collapse: collapse; margin: 10px 0;'>";
        echo "<tr><th>Kolon</th><th>Tip</th><th>Null</th><th>Key</th><th>Default</th></tr>";
        while ($column = $columns->fetch()) {
            echo "<tr>";
            echo "<td>{$column['Field']}</td>";
            echo "<td>{$column['Type']}</td>";
            echo "<td>{$column['Null']}</td>";
            echo "<td>{$column['Key']}</td>";
            echo "<td>{$column['Default']}</td>";
            echo "</tr>";
        }
        echo "</table>";
        
        // Veri sayısını göster
        $count = $db->query("SELECT COUNT(*) as total FROM newsletter_subscribers")->fetch();
        echo "<p><strong>Toplam kayıt sayısı:</strong> {$count['total']}</p>";
        
        // Son 10 kaydı göster
        if ($count['total'] > 0) {
            $records = $db->query("SELECT * FROM newsletter_subscribers ORDER BY subscribed_at DESC LIMIT 10");
            echo "<h3>Son 10 Kayıt:</h3>";
            echo "<table border='1' style='border-collapse: collapse; margin: 10px 0;'>";
            echo "<tr><th>ID</th><th>Email</th><th>Tarih</th><th>Durum</th><th>IP</th></tr>";
            while ($record = $records->fetch()) {
                echo "<tr>";
                echo "<td>{$record['id']}</td>";
                echo "<td>{$record['email']}</td>";
                echo "<td>{$record['subscribed_at']}</td>";
                echo "<td>{$record['status']}</td>";
                echo "<td>{$record['ip_address']}</td>";
                echo "</tr>";
            }
            echo "</table>";
        }
        
    } else {
        echo "<p style='color: red;'>✗ newsletter_subscribers tablosu bulunamadı</p>";
        
        // Tabloyu oluşturmayı dene
        echo "<p>Tablo oluşturuluyor...</p>";
        $createTable = "
        CREATE TABLE newsletter_subscribers (
            id INT AUTO_INCREMENT PRIMARY KEY,
            email VARCHAR(255) NOT NULL UNIQUE,
            subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            status ENUM('active', 'unsubscribed') DEFAULT 'active',
            ip_address VARCHAR(45),
            user_agent TEXT,
            INDEX idx_email (email),
            INDEX idx_status (status),
            INDEX idx_subscribed_at (subscribed_at)
        )";
        
        $db->exec($createTable);
        echo "<p style='color: green;'>✓ Tablo oluşturuldu</p>";
    }
} catch(PDOException $e) {
    echo "<p style='color: red;'>✗ Tablo kontrolü hatası: " . $e->getMessage() . "</p>";
}

// Test kaydı ekle
try {
    $testEmail = 'test@test.com';
    $stmt = $db->prepare("INSERT IGNORE INTO newsletter_subscribers (email, ip_address) VALUES (?, ?)");
    $stmt->execute([$testEmail, '127.0.0.1']);
    
    if ($stmt->rowCount() > 0) {
        echo "<p style='color: green;'>✓ Test kaydı eklendi: $testEmail</p>";
    } else {
        echo "<p style='color: orange;'>⚠ Test kaydı zaten mevcut: $testEmail</p>";
    }
} catch(PDOException $e) {
    echo "<p style='color: red;'>✗ Test kaydı ekleme hatası: " . $e->getMessage() . "</p>";
}

// API test et
echo "<h3>API Test:</h3>";
try {
    $apiUrl = 'http://' . $_SERVER['HTTP_HOST'] . dirname($_SERVER['REQUEST_URI']) . '/api/newsletter.php';
    
    // GET test
    $context = stream_context_create([
        'http' => [
            'method' => 'GET',
            'header' => 'Content-Type: application/json'
        ]
    ]);
    
    $response = file_get_contents($apiUrl, false, $context);
    $data = json_decode($response, true);
    
    if ($data) {
        echo "<p style='color: green;'>✓ API GET response alındı</p>";
        echo "<pre>" . print_r($data, true) . "</pre>";
    } else {
        echo "<p style='color: red;'>✗ API response decode edilemedi</p>";
        echo "<p>Raw response: " . htmlspecialchars($response) . "</p>";
    }
    
} catch(Exception $e) {
    echo "<p style='color: red;'>✗ API test hatası: " . $e->getMessage() . "</p>";
}

echo "<hr>";
echo "<p><a href='admin/index.html'>Admin Panele Git</a></p>";
echo "<p><a href='index.html'>Ana Sayfaya Git</a></p>";
?>