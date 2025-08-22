// Giriş kontrolü
async function checkAuth() {
    try {
        const response = await fetch('../api/check-auth.php');
        const data = await response.json();
        
        if (!data.logged_in) {
            window.location.href = 'login.html';
        }
    } catch (error) {
        console.error('Auth check error:', error);
        window.location.href = 'login.html';
    }
}

// Sayfa yüklendiğinde kontrol et
checkAuth();

// Mobile menu kapatma fonksiyonu
function closeMobileMenu() {
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    
    console.log('closeMobileMenu called'); // DEBUG
    
    if (sidebar) {
        sidebar.classList.remove('active');
        // Remove inline styles to allow CSS to work
        sidebar.style.transform = '';
    }
    if (sidebarOverlay) {
        sidebarOverlay.classList.remove('active');
        // Remove inline styles to allow CSS to work
        sidebarOverlay.style.display = '';
    }
    if (mobileMenuToggle) {
        mobileMenuToggle.classList.remove('active');
        mobileMenuToggle.setAttribute('aria-expanded', 'false');
    }
}

// Çıkış fonksiyonu
async function logout() {
    if (confirm('Çıkmak istediğinize emin misiniz?')) {
        try {
            await fetch('../api/logout.php');
            window.location.href = 'login.html';
        } catch (error) {
            console.error('Logout error:', error);
        }
    }
}

// API fonksiyonları
async function apiRequest(url, method = 'GET', data = null) {
    const options = {
        method: method,
        headers: {
            'Content-Type': 'application/json'
        }
    };
    
    if (data) {
        options.body = JSON.stringify(data);
    }
    
    try {
        const response = await fetch(url, options);
        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Data storage
let appData = {
    classes: [],
    schedule: [],
    reservations: [],
    gallery: [],
    videos: [],
    blog: []
};

// YouTube video listesi ve filtreleme
let youtubeVideosAll = [];
let currentYouTubeFilter = 'all';

// YouTube videolarını kategoriye göre filtrele - Global fonksiyon (En başta tanımla)
window.filterYouTubeByCategory = function(category) {
    currentYouTubeFilter = category;
    
    // Tüm filtre butonlarının active sınıfını kaldır
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Seçili butona active sınıfını ekle
    const activeBtn = document.querySelector(`.filter-btn[data-category="${category}"]`);
    if (activeBtn) {
        activeBtn.classList.add('active');
    }
    
    // Eğer videolar henüz yüklenmediyse, sadece filtreyi ayarla
    if (!youtubeVideosAll || youtubeVideosAll.length === 0) {
        console.log('Videolar henüz yüklenmedi, filtre ayarlandı:', category);
        return;
    }
    
    // Filtrelenmiş videoları göster
    let filteredVideos = youtubeVideosAll;
    if (category !== 'all') {
        filteredVideos = youtubeVideosAll.filter(video => video.category === category);
    }
    
    if (typeof displayYouTubeVideos === 'function') {
        displayYouTubeVideos(filteredVideos);
    }
}

// Auto-refresh functionality
let inactivityTimer;
const INACTIVITY_TIME = 60000; // 1 minute in milliseconds

// Notification sound functionality
let lastParticipantCount = 0;

function playNotificationSound() {
    try {
        // Create a pleasant ding-dong bell sound using Web Audio API
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // First tone (ding) - higher frequency
        const oscillator1 = audioContext.createOscillator();
        const gainNode1 = audioContext.createGain();
        
        oscillator1.connect(gainNode1);
        gainNode1.connect(audioContext.destination);
        
        oscillator1.frequency.setValueAtTime(800, audioContext.currentTime); // High C
        oscillator1.type = 'sine';
        
        gainNode1.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode1.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01);
        gainNode1.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.8);
        
        oscillator1.start(audioContext.currentTime);
        oscillator1.stop(audioContext.currentTime + 0.8);
        
        // Second tone (dong) - lower frequency, slightly delayed
        const oscillator2 = audioContext.createOscillator();
        const gainNode2 = audioContext.createGain();
        
        oscillator2.connect(gainNode2);
        gainNode2.connect(audioContext.destination);
        
        oscillator2.frequency.setValueAtTime(600, audioContext.currentTime + 0.3); // Lower G
        oscillator2.type = 'sine';
        
        gainNode2.gain.setValueAtTime(0, audioContext.currentTime + 0.3);
        gainNode2.gain.linearRampToValueAtTime(0.25, audioContext.currentTime + 0.31);
        gainNode2.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 1.2);
        
        oscillator2.start(audioContext.currentTime + 0.3);
        oscillator2.stop(audioContext.currentTime + 1.2);
        
        console.log('🔔 Ding-dong notification sound played - New participant detected!');
    } catch (error) {
        console.log('Audio creation failed:', error);
        playFallbackSound();
    }
}

function playFallbackSound() {
    try {
        // Create simple beep with Web Audio API as fallback
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800; // High frequency beep
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.5);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
        
        console.log('🔔 Fallback beep sound played');
    } catch (error) {
        console.log('All sound methods failed:', error);
    }
}

function checkForNewParticipants(currentData) {
    if (currentData && Array.isArray(currentData)) {
        const currentCount = currentData.length;
        
        // If we have a previous count and current count is higher, play sound
        if (lastParticipantCount > 0 && currentCount > lastParticipantCount) {
            const newParticipants = currentCount - lastParticipantCount;
            console.log(`🎉 ${newParticipants} new participant(s) detected!`);
            playNotificationSound();
        }
        
        // Update the count
        lastParticipantCount = currentCount;
    }
}

function resetInactivityTimer() {
    clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(() => {
        // Get current active section
        const activeSection = document.querySelector('.content-section.active');
        if (activeSection) {
            const sectionId = activeSection.id;
            console.log('Auto-refreshing section:', sectionId);
            
            // Refresh data for current section
            switch(sectionId) {
                case 'summer-classes':
                    loadSummerAttendanceData();
                    loadSummerStats();
                    break;
                case 'newsletter':
                    if (document.getElementById('subscribersTableBody')) {
                        loadSubscribers();
                    }
                    break;
                case 'classes':
                    loadClassesList();
                    break;
                case 'schedule':
                    loadScheduleData();
                    break;
                case 'reservations':
                    loadReservationsList();
                    break;
                case 'gallery':
                    loadGalleryImages();
                    break;
                case 'videos':
                    loadVideosList();
                    break;
                case 'blog':
                    loadBlogPosts();
                    break;
                case 'sections':
                    loadSections();
                    break;
            }
        }
    }, INACTIVITY_TIME);
}

// Track user activity
function initActivityTracking() {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
        document.addEventListener(event, resetInactivityTimer, true);
    });
    
    // Start the timer
    resetInactivityTimer();
}

