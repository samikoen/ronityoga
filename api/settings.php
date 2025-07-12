<?php
// Debug için hata raporlamayı aç
error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('log_errors', 1);

session_start();
header('Content-Type: application/json; charset=utf-8');

// Debug log fonksiyonu
function debug_log($message) {
    error_log("[SETTINGS DEBUG] " . $message);
}

debug_log("Script started");

// DB bağlantısı
try {
    debug_log("Attempting database connection");
    $db = new PDO("mysql:host=localhost;dbname=ronityog_db;charset=utf8", "ronityog_ronit", "alenroy11.");
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    debug_log("Database connected successfully");
} catch(PDOException $e) {
    debug_log("Database connection failed: " . $e->getMessage());
    http_response_code(500);
    die(json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]));
}

$method = $_SERVER['REQUEST_METHOD'];
debug_log("Request method: " . $method);

try {
    if ($method === 'GET') {
        debug_log("Processing GET request");
        $key = $_GET['key'] ?? null;
        
        if ($key) {
            debug_log("Getting single setting: " . $key);
            $stmt = $db->prepare("SELECT * FROM settings WHERE setting_key = ?");
            $stmt->execute([$key]);
            $setting = $stmt->fetch(PDO::FETCH_ASSOC);
            echo json_encode($setting ?: ['setting_value' => null]);
        } else {
            debug_log("Getting all settings");
            $stmt = $db->query("SELECT * FROM settings");
            $settings = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            $result = [];
            foreach($settings as $setting) {
                $result[$setting['setting_key']] = $setting['setting_value'];
            }
            echo json_encode($result);
        }
        
    } else if ($method === 'POST') {
        debug_log("Processing POST request");
        
        // Oturum kontrolü
        if (!isset($_SESSION['admin_logged_in'])) {
            debug_log("Unauthorized access attempt");
            http_response_code(401);
            die(json_encode(['error' => 'Yetkisiz erişim']));
        }
        
        debug_log("Admin logged in, processing data");
        
        // Input'u al
        $input = file_get_contents('php://input');
        debug_log("Raw input length: " . strlen($input));
        debug_log("Raw input: " . substr($input, 0, 200) . "...");
        
        if (empty($input)) {
            debug_log("Empty input received");
            die(json_encode(['error' => 'Boş veri gönderildi']));
        }
        
        // JSON decode
        $data = json_decode($input, true);
        $json_error = json_last_error();
        
        if ($json_error !== JSON_ERROR_NONE) {
            debug_log("JSON decode error: " . json_last_error_msg());
            die(json_encode(['error' => 'JSON hatası: ' . json_last_error_msg()]));
        }
        
        debug_log("Decoded data: " . print_r($data, true));
        
        if (!$data) {
            debug_log("Data is null after decode");
            die(json_encode(['error' => 'Veri çözümlenemedi']));
        }
        
        // Birden fazla ayar güncelleme
        if (isset($data['settings']) && is_array($data['settings'])) {
            debug_log("Processing multiple settings");
            $db->beginTransaction();
            
            try {
                foreach($data['settings'] as $key => $value) {
                    debug_log("Setting: $key = " . substr($value, 0, 50) . "...");
                    
                    $stmt = $db->prepare("INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) 
                                         ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)");
                    $stmt->execute([$key, $value]);
                }
                
                $db->commit();
                debug_log("All settings saved successfully");
                echo json_encode(['success' => true, 'message' => 'Ayarlar kaydedildi']);
                
            } catch (Exception $e) {
                $db->rollback();
                debug_log("Transaction error: " . $e->getMessage());
                throw $e;
            }
        } 
        // Tek ayar güncelleme
        else if (isset($data['key'])) {
            debug_log("Processing single setting: " . $data['key']);
            $value = $data['value'] ?? '';
            $stmt = $db->prepare("INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) 
                                 ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)");
            $stmt->execute([$data['key'], $value]);
            echo json_encode(['success' => true, 'message' => 'Ayar kaydedildi']);
        } else {
            debug_log("Invalid data format received");
            echo json_encode(['error' => 'Geçersiz veri formatı']);
        }
        
    } else {
        debug_log("Method not allowed: " . $method);
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
    }
    
} catch (Exception $e) {
    debug_log("Exception caught: " . $e->getMessage());
    debug_log("Exception trace: " . $e->getTraceAsString());
    http_response_code(500);
    echo json_encode(['error' => 'Sunucu hatası: ' . $e->getMessage()]);
}

debug_log("Script ended");
?>