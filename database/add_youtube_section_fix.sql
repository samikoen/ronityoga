-- YouTube Videos section'ını section_visibility tablosuna ekle
INSERT INTO section_visibility (section_name, display_name, description, is_active, menu_order) 
VALUES ('youtube-videos', 'YouTube Videolarım', 'YouTube kanalında paylaşılan yoga videoları', 1, 5)
ON DUPLICATE KEY UPDATE 
    display_name = VALUES(display_name),
    description = VALUES(description),
    is_active = VALUES(is_active);