// DOM loaded - TEK BİR DOMContentLoaded EVENT
document.addEventListener('DOMContentLoaded', function() {
    
    // Initialize auto-refresh
    initActivityTracking();
    
    // Mobile menu toggle
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    
    if (mobileMenuToggle) {
        console.log('Mobile menu toggle found, adding event listener'); // DEBUG
        mobileMenuToggle.addEventListener('click', function() {
            console.log('Mobile menu toggle clicked'); // DEBUG
            sidebar.classList.toggle('active');
            sidebarOverlay.classList.toggle('active');
            this.classList.toggle('active');
            
            // Update aria attributes for accessibility
            const isActive = sidebar.classList.contains('active');
            this.setAttribute('aria-expanded', isActive.toString());
        });
    } else {
        console.log('Mobile menu toggle not found!'); // DEBUG
    }
    
    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', function() {
            closeMobileMenu();
        });
    }
    
    // Navigation system
    document.querySelectorAll('.nav-link').forEach(link => {
        console.log('Adding event listener to nav-link:', link.getAttribute('data-section')); // DEBUG
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Get section from data-section attribute
            const section = this.getAttribute('data-section');
            console.log('Nav-link clicked, section:', section); // Debug
            
            if (section) {
                showSection(section);
                
                // Update active nav link
                document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
                this.classList.add('active');
                
                // Close mobile menu after navigation - FORCE CLOSE
                closeMobileMenu();
                
                // showSection function will handle data loading
            }
        });
    });
    
    // Initialize default section
    setTimeout(() => {
        showSection('summer-classes');
        // Initialize participant count after initial load
        setTimeout(() => {
            if (currentSummerData && Array.isArray(currentSummerData)) {
                lastParticipantCount = currentSummerData.length;
                console.log('Initial participant count set:', lastParticipantCount);
            }
        }, 2000);
    }, 500);
    
    // Initialize sections if elements exist
    if (document.getElementById('sections')) {
        loadSections();
    }
    
    // Initialize section toggles based on current page
    setTimeout(() => {
        // Load toggle states for all sections that have toggles
        const sectionsWithToggles = ['classes', 'gallery', 'videos', 'community', 'blog', 'newsletter', 'about', 'reservation'];
        sectionsWithToggles.forEach(section => {
            loadSectionToggleState(section);
        });
    }, 1000);
    
    // Logo upload - DOMContentLoaded içine ekleyin
    const logoUpload = document.getElementById('logoUpload');
    const logoInput = document.getElementById('logoInput');

    if (logoUpload && logoInput) {
        console.log('Logo upload elements found!'); // Debug
        
        logoUpload.addEventListener('click', () => {
            logoInput.click();
        });

        logoInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            console.log('Logo file selected:', file); // Debug
            
            if (file && file.type.startsWith('image/')) {
                // FormData oluştur
                const formData = new FormData();
                formData.append('file', file);
                formData.append('folder', 'logo');
                
                try {
                    console.log('Uploading logo to ../api/upload.php'); // Debug
                    
                    // Sunucuya yükle
                    const response = await fetch('../api/upload.php', {
                        method: 'POST',
                        body: formData
                    });
                    
                    const data = await response.json();
                    console.log('Logo upload response:', data); // Debug
                    
                    if (data.success) {
                        // Logo'yu ayarlara kaydet
                        await saveLogo(data.url);
                        displayLogo(data.url);
                        alert('Logo başarıyla güncellendi!');
                    } else {
                        alert('Hata: ' + (data.error || 'Logo yüklenemedi'));
                    }
                } catch (error) {
                    console.error('Logo upload error:', error);
                    alert('Logo yükleme hatası: ' + error.message);
                }
            } else {
                alert('Lütfen geçerli bir resim dosyası seçin!');
            }
        });
    } else {
        console.error('Logo upload elements not found!'); // Debug
    }

    // Profile image upload - YENİ EKLENDİ
    const profileImageUpload = document.getElementById('profileImageUpload');
    const profileImageInput = document.getElementById('profileImageInput');

    if (profileImageUpload && profileImageInput) {
        console.log('Profile image elements found!'); // Debug
        
        profileImageUpload.addEventListener('click', () => {
            profileImageInput.click();
        });

        profileImageInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            console.log('Profile image file selected:', file); // Debug
            
            if (file && file.type.startsWith('image/')) {
                // FormData oluştur
                const formData = new FormData();
                formData.append('file', file);
                formData.append('folder', 'profile');
                
                try {
                    console.log('Uploading profile image to ../api/upload.php'); // Debug
                    
                    // Sunucuya yükle
                    const response = await fetch('../api/upload.php', {
                        method: 'POST',
                        body: formData
                    });
                    
                    const data = await response.json();
                    console.log('Profile image upload response:', data); // Debug
                    
                    if (data.success) {
                        // Profil resmini ayarlara kaydet
                        await saveProfileImage(data.url);
                        displayProfileImage(data.url);
                        alert('Profil resmi başarıyla güncellendi!');
                    } else {
                        alert('Hata: ' + (data.error || 'Profil resmi yüklenemedi'));
                    }
                } catch (error) {
                    console.error('Profile image upload error:', error);
                    alert('Profil resmi yükleme hatası: ' + error.message);
                }
            } else {
                alert('Lütfen geçerli bir resim dosyası seçin!');
            }
        });
    } else {
        console.error('Profile image elements not found!'); // Debug
    }

    // Mevcut profil resmini yükle
    loadProfileImage();
	
    // Special fix for classes, schedule, reservations mobile menu closing
    const problematicSections = ['classes', 'schedule', 'reservations'];
    problematicSections.forEach(sectionName => {
        const link = document.querySelector(`[data-section="${sectionName}"]`);
        if (link) {
            link.addEventListener('click', function(e) {
                console.log(`Force closing menu for ${sectionName}`); // DEBUG
                setTimeout(() => {
                    closeMobileMenu();
                }, 100); // Delay to ensure it works
            });
        }
    });
    
    // Dashboard'u default aktif yap
    const dashboardLink = document.querySelector('.nav-link[data-section="dashboard"]');
    const dashboardSection = document.getElementById('dashboard');
    
    if (dashboardLink && dashboardSection) {
        dashboardLink.classList.add('active');
        dashboardSection.classList.add('active');
    }

    // Modal functions
    window.showModal = function(modalId) {
        document.getElementById(modalId).classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent body scroll on mobile
    }

    window.closeModal = function(modalId) {
        document.getElementById(modalId).classList.remove('active');
        document.body.style.overflow = ''; // Restore body scroll
        
        // Eğer class modal ise formu resetle
        if (modalId === 'classModal') {
            const form = document.querySelector('#classModal form');
            form.reset();
            form.removeAttribute('data-edit-id');
            document.querySelector('#classModal .modal-title').textContent = 'Yeni Ders Ekle';
            document.querySelector('#classModal button[type="submit"]').textContent = 'Ders Ekle';
        }
    }

    // Close modal on outside click
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.remove('active');
                document.body.style.overflow = ''; // Restore body scroll
            }
        });
    });

    // Image upload (galeri için)
    const imageUploadArea = document.getElementById('imageUploadArea');
    const imageInput = document.getElementById('imageInput');

    if (imageUploadArea && imageInput) {
        imageUploadArea.addEventListener('click', () => {
            imageInput.click();
        });

        // Touch events for mobile
        let touchStartY = 0;
        
        imageUploadArea.addEventListener('touchstart', (e) => {
            touchStartY = e.touches[0].clientY;
        });

        imageUploadArea.addEventListener('touchend', (e) => {
            const touchEndY = e.changedTouches[0].clientY;
            if (Math.abs(touchEndY - touchStartY) < 10) {
                imageInput.click();
            }
        });

        imageUploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            imageUploadArea.style.background = '#e3e8ef';
        });

        imageUploadArea.addEventListener('dragleave', () => {
            imageUploadArea.style.background = '#f8f9fa';
        });

        imageUploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            imageUploadArea.style.background = '#f8f9fa';
            handleImageFiles(e.dataTransfer.files);
        });

        imageInput.addEventListener('change', (e) => {
            handleImageFiles(e.target.files);
        });
    }

    // Hero image upload - DÜZELTİLDİ
    const heroImageUpload = document.getElementById('heroImageUpload');
    const heroImageInput = document.getElementById('heroImageInput');

    if (heroImageUpload && heroImageInput) {
        console.log('Hero image elements found!'); // Debug
        
        heroImageUpload.addEventListener('click', () => {
            heroImageInput.click();
        });

        heroImageInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            console.log('File selected:', file); // Debug
            
            if (file && file.type.startsWith('image/')) {
                // FormData oluştur
                const formData = new FormData();
                formData.append('file', file);
                formData.append('folder', 'hero');
                
                try {
                    console.log('Uploading to ../api/upload.php'); // Debug
                    
                    // Sunucuya yükle
                    const response = await fetch('../api/upload.php', {
                        method: 'POST',
                        body: formData
                    });
                    
                    const data = await response.json();
                    console.log('Upload response:', data); // Debug
                    
                    if (data.success) {
                        // Hero image'i ayarlara kaydet
                        await saveHeroImage(data.url);
                        displayHeroImage(data.url);
                        alert('Hero resmi başarıyla güncellendi!');
                    } else {
                        alert('Hata: ' + (data.error || 'Resim yüklenemedi'));
                    }
                } catch (error) {
                    console.error('Upload error:', error);
                    alert('Yükleme hatası: ' + error.message);
                }
            } else {
                alert('Lütfen geçerli bir resim dosyası seçin!');
            }
        });
    } else {
        console.error('Hero image elements not found!'); // Debug
    }

    // Form submissions - classModal
    const classModal = document.getElementById('classModal');
    if (classModal) {
        const form = classModal.querySelector('form');
        if (form) {
            form.addEventListener('submit', async function(e) {
                e.preventDefault();
                
                // Eğer data-edit-id varsa güncelleme, yoksa yeni ekleme
                const editId = this.getAttribute('data-edit-id');
                
                const classData = {
                    name: this.querySelector('input[name="name"]').value,
                    description: this.querySelector('textarea[name="description"]').value,
                    level: this.querySelector('select[name="level"]').value,
                    duration: parseInt(this.querySelector('input[name="duration"]').value),
                    capacity: parseInt(this.querySelector('input[name="capacity"]').value)
                };
                
                // ID varsa ekle
                if (editId) {
                    classData.id = editId;
                }
                
                try {
                    // Her zaman POST kullan, ID varsa güncelleme yapacak
                    const response = await apiRequest('../api/classes.php', 'POST', classData);
                    
                    if (response.success) {
                        alert(editId ? 'Ders başarıyla güncellendi!' : 'Ders başarıyla eklendi!');
                        closeModal('classModal');
                        this.reset();
                        this.removeAttribute('data-edit-id');
                        
                        // Modal başlığını ve butonu sıfırla
                        document.querySelector('#classModal .modal-title').textContent = 'Yeni Ders Ekle';
                        document.querySelector('#classModal button[type="submit"]').textContent = 'Ders Ekle';
                        
                        loadClasses();
                    } else {
                        alert('Hata: ' + (response.error || 'İşlem başarısız'));
                    }
                } catch (error) {
                    console.error('Error:', error);
                    alert('Bir hata oluştu!');
                }
            });
        }
    }

    // Blog modal
    const blogModal = document.getElementById('blogModal');
    if (blogModal) {
        const form = blogModal.querySelector('form');
        if (form) {
            form.addEventListener('submit', function(e) {
                e.preventDefault();
                
                const formData = new FormData(this);
                const blogData = {
                    title: formData.get('title'),
                    category: formData.get('category'),
                    content: formData.get('content'),
                    date: new Date(),
                    status: 'published'
                };
                
                appData.blog.push(blogData);
                closeModal('blogModal');
                this.reset();
                
                alert('Blog yazısı başarıyla yayınlandı!');
            });
        }
    }

    // Load existing data
    loadData();
    
    // Ayarları yükle - DÜZELTİLDİ
    loadCurrentSettings();
    
    // Mevcut hero images'ları yükle - CAROUSEL
    if (document.getElementById('heroImagesList')) {
        loadHeroImages();
    }
	
	// Mevcut logo'yu yükle
    loadLogo();

    // Auto-save every 30 seconds
    setInterval(saveData, 30000);

    // Sayfa yüklendiğinde dersleri yükle
    if (document.getElementById('classesTableBody')) {
        loadClasses();
    }
    
    // Dashboard removed
    
    // Galeri resimlerini yükle
    loadGalleryImages();
    
    // Blog yazılarını yükle
    loadBlogPosts();
    
    // Rezervasyonları yükle
    loadReservations();
    
    // Programı yükle
    loadSchedule();
    
    // Hero Carousel Upload - DOMContentLoaded içine taşındı
    const heroCarouselUpload = document.getElementById('heroCarouselUpload');
    const heroCarouselInput = document.getElementById('heroCarouselInput');

    if (heroCarouselUpload && heroCarouselInput) {
        heroCarouselUpload.addEventListener('click', () => {
            heroCarouselInput.click();
        });

        heroCarouselInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            
            if (file && file.type.startsWith('image/')) {
                const formData = new FormData();
                formData.append('file', file);
                formData.append('folder', 'hero');
                
                try {
                    // Resmi yükle
                    const uploadResponse = await fetch('../api/upload.php', {
                        method: 'POST',
                        body: formData
                    });
                    
                    const uploadData = await uploadResponse.json();
                    
                    if (uploadData.success) {
                        // Hero images tablosuna ekle
                        const response = await fetch('../api/hero_images.php', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                image_url: uploadData.url,
                                title: file.name
                            })
                        });
                        
                        const data = await response.json();
                        
                        if (data.success) {
                            alert('Hero resmi başarıyla eklendi!');
                            loadHeroImages();
                        } else {
                            alert('Hata: ' + (data.error || 'Hero resmi eklenemedi'));
                        }
                    } else {
                        alert('Hata: ' + (uploadData.error || 'Resim yüklenemedi'));
                    }
                } catch (error) {
                    console.error('Hero carousel upload error:', error);
                    alert('Resim yükleme hatası!');
                }
            } else {
                alert('Lütfen geçerli bir resim dosyası seçin!');
            }
        });
    }
    
    // Form Event Listeners
    
    // Gallery Upload Form
    const galleryUploadForm = document.getElementById('galleryUploadForm');
    const galleryUploadArea = document.getElementById('galleryUploadArea');
    const galleryImageInput = document.getElementById('galleryImageInput');
    
    // Gallery drag & drop ve click events
    if (galleryUploadArea && galleryImageInput) {
        galleryUploadArea.addEventListener('click', () => {
            galleryImageInput.click();
        });

        galleryUploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            galleryUploadArea.style.background = '#e3e8ef';
        });

        galleryUploadArea.addEventListener('dragleave', () => {
            galleryUploadArea.style.background = '#f8f9fa';
        });

        galleryUploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            galleryUploadArea.style.background = '#f8f9fa';
            
            if (e.dataTransfer.files.length > 0) {
                galleryImageInput.files = e.dataTransfer.files;
                // Otomatik yükleme başlat
                uploadGalleryImage(e.dataTransfer.files[0]);
            }
        });

        galleryImageInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                // Otomatik yükleme başlat
                uploadGalleryImage(e.target.files[0]);
            }
        });
    }

    // Otomatik galeri yükleme fonksiyonu
    async function uploadGalleryImage(file) {
        const titleInput = document.getElementById('galleryTitle');
        
        if (!file) {
            alert('Lütfen bir resim seçin!');
            return;
        }

        // Upload area'ya yükleme durumu göster
        galleryUploadArea.innerHTML = `
            <div class="upload-icon">📤</div>
            <p>Yükleniyor...</p>
        `;

        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', 'gallery');
        formData.append('title', titleInput.value || '');

        try {
            const response = await fetch('../api/gallery.php', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                alert('Resim başarıyla yüklendi!');
                titleInput.value = ''; // Başlığı temizle
                loadGalleryImages();
                // Dashboard removed
                
                // Upload area'yı normale döndür
                galleryUploadArea.innerHTML = `
                    <div class="upload-icon">🖼️</div>
                    <p>Resimleri buraya sürükleyin veya tıklayın</p>
                `;
            } else {
                alert('Hata: ' + (data.error || 'Resim yüklenemedi'));
                // Upload area'yı normale döndür
                galleryUploadArea.innerHTML = `
                    <div class="upload-icon">🖼️</div>
                    <p>Resimleri buraya sürükleyin veya tıklayın</p>
                `;
            }
        } catch (error) {
            console.error('Gallery upload error:', error);
            alert('Yükleme sırasında hata oluştu!');
            // Upload area'yı normale döndür
            galleryUploadArea.innerHTML = `
                <div class="upload-icon">🖼️</div>
                <p>Resimleri buraya sürükleyin veya tıklayın</p>
            `;
        }
    }
    
    if (galleryUploadForm) {
        galleryUploadForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const fileInput = document.getElementById('galleryImageInput');
            const titleInput = document.getElementById('galleryTitle');
            
            if (!fileInput.files.length) {
                alert('Lütfen bir resim seçin!');
                return;
            }
            
            const formData = new FormData();
            formData.append('file', fileInput.files[0]);
            formData.append('folder', 'gallery');
            formData.append('title', titleInput.value);
            
            try {
                const response = await fetch('../api/gallery.php', {
                    method: 'POST',
                    body: formData
                });
                
                const data = await response.json();
                
                if (data.success) {
                    alert('Resim başarıyla yüklendi!');
                    galleryUploadForm.reset();
                    loadGalleryImages();
                    // Dashboard removed
                } else {
                    alert('Hata: ' + (data.error || 'Resim yüklenemedi'));
                }
            } catch (error) {
                console.error('Gallery upload error:', error);
                alert('Yükleme sırasında hata oluştu!');
            }
        });
    }
    
    // About Form
    const aboutForm = document.getElementById('aboutForm');
    if (aboutForm) {
        aboutForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const aboutData = {
                title: document.getElementById('aboutTitle').value,
                content: document.getElementById('aboutContent').value
            };
            
            try {
                const response = await fetch('../api/site_content.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        section: 'about',
                        content: aboutData
                    })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    alert('Hakkımızda bölümü güncellendi!');
                } else {
                    alert('Hata: ' + (result.error || 'Güncelleme başarısız'));
                }
            } catch (error) {
                console.error('About update error:', error);
                alert('Güncelleme sırasında hata oluştu!');
            }
        });
    }
    
    // Blog Form
    const blogForm = document.getElementById('blogForm');
    if (blogForm) {
        blogForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const blogData = {
                title: document.getElementById('blogTitle').value,
                category: document.getElementById('blogCategory').value,
                excerpt: document.getElementById('blogExcerpt').value,
                content: document.getElementById('blogContent').value
            };
            
            try {
                const response = await fetch('../api/blog.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(blogData)
                });
                
                const data = await response.json();
                
                if (data.success) {
                    alert('Blog yazısı başarıyla yayınlandı!');
                    closeModal('blogModal');
                    blogForm.reset();
                    loadBlogPosts();
                } else {
                    alert('Hata: ' + (data.error || 'Blog yazısı yayınlanamadı'));
                }
            } catch (error) {
                console.error('Blog post error:', error);
                alert('Yayınlama sırasında hata oluştu!');
            }
        });
    }
    
    // Schedule Form
    const scheduleForm = document.getElementById('scheduleForm');
    if (scheduleForm) {
        scheduleForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const scheduleData = {
                day: document.getElementById('scheduleDay').value,
                time: document.getElementById('scheduleTime').value,
                class_id: document.getElementById('scheduleClass').value
            };
            
            try {
                const response = await fetch('../api/schedule.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(scheduleData)
                });
                
                const data = await response.json();
                
                if (data.success) {
                    alert('Program başarıyla eklendi!');
                    scheduleForm.reset();
                    loadSchedule();
                } else {
                    alert('Hata: ' + (data.error || 'Program eklenemedi'));
                }
            } catch (error) {
                console.error('Schedule error:', error);
                alert('Program ekleme sırasında hata oluştu!');
            }
        });
    }
    
    // Reservation Form
    const reservationForm = document.getElementById('reservationForm');
    if (reservationForm) {
        reservationForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const reservationData = {
                customer_name: document.getElementById('customerName').value,
                email: document.getElementById('customerEmail').value,
                phone: document.getElementById('customerPhone').value,
                class_id: document.getElementById('reservationClass').value,
                date: document.getElementById('reservationDate').value,
                time: document.getElementById('reservationTime').value,
                notes: document.getElementById('reservationNotes').value
            };
            
            try {
                const response = await fetch('../api/reservations.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(reservationData)
                });
                
                const data = await response.json();
                
                if (data.success) {
                    alert('Rezervasyon başarıyla oluşturuldu!');
                    closeModal('reservationModal');
                    reservationForm.reset();
                    loadReservations();
                    // Dashboard removed
                } else {
                    alert('Hata: ' + (data.error || 'Rezervasyon oluşturulamadı'));
                }
            } catch (error) {
                console.error('Reservation error:', error);
                alert('Rezervasyon oluşturma sırasında hata oluştu!');
            }
        });
    }
    
    // Load classes for schedule and reservation forms
    loadClassesForForms();
});

// Logo'yu kaydet
async function saveLogo(imageUrl) {
    try {
        const response = await fetch('../api/settings.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                key: 'site_logo',
                value: imageUrl
            })
        });
        
        const data = await response.json();
        console.log('Logo saved:', data); // Debug
        return data;
    } catch (error) {
        console.error('Logo save error:', error);
        throw error;
    }
}

// Logo'yu yükle ve göster
async function loadLogo() {
    try {
        const response = await fetch('../api/settings.php?key=site_logo');
        const data = await response.json();
        console.log('Loaded logo:', data); // Debug
        
        if (data && data.setting_value) {
            displayLogo(data.setting_value);
        }
    } catch (error) {
        console.error('Logo load error:', error);
    }
}

// Logo'yu göster
function displayLogo(imageUrl) {
    const currentLogo = document.getElementById('currentLogo');
    const logoUpload = document.getElementById('logoUpload');
    
    console.log('Displaying logo:', imageUrl); // Debug
    
    if (imageUrl && currentLogo && logoUpload) {
        currentLogo.style.display = 'block';
        const img = currentLogo.querySelector('img');
        if (img) {
            img.src = imageUrl;
        }
        logoUpload.style.display = 'none';
    } else if (currentLogo && logoUpload) {
        currentLogo.style.display = 'none';
        logoUpload.style.display = 'block';
    }
}

// Logo'yu kaldır
async function removeLogo() {
    if (confirm('Logoyu kaldırmak istediğinize emin misiniz?')) {
        try {
            // Ayarlardan kaldır
            await fetch('../api/settings.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    key: 'site_logo',
                    value: ''
                })
            });
            
            displayLogo(null);
            alert('Logo kaldırıldı!');
        } catch (error) {
            console.error('Logo remove error:', error);
            alert('Logo kaldırılırken hata oluştu!');
        }
    }
}

// Profil resmini kaydet
async function saveProfileImage(imageUrl) {
    try {
        const response = await fetch('../api/settings.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                key: 'profile_image',
                value: imageUrl
            })
        });
        
        const data = await response.json();
        console.log('Profile image saved:', data); // Debug
        return data;
    } catch (error) {
        console.error('Profile image save error:', error);
        throw error;
    }
}

// Profil resmini yükle ve göster
async function loadProfileImage() {
    try {
        const response = await fetch('../api/settings.php?key=profile_image');
        const data = await response.json();
        console.log('Loaded profile image:', data); // Debug
        
        if (data && data.setting_value) {
            displayProfileImage(data.setting_value);
        }
    } catch (error) {
        console.error('Profile image load error:', error);
    }
}

// Profil resmini göster
function displayProfileImage(imageUrl) {
    const currentProfileImage = document.getElementById('currentProfileImage');
    const profileImageUpload = document.getElementById('profileImageUpload');
    
    console.log('Displaying profile image:', imageUrl); // Debug
    
    if (imageUrl && currentProfileImage && profileImageUpload) {
        currentProfileImage.style.display = 'block';
        const img = currentProfileImage.querySelector('img');
        if (img) {
            img.src = imageUrl;
        }
        profileImageUpload.style.display = 'none';
    } else if (currentProfileImage && profileImageUpload) {
        currentProfileImage.style.display = 'none';
        profileImageUpload.style.display = 'block';
    }
}

// Profil resmini kaldır
async function removeProfileImage() {
    if (confirm('Profil resmini kaldırmak istediğinize emin misiniz?')) {
        try {
            // Ayarlardan kaldır
            await fetch('../api/settings.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    key: 'profile_image',
                    value: ''
                })
            });
            
            displayProfileImage(null);
            alert('Profil resmi kaldırıldı!');
        } catch (error) {
            console.error('Profile image remove error:', error);
            alert('Profil resmi kaldırılırken hata oluştu!');
        }
    }
}

