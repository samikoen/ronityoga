<?php
require_once 'config.php';

// CORS headers
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

try {
    $method = $_SERVER['REQUEST_METHOD'];
    $input = json_decode(file_get_contents('php://input'), true);
    
    switch ($method) {
        case 'GET':
            handleGetRequest();
            break;
        case 'POST':
            handlePostRequest($input);
            break;
        case 'PUT':
            handlePutRequest($input);
            break;
        case 'DELETE':
            handleDeleteRequest($input);
            break;
        default:
            throw new Exception('Method not allowed');
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false, 
        'error' => $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine(),
        'trace' => $e->getTraceAsString()
    ]);
}

function handleGetRequest() {
    global $db;
    
    $action = $_GET['action'] ?? 'get_schedule';
    
    switch ($action) {
        case 'get_schedule':
            getClassSchedule();
            break;
        case 'get_attendance':
            getClassAttendance();
            break;
        case 'get_stats':
            getAttendanceStats();
            break;
        default:
            throw new Exception('Invalid action');
    }
}

function getClassSchedule() {
    global $db;
    
    $currentDate = date('Y-m-d');
    $sql = "SELECT 
                s.id,
                s.class_date,
                s.class_day,
                s.class_time,
                s.max_capacity,
                s.current_registrations,
                s.is_active,
                s.special_notes,
                COUNT(a.id) as actual_registrations
            FROM summer_class_schedule s
            LEFT JOIN summer_class_attendance a ON s.class_date = a.class_date
            WHERE s.class_date >= ? AND s.is_active = 1
            GROUP BY s.id
            ORDER BY s.class_date ASC";
    
    $stmt = $db->prepare($sql);
    $stmt->execute([$currentDate]);
    $schedule = $stmt->fetchAll();
    
    // Format dates for Turkish locale
    foreach ($schedule as &$class) {
        $class['formatted_date'] = date('d.m.Y', strtotime($class['class_date']));
        $class['formatted_time'] = date('H:i', strtotime($class['class_time']));
        $class['available_spots'] = $class['max_capacity'] - $class['actual_registrations'];
        $class['is_full'] = $class['actual_registrations'] >= $class['max_capacity'];
    }
    
    echo json_encode([
        'success' => true,
        'schedule' => $schedule
    ]);
}

function getClassAttendance() {
    global $db;
    
    $classDate = $_GET['class_date'] ?? null;
    $startDate = $_GET['start_date'] ?? null;
    $endDate = $_GET['end_date'] ?? null;
    
    $sql = "SELECT 
                a.id,
                a.class_date,
                a.class_day,
                a.class_time,
                a.participant_name,
                a.participant_email,
                a.participant_phone,
                a.participant_level,
                a.registration_date,
                a.attendance_status,
                a.notes
            FROM summer_class_attendance a
            WHERE 1=1";
    
    $params = [];
    
    if ($classDate) {
        $sql .= " AND a.class_date = ?";
        $params[] = $classDate;
    }
    
    if ($startDate && $endDate) {
        $sql .= " AND a.class_date BETWEEN ? AND ?";
        $params[] = $startDate;
        $params[] = $endDate;
    }
    
    $sql .= " ORDER BY a.class_date DESC, a.registration_date ASC";
    
    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    $attendance = $stmt->fetchAll();
    
    // Format dates
    foreach ($attendance as &$record) {
        $record['formatted_date'] = date('d.m.Y', strtotime($record['class_date']));
        $record['formatted_time'] = date('H:i', strtotime($record['class_time']));
        $record['formatted_registration'] = date('d.m.Y H:i', strtotime($record['registration_date']));
    }
    
    echo json_encode([
        'success' => true,
        'attendance' => $attendance
    ]);
}

