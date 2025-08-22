<?php
require_once 'config.php';

// CORS headers
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

try {
    $method = $_SERVER['REQUEST_METHOD'];
    $input = json_decode(file_get_contents('php://input'), true);
    
    switch ($method) {
        case 'POST':
            $action = $input['action'] ?? '';
            switch ($action) {
                case 'register':
                    registerMember($input);
                    break;
                case 'login':
                    loginMember($input);
                    break;
                case 'logout':
                    logoutMember($input);
                    break;
                default:
                    throw new Exception('Geçersiz işlem');
            }
            break;
        case 'GET':
            $action = $_GET['action'] ?? '';
            switch ($action) {
                case 'verify':
                    verifySession();
                    break;
                case 'profile':
                    getMemberProfile();
                    break;
                default:
                    throw new Exception('Geçersiz işlem');
            }
            break;
        default:
            throw new Exception('Desteklenmeyen HTTP metodu');
    }
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}

function registerMember($input) {
    global $db;
    
    // Girdi doğrulama
    $required = ['email', 'password', 'first_name', 'last_name', 'phone'];
    foreach ($required as $field) {
        if (empty($input[$field])) {
            throw new Exception("$field alanı gereklidir");
        }
    }
    
    $email = trim(strtolower($input['email']));
    $password = $input['password'];
    $firstName = trim($input['first_name']);
    $lastName = trim($input['last_name']);
    $phone = trim($input['phone']);
    
    // Email formatı kontrolü
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        throw new Exception('Geçerli bir e-posta adresi girin');
    }
    
    // Şifre güvenlik kontrolü
    if (strlen($password) < 6) {
        throw new Exception('Şifre en az 6 karakter olmalıdır');
    }
    
    // Telefon formatı kontrolü
    if (!preg_match('/^[\+]?[0-9\s\-\(\)]+$/', $phone)) {
        throw new Exception('Geçerli bir telefon numarası girin');
    }
    
    // Email zaten var mı kontrol et
    $sql = "SELECT id FROM members WHERE email = ?";
    $stmt = $db->prepare($sql);
    $stmt->execute([$email]);
    
    if ($stmt->fetch()) {
        throw new Exception('Bu e-posta adresi zaten kayıtlı');
    }
    
    // Şifreyi hashle
    $passwordHash = password_hash($password, PASSWORD_DEFAULT);
    
    // Üye kaydı oluştur
    $sql = "INSERT INTO members (email, password_hash, first_name, last_name, phone) 
            VALUES (?, ?, ?, ?, ?)";
    $stmt = $db->prepare($sql);
    $stmt->execute([$email, $passwordHash, $firstName, $lastName, $phone]);
    
    $memberId = $db->lastInsertId();
    
    // Oturum oluştur
    $sessionToken = bin2hex(random_bytes(32));
    $expiresAt = date('Y-m-d H:i:s', strtotime('+30 days'));
    
    $sql = "INSERT INTO member_sessions (member_id, session_token, ip_address, user_agent, expires_at) 
            VALUES (?, ?, ?, ?, ?)";
    $stmt = $db->prepare($sql);
    $stmt->execute([
        $memberId,
        $sessionToken,
        $_SERVER['REMOTE_ADDR'] ?? '',
        $_SERVER['HTTP_USER_AGENT'] ?? '',
        $expiresAt
    ]);
    
    echo json_encode([
        'success' => true,
        'message' => 'Üyelik başarıyla oluşturuldu',
        'member' => [
            'id' => $memberId,
            'email' => $email,
            'first_name' => $firstName,
            'last_name' => $lastName,
            'phone' => $phone
        ],
        'session_token' => $sessionToken
    ]);
}