// Global fonksiyon yap
window.removeProfileImage = removeProfileImage;
window.removeLogo = removeLogo;

// Hero image'i kaydet - DÜZELTİLDİ
async function saveHeroImage(imageUrl) {
    try {
        const response = await fetch('../api/settings.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                key: 'hero_image',
                value: imageUrl
            })
        });
        
        const data = await response.json();
        console.log('Hero image saved:', data); // Debug
        return data;
    } catch (error) {
        console.error('Hero image save error:', error);
        throw error;
    }
}

// Hero image'i yükle ve göster - DÜZELTİLDİ
async function loadHeroImage() {
    try {
        const response = await fetch('../api/settings.php?key=hero_image');
        const data = await response.json();
        console.log('Loaded hero image:', data); // Debug
        
        if (data && data.setting_value) {
            displayHeroImage(data.setting_value);
        }
    } catch (error) {
        console.error('Hero image load error:', error);
    }
}

// Hero image'i göster - DÜZELTİLDİ
function displayHeroImage(imageUrl) {
    const currentHeroImage = document.getElementById('currentHeroImage');
    const heroImageUpload = document.getElementById('heroImageUpload');
    
    console.log('Displaying hero image:', imageUrl); // Debug
    
    if (imageUrl && currentHeroImage && heroImageUpload) {
        currentHeroImage.style.display = 'block';
        const img = currentHeroImage.querySelector('img');
        if (img) {
            img.src = imageUrl;
        }
        heroImageUpload.style.display = 'none';
    } else if (currentHeroImage && heroImageUpload) {
        currentHeroImage.style.display = 'none';
        heroImageUpload.style.display = 'block';
    }
}

// Hero image'i kaldır - DÜZELTİLDİ
async function removeHeroImage() {
    if (confirm('Hero resmini kaldırmak istediğinize emin misiniz?')) {
        try {
            // Ayarlardan kaldır
            await fetch('../api/settings.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    key: 'hero_image',
                    value: ''
                })
            });
            
            displayHeroImage(null);
            alert('Hero resmi kaldırıldı!');
        } catch (error) {
            console.error('Remove error:', error);
            alert('Resim kaldırılırken hata oluştu!');
        }
    }
}

// Dersleri yükle
async function loadClasses() {
    try {
        const response = await apiRequest('../api/classes.php', 'GET');
        
        if (Array.isArray(response)) {
            const tbody = document.getElementById('classesTableBody');
            const mobileContainer = document.getElementById('classesTableMobile');
            
            if (tbody) {
                tbody.innerHTML = response.map(cls => `
                    <tr>
                        <td>${cls.name}</td>
                        <td class="hide-mobile">${cls.level}</td>
                        <td class="hide-mobile">${cls.duration} dakika</td>
                        <td class="hide-mobile">${cls.capacity} kişi</td>
                        <td>
                            <div class="action-buttons">
                                <button class="btn btn-secondary btn-sm" onclick="editClass(${cls.id})">Düzenle</button>
                                <button class="btn btn-danger btn-sm" onclick="deleteClass(${cls.id})">Sil</button>
                            </div>
                        </td>
                    </tr>
                `).join('');
            }
            
            // Mobile card layout
            if (mobileContainer) {
                mobileContainer.innerHTML = response.map(cls => `
                    <div class="lesson-card">
                        <div class="lesson-card-header">
                            <h3 class="lesson-card-title">${cls.name}</h3>
                        </div>
                        <div class="lesson-card-meta">
                            <div class="lesson-meta-item">
                                <span class="lesson-meta-label">Seviye</span>
                                <span class="lesson-meta-value">${cls.level}</span>
                            </div>
                            <div class="lesson-meta-item">
                                <span class="lesson-meta-label">Süre</span>
                                <span class="lesson-meta-value">${cls.duration} dakika</span>
                            </div>
                            <div class="lesson-meta-item">
                                <span class="lesson-meta-label">Kapasite</span>
                                <span class="lesson-meta-value">${cls.capacity} kişi</span>
                            </div>
                        </div>
                        <div class="lesson-card-actions">
                            <button class="btn btn-secondary" onclick="editClass(${cls.id})">Düzenle</button>
                            <button class="btn btn-danger" onclick="deleteClass(${cls.id})">Sil</button>
                        </div>
                    </div>
                `).join('');
            }
            
            // Toggle mobile/desktop view based on screen size
            updateClassesDisplay();
        }
    } catch (error) {
        console.error('Load classes error:', error);
    }
}

// Mobile responsive display toggle for classes
function updateClassesDisplay() {
    const isMobile = window.innerWidth <= 768;
    const desktopTable = document.querySelector('.classes-section .data-table');
    const mobileContainer = document.getElementById('classesTableMobile');
    
    if (desktopTable && mobileContainer) {
        if (isMobile) {
            desktopTable.style.display = 'none';
            mobileContainer.style.display = 'block';
            mobileContainer.classList.add('active');
        } else {
            desktopTable.style.display = 'block';
            mobileContainer.style.display = 'none';
            mobileContainer.classList.remove('active');
        }
    }
}

// Add resize event listeners
window.addEventListener('resize', updateClassesDisplay);
window.addEventListener('resize', updateSummerAttendanceDisplay);

