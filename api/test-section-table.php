<?php
// Test script to check section_visibility table
header('Content-Type: application/json');

try {
    require_once 'config.php';
    
    // Check if table exists
    $stmt = $db->prepare("SHOW TABLES LIKE 'section_visibility'");
    $stmt->execute();
    $tableExists = $stmt->fetchColumn();
    
    if (!$tableExists) {
        echo json_encode([
            'success' => false, 
            'message' => 'Table section_visibility does not exist',
            'solution' => 'Run create-section-table.php first'
        ]);
        exit;
    }
    
    // Check table structure
    $stmt = $db->prepare("DESCRIBE section_visibility");
    $stmt->execute();
    $structure = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Check records
    $stmt = $db->prepare("SELECT COUNT(*) FROM section_visibility");
    $stmt->execute();
    $recordCount = $stmt->fetchColumn();
    
    // Get sample records
    $stmt = $db->prepare("SELECT * FROM section_visibility LIMIT 5");
    $stmt->execute();
    $sampleRecords = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'table_exists' => true,
        'record_count' => $recordCount,
        'table_structure' => $structure,
        'sample_records' => $sampleRecords
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Error: ' . $e->getMessage()
    ]);
}
?>