function loginMember($input) {
    global $db;
    
    $email = trim(strtolower($input['email'] ?? ''));
    $password = $input['password'] ?? '';
    
    if (empty($email) || empty($password)) {
        throw new Exception('E-posta ve şifre gereklidir');
    }
    
    // Üye bilgilerini getir
    $sql = "SELECT id, email, password_hash, first_name, last_name, phone, is_active 
            FROM members WHERE email = ?";
    $stmt = $db->prepare($sql);
    $stmt->execute([$email]);
    $member = $stmt->fetch();
    
    if (!$member) {
        throw new Exception('Geçersiz e-posta veya şifre');
    }
    
    if (!$member['is_active']) {
        throw new Exception('Hesabınız devre dışı bırakılmış');
    }
    
    // Şifreyi doğrula
    if (!password_verify($password, $member['password_hash'])) {
        throw new Exception('Geçersiz e-posta veya şifre');
    }
    
    // Eski oturumları temizle
    $sql = "DELETE FROM member_sessions WHERE member_id = ? AND expires_at < NOW()";
    $stmt = $db->prepare($sql);
    $stmt->execute([$member['id']]);
    
    // Yeni oturum oluştur
    $sessionToken = bin2hex(random_bytes(32));
    $expiresAt = date('Y-m-d H:i:s', strtotime('+30 days'));
    
    $sql = "INSERT INTO member_sessions (member_id, session_token, ip_address, user_agent, expires_at) 
            VALUES (?, ?, ?, ?, ?)";
    $stmt = $db->prepare($sql);
    $stmt->execute([
        $member['id'],
        $sessionToken,
        $_SERVER['REMOTE_ADDR'] ?? '',
        $_SERVER['HTTP_USER_AGENT'] ?? '',
        $expiresAt
    ]);
    
    // Son giriş zamanını güncelle
    $sql = "UPDATE members SET last_login = NOW() WHERE id = ?";
    $stmt = $db->prepare($sql);
    $stmt->execute([$member['id']]);
    
    echo json_encode([
        'success' => true,
        'message' => 'Giriş başarılı',
        'member' => [
            'id' => $member['id'],
            'email' => $member['email'],
            'first_name' => $member['first_name'],
            'last_name' => $member['last_name'],
            'phone' => $member['phone']
        ],
        'session_token' => $sessionToken
    ]);
}

function logoutMember($input) {
    global $db;
    
    $sessionToken = $input['session_token'] ?? '';
    
    if (empty($sessionToken)) {
        throw new Exception('Oturum token gereklidir');
    }
    
    // Oturumu sil
    $sql = "DELETE FROM member_sessions WHERE session_token = ?";
    $stmt = $db->prepare($sql);
    $stmt->execute([$sessionToken]);
    
    echo json_encode([
        'success' => true,
        'message' => 'Çıkış yapıldı'
    ]);
}

function verifySession() {
    global $db;
    
    $sessionToken = $_GET['session_token'] ?? '';
    
    if (empty($sessionToken)) {
        throw new Exception('Oturum token gereklidir');
    }
    
    // Oturumu doğrula
    $sql = "SELECT ms.member_id, ms.expires_at, m.email, m.first_name, m.last_name, m.phone, m.is_active
            FROM member_sessions ms
            JOIN members m ON ms.member_id = m.id
            WHERE ms.session_token = ? AND ms.expires_at > NOW()";
    $stmt = $db->prepare($sql);
    $stmt->execute([$sessionToken]);
    $session = $stmt->fetch();
    
    if (!$session) {
        throw new Exception('Geçersiz veya süresi dolmuş oturum');
    }
    
    if (!$session['is_active']) {
        throw new Exception('Hesabınız devre dışı bırakılmış');
    }
    
    echo json_encode([
        'success' => true,
        'member' => [
            'id' => $session['member_id'],
            'email' => $session['email'],
            'first_name' => $session['first_name'],
            'last_name' => $session['last_name'],
            'phone' => $session['phone']
        ]
    ]);
}

function getMemberProfile() {
    global $db;
    
    $sessionToken = $_GET['session_token'] ?? '';
    
    if (empty($sessionToken)) {
        throw new Exception('Oturum token gereklidir');
    }
    
    // Üye bilgilerini getir
    $sql = "SELECT m.id, m.email, m.first_name, m.last_name, m.phone, m.created_at, m.last_login
            FROM members m
            JOIN member_sessions ms ON m.id = ms.member_id
            WHERE ms.session_token = ? AND ms.expires_at > NOW() AND m.is_active = 1";
    $stmt = $db->prepare($sql);
    $stmt->execute([$sessionToken]);
    $member = $stmt->fetch();
    
    if (!$member) {
        throw new Exception('Geçersiz oturum');
    }
    
    // Üye rezervasyonlarını getir
    $sql = "SELECT mr.class_date, mr.status, mr.created_at
            FROM member_reservations mr
            WHERE mr.member_id = ?
            ORDER BY mr.class_date DESC";
    $stmt = $db->prepare($sql);
    $stmt->execute([$member['id']]);
    $reservations = $stmt->fetchAll();
    
    echo json_encode([
        'success' => true,
        'member' => $member,
        'reservations' => $reservations
    ]);
}
?>