// Ders silme fonksiyonunu global yap
window.deleteClass = async function(id) {
    if (confirm('Bu dersi silmek istediğinize emin misiniz?')) {
        try {
            const response = await fetch(`../api/delete-ders.php?id=${id}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            const data = await response.json();
            
            if (data.success) {
                alert('Ders başarıyla silindi!');
                loadClasses(); // Listeyi yenile
            } else {
                alert('Hata: ' + (data.error || 'Ders silinemedi'));
            }
        } catch (error) {
            console.error('Delete error:', error);
            alert('Silme işlemi sırasında hata oluştu!');
        }
    }
}

// Ders düzenleme fonksiyonu
window.editClass = async function(id) {
    try {
        // Önce ders bilgilerini al
        const response = await fetch('../api/classes.php');
        const classes = await response.json();
        const classData = classes.find(c => c.id == id);
        
        if (classData) {
            // Formu doldur
            const modal = document.getElementById('classModal');
            const form = modal.querySelector('form');
            
            form.querySelector('input[name="name"]').value = classData.name;
            form.querySelector('textarea[name="description"]').value = classData.description;
            form.querySelector('select[name="level"]').value = classData.level;
            form.querySelector('input[name="duration"]').value = classData.duration;
            form.querySelector('input[name="capacity"]').value = classData.capacity;
            
            // Form'a edit ID'sini ekle
            form.setAttribute('data-edit-id', id);
            
            // Modal başlığını ve buton metnini değiştir
            modal.querySelector('.modal-title').textContent = 'Ders Düzenle';
            modal.querySelector('button[type="submit"]').textContent = 'Güncelle';
            
            // Modalı aç
            showModal('classModal');
        }
    } catch (error) {
        console.error('Edit error:', error);
        alert('Ders bilgileri alınamadı!');
    }
}

// Functions
function handleImageFiles(files) {
    const galleryGrid = document.getElementById('galleryGrid');
    
    Array.from(files).forEach(file => {
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const mediaItem = document.createElement('div');
                mediaItem.className = 'media-item';
                mediaItem.innerHTML = `
                    <div class="media-preview" style="background-image: url('${e.target.result}'); background-size: cover; background-position: center;"></div>
                    <div class="media-info">
                        <div class="media-name">${file.name}</div>
                        <div class="media-date">${new Date().toLocaleDateString('tr-TR')}</div>
                    </div>
                `;
                galleryGrid.appendChild(mediaItem);
                
                // Store in appData
                appData.gallery.push({
                    name: file.name,
                    url: e.target.result,
                    date: new Date()
                });
            };
            reader.readAsDataURL(file);
        }
    });
}

function updateClassesTable() {
    const tbody = document.getElementById('classesTableBody');
    if (tbody) {
        tbody.innerHTML = appData.classes.map(cls => `
            <tr>
                <td>${cls.name}</td>
                <td class="hide-mobile">${cls.level}</td>
                <td class="hide-mobile">${cls.duration} dakika</td>
                <td class="hide-mobile">${cls.capacity} kişi</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-secondary btn-sm">Düzenle</button>
                        <button class="btn btn-danger btn-sm">Sil</button>
                    </div>
                </td>
            </tr>
        `).join('');
    }
}

// Sayfa yüklendiğinde mevcut ayarları yükle - DÜZELTİLDİ
async function loadCurrentSettings() {
    try {
        const response = await fetch('../api/settings.php');
        const settings = await response.json();
        
        console.log('Yüklenen ayarlar:', settings);
        
        if (settings) {
            // Form alanlarını doldur - null kontrolü ekle
            const nameField = document.getElementById('settingsName');
            const emailField = document.getElementById('settingsEmail');
            const phoneField = document.getElementById('settingsPhone');
            const aboutField = document.getElementById('settingsAbout');
            const siteTitleField = document.getElementById('settingsSiteTitle');
            const instagramField = document.getElementById('settingsInstagram');
            const facebookField = document.getElementById('settingsFacebook');
            const youtubeField = document.getElementById('settingsYoutube');
            
            if (settings.name && nameField) nameField.value = settings.name;
            if (settings.email && emailField) emailField.value = settings.email;
            if (settings.phone && phoneField) phoneField.value = settings.phone;
            if (settings.about && aboutField) aboutField.value = settings.about;
            if (settings.site_title && siteTitleField) siteTitleField.value = settings.site_title;
            if (settings.instagram && instagramField) instagramField.value = settings.instagram;
            if (settings.facebook && facebookField) facebookField.value = settings.facebook;
            if (settings.youtube && youtubeField) youtubeField.value = settings.youtube;
        }
    } catch (error) {
        console.error('Ayarlar yüklenemedi:', error);
    }
}

// Tüm ayarları kaydet - DÜZELTİLDİ
async function saveAllSettings() {
    try {
        // Form verilerini topla
        const settings = {};
        
        // Her alanı kontrol et ve sadece dolu olanları ekle
        const nameField = document.getElementById('settingsName');
        const emailField = document.getElementById('settingsEmail');
        const phoneField = document.getElementById('settingsPhone');
        const aboutField = document.getElementById('settingsAbout');
        const siteTitleField = document.getElementById('settingsSiteTitle');
        const instagramField = document.getElementById('settingsInstagram');
        const facebookField = document.getElementById('settingsFacebook');
        const youtubeField = document.getElementById('settingsYoutube');
        
        if (nameField && nameField.value.trim()) {
            settings.name = nameField.value.trim();
        }
        if (emailField && emailField.value.trim()) {
            settings.email = emailField.value.trim();
        }
        if (phoneField && phoneField.value.trim()) {
            settings.phone = phoneField.value.trim();
        }
        if (aboutField && aboutField.value.trim()) {
            settings.about = aboutField.value.trim();
        }
        if (siteTitleField && siteTitleField.value.trim()) {
            settings.site_title = siteTitleField.value.trim();
        }
        if (instagramField && instagramField.value.trim()) {
            settings.instagram = instagramField.value.trim();
        }
        if (facebookField && facebookField.value.trim()) {
            settings.facebook = facebookField.value.trim();
        }
        if (youtubeField && youtubeField.value.trim()) {
            settings.youtube = youtubeField.value.trim();
        }

        console.log('Kaydedilecek ayarlar:', settings);

        // Boş ayarlar kontrolü
        if (Object.keys(settings).length === 0) {
            alert('Kaydedilecek hiçbir ayar bulunamadı!');
            return;
        }

        // API'ye gönder
        const response = await fetch('../api/settings.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json; charset=utf-8'
            },
            body: JSON.stringify({
                settings: settings
            })
        });

        // Response'u kontrol et
        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log('API yanıtı:', data);

        if (data.success) {
            alert('Tüm ayarlar başarıyla kaydedildi!');
        } else {
            alert('Hata: ' + (data.error || 'Ayarlar kaydedilemedi'));
        }
    } catch (error) {
        console.error('Kaydetme hatası:', error);
        alert('Kaydetme sırasında hata oluştu: ' + error.message);
    }
}

function saveSiteSettings() {
    // Site ayarları kaydetme devre dışı - RONIT YOGA sabit kalacak
    // const siteTitleInput = document.querySelector('input[value="Ronit Yoga Studio"]');
    // if (siteTitleInput) {
    //     const siteTitle = siteTitleInput.value;
    //     localStorage.setItem('yogaSiteTitle', siteTitle);
    //     alert('Site ayarları başarıyla kaydedildi!');
    // }
}

// Save data to localStorage
function saveData() {
    localStorage.setItem('yogaStudioData', JSON.stringify(appData));
}

// Load data from localStorage
function loadData() {
    const savedData = localStorage.getItem('yogaStudioData');
    if (savedData) {
        appData = JSON.parse(savedData);
        updateClassesTable();
    }
}

// Handle window resize
let resizeTimer;
window.addEventListener('resize', function() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function() {
        // Eğer masaüstü boyutuna geçtiyse mobile menüyü kapat
        if (window.innerWidth > 768) {
            const sidebar = document.getElementById('sidebar');
            const sidebarOverlay = document.getElementById('sidebarOverlay');
            const mobileMenuToggle = document.getElementById('mobileMenuToggle');
            
            if (sidebar) sidebar.classList.remove('active');
            if (sidebarOverlay) sidebarOverlay.classList.remove('active');
            if (mobileMenuToggle) mobileMenuToggle.classList.remove('active');
            document.body.style.overflow = '';
        }
    }, 250);
});
// Hero resimlerini yükle
async function loadHeroImages() {
    try {
        const response = await fetch('../api/hero_images.php');
        const images = await response.json();
        
        const container = document.getElementById('heroImagesList');
        if (container && Array.isArray(images)) {
            container.innerHTML = images.map((img, index) => `
                <div class="hero-image-item">
                    <img src="${img.image_url}" alt="${img.title || 'Hero Image'}">
                    <div class="hero-image-order">Sıra: ${index + 1}</div>
                    <div class="hero-image-actions">
                        <button onclick="moveHeroImage(${img.id}, 'up')">↑</button>
                        <button onclick="moveHeroImage(${img.id}, 'down')">↓</button>
                        <button onclick="deleteHeroImage(${img.id})" style="background: #e74c3c; color: white;">Sil</button>
                    </div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Load hero images error:', error);
    }
}

// Hero resmini sil
window.deleteHeroImage = async function(id) {
    if (confirm('Bu resmi silmek istediğinize emin misiniz?')) {
        try {
            const response = await fetch(`../api/hero_images.php?id=${id}`, {
                method: 'DELETE'
            });
            
            const data = await response.json();
            
            if (data.success) {
                alert('Resim silindi!');
                loadHeroImages();
            } else {
                alert('Hata: ' + (data.error || 'Resim silinemedi'));
            }
        } catch (error) {
            console.error('Delete hero image error:', error);
            alert('Silme işlemi sırasında hata oluştu!');
        }
    }
}

// Hero resim sırasını değiştir (opsiyonel)
window.moveHeroImage = function(id, direction) {
    alert('Sıralama özelliği yakında eklenecek!');
    // Bu özellik için hero_images tablosunda order_index güncellemesi gerekir
}

// ==== DASHBOARD FUNCTIONS ====
async function loadDashboardStats() {
    try {
        // Dersler sayısı
        const classesResponse = await fetch('../api/classes.php');
        const classes = await classesResponse.json();
        const totalClasses = Array.isArray(classes) ? classes.length : 0;
        
        // Rezervasyonlar sayısı
        const reservationsResponse = await fetch('../api/reservations.php');
        const reservations = await reservationsResponse.json();
        const totalReservations = Array.isArray(reservations) ? reservations.length : 0;
        
        // Bu haftaki rezervasyonlar
        const weeklyReservations = Array.isArray(reservations) ? 
            reservations.filter(res => {
                const resDate = new Date(res.date);
                const today = new Date();
                const weekStart = new Date(today.setDate(today.getDate() - today.getDay()));
                return resDate >= weekStart;
            }).length : 0;
        
        // Galeri resimleri
        const galleryResponse = await fetch('../api/gallery.php');
        const galleryImages = await galleryResponse.json();
        const totalGalleryImages = Array.isArray(galleryImages) ? galleryImages.length : 0;
        
        // DOM'u güncelle
        document.getElementById('totalClasses').textContent = totalClasses;
        document.getElementById('totalReservations').textContent = totalReservations;
        document.getElementById('weeklyReservations').textContent = weeklyReservations;
        document.getElementById('totalGalleryImages').textContent = totalGalleryImages;
        
    } catch (error) {
        console.error('Dashboard stats error:', error);
        document.getElementById('totalClasses').textContent = 'Hata';
        document.getElementById('totalReservations').textContent = 'Hata';
        document.getElementById('weeklyReservations').textContent = 'Hata';
        document.getElementById('totalGalleryImages').textContent = 'Hata';
    }
}

// ==== GALLERY FUNCTIONS ====
async function loadGalleryImages() {
    try {
        const response = await fetch('../api/gallery.php');
        const images = await response.json();
        
        const galleryGrid = document.getElementById('galleryGrid');
        if (galleryGrid && Array.isArray(images)) {
            galleryGrid.innerHTML = images.map(img => `
                <div class="gallery-item">
                    <img src="${img.image_url}" alt="${img.title || 'Galeri Resmi'}">
                    <div class="gallery-info">
                        <div class="gallery-title">${img.title || 'Başlıksız'}</div>
                        <div class="gallery-date">${new Date(img.uploaded_at).toLocaleDateString('tr-TR')}</div>
                    </div>
                    <div class="gallery-actions">
                        <button onclick="deleteGalleryImage(${img.id})" style="background: #e74c3c; color: white;">Sil</button>
                    </div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Gallery load error:', error);
    }
}

window.deleteGalleryImage = async function(id) {
    console.log('Deleting gallery image with ID:', id);
    if (confirm('Bu resmi silmek istediğinize emin misiniz?')) {
        try {
            const response = await fetch(`../api/gallery.php?id=${id}`, {
                method: 'DELETE'
            });
            
            console.log('Delete response status:', response.status);
            const data = await response.json();
            console.log('Delete response data:', data);
            
            if (data.success) {
                alert('Resim silindi!');
                loadGalleryImages();
                // Dashboard removed
            } else {
                alert('Hata: ' + (data.error || 'Resim silinemedi'));
            }
        } catch (error) {
            console.error('Delete gallery image error:', error);
            alert('Silme işlemi sırasında hata oluştu!');
        }
    }
}

// ==== BLOG FUNCTIONS ====
let currentBlogId = null;

async function loadBlogPosts(page = 1) {
    try {
        const search = document.getElementById('blogSearch')?.value || '';
        const category = document.getElementById('blogCategoryFilter')?.value || '';
        const status = document.getElementById('blogStatusFilter')?.value || 'all';
        
        const params = new URLSearchParams({
            page: page,
            search: search,
            category: category,
            status: status
        });
        
        const response = await fetch(`../api/blog.php?${params}`);
        const data = await response.json();
        
        if (data.posts) {
            displayBlogPosts(data.posts);
            createPagination('blogPagination', data.page, data.pages, loadBlogPosts);
        }
    } catch (error) {
        console.error('Blog load error:', error);
        document.getElementById('blogTableBody').innerHTML = 
            '<tr><td colspan="6" style="text-align: center; color: red;">Blog yazıları yüklenirken hata oluştu</td></tr>';
    }
}

function displayBlogPosts(posts) {
    const tbody = document.getElementById('blogTableBody');
    
    if (posts.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Blog yazısı bulunamadı</td></tr>';
        return;
    }
    
    tbody.innerHTML = posts.map(post => {
        const categoryClass = `category-${post.category.toLowerCase().replace(/\s+/g, '-').replace(/ı/g, 'i').replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's').replace(/ö/g, 'o').replace(/ç/g, 'c')}`;
        
        return `
            <tr>
                <td class="blog-title-cell">
                    <strong>${post.title}</strong>
                    ${post.excerpt ? `<br><small style="color: #666;">${post.excerpt.substring(0, 80)}...</small>` : ''}
                </td>
                <td class="hide-mobile">
                    <span class="category-badge ${categoryClass}">${post.category}</span>
                </td>
                <td class="hide-mobile">
                    <span class="status-badge status-${post.status}">
                        ${post.status === 'published' ? 'Yayınlanan' : 
                          post.status === 'draft' ? 'Taslak' : 'Arşivlenen'}
                    </span>
                </td>
                <td class="hide-mobile blog-views">${post.views || 0}</td>
                <td class="hide-mobile">${new Date(post.created_at).toLocaleDateString('tr-TR')}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-small btn-secondary" onclick="editBlogPost(${post.id})">Düzenle</button>
                        <button class="btn-small btn-danger" onclick="deleteBlogPost(${post.id})">Sil</button>
                        <div class="social-share-admin">
                            <button class="share-btn-admin" onclick="shareAdminBlogOnFacebook('${post.title}', '${post.excerpt || ''}')" title="Facebook'ta Paylaş">📘</button>
                            <button class="share-btn-admin" onclick="shareAdminBlogOnTwitter('${post.title}', '${post.excerpt || ''}')" title="Twitter'da Paylaş">🐦</button>
                            <button class="share-btn-admin" onclick="shareAdminBlogOnWhatsApp('${post.title}', '${post.excerpt || ''}')" title="WhatsApp'ta Paylaş">📱</button>
                            <button class="share-btn-admin" onclick="shareAdminBlogOnInstagram('${post.title}', '${post.excerpt || ''}')" title="Instagram için URL Kopyala">📷</button>
                        </div>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function openBlogModal(postId = null) {
    currentBlogId = postId;
    const modal = document.getElementById('blogModal');
    const title = document.getElementById('blogModalTitle');
    
    if (postId) {
        title.textContent = 'Blog Yazısını Düzenle';
        loadBlogPostData(postId);
    } else {
        title.textContent = 'Yeni Blog Yazısı';
        clearBlogForm();
    }
    
    modal.classList.add('active');
}

function closeBlogModal() {
    document.getElementById('blogModal').classList.remove('active');
    clearBlogForm();
    currentBlogId = null;
}

function clearBlogForm() {
    const form = document.getElementById('blogForm');
    form.reset();
    document.getElementById('blogId').value = '';
    document.getElementById('featuredImagePreview').style.display = 'none';
}

async function loadBlogPostData(postId) {
    try {
        const response = await fetch(`../api/blog.php?id=${postId}`);
        const data = await response.json();
        
        if (data.posts && data.posts.length > 0) {
            const post = data.posts[0];
            
            document.getElementById('blogId').value = post.id;
            document.getElementById('blogTitle').value = post.title;
            document.getElementById('blogCategory').value = post.category;
            document.getElementById('blogStatus').value = post.status;
            document.getElementById('blogExcerpt').value = post.excerpt || '';
            document.getElementById('blogFeaturedImage').value = post.featured_image || '';
            document.getElementById('blogContent').value = post.content;
            document.getElementById('blogTags').value = Array.isArray(post.tags) ? post.tags.join(', ') : post.tags || '';
            document.getElementById('blogMetaTitle').value = post.meta_title || '';
            document.getElementById('blogMetaDescription').value = post.meta_description || '';
            
            // Show image preview if exists
            if (post.featured_image) {
                showImagePreview('featuredImagePreview', post.featured_image);
            }
        }
    } catch (error) {
        console.error('Error loading blog post:', error);
    }
}

function editBlogPost(id) {
    openBlogModal(id);
}

async function deleteBlogPost(id) {
    if (confirm('Bu blog yazısını silmek istediğinize emin misiniz?')) {
        try {
            const response = await fetch(`../api/blog.php?id=${id}`, {
                method: 'DELETE'
            });
            
            const data = await response.json();
            
            if (data.success) {
                showNotification('Blog yazısı silindi!', 'success');
                loadBlogPosts();
            } else {
                alert('Hata: ' + (data.error || 'Blog yazısı silinemedi'));
            }
        } catch (error) {
            console.error('Delete blog error:', error);
            alert('Silme işlemi sırasında hata oluştu!');
        }
    }
}

// Blog form submit
document.addEventListener('DOMContentLoaded', function() {
    const blogForm = document.getElementById('blogForm');
    if (blogForm) {
        blogForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            await saveBlogPost();
        });
    }
    
    // Featured image preview
    const featuredImageInput = document.getElementById('blogFeaturedImage');
    if (featuredImageInput) {
        featuredImageInput.addEventListener('input', function() {
            if (this.value) {
                showImagePreview('featuredImagePreview', this.value);
            } else {
                document.getElementById('featuredImagePreview').style.display = 'none';
            }
        });
    }
});

async function saveBlogPost() {
    try {
        const formData = new FormData(document.getElementById('blogForm'));
        const data = {};
        
        // Convert FormData to object
        for (let [key, value] of formData.entries()) {
            data[key] = value;
        }
        
        // Process tags
        if (data.tags) {
            data.tags = data.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
        }
        
        const method = data.id ? 'PUT' : 'POST';
        const response = await fetch('../api/blog.php', {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification(data.id ? 'Blog yazısı güncellendi!' : 'Blog yazısı oluşturuldu!', 'success');
            closeBlogModal();
            loadBlogPosts();
        } else {
            alert('Hata: ' + (result.error || 'Blog yazısı kaydedilemedi'));
        }
    } catch (error) {
        console.error('Save blog error:', error);
        alert('Kaydetme işlemi sırasında hata oluştu!');
    }
}

async function saveBlogDraft() {
    // Set status to draft and save
    document.getElementById('blogStatus').value = 'draft';
    await saveBlogPost();
}

// Blog editor functions
function insertFormatting(type) {
    const textarea = document.getElementById('blogContent');
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    let replacement = '';
    
    switch (type) {
        case 'h2':
            replacement = `<h2>${selectedText || 'Başlık'}</h2>`;
            break;
        case 'h3':
            replacement = `<h3>${selectedText || 'Alt Başlık'}</h3>`;
            break;
        case 'bold':
            replacement = `<strong>${selectedText || 'Kalın metin'}</strong>`;
            break;
        case 'italic':
            replacement = `<em>${selectedText || 'İtalik metin'}</em>`;
            break;
        case 'ul':
            replacement = `<ul>\n<li>${selectedText || 'Liste öğesi'}</li>\n<li>İkinci öğe</li>\n</ul>`;
            break;
        case 'ol':
            replacement = `<ol>\n<li>${selectedText || 'Birinci öğe'}</li>\n<li>İkinci öğe</li>\n</ol>`;
            break;
    }
    
    textarea.value = textarea.value.substring(0, start) + replacement + textarea.value.substring(end);
    textarea.focus();
}

function insertImage() {
    const imageUrl = prompt('Resim URL\'sini girin:');
    if (imageUrl) {
        const textarea = document.getElementById('blogContent');
        const cursorPos = textarea.selectionStart;
        const imageHtml = `<img src="${imageUrl}" alt="Blog resmi" style="max-width: 100%; height: auto; border-radius: 5px; margin: 1rem 0;">`;
        
        textarea.value = textarea.value.substring(0, cursorPos) + imageHtml + textarea.value.substring(cursorPos);
        textarea.focus();
    }
}

function showImagePreview(previewId, imageUrl) {
    const preview = document.getElementById(previewId);
    const img = preview.querySelector('img');
    
    if (img) {
        img.src = imageUrl;
        img.onerror = function() {
            preview.style.display = 'none';
        };
        img.onload = function() {
            preview.style.display = 'block';
        };
    }
}

function openMediaLibrary(targetInputId) {
    // This would open a media library modal in a real implementation
    alert('Medya kütüphanesi özelliği yakında eklenecek. Şimdilik resim URL\'sini manuel olarak girin.');
}

// Blog posts loaded when section is shown

// ==== RESERVATION FUNCTIONS ====
async function loadReservations() {
    try {
        const response = await fetch('../api/reservations.php');
        const reservations = await response.json();
        
        const tbody = document.getElementById('reservationsTableBody');
        if (tbody && Array.isArray(reservations)) {
            tbody.innerHTML = reservations.map(res => `
                <tr>
                    <td>${res.customer_name}</td>
                    <td class="hide-mobile">${res.email}</td>
                    <td class="hide-mobile">${res.phone}</td>
                    <td>${res.class_name}</td>
                    <td class="hide-mobile">${new Date(res.date).toLocaleDateString('tr-TR')}</td>
                    <td><span class="status-badge status-${res.status}">${getStatusText(res.status)}</span></td>
                    <td>
                        <div class="action-buttons">
                            ${res.status === 'pending' ? 
                                `<button class="btn btn-secondary btn-sm" onclick="updateReservationStatus(${res.id}, 'confirmed')">Onayla</button>
                                 <button class="btn btn-danger btn-sm" onclick="updateReservationStatus(${res.id}, 'cancelled')">Reddet</button>` :
                                `<button class="btn btn-secondary btn-sm" onclick="editReservation(${res.id})">Düzenle</button>
                                 <button class="btn btn-danger btn-sm" onclick="deleteReservation(${res.id})">Sil</button>`
                            }
                        </div>
                    </td>
                </tr>
            `).join('');
        }
    } catch (error) {
        console.error('Reservations load error:', error);
    }
}

function getStatusText(status) {
    switch(status) {
        case 'pending': return 'Beklemede';
        case 'confirmed': return 'Onaylandı';
        case 'cancelled': return 'İptal Edildi';
        default: return 'Bilinmeyen';
    }
}

window.updateReservationStatus = async function(id, status) {
    try {
        const response = await fetch('../api/reservations.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                id: id,
                status: status
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('Rezervasyon durumu güncellendi!');
            loadReservations();
            loadDashboardStats();
        } else {
            alert('Hata: ' + (data.error || 'Durum güncellenemedi'));
        }
    } catch (error) {
        console.error('Update reservation error:', error);
        alert('Güncelleme sırasında hata oluştu!');
    }
}

window.deleteReservation = async function(id) {
    if (confirm('Bu rezervasyonu silmek istediğinize emin misiniz?')) {
        try {
            const response = await fetch(`../api/reservations.php?id=${id}`, {
                method: 'DELETE'
            });
            
            const data = await response.json();
            
            if (data.success) {
                alert('Rezervasyon silindi!');
                loadReservations();
                // Dashboard removed
            } else {
                alert('Hata: ' + (data.error || 'Rezervasyon silinemedi'));
            }
        } catch (error) {
            console.error('Delete reservation error:', error);
            alert('Silme işlemi sırasında hata oluştu!');
        }
    }
}

window.editReservation = function(id) {
    alert('Rezervasyon düzenleme özelliği yakında eklenecek! ID: ' + id);
}

// ==== SCHEDULE FUNCTIONS ====
async function loadSchedule() {
    try {
        const response = await fetch('../api/schedule.php');
        const schedule = await response.json();
        
        const scheduleGrid = document.getElementById('scheduleGrid');
        if (scheduleGrid && Array.isArray(schedule)) {
            // Günleri grupla
            const days = {
                'monday': 'Pazartesi',
                'tuesday': 'Salı',
                'wednesday': 'Çarşamba', 
                'thursday': 'Perşembe',
                'friday': 'Cuma',
                'saturday': 'Cumartesi',
                'sunday': 'Pazar'
            };
            
            let html = '';
            for (const [dayKey, dayName] of Object.entries(days)) {
                const daySchedule = schedule.filter(item => item.day === dayKey);
                html += `
                    <div class="schedule-day">
                        <h4>${dayName}</h4>
                        <div class="schedule-slots">
                            ${daySchedule.map(item => `
                                <div class="schedule-slot">
                                    <span class="time">${item.time}</span>
                                    <span class="class">${item.class_name}</span>
                                    <div class="actions">
                                        <button onclick="deleteScheduleItem(${item.id})" title="Sil">🗑️</button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            }
            
            scheduleGrid.innerHTML = html;
        }
    } catch (error) {
        console.error('Schedule load error:', error);
    }
}

window.deleteScheduleItem = async function(id) {
    if (confirm('Bu program öğesini silmek istediğinize emin misiniz?')) {
        try {
            const response = await fetch(`../api/schedule.php?id=${id}`, {
                method: 'DELETE'
            });
            
            const data = await response.json();
            
            if (data.success) {
                alert('Program öğesi silindi!');
                loadSchedule();
            } else {
                alert('Hata: ' + (data.error || 'Program öğesi silinemedi'));
            }
        } catch (error) {
            console.error('Delete schedule error:', error);
            alert('Silme işlemi sırasında hata oluştu!');
        }
    }
}

// Load classes for forms
async function loadClassesForForms() {
    try {
        const response = await fetch('../api/classes.php');
        const classes = await response.json();
        
        if (Array.isArray(classes)) {
            // Schedule form
            const scheduleClassSelect = document.getElementById('scheduleClass');
            if (scheduleClassSelect) {
                scheduleClassSelect.innerHTML = '<option value="">Seçin...</option>' + 
                    classes.map(cls => `<option value="${cls.id}">${cls.name}</option>`).join('');
            }
            
            // Reservation form
            const reservationClassSelect = document.getElementById('reservationClass');
            if (reservationClassSelect) {
                reservationClassSelect.innerHTML = '<option value="">Seçin...</option>' + 
                    classes.map(cls => `<option value="${cls.id}">${cls.name}</option>`).join('');
            }
            
            // Modal schedule form
            const modalScheduleClassSelect = document.getElementById('modalScheduleClass');
            if (modalScheduleClassSelect) {
                modalScheduleClassSelect.innerHTML = '<option value="">Seçin...</option>' + 
                    classes.map(cls => `<option value="${cls.id}">${cls.name}</option>`).join('');
            }
        }
    } catch (error) {
        console.error('Load classes for forms error:', error);
    }
}

// Section Navigation Functions
function showSection(sectionName) {
    console.log('showSection called with:', sectionName); // Debug
    
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Show selected section
    const targetSection = document.getElementById(sectionName);
    console.log('Target section found:', targetSection); // Debug
    
    if (targetSection) {
        targetSection.classList.add('active');
        console.log('Section activated:', sectionName); // Debug
        
        // Load section-specific data
        switch(sectionName) {
            case 'newsletter':
                if (document.getElementById('subscribersTableBody')) {
                    loadSubscribers();
                }
                break;
            case 'content':
                if (document.getElementById('heroQuoteText')) {
                    loadSiteContent();
                }
                break;
            case 'dashboard':
                // Dashboard removed
                break;
            case 'classes':
                loadClassesList();
                break;
            case 'schedule':
                loadScheduleData();
                break;
            case 'reservations':
                loadReservationsList();
                break;
            case 'gallery':
                loadGalleryImages();
                break;
            case 'videos':
                loadVideosList();
                break;
            case 'youtube':
                loadYouTubeVideos();
                break;
            case 'blog':
                loadBlogPosts();
                break;
            case 'summer-classes':
                loadSummerAttendanceData();
                loadSummerStats();
                break;
        }
    }
    
    // Always close mobile menu after section change
    closeMobileMenu();
}

// Content Management Tab Functions
function showContentTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    
    // Show selected tab
    const selectedTab = document.getElementById(tabName + '-tab');
    const selectedBtn = event.target;
    
    if (selectedTab) selectedTab.classList.add('active');
    if (selectedBtn) selectedBtn.classList.add('active');
}

// Newsletter Management Functions
async function loadSubscribers(page = 1) {
    try {
        const search = document.getElementById('subscriberSearch')?.value || '';
        const status = document.getElementById('statusFilter')?.value || 'all';
        
        const response = await fetch(`../api/newsletter.php?page=${page}&search=${search}&status=${status}`);
        const data = await response.json();
        
        if (data.subscribers) {
            displaySubscribers(data.subscribers);
            updateSubscriberStats(data);
            createPagination('subscribersPagination', data.page, data.pages, loadSubscribers);
        }
    } catch (error) {
        console.error('Error loading subscribers:', error);
        showNotification('Newsletter verileri yüklenirken hata oluştu', 'error');
    }
}

function displaySubscribers(subscribers) {
    const tbody = document.getElementById('subscribersTableBody');
    if (!tbody) return;
    
    if (subscribers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="no-data">Abone bulunamadı</td></tr>';
        return;
    }
    
    tbody.innerHTML = subscribers.map(subscriber => `
        <tr>
            <td>${subscriber.email}</td>
            <td>${new Date(subscriber.subscribed_at).toLocaleDateString('tr-TR')}</td>
            <td>
                <span class="status-badge ${subscriber.status === 'active' ? 'status-active' : 'status-inactive'}">
                    ${subscriber.status === 'active' ? 'Aktif' : 'İptal'}
                </span>
            </td>
            <td>${subscriber.ip_address || '-'}</td>
            <td class="actions">
                ${subscriber.status === 'active' ? 
                    `<button onclick="unsubscribeUser(${subscriber.id})" class="btn-small btn-warning">İptal Et</button>` : 
                    `<button onclick="resubscribeUser(${subscriber.id})" class="btn-small btn-success">Yeniden Aktif Et</button>`
                }
                <button onclick="deleteSubscriber(${subscriber.id})" class="btn-small btn-danger">Sil</button>
            </td>
        </tr>
    `).join('');
}

function updateSubscriberStats(data) {
    const totalElement = document.getElementById('totalSubscribers');
    const activeElement = document.getElementById('activeSubscribers');
    
    if (totalElement) totalElement.textContent = data.total;
    if (activeElement) activeElement.textContent = data.total; // This should be calculated properly
}

async function unsubscribeUser(id) {
    if (!confirm('Bu kullanıcının aboneliğini iptal etmek istediğinize emin misiniz?')) return;
    
    try {
        const response = await fetch(`../api/newsletter.php?id=${id}&action=unsubscribe`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            loadSubscribers();
            showNotification('Abonelik iptal edildi', 'success');
        }
    } catch (error) {
        showNotification('Hata oluştu', 'error');
    }
}

async function deleteSubscriber(id) {
    if (!confirm('Bu aboneyi kalıcı olarak silmek istediğinize emin misiniz?')) return;
    
    try {
        const response = await fetch(`../api/newsletter.php?id=${id}&action=delete`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            loadSubscribers();
            showNotification('Abone silindi', 'success');
        }
    } catch (error) {
        showNotification('Hata oluştu', 'error');
    }
}

// Site Content Management
async function loadSiteContent() {
    try {
        const response = await fetch('../api/site_content.php');
        const content = await response.json();
        
        // Load hero quote
        if (content.hero_quote) {
            const quoteText = document.getElementById('heroQuoteText');
            const quoteEnabled = document.getElementById('heroQuoteEnabled');
            
            if (quoteText) quoteText.value = content.hero_quote.quote || '';
            if (quoteEnabled) quoteEnabled.checked = content.hero_quote.enabled || false;
        }
        
        // Load about content
        if (content.about) {
            const aboutTitle = document.getElementById('aboutTitle');
            const aboutContent = document.getElementById('aboutContent');
            
            if (aboutTitle) aboutTitle.value = content.about.title || '';
            if (aboutContent) aboutContent.value = content.about.content || '';
        }
        
        // Load story content
        if (content.story_section) {
            loadStoryContent(content.story_section);
        }
        
        // Load testimonials
        if (content.community_testimonials) {
            loadTestimonials(content.community_testimonials.testimonials || []);
        }
        
        // Load features
        if (content.community_features) {
            loadFeatures(content.community_features.features || []);
        }
        
    } catch (error) {
        console.error('Error loading site content:', error);
        showNotification('İçerik yüklenirken hata oluştu', 'error');
    }
}

function loadStoryContent(story) {
    const titleElement = document.getElementById('storyTitle');
    const introElement = document.getElementById('storyIntro');
    const imageElement = document.getElementById('storyImage');
    
    if (titleElement) titleElement.value = story.title || '';
    if (introElement) introElement.value = story.intro || '';
    if (imageElement) imageElement.value = story.image || '';
    
    // Load content paragraphs
    const contentList = document.getElementById('storyContentList');
    if (contentList) {
        contentList.innerHTML = '';
        (story.content || []).forEach((paragraph, index) => {
            addStoryParagraph(paragraph, index);
        });
    }
    
    // Load stats
    const statsList = document.getElementById('storyStatsList');
    if (statsList) {
        statsList.innerHTML = '';
        (story.stats || []).forEach((stat, index) => {
            addStoryStat(stat.number, stat.label, index);
        });
    }
}

function addStoryParagraph(text = '', index = null) {
    const contentList = document.getElementById('storyContentList');
    if (!contentList) return;
    
    const div = document.createElement('div');
    div.className = 'form-group story-paragraph';
    div.innerHTML = `
        <textarea class="form-control" placeholder="Paragraf metni..." rows="3">${text}</textarea>
        <button type="button" onclick="removeStoryParagraph(this)" class="btn-small btn-danger">Sil</button>
    `;
    
    contentList.appendChild(div);
}

function removeStoryParagraph(button) {
    button.closest('.story-paragraph').remove();
}

function addStoryStat(number = '', label = '', index = null) {
    const statsList = document.getElementById('storyStatsList');
    if (!statsList) return;
    
    const div = document.createElement('div');
    div.className = 'form-row story-stat';
    div.innerHTML = `
        <div class="form-group">
            <input type="text" class="form-control" placeholder="Sayı" value="${number}">
        </div>
        <div class="form-group">
            <input type="text" class="form-control" placeholder="Label" value="${label}">
        </div>
        <button type="button" onclick="removeStoryStat(this)" class="btn-small btn-danger">Sil</button>
    `;
    
    statsList.appendChild(div);
}

function removeStoryStat(button) {
    button.closest('.story-stat').remove();
}

function loadTestimonials(testimonials) {
    const list = document.getElementById('testimonialsList');
    if (!list) return;
    
    list.innerHTML = '';
    testimonials.forEach((testimonial, index) => {
        addTestimonial(testimonial.text, testimonial.author, index);
    });
}

function addTestimonial(text = '', author = '', index = null) {
    const list = document.getElementById('testimonialsList');
    if (!list) return;
    
    const div = document.createElement('div');
    div.className = 'form-card testimonial-item';
    div.innerHTML = `
        <div class="form-group">
            <label class="form-label">Yorum</label>
            <textarea class="form-control" placeholder="Müşteri yorumu..." rows="3">${text}</textarea>
        </div>
        <div class="form-group">
            <label class="form-label">Yazar</label>
            <input type="text" class="form-control" placeholder="- İsim S." value="${author}">
        </div>
        <button type="button" onclick="removeTestimonial(this)" class="btn-small btn-danger">Sil</button>
    `;
    
    list.appendChild(div);
}

function removeTestimonial(button) {
    button.closest('.testimonial-item').remove();
}

function loadFeatures(features) {
    const list = document.getElementById('featuresList');
    if (!list) return;
    
    list.innerHTML = '';
    features.forEach((feature, index) => {
        addFeature(feature.icon, feature.title, feature.description, index);
    });
}

function addFeature(icon = '', title = '', description = '', index = null) {
    const list = document.getElementById('featuresList');
    if (!list) return;
    
    const div = document.createElement('div');
    div.className = 'form-card feature-item';
    div.innerHTML = `
        <div class="form-row">
            <div class="form-group">
                <label class="form-label">Icon</label>
                <input type="text" class="form-control" placeholder="🧘‍♀️" value="${icon}">
            </div>
            <div class="form-group">
                <label class="form-label">Başlık</label>
                <input type="text" class="form-control" placeholder="Özellik başlığı" value="${title}">
            </div>
        </div>
        <div class="form-group">
            <label class="form-label">Açıklama</label>
            <textarea class="form-control" placeholder="Özellik açıklaması..." rows="2">${description}</textarea>
        </div>
        <button type="button" onclick="removeFeature(this)" class="btn-small btn-danger">Sil</button>
    `;
    
    list.appendChild(div);
}

function removeFeature(button) {
    button.closest('.feature-item').remove();
}

// Save Functions
async function saveTestimonials() {
    const testimonials = [];
    document.querySelectorAll('.testimonial-item').forEach(item => {
        const text = item.querySelector('textarea').value;
        const author = item.querySelector('input[type="text"]').value;
        if (text && author) {
            testimonials.push({ text, author });
        }
    });
    
    try {
        const response = await fetch('../api/site_content.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                section: 'community_testimonials',
                content: { testimonials }
            })
        });
        
        if (response.ok) {
            showNotification('Testimonial\'lar güncellendi', 'success');
        }
    } catch (error) {
        showNotification('Kaydetme hatası', 'error');
    }
}

