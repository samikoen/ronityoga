<?php
header('Content-Type: application/json; charset=utf-8');

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($input['name']) || !isset($input['email']) || !isset($input['message'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Ad, e-posta ve mesaj gerekli']);
        exit;
    }
    
    // Basic validation
    if (!filter_var($input['email'], FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode(['error' => 'Geçerli bir e-posta adresi girin']);
        exit;
    }
    
    // In a real implementation, you would:
    // 1. Save to database
    // 2. Send email notification
    // 3. Implement spam protection
    
    // For now, just return success
    echo json_encode([
        'success' => true,
        'message' => 'Mesajınız başarıyla gönderildi. En kısa sürede size dönüş yapacağız.'
    ]);
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}
?>