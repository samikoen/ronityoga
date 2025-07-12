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

// DOM loaded - TEK BİR DOMContentLoaded EVENT
document.addEventListener('DOMContentLoaded', function() {
    
    // Mobile menu toggle
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    
    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', function() {
            sidebar.classList.toggle('active');
            sidebarOverlay.classList.toggle('active');
            this.classList.toggle('active');
        });
    }
    
    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', function() {
            sidebar.classList.remove('active');
            sidebarOverlay.classList.remove('active');
            mobileMenuToggle.classList.remove('active');
        });
    }
    
    // Navigation system
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Get section from data-section attribute
            const section = this.getAttribute('data-section');
            console.log('Clicked section:', section); // Debug
            
            if (section) {
                showSection(section);
                
                // Update active nav link
                document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
                this.classList.add('active');
            }
            
            // Close mobile menu
            if (window.innerWidth <= 768) {
                sidebar.classList.remove('active');
                sidebarOverlay.classList.remove('active');
                mobileMenuToggle.classList.remove('active');
            }
        });
    });
    
    // Initialize default section
    setTimeout(() => {
        showSection('dashboard');
    }, 500);
    
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
	
    // Navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Update active states
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
            
            this.classList.add('active');
            const section = document.getElementById(this.dataset.section);
            if (section) {
                section.classList.add('active');
            }
        });
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
    
    // Dashboard istatistiklerini yükle
    loadDashboardStats();
    
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
                    loadDashboardStats();
                } else {
                    alert('Hata: ' + (data.error || 'Resim yüklenemedi'));
                }
            } catch (error) {
                console.error('Gallery upload error:', error);
                alert('Yükleme sırasında hata oluştu!');
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
                    loadDashboardStats();
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
        }
    } catch (error) {
        console.error('Load classes error:', error);
    }
}

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
    // Site ayarlarını kaydet
    const siteTitleInput = document.querySelector('input[value="Ronit Yoga Studio"]');
    if (siteTitleInput) {
        const siteTitle = siteTitleInput.value;
        localStorage.setItem('yogaSiteTitle', siteTitle);
        alert('Site ayarları başarıyla kaydedildi!');
    }
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
                        <div class="gallery-date">${new Date(img.created_at).toLocaleDateString('tr-TR')}</div>
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
    if (confirm('Bu resmi silmek istediğinize emin misiniz?')) {
        try {
            const response = await fetch(`../api/gallery.php?id=${id}`, {
                method: 'DELETE'
            });
            
            const data = await response.json();
            
            if (data.success) {
                alert('Resim silindi!');
                loadGalleryImages();
                loadDashboardStats();
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
                loadDashboardStats();
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
                loadDashboardStats();
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
        }
    }
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
    // Show dashboard by default
    setTimeout(() => {
        showSection('dashboard');
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