async function saveFeatures() {
    const features = [];
    document.querySelectorAll('.feature-item').forEach(item => {
        const icon = item.querySelector('input[placeholder="🧘‍♀️"]').value;
        const title = item.querySelector('input[placeholder="Özellik başlığı"]').value;
        const description = item.querySelector('textarea').value;
        if (title && description) {
            features.push({ icon, title, description });
        }
    });
    
    try {
        const response = await fetch('../api/site_content.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                section: 'community_features',
                content: { features }
            })
        });
        
        if (response.ok) {
            showNotification('Özellikler güncellendi', 'success');
        }
    } catch (error) {
        showNotification('Kaydetme hatası', 'error');
    }
}

// Create pagination function if not exists
function createPagination(containerId, currentPage, totalPages, loadFunction) {
    const container = document.getElementById(containerId);
    if (!container || totalPages <= 1) return;
    
    let paginationHtml = '';
    
    // Previous button
    if (currentPage > 1) {
        paginationHtml += `<button onclick="${loadFunction.name}(${currentPage - 1})" class="btn btn-secondary">‹ Önceki</button>`;
    }
    
    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        if (i === currentPage) {
            paginationHtml += `<button class="btn active">${i}</button>`;
        } else {
            paginationHtml += `<button onclick="${loadFunction.name}(${i})" class="btn btn-secondary">${i}</button>`;
        }
    }
    
    // Next button
    if (currentPage < totalPages) {
        paginationHtml += `<button onclick="${loadFunction.name}(${currentPage + 1})" class="btn btn-secondary">Sonraki ›</button>`;
    }
    
    container.innerHTML = paginationHtml;
}

