<?php
// Hataları göster
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "PHP Çalışıyor<br>";

// Config dosyasını kontrol et
$configFile = __DIR__ . '/config.php';
if (file_exists($configFile)) {
    echo "config.php mevcut<br>";
    
    // Syntax kontrolü
    $output = shell_exec('php -l ' . $configFile . ' 2>&1');
    echo "Syntax kontrolü: " . $output . "<br>";
    
    // İçeriği göster
    echo "<h3>config.php içeriği:</h3>";
    echo "<pre>" . htmlspecialchars(file_get_contents($configFile)) . "</pre>";
} else {
    echo "config.php BULUNAMADI!<br>";
}
?>