-- YouTube thumbnail URL'lerini düzelt
UPDATE youtube_videos 
SET thumbnail_url = REPLACE(thumbnail_url, '/maxresdefault.jpg', '/hqdefault.jpg')
WHERE thumbnail_url LIKE '%maxresdefault.jpg%';

-- Alternatif olarak direct update
UPDATE youtube_videos 
SET thumbnail_url = 'https://img.youtube.com/vi/cm0sS5wy_7g/hqdefault.jpg'
WHERE youtube_id = 'cm0sS5wy_7g';

UPDATE youtube_videos 
SET thumbnail_url = 'https://img.youtube.com/vi/EXAMPLE2/hqdefault.jpg'
WHERE youtube_id = 'EXAMPLE2';