// Show notification function if not exists
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `admin-notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span>${message}</span>
            <button onclick="this.parentElement.parentElement.remove()">&times;</button>
        </div>
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        max-width: 400px;
        padding: 1rem;
        border-radius: 8px;
        color: white;
        background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#17a2b8'};
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

// Initialize admin when page loads
window.addEventListener('load', function() {
    // Show summer-classes by default
    setTimeout(() => {
        showSection('summer-classes');
        loadThemeSettings();
    }, 100);
});

// Theme Color Functions
async function loadThemeSettings() {
    try {
        const response = await fetch('../api/settings.php');
        const settings = await response.json();
        
        if (settings) {
            // Load theme colors into form
            if (settings.primary_color) {
                document.getElementById('primaryColor').value = settings.primary_color;
            }
            if (settings.primary_dark) {
                document.getElementById('primaryDark').value = settings.primary_dark;
            }
            if (settings.accent_color) {
                document.getElementById('accentColor').value = settings.accent_color;
            }
            if (settings.background_light) {
                document.getElementById('backgroundLight').value = settings.background_light;
            }
        }
    } catch (error) {
        console.error('Theme settings load error:', error);
    }
}

async function saveThemeColors() {
    try {
        const primaryColor = document.getElementById('primaryColor').value;
        const primaryDark = document.getElementById('primaryDark').value;
        const accentColor = document.getElementById('accentColor').value;
        const backgroundLight = document.getElementById('backgroundLight').value;
        
        // Save each color setting
        await saveSettingValue('primary_color', primaryColor);
        await saveSettingValue('primary_dark', primaryDark);
        await saveSettingValue('accent_color', accentColor);
        await saveSettingValue('background_light', backgroundLight);
        
        showNotification('Tema renkleri başarıyla kaydedildi!', 'success');
        
        // Preview theme colors immediately
        previewThemeColors();
        
    } catch (error) {
        console.error('Theme save error:', error);
        showNotification('Tema renkleri kaydedilemedi!', 'error');
    }
}

// Preview theme colors in admin panel
function previewThemeColors() {
    const primaryColor = document.getElementById('primaryColor').value;
    const primaryDark = document.getElementById('primaryDark').value;
    const accentColor = document.getElementById('accentColor').value;
    const backgroundLight = document.getElementById('backgroundLight').value;
    
    // Apply colors to admin panel CSS variables if they exist
    const root = document.documentElement;
    root.style.setProperty('--primary-color', primaryColor);
    root.style.setProperty('--primary-dark', primaryDark);
    root.style.setProperty('--accent-color', accentColor);
    root.style.setProperty('--background-light', backgroundLight);
}

// Helper function to save individual settings
async function saveSettingValue(key, value) {
    const response = await fetch('../api/settings.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            [key]: value
        })
    });
    
    if (!response.ok) {
        throw new Error('Failed to save setting: ' + key);
    }
    
    return response.json();
}

// Admin Social Media Sharing Functions

// Blog sharing functions
function shareAdminBlogOnFacebook(title, excerpt) {
    const url = encodeURIComponent(window.location.origin + '/#blog');
    const text = encodeURIComponent(`${title} - ${excerpt}`);
    const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${text}`;
    window.open(shareUrl, '_blank', 'width=600,height=400');
}

function shareAdminBlogOnTwitter(title, excerpt) {
    const url = encodeURIComponent(window.location.origin + '/#blog');
    const text = encodeURIComponent(`${title} - ${excerpt} #yoga #meditasyon #blog`);
    const shareUrl = `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
    window.open(shareUrl, '_blank', 'width=600,height=400');
}

function shareAdminBlogOnWhatsApp(title, excerpt) {
    const url = window.location.origin + '/#blog';
    const text = encodeURIComponent(`*${title}*\n\n${excerpt}\n\n${url}`);
    const shareUrl = `https://wa.me/?text=${text}`;
    window.open(shareUrl, '_blank');
}

function shareAdminBlogOnInstagram(title, excerpt) {
    const url = window.location.origin + '/#blog';
    const shareText = `${title}\n\n${excerpt}\n\n${url}`;
    
    // URL'yi panoya kopyala
    navigator.clipboard.writeText(shareText).then(() => {
        alert('Blog bilgileri panoya kopyalandı!\n\nInstagram\'da paylaşmak için:\n1. Instagram\'ı açın\n2. Yeni gönderi oluşturun\n3. Kopyalanan metni yapıştırın');
    }).catch(() => {
        // Fallback - prompt ile göster
        prompt('Instagram için bu metni kopyalayın:', shareText);
    });
}

// Video sharing functions
function shareAdminVideoOnFacebook(title, description) {
    const url = encodeURIComponent(window.location.origin + '/#videos');
    const text = encodeURIComponent(`${title} - ${description}`);
    const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${text}`;
    window.open(shareUrl, '_blank', 'width=600,height=400');
}

function shareAdminVideoOnTwitter(title, description) {
    const url = encodeURIComponent(window.location.origin + '/#videos');
    const text = encodeURIComponent(`${title} - ${description} #yoga #meditasyon #yogavideo`);
    const shareUrl = `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
    window.open(shareUrl, '_blank', 'width=600,height=400');
}

function shareAdminVideoOnWhatsApp(title, description) {
    const url = window.location.origin + '/#videos';
    const text = encodeURIComponent(`*${title}*\n\n${description}\n\n${url}`);
    const shareUrl = `https://wa.me/?text=${text}`;
    window.open(shareUrl, '_blank');
}

function shareAdminVideoOnInstagram(title, description) {
    const url = window.location.origin + '/#videos';
    const shareText = `${title}\n\n${description}\n\n${url}`;
    
    // URL'yi panoya kopyala
    navigator.clipboard.writeText(shareText).then(() => {
        alert('Video bilgileri panoya kopyalandı!\n\nInstagram\'da paylaşmak için:\n1. Instagram\'ı açın\n2. Yeni gönderi oluşturun\n3. Kopyalanan metni yapıştırın');
    }).catch(() => {
        // Fallback - prompt ile göster
        prompt('Instagram için bu metni kopyalayın:', shareText);
    });
}

// ===== YAZ DÖNEMİ DERS KATILIMLARI =====
let currentSummerData = [];

// Yaz dönemi katılım verilerini yükle
async function loadSummerAttendanceData() {
    try {
        const startDate = document.getElementById('summerStartDate').value;
        const endDate = document.getElementById('summerEndDate').value;
        const classDay = document.getElementById('summerClassDay').value;
        const attendanceStatus = document.getElementById('summerAttendanceStatus').value;
        
        let url = '../api/summer-classes.php?action=get_attendance';
        
        if (startDate) url += `&start_date=${startDate}`;
        if (endDate) url += `&end_date=${endDate}`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.success) {
            let filteredData = data.attendance;
            
            // Frontend filtreleme
            if (classDay) {
                filteredData = filteredData.filter(item => item.class_day === classDay);
            }
            
            if (attendanceStatus) {
                filteredData = filteredData.filter(item => item.attendance_status === attendanceStatus);
            }
            
            // Check for new participants before updating data
            checkForNewParticipants(filteredData);
            
            currentSummerData = filteredData;
            displaySummerAttendanceData(filteredData);
        } else {
            console.error('Veri yükleme hatası:', data.message);
        }
    } catch (error) {
        console.error('Veri yükleme hatası:', error);
        document.getElementById('summerAttendanceTableBody').innerHTML = `
            <tr>
                <td colspan="9" style="text-align: center; padding: 2rem; color: #dc3545;">Veriler yüklenirken hata oluştu</td>
            </tr>
        `;
    }
}

// Yaz dönemi verilerini tabloda göster
function displaySummerAttendanceData(data) {
    const tbody = document.getElementById('summerAttendanceTableBody');
    const mobileContainer = document.getElementById('summerAttendanceTableMobile');
    
    if (data.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" style="text-align: center; padding: 2rem; color: #6c757d;">Seçilen kriterlere uygun veri bulunamadı</td>
            </tr>
        `;
        if (mobileContainer) {
            mobileContainer.innerHTML = `
                <div class="attendance-card">
                    <div class="attendance-card-header">
                        <h3 class="attendance-card-title">Seçilen kriterlere uygun veri bulunamadı</h3>
                    </div>
                </div>
            `;
        }
        return;
    }
    
    // Desktop table view
    tbody.innerHTML = data.map(item => `
        <tr>
            <td><strong>${item.formatted_date}</strong></td>
            <td class="hide-mobile"><span class="badge badge-info">${item.class_day}</span></td>
            <td><strong>${item.participant_name}</strong></td>
            <td class="hide-mobile">${item.participant_email}</td>
            <td class="hide-mobile">${item.participant_phone}</td>
            <td class="hide-mobile"><span class="badge badge-secondary">${item.participant_level}</span></td>
            <td class="hide-mobile">${item.formatted_registration}</td>
            <td><span class="attendance-status ${getStatusClass(item.attendance_status)}">${item.attendance_status}</span></td>
            <td>
                <div class="action-buttons">
                    <select onchange="updateSummerAttendanceStatus(${item.id}, this.value)" class="form-control">
                        <option value="Kayıtlı" ${item.attendance_status === 'Kayıtlı' ? 'selected' : ''}>Kayıtlı</option>
                        <option value="Katıldı" ${item.attendance_status === 'Katıldı' ? 'selected' : ''}>Katıldı</option>
                        <option value="Katılmadı" ${item.attendance_status === 'Katılmadı' ? 'selected' : ''}>Katılmadı</option>
                    </select>
                    <button class="btn btn-danger btn-sm" onclick="deleteSummerAttendance(${item.id})" title="Sil">
                        🗑️ Sil
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
    
    // Mobile card view
    if (mobileContainer) {
        mobileContainer.innerHTML = data.map(item => `
            <div class="attendance-card">
                <div class="attendance-card-header">
                    <h3 class="attendance-card-title">${item.participant_name}</h3>
                    <div class="attendance-card-date">${item.formatted_date}</div>
                </div>
                <div class="attendance-card-meta">
                    <div class="attendance-meta-item">
                        <span class="attendance-meta-label">Gün</span>
                        <span class="attendance-meta-value">${item.class_day}</span>
                    </div>
                    <div class="attendance-meta-item">
                        <span class="attendance-meta-label">Seviye</span>
                        <span class="attendance-meta-value">${item.participant_level}</span>
                    </div>
                    <div class="attendance-meta-item">
                        <span class="attendance-meta-label">Durum</span>
                        <span class="attendance-status ${getStatusClass(item.attendance_status)}">${item.attendance_status}</span>
                    </div>
                    <div class="attendance-meta-item">
                        <span class="attendance-meta-label">Kayıt Tarihi</span>
                        <span class="attendance-meta-value">${item.formatted_registration}</span>
                    </div>
                    <div class="attendance-card-contact">
                        <span class="attendance-meta-label">İletişim Bilgileri</span>
                        <div class="contact-info">
                            <span>📧 ${item.participant_email}</span>
                            <span>📱 ${item.participant_phone}</span>
                        </div>
                    </div>
                </div>
                <div class="attendance-card-actions">
                    <select onchange="updateSummerAttendanceStatus(${item.id}, this.value)" class="form-control">
                        <option value="Kayıtlı" ${item.attendance_status === 'Kayıtlı' ? 'selected' : ''}>Kayıtlı</option>
                        <option value="Katıldı" ${item.attendance_status === 'Katıldı' ? 'selected' : ''}>Katıldı</option>
                        <option value="Katılmadı" ${item.attendance_status === 'Katılmadı' ? 'selected' : ''}>Katılmadı</option>
                    </select>
                    <button class="btn btn-danger" onclick="deleteSummerAttendance(${item.id})">
                        🗑️ Sil
                    </button>
                </div>
            </div>
        `).join('');
    }
    
    // Toggle mobile/desktop view based on screen size
    updateSummerAttendanceDisplay();
}

// Mobile responsive display toggle for summer attendance
function updateSummerAttendanceDisplay() {
    const isMobile = window.innerWidth <= 768;
    const desktopTable = document.querySelector('.summer-classes-section .data-table');
    const mobileContainer = document.getElementById('summerAttendanceTableMobile');
    
    if (desktopTable && mobileContainer) {
        if (isMobile) {
            desktopTable.style.display = 'none';
            mobileContainer.style.display = 'block';
            mobileContainer.classList.add('active');
        } else {
            desktopTable.style.display = 'block';
            mobileContainer.style.display = 'none';
            mobileContainer.classList.remove('active');
        }
    }
}

// Status class helper
function getStatusClass(status) {
    switch(status) {
        case 'Kayıtlı': return 'registered';
        case 'Katıldı': return 'attended';
        case 'Katılmadı': return 'not-attended';
        default: return 'registered';
    }
}

// Durum badge class'ını belirle
function getStatusBadgeClass(status) {
    switch(status) {
        case 'Kayıtlı': return 'warning';
        case 'Katıldı': return 'success';
        case 'Katılmadı': return 'danger';
        default: return 'secondary';
    }
}

// Yaz dönemi istatistiklerini yükle
async function loadSummerStats() {
    try {
        const startDate = document.getElementById('summerStartDate').value;
        const endDate = document.getElementById('summerEndDate').value;
        
        let url = '../api/summer-classes.php?action=get_stats';
        if (startDate) url += `&start_date=${startDate}`;
        if (endDate) url += `&end_date=${endDate}`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        console.log('Stats API Response:', data); // Debug log
        
        if (data.success) {
            document.getElementById('summerTotalRegistrations').textContent = data.stats.total_registrations;
            document.getElementById('summerUniqueParticipants').textContent = data.stats.unique_participants;
            document.getElementById('summerAttendedCount').textContent = data.stats.attended_count;
            document.getElementById('summerNotAttendedCount').textContent = data.stats.not_attended_count;
            
            // En yakın ders bilgisi
            const nextClassCountElement = document.getElementById('summerNextClassCount');
            const nextClassLabelElement = document.getElementById('summerNextClassLabel');
            
            if (data.next_class) {
                const classDate = new Date(data.next_class.class_date);
                const formattedDate = classDate.toLocaleDateString('tr-TR', { 
                    day: 'numeric', 
                    month: 'long' 
                });
                const participantCount = data.next_class.participant_count || 0;
                
                nextClassCountElement.textContent = participantCount;
                nextClassLabelElement.textContent = `${formattedDate} ${data.next_class.class_day}`;
            } else {
                nextClassCountElement.textContent = '-';
                nextClassLabelElement.textContent = 'Yaklaşan ders yok';
            }
        }
    } catch (error) {
        console.error('İstatistik yükleme hatası:', error);
    }
}

// Debug function to test API response
async function testStatsAPI() {
    try {
        const response = await fetch('../api/summer-classes.php?action=get_stats');
        const data = await response.json();
        
        console.log('Raw API Response:', data);
        alert(`API Test Results:
Total Registrations: ${data.stats.total_registrations}
Unique Participants: ${data.stats.unique_participants}
Attended: ${data.stats.attended_count}
Not Attended: ${data.stats.not_attended_count}`);
    } catch (error) {
        console.error('API Test Error:', error);
        alert('API Test Failed: ' + error.message);
    }
}

// Basic API test
async function testBasicAPI() {
    try {
        console.log('Testing basic API...');
        const response = await fetch('../api/test-api.php');
        console.log('Response status:', response.status);
        console.log('Response headers:', response.headers);
        
        const text = await response.text();
        console.log('Raw response text:', text);
        
        const data = JSON.parse(text);
        console.log('Parsed data:', data);
        
        alert(`Basic API Test: ${data.success ? 'SUCCESS' : 'FAILED'}
Message: ${data.message || data.error}
Timestamp: ${data.timestamp || 'N/A'}`);
    } catch (error) {
        console.error('Basic API Test Error:', error);
        alert('Basic API Test Failed: ' + error.message);
    }
}

// Summer API config test
async function testSummerAPI() {
    try {
        console.log('Testing summer API config...');
        const response = await fetch('../api/test-summer.php');
        console.log('Response status:', response.status);
        
        const text = await response.text();
        console.log('Raw response text:', text);
        
        const data = JSON.parse(text);
        console.log('Parsed data:', data);
        
        alert(`Summer API Test: ${data.success ? 'SUCCESS' : 'FAILED'}
Message: ${data.message || data.error}
DB Connected: ${data.db_connected || 'unknown'}
${data.file ? 'File: ' + data.file : ''}
${data.line ? 'Line: ' + data.line : ''}`);
        
        // If config is OK, test summer-classes.php GET request
        if (data.success) {
            console.log('Config OK, testing summer-classes.php GET...');
            const summerResponse = await fetch('../api/summer-classes.php?action=get_schedule');
            console.log('Summer GET Response status:', summerResponse.status);
            
            const summerText = await summerResponse.text();
            console.log('Summer GET Raw response:', summerText);
            
            if (summerResponse.status === 200) {
                const summerData = JSON.parse(summerText);
                console.log('Summer GET Parsed data:', summerData);
                alert('Summer GET Test: SUCCESS\nSchedule items: ' + (summerData.schedule ? summerData.schedule.length : 0));
            } else {
                alert('Summer GET Test: FAILED\nStatus: ' + summerResponse.status + '\nResponse: ' + summerText.substring(0, 200));
            }
        }
    } catch (error) {
        console.error('Summer API Test Error:', error);
        alert('Summer API Test Failed: ' + error.message);
    }
}

// Test summer POST request
async function testSummerPOST() {
    try {
        console.log('Testing summer API POST...');
        
        const testData = {
            action: 'register',
            class_date: '2025-07-17',
            participant_name: 'Test User',
            participant_email: 'test@example.com',
            participant_phone: '+90 555 123 4567',
            participant_level: 'Tüm Seviyeler'
        };
        
        // Also test with session token (if we want to simulate member)
        const testDataWithToken = {
            action: 'register',
            class_date: '2025-07-17',
            session_token: 'fake_session_token_123',
            participant_level: 'Tüm Seviyeler'
        };
        
        console.log('Sending POST data:', testData);
        
        const response = await fetch('../api/summer-classes.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(testData)
        });
        
        console.log('POST Response status:', response.status);
        
        const text = await response.text();
        console.log('POST Raw response:', text);
        
        if (response.status === 200) {
            const data = JSON.parse(text);
            console.log('POST Parsed data:', data);
            alert(`POST Test: ${data.success ? 'SUCCESS' : 'FAILED'}
Message: ${data.message || data.error}
Registration ID: ${data.registration_id || 'N/A'}`);
        } else {
            alert(`POST Test: FAILED
Status: ${response.status}
Response: ${text.substring(0, 300)}`);
        }
    } catch (error) {
        console.error('Summer POST Test Error:', error);
        alert('Summer POST Test Failed: ' + error.message);
    }
}