function getAttendanceStats() {
    global $db;
    
    $startDate = $_GET['start_date'] ?? date('Y-m-01'); // Bu ayın başı
    $endDate = $_GET['end_date'] ?? date('Y-m-t'); // Bu ayın sonu
    
    // Genel istatistikler
    $sql = "SELECT 
                COUNT(*) as total_registrations,
                COUNT(DISTINCT participant_email) as unique_participants,
                COUNT(CASE WHEN attendance_status = 'Katıldı' THEN 1 END) as attended_count,
                COUNT(CASE WHEN attendance_status = 'Katılmadı' THEN 1 END) as not_attended_count
            FROM summer_class_attendance
            WHERE class_date BETWEEN ? AND ?";
    
    $stmt = $db->prepare($sql);
    $stmt->execute([$startDate, $endDate]);
    $stats = $stmt->fetch();
    
    // En yakın ders bilgisi
    $sql = "SELECT 
                scs.class_date,
                scs.class_day,
                scs.class_time,
                COUNT(sca.id) as participant_count
            FROM summer_class_schedule scs
            LEFT JOIN summer_class_attendance sca ON scs.class_date = sca.class_date
            WHERE scs.class_date >= CURDATE() AND scs.is_active = 1
            GROUP BY scs.class_date, scs.class_day, scs.class_time
            ORDER BY scs.class_date ASC
            LIMIT 1";
    
    $stmt = $db->prepare($sql);
    $stmt->execute();
    $nextClass = $stmt->fetch();
    
    // Günlük istatistikler
    $sql = "SELECT 
                class_date,
                class_day,
                COUNT(*) as registrations,
                COUNT(CASE WHEN attendance_status = 'Katıldı' THEN 1 END) as attended
            FROM summer_class_attendance
            WHERE class_date BETWEEN ? AND ?
            GROUP BY class_date, class_day
            ORDER BY class_date ASC";
    
    $stmt = $db->prepare($sql);
    $stmt->execute([$startDate, $endDate]);
    $daily_stats = $stmt->fetchAll();
    
    // Seviye bazlı istatistikler
    $sql = "SELECT 
                participant_level,
                COUNT(*) as count
            FROM summer_class_attendance
            WHERE class_date BETWEEN ? AND ?
            GROUP BY participant_level";
    
    $stmt = $db->prepare($sql);
    $stmt->execute([$startDate, $endDate]);
    $level_stats = $stmt->fetchAll();
    
    echo json_encode([
        'success' => true,
        'stats' => $stats,
        'daily_stats' => $daily_stats,
        'level_stats' => $level_stats,
        'next_class' => $nextClass
    ]);
}

function handlePostRequest($input) {
    global $db;
    
    $action = $input['action'] ?? 'register';
    
    switch ($action) {
        case 'register':
            registerForClass($input);
            break;
        case 'update_attendance':
            updateAttendanceStatus($input);
            break;
        default:
            throw new Exception('Invalid action');
    }
}

