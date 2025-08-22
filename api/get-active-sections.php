<?php
require_once 'config.php';

header('Content-Type: application/json');

try {
    // Get all active sections ordered by menu_order
    $stmt = $db->prepare("SELECT section_name, display_name, menu_order FROM section_visibility WHERE is_active = 1 ORDER BY menu_order ASC");
    $stmt->execute();
    $sections = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode(['success' => true, 'sections' => $sections]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}

// Helper function to check if section is active (for PHP includes)
function isSectionActive($sectionName) {
    global $db;
    $pdo = $db;
    
    try {
        $stmt = $pdo->prepare("SELECT is_active FROM section_visibility WHERE section_name = ?");
        $stmt->execute([$sectionName]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        return $result ? (bool)$result['is_active'] : false;
    } catch (Exception $e) {
        return false; // Default to false if error
    }
}
?>