// Yaz dönemi katılım durumunu güncelle
async function updateSummerAttendanceStatus(attendanceId, status) {
    try {
        const response = await fetch('../api/summer-classes.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'update_attendance',
                attendance_id: attendanceId,
                status: status
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Katılım durumu güncellendi', 'success');
            loadSummerStats(); // İstatistikleri yenile
        } else {
            showNotification('Güncelleme hatası: ' + result.message, 'error');
        }
    } catch (error) {
        console.error('Güncelleme hatası:', error);
        showNotification('Güncelleme hatası oluştu', 'error');
    }
}

// Yaz dönemi katılım kaydını sil
async function deleteSummerAttendance(attendanceId) {
    if (!confirm('Bu katılım kaydını silmek istediğinizden emin misiniz?')) {
        return;
    }
    
    try {
        const response = await fetch('../api/summer-classes.php', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                attendance_id: attendanceId
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Kayıt silindi', 'success');
            loadSummerAttendanceData(); // Tabloyu yenile
            loadSummerStats(); // İstatistikleri yenile
        } else {
            showNotification('Silme hatası: ' + result.message, 'error');
        }
    } catch (error) {
        console.error('Silme hatası:', error);
        showNotification('Silme hatası oluştu', 'error');
    }
}

// Yaz dönemi Excel export
function exportSummerToExcel() {
    if (currentSummerData.length === 0) {
        showNotification('Önce verileri yükleyin', 'warning');
        return;
    }
    
    // CSV formatında veri hazırla
    const headers = ['Tarih', 'Gün', 'Katılımcı', 'E-posta', 'Telefon', 'Seviye', 'Kayıt Tarihi', 'Durum', 'Notlar'];
    const csvData = [headers];
    
    currentSummerData.forEach(item => {
        csvData.push([
            item.formatted_date,
            item.class_day,
            item.participant_name,
            item.participant_email,
            item.participant_phone,
            item.participant_level,
            item.formatted_registration,
            item.attendance_status,
            item.notes || ''
        ]);
    });
    
    // CSV string'i oluştur
    const csvString = csvData.map(row => row.join(',')).join('\n');
    
    // Dosyayı indir
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `yaz-dersleri-katilim-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    showNotification('Excel dosyası indiriliyor', 'success');
}

// Section Management Functions
let sectionsData = [];

async function loadSections() {
    try {
        console.log('Loading sections...'); // Debug
        const response = await fetch('../api/section-visibility.php');
        const data = await response.json();
        
        if (data.success) {
            sectionsData = data.sections;
            console.log('Sections loaded:', sectionsData); // Debug
            displaySections();
            updateSectionStats();
        } else {
            console.error('Sections loading error:', data.message);
        }
    } catch (error) {
        console.error('Sections loading error:', error);
    }
}

function displaySections() {
    const mainSections = sectionsData.filter(section => 
        ['home', 'about', 'classes', 'videos', 'blog', 'gallery', 'community', 'newsletter', 'reservation'].includes(section.section_name)
    );
    
    const pageSections = sectionsData.filter(section => 
        ['meditation', 'poses', 'shop', 'cart'].includes(section.section_name)
    );
    
    const featureSections = sectionsData.filter(section => 
        ['footer_social', 'footer_contact', 'hero_carousel', 'contact_form'].includes(section.section_name)
    );
    
    renderSectionGrid('mainSectionsGrid', mainSections);
    renderSectionGrid('pageSectionsGrid', pageSections);
    renderSectionGrid('featureSectionsGrid', featureSections);
}

function renderSectionGrid(containerId, sections) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = sections.map(section => `
        <div class="section-card">
            <div class="section-card-header">
                <h3 class="section-card-title">${section.display_name}</h3>
                <label class="section-toggle">
                    <input type="checkbox" ${section.is_active == 1 || section.is_active === true ? 'checked' : ''} 
                           onchange="toggleSection('${section.section_name}', this.checked)">
                    <span class="section-toggle-slider"></span>
                </label>
            </div>
            <div class="section-card-description">
                ${section.description || 'Bu bölüm için açıklama bulunmuyor.'}
            </div>
            <div class="section-card-meta">
                <span class="section-status ${section.is_active == 1 || section.is_active === true ? 'active' : 'inactive'}">
                    ${section.is_active == 1 || section.is_active === true ? 'Aktif' : 'Pasif'}
                </span>
                <span class="section-order">Sıra: ${section.menu_order}</span>
            </div>
        </div>
    `).join('');
}

async function toggleSection(sectionName, isActive) {
    try {
        const response = await fetch('../api/section-visibility.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                section_name: sectionName,
                is_active: isActive
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Update local data
            const section = sectionsData.find(s => s.section_name === sectionName);
            if (section) {
                section.is_active = isActive;
            }
            
            displaySections();
            updateSectionStats();
            
            // Sync with page toggles
            syncPageToggle(sectionName, isActive);
            
            showNotification(`${sectionName} bölümü ${isActive ? 'aktif' : 'pasif'} yapıldı`, 'success');
        } else {
            console.error('Section toggle error:', data.message);
            showNotification('Bölüm durumu güncellenemedi', 'error');
            // Revert the toggle
            loadSections();
        }
    } catch (error) {
        console.error('Section toggle error:', error);
        showNotification('Bölüm durumu güncellenemedi', 'error');
        // Revert the toggle
        loadSections();
    }
}

function updateSectionStats() {
    const total = sectionsData.length;
    const active = sectionsData.filter(s => s.is_active == 1 || s.is_active === true).length;
    const inactive = total - active;
    
    document.getElementById('totalSections').textContent = total;
    document.getElementById('activeSections').textContent = active;
    document.getElementById('inactiveSections').textContent = inactive;
}

function showSectionTab(tabName) {
    // Hide all tab contents
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Remove active class from all tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab
    const tabMap = {
        'main': 'mainSections',
        'pages': 'pageSections',
        'features': 'featureSections'
    };
    
    document.getElementById(tabMap[tabName]).classList.add('active');
    
    // Add active class to clicked button
    event.target.classList.add('active');
}

// Section toggle functions for individual pages
async function loadSectionToggleState(sectionName) {
    try {
        const response = await fetch('../api/section-visibility.php');
        const data = await response.json();
        
        if (data.success) {
            const section = data.sections.find(s => s.section_name === sectionName);
            if (section) {
                // Update toggle switches based on section name
                const toggleMappings = {
                    'classes': ['classesToggle', 'summerClassesToggle', 'scheduleToggle'],
                    'newsletter': ['newsletterToggle'],
                    'gallery': ['galleryToggle'],
                    'videos': ['videosToggle'],
                    'about': ['aboutToggle'],
                    'blog': ['blogToggle'],
                    'community': ['communityToggle'],
                    'reservation': ['reservationToggle']
                };
                
                const toggleIds = toggleMappings[sectionName] || [];
                toggleIds.forEach(toggleId => {
                    const toggle = document.getElementById(toggleId);
                    if (toggle) {
                        toggle.checked = section.is_active;
                    }
                });
            }
        }
    } catch (error) {
        console.error('Error loading section toggle state:', error);
    }
}

async function toggleSectionFromPage(sectionName, isActive) {
    try {
        console.log('Toggling section:', sectionName, 'to', isActive); // Debug
        
        const response = await fetch('../api/section-visibility.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                section_name: sectionName,
                is_active: isActive
            })
        });
        
        // Debug: Check response headers and text
        console.log('Response status:', response.status);
        console.log('Response headers:', response.headers.get('Content-Type'));
        
        const responseText = await response.text();
        console.log('Raw response:', responseText); // Debug
        
        // Try to parse JSON
        let data;
        try {
            data = JSON.parse(responseText);
        } catch (parseError) {
            console.error('JSON Parse Error:', parseError);
            console.error('Raw response that failed to parse:', responseText);
            showNotification('Server returned invalid response. Check console for details.', 'error');
            return;
        }
        
        console.log('Parsed API Response:', data); // Debug
        
        if (data.success) {
            showNotification(`${sectionName} bölümü ${isActive ? 'aktif' : 'pasif'} yapıldı`, 'success');
            
            // Update all related toggles
            const toggleMappings = {
                'classes': ['classesToggle', 'summerClassesToggle', 'scheduleToggle'],
                'newsletter': ['newsletterToggle'],
                'gallery': ['galleryToggle'],
                'videos': ['videosToggle'],
                'about': ['aboutToggle'],
                'blog': ['blogToggle'],
                'community': ['communityToggle'],
                'reservation': ['reservationToggle']
            };
            
            const toggleIds = toggleMappings[sectionName] || [];
            toggleIds.forEach(toggleId => {
                const toggle = document.getElementById(toggleId);
                if (toggle) {
                    toggle.checked = isActive;
                }
            });
            
            // Sync with section management page
            syncSectionManagementToggle(sectionName, isActive);
        } else {
            console.error('API Error:', data.message); // Debug
            showNotification('Bölüm durumu güncellenemedi: ' + (data.message || 'Bilinmeyen hata'), 'error');
            // Revert the toggle
            loadSectionToggleState(sectionName);
        }
    } catch (error) {
        console.error('Error toggling section:', error);
        showNotification('Bölüm durumu güncellenemedi: ' + error.message, 'error');
        // Revert the toggle
        loadSectionToggleState(sectionName);
    }
}

async function toggleAllSections(isActive) {
    try {
        const confirmMessage = isActive ? 
            'Tüm bölümleri aktif yapmak istediğinize emin misiniz?' : 
            'Tüm bölümleri pasif yapmak istediğinize emin misiniz?';
            
        if (!confirm(confirmMessage)) {
            return;
        }
        
        const response = await fetch('../api/section-visibility.php');
        const data = await response.json();
        
        if (data.success) {
            const sections = data.sections;
            const promises = sections.map(section => 
                fetch('../api/section-visibility.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        section_name: section.section_name,
                        is_active: isActive
                    })
                })
            );
            
            await Promise.all(promises);
            
            showNotification(`Tüm bölümler ${isActive ? 'aktif' : 'pasif'} yapıldı`, 'success');
            
            // Reload sections data
            loadSections();
        }
    } catch (error) {
        console.error('Error toggling all sections:', error);
        showNotification('Bölümler güncellenemedi', 'error');
    }
}

// Yaz dönemi section'ı yüklendiğinde
function initSummerClasses() {
    // Varsayılan tarih aralığını ayarla (bu ay)
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    const startDateInput = document.getElementById('summerStartDate');
    const endDateInput = document.getElementById('summerEndDate');
    
    if (startDateInput && endDateInput) {
        startDateInput.value = firstDay.toISOString().split('T')[0];
        endDateInput.value = lastDay.toISOString().split('T')[0];
    }
    
    // Verileri yükle
    loadSummerAttendanceData();
    loadSummerStats();
}

// Navigation event listener'ına summer classes ekle
document.addEventListener('DOMContentLoaded', function() {
    // Existing navigation setup
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            if (this.getAttribute('data-section') === 'summer-classes') {
                e.preventDefault();
                
                // Remove active class from all links
                navLinks.forEach(l => l.classList.remove('active'));
                this.classList.add('active');
                
                // Hide all sections
                document.querySelectorAll('.content-section').forEach(section => {
                    section.classList.remove('active');
                });
                
                // Show summer classes section
                document.getElementById('summer-classes').classList.add('active');
                
                // Initialize summer classes
                initSummerClasses();
            }
        });
    });
});

// Community Management Functions
async function addCommunityFeature() {
    const featuresDiv = document.getElementById('communityFeaturesList');
    const featureCount = featuresDiv.children.length;
    
    const featureHtml = `
        <div class="feature-item" data-id="${featureCount}">
            <div class="form-group">
                <label class="form-label">Özellik İkonu</label>
                <input type="text" class="form-control feature-icon" placeholder="🧘‍♀️" style="width: 80px;">
            </div>
            <div class="form-group">
                <label class="form-label">Özellik Başlığı</label>
                <input type="text" class="form-control feature-title" placeholder="Özellik başlığı">
            </div>
            <div class="form-group">
                <label class="form-label">Özellik Açıklaması</label>
                <textarea class="form-control feature-description" rows="3" placeholder="Özellik açıklaması"></textarea>
            </div>
            <button type="button" class="btn btn-danger btn-sm" onclick="removeCommunityFeature(this)">Kaldır</button>
        </div>
    `;
    
    featuresDiv.insertAdjacentHTML('beforeend', featureHtml);
}

function removeCommunityFeature(button) {
    button.parentElement.remove();
}

async function saveCommunityFeatures() {
    const featuresDiv = document.getElementById('communityFeaturesList');
    const features = [];
    
    featuresDiv.querySelectorAll('.feature-item').forEach(item => {
        const icon = item.querySelector('.feature-icon').value;
        const title = item.querySelector('.feature-title').value;
        const description = item.querySelector('.feature-description').value;
        
        if (title && description) {
            features.push({ icon, title, description });
        }
    });
    
    try {
        const response = await fetch('../api/site_content.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'update_community_features',
                features: features
            })
        });
        
        const result = await response.json();
        if (result.success) {
            showNotification('Topluluk özellikleri güncellendi!', 'success');
        } else {
            showNotification('Hata: ' + result.message, 'error');
        }
    } catch (error) {
        console.error('Error saving community features:', error);
        showNotification('Kayıt hatası oluştu', 'error');
    }
}

// Toggle synchronization functions
function syncPageToggle(sectionName, isActive) {
    const toggleMappings = {
        'classes': ['classesToggle', 'summerClassesToggle', 'scheduleToggle'],
        'newsletter': ['newsletterToggle'],
        'gallery': ['galleryToggle'],
        'videos': ['videosToggle'],
        'about': ['aboutToggle'],
        'blog': ['blogToggle'],
        'community': ['communityToggle'],
        'reservation': ['reservationToggle']
    };
    
    const toggleIds = toggleMappings[sectionName] || [];
    toggleIds.forEach(toggleId => {
        const toggle = document.getElementById(toggleId);
        if (toggle) {
            toggle.checked = isActive;
        }
    });
}

function syncSectionManagementToggle(sectionName, isActive) {
    // Update section management grid toggle if on that page
    const sectionElement = document.querySelector(`[data-section="${sectionName}"]`);
    if (sectionElement) {
        const toggle = sectionElement.querySelector('.section-toggle-switch');
        if (toggle) {
            toggle.checked = isActive;
        }
    }
    
    // Update sections data if available
    if (typeof sectionsData !== 'undefined' && sectionsData) {
        const section = sectionsData.find(s => s.section_name === sectionName);
        if (section) {
            section.is_active = isActive;
        }
        
        // Update display and stats if functions are available
        if (typeof displaySections === 'function') {
            displaySections();
        }
        if (typeof updateSectionStats === 'function') {
            updateSectionStats();
        }
    }
}

// Utility functions
function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// ===== YOUTUBE VİDEOLARI =====

let youtubeVideos = [];

async function loadYouTubeVideos() {
    try {
        const response = await fetch('../api/youtube.php?admin=true');
        const data = await response.json();
        console.log('Admin YouTube API Response:', data); // Debug için bırak
        
        if (data.success) {
            youtubeVideos = data.videos;
            youtubeVideosAll = data.videos; // Tüm videoları sakla
            // Display order değerlerini kontrol et ve düzelt
            await fixDisplayOrders();
            // Mevcut filtreye göre videoları göster
            window.filterYouTubeByCategory(currentYouTubeFilter);
            updateYouTubeStats();
        } else {
            console.error('Admin: API Error:', data);
            showNotification('YouTube videoları yüklenirken hata oluştu', 'error');
        }
    } catch (error) {
        console.error('YouTube videos loading error:', error);
        showNotification('YouTube videoları yüklenirken hata oluştu', 'error');
    }
}

// Bu fonksiyon artık dosyanın başında tanımlı, burayı kaldırıyoruz

// Display order değerlerini düzelt
async function fixDisplayOrders() {
    let needsUpdate = false;
    
    for (let i = 0; i < youtubeVideos.length; i++) {
        const video = youtubeVideos[i];
        const expectedOrder = i;
        const currentOrder = parseInt(video.display_order) || 0;
        
        if (currentOrder !== expectedOrder) {
            console.log(`Fixing display order for video ${video.id}: ${currentOrder} -> ${expectedOrder}`);
            await updateVideoDisplayOrder(video.id, expectedOrder);
            video.display_order = expectedOrder; // Local state'i güncelle
            needsUpdate = true;
        }
    }
    
    if (needsUpdate) {
        console.log('Display orders fixed, reloading...');
        // Tekrar yükle ama fix fonksiyonunu çağırma
        const response = await fetch('../api/youtube.php?admin=true');
        const data = await response.json();
        if (data.success) {
            youtubeVideos = data.videos;
        }
    }
}

function displayYouTubeVideos(videos) {
    const videosList = document.getElementById('youtubeVideosGrid');
    if (!videosList) return;
    
    if (videos.length === 0) {
        videosList.innerHTML = '<div class="no-data">Henüz YouTube videosu eklenmemiş.</div>';
        return;
    }
    
    videosList.innerHTML = videos.map((video, index) => `
        <div class="video-card ${video.is_active ? 'active' : 'inactive'}">
            <div class="video-thumbnail">
                <img src="${video.thumbnail_url}" alt="${video.title}" 
                     onerror="this.src='https://via.placeholder.com/320x180?text=Video'">
                <div class="video-duration">${video.duration || ''}</div>
                <div class="video-status">
                    <span class="status-badge ${video.is_active ? 'active' : 'inactive'}">
                        ${video.is_active ? 'Aktif' : 'Pasif'}
                    </span>
                </div>
            </div>
            <div class="video-content">
                <h3 class="video-title">${video.title}</h3>
                <p class="video-description">${video.description || 'Açıklama yok'}</p>
                <div class="video-meta">
                    <span class="video-category">${getCategoryDisplayName(video.category)}</span>
                    <span class="video-views">${video.view_count} görüntülenme</span>
                    <span class="video-date">${formatDate(video.created_at)}</span>
                    <span class="video-order">Sıra: ${video.display_order || index + 1}</span>
                </div>
            </div>
            <div class="video-actions">
                <button class="btn btn-sm btn-secondary" onclick="moveVideoUp(${video.id})" 
                        ${index === 0 ? 'disabled' : ''} title="Yukarı taşı">↑</button>
                <button class="btn btn-sm btn-secondary" onclick="moveVideoDown(${video.id})" 
                        ${index === videos.length - 1 ? 'disabled' : ''} title="Aşağı taşı">↓</button>
                <button class="btn btn-sm btn-primary" onclick="editYouTubeVideo(${video.id})">Düzenle</button>
                <button class="btn btn-sm ${video.is_active ? 'btn-warning' : 'btn-success'}" 
                        onclick="toggleYouTubeVideoStatus(${video.id}, ${video.is_active ? 0 : 1})">
                    ${video.is_active ? 'Pasif' : 'Aktif'}
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteYouTubeVideo(${video.id})">Sil</button>
            </div>
        </div>
    `).join('');
}

function getCategoryDisplayName(category) {
    const categories = {
        'beginner': 'Başlangıç seviyesi',
        'intermediate': 'Orta seviye',
        'advanced': 'İleri seviye',
        'yoga_related': 'Yoga\'ya dair',
        'breathing': 'Nefes çalışmaları',
        'stretching': 'Esneme',
        'mini_flows': 'Mini yoga flows',
        'pose_tutorials': 'Poz anlatımları',
        // Eski kategoriler için uyumluluk
        'yoga': 'Yoga\'ya dair',
        'meditation': 'Nefes çalışmaları',
        'lifestyle': 'Yoga\'ya dair',
        'tips': 'Poz anlatımları'
    };
    return categories[category] || category;
}

function updateYouTubeStats() {
    const totalVideos = youtubeVideos.length;
    const activeVideos = youtubeVideos.filter(v => v.is_active).length;
    const totalViews = youtubeVideos.reduce((sum, v) => sum + parseInt(v.view_count || 0), 0);
    
    document.getElementById('totalYouTubeVideos').textContent = totalVideos;
    document.getElementById('activeYouTubeVideos').textContent = activeVideos;
    document.getElementById('totalYouTubeViews').textContent = totalViews;
}

// YouTube video form handling
document.addEventListener('DOMContentLoaded', function() {
    const youtubeForm = document.getElementById('youtubeForm');
    if (youtubeForm) {
        youtubeForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const videoData = {
                title: document.getElementById('youtubeTitle').value,
                youtube_url: document.getElementById('youtubeUrl').value,
                description: document.getElementById('youtubeDescription').value,
                category: document.getElementById('youtubeCategory').value || 'yoga_related'
            };
            
            const videoIdElement = document.getElementById('youtubeVideoId');
            const videoId = videoIdElement ? videoIdElement.value.trim() : '';
            
            console.log('Video ID for submit:', videoId); // Debug log
            
            try {
                let response;
                if (videoId && videoId !== '') {
                    // Düzenleme modu - mevcut video bilgilerini al
                    const existingVideo = youtubeVideos.find(v => v.id == videoId);
                    if (existingVideo) {
                        videoData.id = videoId;
                        videoData.is_active = existingVideo.is_active;
                        videoData.display_order = existingVideo.display_order || 0;
                    }
                    
                    response = await fetch('../api/youtube.php', {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(videoData)
                    });
                } else {
                    response = await fetch('../api/youtube.php', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(videoData)
                    });
                }
                
                const data = await response.json();
                
                if (data.success) {
                    showNotification(videoId && videoId !== '' ? 'Video güncellendi' : 'Video eklendi', 'success');
                    youtubeForm.reset();
                    const videoIdField = document.getElementById('youtubeVideoId');
                    if (videoIdField) {
                        videoIdField.value = '';
                    }
                    loadYouTubeVideos();
                } else {
                    showNotification(data.message || 'Hata oluştu', 'error');
                }
            } catch (error) {
                console.error('YouTube video submit error:', error);
                showNotification('Video kaydedilirken hata oluştu', 'error');
            }
        });
    }
});

function showYouTubeModal() {
    // Admin panelinde modal yok, sadece form göster/gizle
    const form = document.querySelector('#youtube .content-form');
    const youtubeSection = document.getElementById('youtube');
    
    if (form && youtubeSection) {
        // Önce YouTube bölümünü aktif yap
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });
        youtubeSection.classList.add('active');
        
        // Sidebar linklerini güncelle
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        const youtubeLink = document.querySelector('[data-section="youtube"]');
        if (youtubeLink) {
            youtubeLink.classList.add('active');
        }
        
        // Form göster ve odaklan
        form.style.display = 'block';
        form.style.background = '#fff3cd'; // Sarı arka plan ile vurgula
        form.style.border = '2px solid #ffc107'; // Sarı kenarlık
        
        // Forma scroll yap
        setTimeout(() => {
            form.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            // 3 saniye sonra normal renge döndür
            setTimeout(() => {
                form.style.background = 'white';
                form.style.border = '1px solid #e1e8ed';
            }, 3000);
        }, 100);
    }
}

function showYouTubeVideoModal(video = null) {
    const form = document.getElementById('youtubeForm');
    const submitButton = form.querySelector('button[type="submit"]');
    
    if (video) {
        console.log('Editing video:', video); // Debug log
        
        // Form alanlarını güvenli şekilde doldur
        const videoIdField = document.getElementById('youtubeVideoId');
        const titleField = document.getElementById('youtubeTitle');
        const urlField = document.getElementById('youtubeUrl');
        const descField = document.getElementById('youtubeDescription');
        const categoryField = document.getElementById('youtubeCategory');
        
        if (videoIdField) videoIdField.value = video.id || '';
        if (titleField) titleField.value = video.title || '';
        if (urlField) urlField.value = video.youtube_url || '';
        if (descField) descField.value = video.description || '';
        if (categoryField) categoryField.value = video.category || 'yoga_related';
        
        // Düzenleme modunda buton metnini değiştir
        if (submitButton) {
            submitButton.textContent = 'Video Güncelle';
            submitButton.style.background = '#28a745'; // Yeşil renk
        }
        
        console.log('Form filled with video data');
    } else {
        form.reset();
        const videoIdField = document.getElementById('youtubeVideoId');
        if (videoIdField) videoIdField.value = '';
        
        // Yeni ekleme modunda buton metnini değiştir
        if (submitButton) {
            submitButton.textContent = 'YouTube Video Ekle';
            submitButton.style.background = '#007bff'; // Mavi renk
        }
    }
    
    showYouTubeModal();
}

function hideYouTubeVideoModal() {
    // Admin panelinde modal yok, bu fonksiyon boş bırakılabilir
}

function editYouTubeVideo(videoId) {
    console.log('editYouTubeVideo called with ID:', videoId);
    console.log('Available videos:', youtubeVideos);
    
    const video = youtubeVideos.find(v => v.id == videoId); // == kullan, çünkü tip farkı olabilir
    
    if (video) {
        console.log('Video found for editing:', video);
        showYouTubeVideoModal(video);
    } else {
        console.error('Video not found with ID:', videoId);
        showNotification('Video bulunamadı', 'error');
    }
}

async function toggleYouTubeVideoStatus(videoId, newStatus) {
    try {
        const video = youtubeVideos.find(v => v.id === videoId);
        if (!video) return;
        
        const response = await fetch('../api/youtube.php', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                id: videoId,
                title: video.title,
                youtube_url: video.youtube_url,
                description: video.description,
                category: video.category,
                is_active: newStatus,
                display_order: video.display_order || 0
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification(`Video ${newStatus ? 'aktifleştirildi' : 'pasifleştirildi'}`, 'success');
            loadYouTubeVideos();
        } else {
            showNotification('Durum değiştirilirken hata oluştu', 'error');
        }
    } catch (error) {
        console.error('Toggle YouTube video status error:', error);
        showNotification('Durum değiştirilirken hata oluştu', 'error');
    }
}

async function deleteYouTubeVideo(videoId) {
    if (!confirm('Bu videoyu silmek istediğinizden emin misiniz?')) {
        return;
    }
    
    try {
        const response = await fetch('../api/youtube.php', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ id: videoId })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('Video silindi', 'success');
            loadYouTubeVideos();
        } else {
            showNotification('Video silinirken hata oluştu', 'error');
        }
    } catch (error) {
        console.error('Delete YouTube video error:', error);
        showNotification('Video silinirken hata oluştu', 'error');
    }
}

// Video sıralama fonksiyonları
async function moveVideoUp(videoId) {
    console.log('moveVideoUp called with videoId:', videoId);
    await changeVideoOrder(videoId, 'up');
}

async function moveVideoDown(videoId) {
    console.log('moveVideoDown called with videoId:', videoId);
    await changeVideoOrder(videoId, 'down');
}

async function changeVideoOrder(videoId, direction) {
    try {
        console.log('changeVideoOrder called:', { videoId, direction, videosCount: youtubeVideos.length });
        
        const currentVideo = youtubeVideos.find(v => v.id == videoId); // == kullan, ID string olabilir
        if (!currentVideo) {
            console.error('Video bulunamadı:', videoId);
            return;
        }

        const currentIndex = youtubeVideos.findIndex(v => v.id == videoId);
        console.log('Current index:', currentIndex);
        
        let newIndex;
        
        if (direction === 'up' && currentIndex > 0) {
            newIndex = currentIndex - 1;
        } else if (direction === 'down' && currentIndex < youtubeVideos.length - 1) {
            newIndex = currentIndex + 1;
        } else {
            console.log('Sınırda, hareket ettirilemez');
            return; // Sınırlarda, hareket ettirme
        }

        console.log('Moving from index', currentIndex, 'to', newIndex);
        
        const targetVideo = youtubeVideos[newIndex];
        
        // Display order değerlerini değiştir - index tabanlı yeni sistem
        const currentOrder = parseInt(currentVideo.display_order) || currentIndex;
        const targetOrder = parseInt(targetVideo.display_order) || newIndex;

        console.log('Updating orders:', { currentOrder, targetOrder });

        // Yeni order değerlerini hesapla
        const newCurrentOrder = newIndex;
        const newTargetOrder = currentIndex;

        console.log('New orders:', { newCurrentOrder, newTargetOrder });

        // İlk videoyu güncelle
        await updateVideoDisplayOrder(videoId, newCurrentOrder);
        // İkinci videoyu güncelle  
        await updateVideoDisplayOrder(targetVideo.id, newTargetOrder);
        
        showNotification('Video sırası değiştirildi', 'success');
        
        // Listeyi yenile
        loadYouTubeVideos();
        
    } catch (error) {
        console.error('Change video order error:', error);
        showNotification('Sıralama değiştirilirken hata oluştu', 'error');
    }
}

async function updateVideoDisplayOrder(videoId, newOrder) {
    console.log('updateVideoDisplayOrder called:', { videoId, newOrder });
    const video = youtubeVideos.find(v => v.id == videoId);
    if (!video) {
        console.error('Video not found for update:', videoId);
        return;
    }

    const response = await fetch('../api/youtube.php', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            id: videoId,
            title: video.title,
            youtube_url: video.youtube_url,
            description: video.description,
            category: video.category,
            is_active: video.is_active,
            display_order: newOrder
        })
    });

    const data = await response.json();
    if (!data.success) {
        throw new Error('Display order update failed');
    }
}

