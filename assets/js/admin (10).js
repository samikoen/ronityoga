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
    
    // Close mobile menu when clicking on nav links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function() {
            if (window.innerWidth <= 768) {
                sidebar.classList.remove('active');
                sidebarOverlay.classList.remove('active');
                mobileMenuToggle.classList.remove('active');
            }
        });
    });
    
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
    
    // Mevcut hero image'i yükle - DÜZELTİLDİ
    loadHeroImage();
	
	// Mevcut logo'yu yükle
    loadLogo();

    // Auto-save every 30 seconds
    setInterval(saveData, 30000);

    // Sayfa yüklendiğinde dersleri yükle
    if (document.getElementById('classesTableBody')) {
        loadClasses();
    }
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
// DOMContentLoaded içine ekleyin

// Hero Carousel Upload
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
                    }
                }
            } catch (error) {
                console.error('Hero carousel upload error:', error);
                alert('Resim yükleme hatası!');
            }
        }
    });
}

// Hero resimlerini yükle
async function loadHeroImages() {
    try {
        const response = await fetch('../api/hero_images.php');
        const images = await response.json();
        
        const container = document.getElementById('heroImagesList');
        if (container) {
            container.innerHTML = images.map((img, index) => `
                <div class="hero-image-item">
                    <img src="../${img.image_url}" alt="${img.title || 'Hero Image'}">
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
            }
        } catch (error) {
            console.error('Delete hero image error:', error);
        }
    }
}

// Hero resim sırasını değiştir (opsiyonel)
window.moveHeroImage = function(id, direction) {
    alert('Sıralama özelliği yakında eklenecek!');
    // Bu özellik için hero_images tablosunda order_index güncellemesi gerekir
}

// Sayfa yüklendiğinde hero resimlerini yükle
if (document.getElementById('heroImagesList')) {
    loadHeroImages();
}