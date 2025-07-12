<?php
session_start();
header('Content-Type: application/json; charset=utf-8');

// DB bağlantısı
try {
    $db = new PDO("mysql:host=localhost;dbname=ronityog_db;charset=utf8", "ronityog_ronit", "alenroy11.");
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $db->exec("SET NAMES 'utf8'");
} catch(PDOException $e) {
    die(json_encode(['error' => 'DB Error: ' . $e->getMessage()]));
}

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        // Get schedule data
        try {
            // For now, return sample schedule data
            // In real implementation, fetch from database
            $schedule = [
                'monday' => [
                    ['time' => '09:00', 'class' => 'Başlangıç Yoga', 'instructor' => 'Ronit'],
                    ['time' => '11:00', 'class' => 'Hatha Yoga', 'instructor' => 'Ronit'],
                    ['time' => '18:00', 'class' => 'Vinyasa Flow', 'instructor' => 'Ronit']
                ],
                'tuesday' => [
                    ['time' => '10:00', 'class' => 'Meditasyon', 'instructor' => 'Ronit'],
                    ['time' => '19:00', 'class' => 'İleri Seviye Yoga', 'instructor' => 'Ronit']
                ],
                'wednesday' => [
                    ['time' => '09:00', 'class' => 'Başlangıç Yoga', 'instructor' => 'Ronit'],
                    ['time' => '17:00', 'class' => 'Restoratif Yoga', 'instructor' => 'Ronit']
                ],
                'thursday' => [
                    ['time' => '10:00', 'class' => 'Hatha Yoga', 'instructor' => 'Ronit'],
                    ['time' => '18:30', 'class' => 'Vinyasa Flow', 'instructor' => 'Ronit']
                ],
                'friday' => [
                    ['time' => '09:30', 'class' => 'Başlangıç Yoga', 'instructor' => 'Ronit'],
                    ['time' => '19:00', 'class' => 'Relax & Restore', 'instructor' => 'Ronit']
                ],
                'saturday' => [
                    ['time' => '10:00', 'class' => 'Workshop', 'instructor' => 'Ronit'],
                    ['time' => '15:00', 'class' => 'Aile Yogası', 'instructor' => 'Ronit']
                ],
                'sunday' => [
                    ['time' => '11:00', 'class' => 'Meditasyon & Nefes', 'instructor' => 'Ronit']
                ]
            ];
            
            echo json_encode($schedule);
            
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to fetch schedule']);
        }
        break;
        
    case 'POST':
        // Add/Update schedule item - requires admin authentication
        if (!isset($_SESSION['admin_logged_in'])) {
            http_response_code(401);
            echo json_encode(['error' => 'Unauthorized']);
            exit;
        }
        
        $input = json_decode(file_get_contents('php://input'), true);
        
        // Implementation would save to database
        echo json_encode([
            'success' => true,
            'message' => 'Schedule updated successfully'
        ]);
        break;
        
    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        break;
}
?>