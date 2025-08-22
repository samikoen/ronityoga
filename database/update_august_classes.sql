-- 5 Ağustos dersini aktif hale getir, 7 Ağustos dersini devre dışı bırak
UPDATE summer_class_schedule 
SET is_active = 1 
WHERE class_date = '2025-08-05';

UPDATE summer_class_schedule 
SET is_active = 0 
WHERE class_date = '2025-08-07';