function registerForClass($input) {
    global $db;
    
    $classDate = $input['class_date'] ?? '';
    $sessionToken = $input['session_token'] ?? '';
    $memberId = null;
    
    // Ders tarihi kontrolü (hem üye hem misafir için gerekli)
    if (empty($classDate)) {
        throw new Exception('Ders tarihi seçilmelidir');
    }
    
    // Üye oturum kontrolü
    if (!empty($sessionToken)) {
        try {
            $sql = "SELECT ms.member_id, m.first_name, m.last_name, m.email, m.phone, m.is_active
                    FROM member_sessions ms
                    JOIN members m ON ms.member_id = m.id
                    WHERE ms.session_token = ? AND ms.expires_at > NOW()";
            $stmt = $db->prepare($sql);
            $stmt->execute([$sessionToken]);
            $member = $stmt->fetch();
            
            if ($member && $member['is_active']) {
                $memberId = $member['member_id'];
                $participantName = $member['first_name'] . ' ' . $member['last_name'];
                $participantEmail = $member['email'];
                $participantPhone = $member['phone'];
            } else if ($member && !$member['is_active']) {
                throw new Exception('Üye hesabınız aktif değil. Lütfen admin ile iletişime geçin.');
            } else {
                // Session token geçersiz veya süresi dolmuş, misafir olarak devam et
                $sessionToken = null; // Session token'i temizle
                $memberId = null;
            }
        } catch (Exception $e) {
            // Session validation hatası durumunda misafir olarak devam et
            $sessionToken = null;
            $memberId = null;
        }
    }
    
    // Eğer üye değilse, manuel bilgi girişi gerekli
    if (!$memberId) {
        // Session token vardı ama geçersizse, kullanıcıya açık mesaj ver
        if (!empty($input['session_token']) && empty($input['participant_name'])) {
            throw new Exception('Oturum süreniz dolmuş. Lütfen sayfayı yenileyip tekrar deneyin veya misafir olarak kayıt olun.');
        }
        
        $required = ['class_date', 'participant_name', 'participant_email', 'participant_phone'];
        foreach ($required as $field) {
            if (empty($input[$field])) {
                throw new Exception("$field is required");
            }
        }
        
        $participantName = trim($input['participant_name']);
        $participantEmail = trim($input['participant_email']);
        $participantPhone = trim($input['participant_phone']);
    }
    
    $participantLevel = $input['participant_level'] ?? 'Tüm Seviyeler';
    $notes = $input['notes'] ?? '';
    
    // Email formatı kontrolü
    if (!filter_var($participantEmail, FILTER_VALIDATE_EMAIL)) {
        throw new Exception('Geçerli bir e-posta adresi girin');
    }
    
    // Telefon formatı kontrolü (basit)
    if (!preg_match('/^[\+]?[0-9\s\-\(\)]+$/', $participantPhone)) {
        throw new Exception('Geçerli bir telefon numarası girin');
    }
    
    // Ders tarihini kontrol et
    $sql = "SELECT * FROM summer_class_schedule WHERE class_date = ? AND is_active = 1";
    $stmt = $db->prepare($sql);
    $stmt->execute([$classDate]);
    $class = $stmt->fetch();
    
    if (!$class) {
        throw new Exception('Seçilen tarihte aktif bir ders bulunamadı');
    }
    
    // Kapasite kontrolü
    $sql = "SELECT COUNT(*) as current_count FROM summer_class_attendance WHERE class_date = ?";
    $stmt = $db->prepare($sql);
    $stmt->execute([$classDate]);
    $currentCount = $stmt->fetch()['current_count'];
    
    if ($currentCount >= $class['max_capacity']) {
        throw new Exception('Bu ders için kapasite dolu');
    }
    
    // Gün bilgisini tarihten çıkar
    $dayOfWeek = date('N', strtotime($classDate)); // 1=Pazartesi, 7=Pazar
    $classDay = ($dayOfWeek == 2) ? 'Salı' : 'Perşembe';
    
    try {
        $db->beginTransaction();
        
        // Katılım kaydı ekle
        $sql = "INSERT INTO summer_class_attendance 
                (member_id, class_date, class_day, class_time, participant_name, participant_email, 
                 participant_phone, participant_level, notes) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
        
        $stmt = $db->prepare($sql);
        $stmt->execute([
            $memberId,
            $classDate,
            $classDay,
            $class['class_time'],
            $participantName,
            $participantEmail,
            $participantPhone,
            $participantLevel,
            $notes
        ]);
        
        // Eğer üye ise, member_reservations tablosuna da kaydet
        if ($memberId) {
            try {
                $sql = "INSERT INTO member_reservations (member_id, class_date) VALUES (?, ?)";
                $stmt = $db->prepare($sql);
                $stmt->execute([$memberId, $classDate]);
            } catch (Exception $e) {
                // Member reservation duplicate'i ignore et, summer_class_attendance zaten kaydedildi
                // Çünkü admin'den silinen bir kayıt member_reservations'da kalmış olabilir
            }
        }
        
        // Program tablosundaki kayıt sayısını güncelle
        $sql = "UPDATE summer_class_schedule 
                SET current_registrations = current_registrations + 1 
                WHERE class_date = ?";
        $stmt = $db->prepare($sql);
        $stmt->execute([$classDate]);
        
        $db->commit();
        
        echo json_encode([
            'success' => true,
            'message' => 'Ders kaydınız başarıyla alındı!',
            'registration_id' => $db->lastInsertId()
        ]);
        
    } catch (Exception $e) {
        $db->rollback();
        if ($e->getCode() == 23000) { // Duplicate entry
            // Debug: Hangi constraint violated oldu?
            $errorMessage = $e->getMessage();
            
            if (strpos($errorMessage, 'unique_participant_date') !== false) {
                // Aynı email + aynı tarih duplicate'i
                try {
                    // Duplicate entry durumunda mevcut kaydı güncelle
                    $db->beginTransaction();
                    
                    $sql = "UPDATE summer_class_attendance 
                            SET participant_name = ?, participant_phone = ?, participant_level = ?, 
                                notes = ?, attendance_status = 'Kayıtlı', updated_at = NOW()
                            WHERE participant_email = ? AND class_date = ?";
                    $stmt = $db->prepare($sql);
                    $stmt->execute([
                        $participantName,
                        $participantPhone, 
                        $participantLevel,
                        $notes,
                        $participantEmail,
                        $classDate
                    ]);
                    
                    // Eğer üye ise, member_reservations tablosunu da güncelle
                    if ($memberId) {
                        $sql = "SELECT COUNT(*) as count FROM member_reservations WHERE member_id = ? AND class_date = ?";
                        $stmt = $db->prepare($sql);
                        $stmt->execute([$memberId, $classDate]);
                        $reservationExists = $stmt->fetch()['count'];
                        
                        if (!$reservationExists) {
                            $sql = "INSERT INTO member_reservations (member_id, class_date) VALUES (?, ?)";
                            $stmt = $db->prepare($sql);
                            $stmt->execute([$memberId, $classDate]);
                        }
                    }
                    
                    $db->commit();
                    
                    echo json_encode([
                        'success' => true,
                        'message' => 'Ders kaydınız güncelleştirildi!',
                        'updated' => true
                    ]);
                    return;
                    
                } catch (Exception $updateError) {
                    $db->rollback();
                    throw new Exception('Bu e-posta adresi ile bu tarihe zaten kayıt yapılmış');
                }
            } else if (strpos($errorMessage, 'unique_member_class') !== false) {
                // member_reservations tablosunda duplicate - bu üye bu derse zaten kayıtlı
                // Bu durumda summer_class_attendance'ı kontrol et
                $sql = "SELECT id FROM summer_class_attendance WHERE participant_email = ? AND class_date = ?";
                $stmt = $db->prepare($sql);
                $stmt->execute([$participantEmail, $classDate]);
                $existingRecord = $stmt->fetch();
                
                if ($existingRecord) {
                    // Kayıt var, güncelle
                    try {
                        $db->beginTransaction();
                        
                        $sql = "UPDATE summer_class_attendance 
                                SET participant_name = ?, participant_phone = ?, participant_level = ?, 
                                    notes = ?, attendance_status = 'Kayıtlı', updated_at = NOW()
                                WHERE participant_email = ? AND class_date = ?";
                        $stmt = $db->prepare($sql);
                        $stmt->execute([
                            $participantName,
                            $participantPhone, 
                            $participantLevel,
                            $notes,
                            $participantEmail,
                            $classDate
                        ]);
                        
                        $db->commit();
                        
                        echo json_encode([
                            'success' => true,
                            'message' => 'Ders kaydınız güncelleştirildi!',
                            'updated' => true
                        ]);
                        return;
                    } catch (Exception $updateError) {
                        $db->rollback();
                        throw new Exception('Kayıt güncellenemedi');
                    }
                } else {
                    throw new Exception('Bu derse zaten kayıtlısınız');
                }
            } else {
                // Başka bir constraint hatası
                throw new Exception('Duplicate entry error: ' . $errorMessage);
            }
        }
        throw $e;
    }
}

