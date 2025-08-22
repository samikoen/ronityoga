<?php
require_once 'config.php';

try {
    // 5 Ağustos (Salı) ve 7 Ağustos (Perşembe) derslerini devre dışı bırak
    $sql = "UPDATE summer_class_schedule SET is_active = 0 WHERE class_date IN ('2025-08-05', '2025-08-07')";
    $stmt = $db->prepare($sql);
    $stmt->execute();
    
    $rowCount = $stmt->rowCount();
    
    echo json_encode([
        'success' => true,
        'message' => "5 ve 7 Ağustos dersleri listeden çıkarıldı",
        'affected_rows' => $rowCount
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>