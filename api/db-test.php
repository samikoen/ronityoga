<?php
// Farklı kombinasyonları deneyelim
$attempts = [
    ['host' => 'localhost:3306', 'user' => 'ronityog_ronit', 'pass' => 'alenroy11', 'db' => 'ronityoga_db'],
    ['host' => 'localhost:3306', 'user' => 'ronityog_ronit', 'pass' => 'alenroy11', 'db' => 'ronityoga'],
    ['host' => 'localhost:3306', 'user' => 'ronityog_ronit', 'pass' => 'alenroy11', 'db' => 'ronit_yoga'],
  ];

foreach ($attempts as $attempt) {
    try {
        $db = new PDO("mysql:host={$attempt['host']};dbname={$attempt['db']};charset=utf8", 
                      $attempt['user'], 
                      $attempt['pass']);
        echo "✅ BAŞARILI! Kullanın: <br>";
        echo "DB_HOST: '{$attempt['host']}'<br>";
        echo "DB_NAME: '{$attempt['db']}'<br>";
        echo "DB_USER: '{$attempt['user']}'<br>";
        break;
    } catch(PDOException $e) {
        echo "❌ Deneme başarısız - DB: {$attempt['db']}, User: {$attempt['user']}<br>";
    }
}
?>