function updateAttendanceStatus($input) {
    global $db;
    
    $attendanceId = $input['attendance_id'] ?? null;
    $status = $input['status'] ?? null;
    
    if (!$attendanceId || !$status) {
        throw new Exception('Attendance ID and status are required');
    }
    
    $validStatuses = ['Kayıtlı', 'Katıldı', 'Katılmadı'];
    if (!in_array($status, $validStatuses)) {
        throw new Exception('Invalid status');
    }
    
    $sql = "UPDATE summer_class_attendance SET attendance_status = ? WHERE id = ?";
    $stmt = $db->prepare($sql);
    $stmt->execute([$status, $attendanceId]);
    
    if ($stmt->rowCount() == 0) {
        throw new Exception('Attendance record not found');
    }
    
    echo json_encode([
        'success' => true,
        'message' => 'Katılım durumu güncellendi'
    ]);
}

function handlePutRequest($input) {
    // Gelecekte ders programını güncelleme için kullanılabilir
    echo json_encode(['success' => false, 'message' => 'PUT method not implemented yet']);
}

function handleDeleteRequest($input) {
    global $db;
    
    $attendanceId = $input['attendance_id'] ?? null;
    
    if (!$attendanceId) {
        throw new Exception('Attendance ID is required');
    }
    
    // Önce kaydı bul (email ve member_id de lazım)
    $sql = "SELECT class_date, participant_email, member_id FROM summer_class_attendance WHERE id = ?";
    $stmt = $db->prepare($sql);
    $stmt->execute([$attendanceId]);
    $record = $stmt->fetch();
    
    if (!$record) {
        throw new Exception('Attendance record not found');
    }
    
    try {
        $db->beginTransaction();
        
        // Katılım kaydını sil
        $sql = "DELETE FROM summer_class_attendance WHERE id = ?";
        $stmt = $db->prepare($sql);
        $stmt->execute([$attendanceId]);
        
        // Eğer üye ise member_reservations tablosundan da sil
        if ($record['member_id']) {
            $sql = "DELETE FROM member_reservations WHERE member_id = ? AND class_date = ?";
            $stmt = $db->prepare($sql);
            $stmt->execute([$record['member_id'], $record['class_date']]);
        }
        
        // Program tablosundaki kayıt sayısını güncelle
        $sql = "UPDATE summer_class_schedule 
                SET current_registrations = current_registrations - 1 
                WHERE class_date = ? AND current_registrations > 0";
        $stmt = $db->prepare($sql);
        $stmt->execute([$record['class_date']]);
        
        $db->commit();
        
        echo json_encode([
            'success' => true,
            'message' => 'Kayıt başarıyla silindi'
        ]);
        
    } catch (Exception $e) {
        $db->rollback();
        throw $e;
    }
}
?>