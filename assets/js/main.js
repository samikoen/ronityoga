// Hero image'i yükle
async function loadHeroImage() {
    try {
        // Önce localStorage kontrol et
        let heroImage = localStorage.getItem('yogaHeroImage');
        
        // Sonra veritabanından kontrol et
        const response = await fetch('api/settings.php?key=hero_image');
        const data = await response.json();
        
        if (data && data.setting_value) {
            heroImage = data.setting_value;
            // localStorage'ı da güncelle
            localStorage.setItem('yogaHeroImage', heroImage);
        }
        
        if (heroImage) {
            document.querySelector('.hero').style.background = 
                `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url('${heroImage}') center/cover`;
        }
    } catch (error) {
        console.log('Hero image load error:', error);
        // Hata durumunda sadece localStorage kullan
        const savedHeroImage = localStorage.getItem('yogaHeroImage');
        if (savedHeroImage) {
            document.querySelector('.hero').style.background = 
                `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url('${savedHeroImage}') center/cover`;
        }
    }
}
// main.js'e ekleyin veya loadHeroImage fonksiyonunu değiştirin

// Hero carousel'i yükle ve başlat
async function loadHeroCarousel() {
    try {
        // Hero resimlerini API'den al
        const response = await fetch('api/hero_images.php');
        const images = await response.json();
        
        if (images && images.length > 0) {
            // Carousel'i başlat
            initHeroCarousel(images);
        } else {
            // Eğer carousel resmi yoksa, eski tek resim sistemini kullan ve zoom efekti ekle
            loadHeroImageWithZoom();
        }
    } catch (error) {
        console.log('Hero carousel load error:', error);
        // Hata durumunda eski sistemi kullan ama zoom efekti ekle
        loadHeroImageWithZoom();
    }
}

// Hero image yükle ve zoom efekti ekle
async function loadHeroImageWithZoom() {
    try {
        const response = await fetch('api/settings.php?key=hero_image');
        const data = await response.json();
        
        if (data && data.setting_value) {
            updateHeroBackground(data.setting_value);
        } else {
            // Default image varsa onu da zoom efekti ile göster
            const heroSection = document.querySelector('.hero');
            if (heroSection) {
                const defaultImage = 'https://images.unsplash.com/photo-1545389336-cf090694435e?w=1600';
                updateHeroBackground(defaultImage);
            }
        }
    } catch (error) {
        console.log('Hero image load error:', error);
        // Fallback olarak default image ile zoom efekti
        const heroSection = document.querySelector('.hero');
        if (heroSection) {
            const defaultImage = 'https://images.unsplash.com/photo-1545389336-cf090694435e?w=1600';
            updateHeroBackground(defaultImage);
        }
    }
}

// FIXED - Hero carousel'i başlat (ilk resim için zoom efekti de dahil)
function initHeroCarousel(images) {
    const heroSection = document.querySelector('.hero');
    if (!heroSection) return;
    
    let currentIndex = 0;
    
    // İlk resmi göster ve zoom efektini başlat
    updateHeroBackground(images[currentIndex].image_url);
    
    // Eğer birden fazla resim varsa carousel'i başlat
    if (images.length > 1) {
        // Carousel göstergeleri ekle
        addCarouselIndicators(images, currentIndex);
        
        // Touch/swipe support for mobile
        addTouchSupport(images, currentIndex, heroSection);
        
        // Her 5 saniyede bir resmi değiştir
        const autoAdvance = setInterval(() => {
            currentIndex = (currentIndex + 1) % images.length;
            updateHeroBackground(images[currentIndex].image_url);
            updateIndicators(currentIndex);
        }, 5000);
        
        // Store interval and currentIndex globally for touch handlers
        window.carouselData = { autoAdvance, currentIndex, images };
    } else {
        // Tek resim varsa da zoom efekti olsun
        console.log('Tek resim var, zoom efekti başlatılıyor');
    }
}

// Add touch/swipe support for mobile carousel
function addTouchSupport(images, currentIndex, heroSection) {
    let startX = 0;
    let currentX = 0;
    let isDragging = false;
    
    heroSection.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
        isDragging = true;
        
        // Pause auto-advance during touch
        if (window.carouselData && window.carouselData.autoAdvance) {
            clearInterval(window.carouselData.autoAdvance);
        }
    }, { passive: true });
    
    heroSection.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        currentX = e.touches[0].clientX;
    }, { passive: true });
    
    heroSection.addEventListener('touchend', () => {
        if (!isDragging) return;
        isDragging = false;
        
        const diff = startX - currentX;
        if (Math.abs(diff) > 50) { // 50px threshold for swipe
            if (diff > 0) {
                // Swipe left - next image
                window.carouselData.currentIndex = (window.carouselData.currentIndex + 1) % images.length;
            } else {
                // Swipe right - previous image
                window.carouselData.currentIndex = (window.carouselData.currentIndex - 1 + images.length) % images.length;
            }
            updateHeroBackground(images[window.carouselData.currentIndex].image_url);
            updateIndicators(window.carouselData.currentIndex);
            
            // Restart zoom animation after swipe
            setTimeout(() => {
                const zoomBg = document.querySelector('.hero-zoom-bg');
                if (zoomBg) {
                    startZoomAnimation(zoomBg);
                }
            }, 100);
        }
        
        // Resume auto-advance after touch
        window.carouselData.autoAdvance = setInterval(() => {
            window.carouselData.currentIndex = (window.carouselData.currentIndex + 1) % images.length;
            updateHeroBackground(images[window.carouselData.currentIndex].image_url);
            updateIndicators(window.carouselData.currentIndex);
        }, 5000);
    }, { passive: true });
}

// JAVASCRIPT ZOOM - Hero arka planını güncelle
function updateHeroBackground(imageUrl) {
    const heroSection = document.querySelector('.hero');
    if (!heroSection) return;
    
    // Zoom background element'ini bul veya oluştur
    let zoomBg = heroSection.querySelector('.hero-zoom-bg');
    if (!zoomBg) {
        zoomBg = document.createElement('div');
        zoomBg.className = 'hero-zoom-bg';
        heroSection.appendChild(zoomBg);
    }
    
    // Background image'i zoom element'ine set et
    zoomBg.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url('${imageUrl}')`;
    
    // Ana hero'nun background'unu kaldır (zoom element kullanacağız)
    heroSection.style.backgroundImage = 'none';
    
    // Zoom animasyonunu başlat (resim yüklendikten sonra)
    setTimeout(() => {
        startZoomAnimation(zoomBg);
    }, 100);
}

// Global zoom animation control
let zoomAnimationFrame = null;

// Zoom animasyonu fonksiyonu - mobile optimized
function startZoomAnimation(zoomElement) {
    if (!zoomElement) return;
    
    // Mobile performance check - light zoom on mobile, disable only for reduced motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        zoomElement.style.transform = 'scale(1)';
        return;
    }
    
    // Mobile zoom animation - lighter but still animated
    if (window.innerWidth <= 768) {
        const mobileDuration = 6000; // Mobile için 6 saniye
        const mobileMaxScale = 1.08;  // Mobile için daha az zoom
        const mobileMinScale = 1.0;
        let mobileStartTime = Date.now();
        
        function mobileAnimate() {
            const elapsed = Date.now() - mobileStartTime;
            const progress = (elapsed % mobileDuration) / mobileDuration;
            
            // Mobile zoom out animation
            const currentScale = mobileMaxScale - (progress * (mobileMaxScale - mobileMinScale));
            
            zoomElement.style.transform = `scale(${currentScale})`;
            
            // Continue mobile animation
            zoomAnimationFrame = requestAnimationFrame(mobileAnimate);
        }
        
        // Start mobile animation
        mobileAnimate();
        return;
    }
    
    // Cancel previous animation if exists
    if (zoomAnimationFrame) {
        cancelAnimationFrame(zoomAnimationFrame);
    }
    
    const duration = 8000; // 8 saniye
    const maxScale = 1.15;
    const minScale = 1.0;
    let startTime = Date.now();
    
    function animate() {
        const elapsed = Date.now() - startTime;
        const progress = (elapsed % duration) / duration;
        
        // Zoom out from maxScale to minScale
        const currentScale = maxScale - (progress * (maxScale - minScale));
        
        zoomElement.style.transform = `scale(${currentScale})`;
        
        // Continue animation
        zoomAnimationFrame = requestAnimationFrame(animate);
    }
    
    // Start animation
    animate();
}

// SIMPLIFIED - Carousel göstergeleri ekle
function addCarouselIndicators(images, currentIndex) {
    const heroSection = document.querySelector('.hero');
    if (!heroSection) return;
    
    // Varolan indicators'ı kaldır
    const existingIndicators = heroSection.querySelector('.carousel-indicators');
    if (existingIndicators) {
        existingIndicators.remove();
    }
    
    const indicators = document.createElement('div');
    indicators.className = 'carousel-indicators';
    indicators.style.cssText = `
        position: absolute;
        bottom: 30px;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        gap: 10px;
        z-index: 10;
    `;
    
    images.forEach((img, index) => {
        const dot = document.createElement('span');
        dot.style.cssText = `
            width: 16px;
            height: 16px;
            border-radius: 50%;
            background: ${index === currentIndex ? 'white' : 'rgba(255,255,255,0.5)'};
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 2px 5px rgba(0,0,0,0.3);
            margin: 2px;
            min-width: 44px;
            min-height: 44px;
            display: flex;
            align-items: center;
            justify-content: center;
        `;
        
        dot.addEventListener('click', () => {
            window.currentCarouselIndex = index;
            updateHeroBackground(img.image_url);
            updateIndicators(index);
        });
        
        indicators.appendChild(dot);
    });
    
    // Add navigation arrows for mobile
    addNavigationArrows(images, heroSection);
    
    heroSection.appendChild(indicators);
    window.carouselImages = images;
}

// Add navigation arrows for better mobile accessibility
function addNavigationArrows(images, heroSection) {
    // Previous button
    const prevBtn = document.createElement('button');
    prevBtn.innerHTML = '‹';
    prevBtn.className = 'carousel-nav carousel-prev';
    prevBtn.style.cssText = `
        position: absolute;
        left: 20px;
        top: 50%;
        transform: translateY(-50%);
        background: rgba(255,255,255,0.2);
        border: 2px solid rgba(255,255,255,0.5);
        color: white;
        font-size: 24px;
        width: 50px;
        height: 50px;
        border-radius: 50%;
        cursor: pointer;
        z-index: 10;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        justify-content: center;
    `;
    
    // Next button
    const nextBtn = document.createElement('button');
    nextBtn.innerHTML = '›';
    nextBtn.className = 'carousel-nav carousel-next';
    nextBtn.style.cssText = `
        position: absolute;
        right: 20px;
        top: 50%;
        transform: translateY(-50%);
        background: rgba(255,255,255,0.2);
        border: 2px solid rgba(255,255,255,0.5);
        color: white;
        font-size: 24px;
        width: 50px;
        height: 50px;
        border-radius: 50%;
        cursor: pointer;
        z-index: 10;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        justify-content: center;
    `;
    
    // Event listeners
    prevBtn.addEventListener('click', () => {
        if (window.carouselData) {
            window.carouselData.currentIndex = (window.carouselData.currentIndex - 1 + images.length) % images.length;
            updateHeroBackground(images[window.carouselData.currentIndex].image_url);
            updateIndicators(window.carouselData.currentIndex);
        }
    });
    
    nextBtn.addEventListener('click', () => {
        if (window.carouselData) {
            window.carouselData.currentIndex = (window.carouselData.currentIndex + 1) % images.length;
            updateHeroBackground(images[window.carouselData.currentIndex].image_url);
            updateIndicators(window.carouselData.currentIndex);
        }
    });
    
    // Hover effects
    [prevBtn, nextBtn].forEach(btn => {
        btn.addEventListener('mouseenter', () => {
            btn.style.background = 'rgba(255,255,255,0.4)';
            btn.style.transform = btn === prevBtn ? 'translateY(-50%) scale(1.1)' : 'translateY(-50%) scale(1.1)';
        });
        
        btn.addEventListener('mouseleave', () => {
            btn.style.background = 'rgba(255,255,255,0.2)';
            btn.style.transform = 'translateY(-50%) scale(1)';
        });
    });
    
    heroSection.appendChild(prevBtn);
    heroSection.appendChild(nextBtn);
}

// SIMPLIFIED - Göstergeleri güncelle
function updateIndicators(activeIndex) {
    const dots = document.querySelectorAll('.carousel-indicators span');
    dots.forEach((dot, index) => {
        dot.style.background = index === activeIndex ? 'white' : 'rgba(255,255,255,0.5)';
        dot.style.width = index === activeIndex ? '30px' : '12px';
        dot.style.borderRadius = index === activeIndex ? '6px' : '50%';
    });
}

// DUPLICATE DOMCONTENTLOADED REMOVED - ENHANCED VERSION AT THE END
// Logo'yu yükle - MEVCUT KORUNDU
async function loadLogo() {
    try {
        const response = await fetch('api/settings.php?key=site_logo');
        const data = await response.json();
        
        if (data && data.setting_value) {
            const logoImg = document.getElementById('siteLogo');
            if (logoImg) {
                logoImg.src = data.setting_value;
                logoImg.style.display = 'block';
            }
        }
    } catch (error) {
        console.log('Logo load error:', error);
    }
}

// Profil resmini yükle - YENİ EKLENDİ
async function loadProfileImage() {
    try {
        const response = await fetch('api/settings.php?key=profile_image');
        const data = await response.json();
        
        if (data && data.setting_value) {
            const aboutImage = document.querySelector('.about-image');
            if (aboutImage) {
                aboutImage.innerHTML = `<img src="${data.setting_value}" alt="Profil Resmi">`;
                aboutImage.classList.remove('no-image');
            }
        } else {
            // Profil resmi yoksa gradient arka planı koru
            const aboutImage = document.querySelector('.about-image');
            if (aboutImage) {
                aboutImage.innerHTML = '';
                aboutImage.classList.add('no-image');
            }
        }
    } catch (error) {
        console.log('Profile image load error:', error);
        // Hata durumunda gradient arka planı koru
        const aboutImage = document.querySelector('.about-image');
        if (aboutImage) {
            aboutImage.innerHTML = '';
            aboutImage.classList.add('no-image');
        }
    }
}

// Site içeriğini yükle
async function loadSiteContent() {
    try {
        const response = await fetch('api/site_content.php');
        const content = await response.json();
        
        // About içeriğini yükle
        if (content.about) {
            const aboutTitle = document.querySelector('#about h2');
            const aboutTextDiv = document.querySelector('#about-text');
            
            if (aboutTitle && content.about.title) {
                aboutTitle.textContent = content.about.title;
            }
            
            if (aboutTextDiv && content.about.content) {
                // Paragrafları ayır
                const paragraphs = content.about.content.split('\n\n').filter(p => p.trim());
                
                // Mevcut içeriği temizle
                aboutTextDiv.innerHTML = '';
                
                // Yeni paragrafları ekle
                paragraphs.forEach((text) => {
                    if (text.trim()) {
                        const p = document.createElement('p');
                        p.textContent = text.trim();
                        aboutTextDiv.appendChild(p);
                    }
                });
            }
        }
    } catch (error) {
        console.error('Site content loading error:', error);
    }
}

// Ayarları yükle ve uygula
async function loadSiteSettings() {
    try {
        const response = await fetch('api/settings.php');
        const settings = await response.json();
        
        console.log('Yüklenen ayarlar:', settings); // DEBUG
        
        if (settings) {
            // Site başlığı - LOGO DESTEĞİ İLE GÜNCELLENDİ
            if (settings.site_title) {
                document.title = settings.site_title;
                // siteTitle DOM elementi artık HİÇBİR ZAMAN değiştirilmeyecek
                // HTML'deki "RONIT YOGA" sabit kalacak
            }
            
            // Hakkımda bölümü - İsim güncelleme kaldırıldı
            // aboutTitle artık değiştirilmeyecek
            
            // Hakkımda içeriği - DOĞRU SELECTOR
            if (settings.about) {
                const aboutTextDiv = document.querySelector('#about-text'); // # ile ID seçici
                if (aboutTextDiv) {
                    console.log('About text bulundu, güncelleniyor...'); // DEBUG
                    
                    // Paragrafları ayır (çift satır sonu ile)
                    const paragraphs = settings.about.split('\n\n').filter(p => p.trim());
                    
                    // Eğer çift satır sonu yoksa tek satır sonu ile dene
                    if (paragraphs.length <= 1) {
                        paragraphs = settings.about.split('\n').filter(p => p.trim());
                    }
                    
                    // Mevcut içeriği temizle
                    aboutTextDiv.innerHTML = '';
                    
                    // Yeni paragrafları ekle
                    paragraphs.forEach((text, index) => {
                        if (text.trim()) {
                            const p = document.createElement('p');
                            p.textContent = text.trim();
                            aboutTextDiv.appendChild(p);
                            console.log(`Paragraf ${index + 1} eklendi:`, text.trim()); // DEBUG
                        }
                    });
                } else {
                    // YouTube sayfasında about-text olmayabilir, bu normal
                    // console.log('about-text elementi bulunamadı!'); // DEBUG
                }
            }
            
            // Sosyal medya linkleri
            updateSocialLinks(settings);
        }
    } catch (error) {
        console.error('Ayarlar yüklenemedi:', error);
    }
}

// Sosyal medya linklerini güncelle - PNG LOGO DESTEĞİ
function updateSocialLinks(settings) {
    const socialLinks = document.querySelector('.social-links');
    if (socialLinks) {
        socialLinks.innerHTML = '';
        
        if (settings.instagram) {
            socialLinks.innerHTML += `
                <a href="${settings.instagram}" target="_blank" class="instagram">
                    <img src="uploads/social/instagram.png" alt="Instagram" onerror="this.outerHTML='📷'">
                </a>`;
        }
        if (settings.facebook) {
            socialLinks.innerHTML += `
                <a href="${settings.facebook}" target="_blank" class="facebook">
                    <img src="uploads/social/facebook.png" alt="Facebook" onerror="this.outerHTML='📘'">
                </a>`;
        }
        if (settings.youtube) {
            socialLinks.innerHTML += `
                <a href="${settings.youtube}" target="_blank" class="youtube">
                    <img src="uploads/social/youtube.png" alt="YouTube" onerror="this.outerHTML='▶️'">
                </a>`;
        }
        if (settings.email) {
            socialLinks.innerHTML += `<a href="mailto:${settings.email}">✉️</a>`;
        }
    }
}


// Yaz dönemi derslerini yükle
async function loadSummerClasses() {
    try {
        const response = await fetch('api/summer-classes.php?action=get_schedule');
        const data = await response.json();
        
        if (data.success && data.schedule) {
            populateSummerClassOptions(data.schedule);
            displayUpcomingClasses(data.schedule);
        }
    } catch (error) {
        console.error('Yaz dönemi dersleri yüklenemedi:', error);
    }
}

// Ders seçeneklerini doldur
function populateSummerClassOptions(schedule) {
    const classDateSelect = document.getElementById('classDate');
    if (!classDateSelect) return;
    
    classDateSelect.innerHTML = '<option value="">Tarih seçin...</option>';
    
    schedule.forEach(cls => {
        const option = document.createElement('option');
        option.value = cls.class_date;
        option.textContent = `${cls.formatted_date} - ${cls.class_day} ${cls.formatted_time}`;
        
        // Dolu dersler için disable
        if (cls.is_full) {
            option.disabled = true;
            option.textContent += ' (Dolu)';
        } else {
            option.textContent += ` (${cls.available_spots} yer)`;
        }
        
        classDateSelect.appendChild(option);
    });
}

// Yaklaşan dersleri göster
function displayUpcomingClasses(schedule) {
    const upcomingContainer = document.getElementById('upcomingClasses');
    if (!upcomingContainer) return;
    
    if (schedule.length === 0) {
        upcomingContainer.innerHTML = '<p>Henüz planlanmış ders bulunmuyor.</p>';
        return;
    }
    
    upcomingContainer.innerHTML = schedule.slice(0, 5).map(cls => {
        const capacityPercentage = (cls.actual_registrations / cls.max_capacity) * 100;
        
        return `
            <div class="upcoming-class-item">
                <div class="class-date-info">
                    <span class="class-date">${cls.formatted_date}</span>
                    <span class="class-day">${cls.class_day} ${cls.formatted_time}</span>
                </div>
                <div class="class-capacity">
                    <span class="capacity-info">${cls.actual_registrations}/${cls.max_capacity} kişi</span>
                    <span class="${cls.is_full ? 'spots-full' : 'spots-left'}">
                        ${cls.is_full ? 'Dolu' : cls.available_spots + ' yer kaldı'}
                    </span>
                </div>
                <div class="capacity-bar">
                    <div class="capacity-fill" style="width: ${capacityPercentage}%"></div>
                </div>
            </div>
        `;
    }).join('');
}

// Üye sistem değişkenleri
let currentMember = null;
let sessionToken = localStorage.getItem('member_session_token');

// Üye sistemi başlat
function initMemberSystem() {
    // Auth butonlarını dinle
    document.getElementById('showLogin')?.addEventListener('click', () => showAuthForm('login'));
    document.getElementById('showRegister')?.addEventListener('click', () => showAuthForm('register'));
    document.getElementById('showGuest')?.addEventListener('click', () => showAuthForm('guest'));
    
    // Form eventlerini dinle
    document.getElementById('memberLoginForm')?.addEventListener('submit', handleLogin);
    document.getElementById('memberRegisterForm')?.addEventListener('submit', handleRegister);
    document.getElementById('logoutBtn')?.addEventListener('click', handleLogout);
    
    // Oturum kontrol et
    if (sessionToken) {
        verifySession();
    }
}

// Auth formlarını göster
function showAuthForm(type) {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const guestFields = document.getElementById('guestFields');
    
    // Butonları güncelle
    document.querySelectorAll('.auth-button').forEach(btn => btn.classList.remove('active'));
    
    if (type === 'login') {
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
        guestFields.style.display = 'none';
        document.getElementById('showLogin').classList.add('active');
        // Misafir alanlarının required özelliklerini kaldır
        removeGuestFieldsRequired();
    } else if (type === 'register') {
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
        guestFields.style.display = 'none';
        document.getElementById('showRegister').classList.add('active');
        // Misafir alanlarının required özelliklerini kaldır
        removeGuestFieldsRequired();
    } else if (type === 'guest') {
        loginForm.style.display = 'none';
        registerForm.style.display = 'none';
        guestFields.style.display = 'block';
        document.getElementById('showGuest').classList.add('active');
        // Misafir alanlarının required özelliklerini ekle
        addGuestFieldsRequired();
    }
}

// Misafir alanlarının required özelliklerini kaldır
function removeGuestFieldsRequired() {
    const guestFields = document.getElementById('guestFields');
    const requiredFields = guestFields.querySelectorAll('input[required], select[required]');
    requiredFields.forEach(field => {
        field.removeAttribute('required');
    });
}

// Misafir alanlarının required özelliklerini ekle
function addGuestFieldsRequired() {
    const guestFields = document.getElementById('guestFields');
    const nameField = guestFields.querySelector('input[name="participant_name"]');
    const emailField = guestFields.querySelector('input[name="participant_email"]');
    const phoneField = guestFields.querySelector('input[name="participant_phone"]');
    
    if (nameField) nameField.setAttribute('required', '');
    if (emailField) emailField.setAttribute('required', '');
    if (phoneField) phoneField.setAttribute('required', '');
}

// Üye girişi
async function handleLogin(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const data = {
        action: 'login',
        email: formData.get('email'),
        password: formData.get('password')
    };
    
    try {
        const response = await fetch('api/member-auth.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.success) {
            sessionToken = result.session_token;
            localStorage.setItem('member_session_token', sessionToken);
            currentMember = result.member;
            showMemberInfo();
            showNotification('Giriş başarılı! 🎉', 'success');
        } else {
            showNotification(result.error || 'Giriş başarısız', 'error');
        }
    } catch (error) {
        showNotification('Bir hata oluştu: ' + error.message, 'error');
    }
}

// Üye kayıt
async function handleRegister(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const data = {
        action: 'register',
        first_name: formData.get('first_name'),
        last_name: formData.get('last_name'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        password: formData.get('password')
    };
    
    try {
        const response = await fetch('api/member-auth.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.success) {
            sessionToken = result.session_token;
            localStorage.setItem('member_session_token', sessionToken);
            currentMember = result.member;
            showMemberInfo();
            showNotification('Üyeliğiniz oluşturuldu! 🎉', 'success');
        } else {
            showNotification(result.error || 'Kayıt başarısız', 'error');
        }
    } catch (error) {
        showNotification('Bir hata oluştu: ' + error.message, 'error');
    }
}

// Üye bilgilerini göster
function showMemberInfo() {
    const authSection = document.getElementById('memberAuthSection');
    const memberInfo = document.getElementById('memberInfo');
    const memberName = document.getElementById('memberName');
    const guestFields = document.getElementById('guestFields');
    
    // Auth formlarını gizle
    authSection.querySelector('.auth-toggle').style.display = 'none';
    authSection.querySelector('#loginForm').style.display = 'none';
    authSection.querySelector('#registerForm').style.display = 'none';
    
    // Üye bilgilerini göster
    memberInfo.style.display = 'block';
    memberName.textContent = currentMember.first_name + ' ' + currentMember.last_name;
    
    // Misafir alanlarını gizle ve required özelliklerini kaldır
    guestFields.style.display = 'none';
    
    // Required özelliklerini kaldır
    const requiredFields = guestFields.querySelectorAll('input[required], select[required]');
    requiredFields.forEach(field => {
        field.removeAttribute('required');
    });
}

// Çıkış yap
function handleLogout() {
    localStorage.removeItem('member_session_token');
    sessionToken = null;
    currentMember = null;
    
    // Formları sıfırla
    const authSection = document.getElementById('memberAuthSection');
    authSection.querySelector('.auth-toggle').style.display = 'block';
    document.getElementById('memberInfo').style.display = 'none';
    const guestFields = document.getElementById('guestFields');
    guestFields.style.display = 'block';
    
    // Required özelliklerini geri ekle
    const nameField = guestFields.querySelector('input[name="participant_name"]');
    const emailField = guestFields.querySelector('input[name="participant_email"]');
    const phoneField = guestFields.querySelector('input[name="participant_phone"]');
    
    if (nameField) nameField.setAttribute('required', '');
    if (emailField) emailField.setAttribute('required', '');
    if (phoneField) phoneField.setAttribute('required', '');
    
    showAuthForm('login');
    showNotification('Çıkış yapıldı', 'success');
}

// Oturum doğrula
async function verifySession() {
    try {
        const response = await fetch(`api/member-auth.php?action=verify&session_token=${sessionToken}`);
        const result = await response.json();
        
        if (result.success) {
            currentMember = result.member;
            showMemberInfo();
        } else {
            localStorage.removeItem('member_session_token');
            sessionToken = null;
        }
    } catch (error) {
        localStorage.removeItem('member_session_token');
        sessionToken = null;
    }
}

// Yaz dönemi ders kayıt formu
function initSummerClassForm() {
    const form = document.getElementById('summerClassForm');
    if (!form) return;
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = new FormData(form);
        const data = {
            action: 'register',
            class_date: formData.get('class_date'),
            participant_level: formData.get('participant_level'),
            notes: formData.get('notes')
        };
        
        // Üye oturum token'i ekle
        if (sessionToken) {
            data.session_token = sessionToken;
        } else {
            // Misafir kullanıcı için bilgileri ekle
            data.participant_name = formData.get('participant_name');
            data.participant_email = formData.get('participant_email');
            data.participant_phone = formData.get('participant_phone');
        }
        
        console.log('Gönderilen veri:', data);
        
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        
        try {
            submitBtn.textContent = 'Kaydediliyor...';
            submitBtn.disabled = true;
            
            const response = await fetch('api/summer-classes.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            
            const result = await response.json();
            console.log('API Yanıtı:', result);
            
            if (result.success) {
                showNotification('Ders kaydınız başarıyla alındı! 🎉', 'success');
                form.reset();
                
                // Programı yeniden yükle
                await loadSummerClasses();
            } else {
                showNotification(result.error || result.message || 'Kayıt sırasında bir hata oluştu.', 'error');
            }
        } catch (error) {
            console.error('Kayıt hatası:', error);
            showNotification('Kayıt sırasında bir hata oluştu: ' + error.message, 'error');
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    });
}

// Bildirim göster
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span>${message}</span>
            <button onclick="this.parentElement.parentElement.remove()" class="close-btn">&times;</button>
        </div>
    `;
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        max-width: 400px;
        padding: 1rem;
        border-radius: 8px;
        color: white;
        background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#007bff'};
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        animation: slideIn 0.3s ease;
        font-size: 0.9rem;
        line-height: 1.4;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

// Eski loadClasses fonksiyonu - artık kullanılmıyor ama backup için kalsın
async function loadClassesLegacy() {
    try {
        const response = await fetch('api/classes.php');
        const classes = await response.json();
        
        const classesGrid = document.getElementById('classesGrid');
        
        if (classesGrid && Array.isArray(classes)) {
            // Store classes data for filtering
            window.classesData = classes;
            
            classesGrid.innerHTML = classes.map(cls => `
                <div class="class-card" data-level="${cls.level}">
                    <div class="class-image"></div>
                    <div class="class-content">
                        <h3>${cls.name}</h3>
                        <p>${cls.description}</p>
                        <div class="class-details">
                            <div>
                                <span class="class-level">Seviye: ${cls.level}</span><br>
                                <span class="class-duration">Süre: ${cls.duration} dakika</span><br>
                                <span class="class-capacity">Kapasite: ${cls.capacity} kişi</span>
                            </div>
                            <a href="#reservation" class="book-button" onclick="selectClass('${cls.id}', '${cls.name}')">Rezervasyon</a>
                        </div>
                    </div>
                </div>
            `).join('');
            
            // Populate reservation form class select
            populateReservationClasses(classes);
        }
    } catch (error) {
        console.error('Dersler yüklenemedi:', error);
        // Hata durumunda varsayılan içerik göster
        const classesGrid = document.getElementById('classesGrid');
        if (classesGrid) {
            classesGrid.innerHTML = `
                <div class="class-card">
                    <div class="class-image"></div>
                    <div class="class-content">
                        <h3>Dersler Yüklüniyor...</h3>
                        <p>Lütfen daha sonra tekrar deneyin.</p>
                    </div>
                </div>
            `;
        }
    }
}

// YENİ FONKSİYONLAR - ENHANCED SECTIONS

// Classes filter functionality
function initClassesFilter() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    const classCards = document.querySelectorAll('.class-card');
    
    filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // Remove active class from all buttons
            filterBtns.forEach(b => b.classList.remove('active'));
            // Add active class to clicked button
            this.classList.add('active');
            
            const filterValue = this.getAttribute('data-filter');
            
            classCards.forEach(card => {
                if (filterValue === 'all' || card.getAttribute('data-level') === filterValue) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });
}

// Populate reservation form with classes
function populateReservationClasses(classes) {
    const select = document.getElementById('reservationClass');
    if (select && classes) {
        select.innerHTML = '<option value="">Ders seçin...</option>';
        classes.forEach(cls => {
            select.innerHTML += `<option value="${cls.id}">${cls.name}</option>`;
        });
    }
}

// Select class for reservation
function selectClass(classId, className) {
    const select = document.getElementById('reservationClass');
    if (select) {
        select.value = classId;
    }
    // Smooth scroll to reservation section
    document.getElementById('reservation').scrollIntoView({ behavior: 'smooth' });
}

// Load gallery images
async function loadGallery() {
    try {
        const response = await fetch('api/gallery-public.php');
        const images = await response.json();
        
        const galleryGrid = document.getElementById('galleryGrid');
        
        if (galleryGrid && Array.isArray(images)) {
            galleryGrid.innerHTML = images.map(img => `
                <div class="gallery-item">
                    <img src="${img.image_url}" alt="${img.title}" onclick="openGalleryModal('${img.image_url}', '${img.title}')">
                    <div class="gallery-overlay">
                        <h3>${img.title}</h3>
                    </div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Galeri yüklenemedi:', error);
        const galleryGrid = document.getElementById('galleryGrid');
        if (galleryGrid) {
            galleryGrid.innerHTML = `
                <div class="gallery-item">
                    <div style="display: flex; align-items: center; justify-content: center; height: 250px; background: #f0f0f0; color: #666;">
                        <p>Galeri resimleri yüklenemedi</p>
                    </div>
                </div>
            `;
        }
    }
}

// Gallery modal
function openGalleryModal(imageUrl, title) {
    const modal = document.createElement('div');
    modal.className = 'gallery-modal';
    modal.innerHTML = `
        <div class="gallery-modal-content">
            <span class="close-modal" onclick="closeGalleryModal()">&times;</span>
            <img src="${imageUrl}" alt="${title}">
            <h3>${title}</h3>
        </div>
    `;
    
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.9);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
    `;
    
    document.body.appendChild(modal);
}

function closeGalleryModal() {
    const modal = document.querySelector('.gallery-modal');
    if (modal) {
        modal.remove();
    }
}

// Load blog posts
async function loadBlog() {
    try {
        const response = await fetch('api/blog.php');
        
        if (!response.ok) {
            console.warn('Blog API not available, skipping blog load');
            return;
        }
        
        const posts = await response.json();
        
        // Blog feature henüz aktif değilse
        if (posts.success === false) {
            console.info('Blog feature not initialized yet');
            return;
        }
        
        const blogGrid = document.getElementById('blogGrid');
        
        if (blogGrid && Array.isArray(posts)) {
            blogGrid.innerHTML = posts.map(post => `
                <div class="blog-card">
                    <div class="blog-image" style="background-image: url('${post.image_url || ''}')"></div>
                    <div class="blog-content">
                        <div class="blog-date">${formatDate(post.created_at)}</div>
                        <h3>${post.title}</h3>
                        <p>${post.excerpt || post.content.substring(0, 150)}...</p>
                        <a href="#" class="read-more" onclick="openBlogPost('${post.id}')">Devamını Oku</a>
                    </div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Blog yüklenemedi:', error);
        const blogGrid = document.getElementById('blogGrid');
        if (blogGrid) {
            blogGrid.innerHTML = `
                <div class="blog-card">
                    <div class="blog-content">
                        <h3>Blog yazıları yüklenemedi</h3>
                        <p>Lütfen daha sonra tekrar deneyin.</p>
                    </div>
                </div>
            `;
        }
    }
}

// Format date for blog
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Open blog post (placeholder)
function openBlogPost(postId) {
    alert(`Blog yazısı #${postId} için detay sayfası yakında eklenecek!`);
}

// Handle reservation form submission
function initReservationForm() {
    const form = document.querySelector('.reservation-form');
    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = new FormData(form);
            const data = {
                class_id: document.getElementById('reservationClass').value,
                date: document.getElementById('reservationDate').value,
                time: document.getElementById('reservationTime').value,
                name: document.getElementById('customerName').value,
                email: document.getElementById('customerEmail').value,
                phone: document.getElementById('customerPhone').value,
                notes: document.getElementById('reservationNotes').value
            };
            
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            
            try {
                submitBtn.textContent = 'Gönderiliyor...';
                submitBtn.disabled = true;
                
                const response = await fetch('api/reservations.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                });
                
                const result = await response.json();
                
                if (result.success) {
                    alert('Rezervasyon talebiniz başarıyla gönderildi! En kısa sürede size dönüş yapacağız.');
                    form.reset();
                } else {
                    alert('Rezervasyon gönderilirken bir hata oluştu. Lütfen tekrar deneyin.');
                }
            } catch (error) {
                console.error('Rezervasyon hatası:', error);
                alert('Rezervasyon gönderilirken bir hata oluştu. Lütfen tekrar deneyin.');
            } finally {
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        });
    }
}

// Handle contact form submission
function initContactForm() {
    const form = document.querySelector('.contact-form');
    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const data = {
                name: document.getElementById('contactName').value,
                email: document.getElementById('contactEmailForm').value,
                subject: document.getElementById('contactSubject').value,
                message: document.getElementById('contactMessage').value
            };
            
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            
            try {
                submitBtn.textContent = 'Gönderiliyor...';
                submitBtn.disabled = true;
                
                const response = await fetch('api/contact.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                });
                
                const result = await response.json();
                
                if (result.success) {
                    alert('Mesajınız başarıyla gönderildi! En kısa sürede size dönüş yapacağız.');
                    form.reset();
                } else {
                    alert('Mesaj gönderilirken bir hata oluştu. Lütfen tekrar deneyin.');
                }
            } catch (error) {
                console.error('Mesaj hatası:', error);
                alert('Mesaj gönderilirken bir hata oluştu. Lütfen tekrar deneyin.');
            } finally {
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        });
    }
}

// Load contact info from admin
async function loadContactInfo() {
    try {
        const response = await fetch('api/settings.php');
        const settings = await response.json();
        
        if (settings) {
            // Update contact info
            if (settings.email) {
                const emailElement = document.getElementById('contactEmail');
                if (emailElement) emailElement.textContent = settings.email;
            }
            
            if (settings.phone) {
                const phoneElement = document.getElementById('contactPhone');
                if (phoneElement) phoneElement.textContent = settings.phone;
            }
            
            if (settings.address) {
                const addressElement = document.querySelector('.contact-item:nth-child(3) .contact-text p');
                if (addressElement) addressElement.textContent = settings.address;
            }
        }
    } catch (error) {
        console.error('İletişim bilgileri yüklenemedi:', error);
    }
}

// Hamburger Menu Functions
function toggleMenu() {
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.getElementById('navLinks');
    
    if (hamburger && navLinks) {
        hamburger.classList.toggle('active');
        navLinks.classList.toggle('show');
        
        // Update aria-expanded for accessibility
        const isExpanded = navLinks.classList.contains('show');
        hamburger.setAttribute('aria-expanded', isExpanded.toString());
    }
}

function closeMenu() {
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.getElementById('navLinks');
    
    if (hamburger && navLinks) {
        hamburger.classList.remove('active');
        navLinks.classList.remove('show');
        hamburger.setAttribute('aria-expanded', 'false');
    }
}

// Intersection Observer for animations
function initScrollAnimations() {
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    // Observe all elements with fade-in-up class
    document.querySelectorAll('.fade-in-up').forEach(el => {
        observer.observe(el);
    });
}

// Enhanced form validation
function initFormValidation() {
    const form = document.querySelector('.contact-form');
    if (!form) return;
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Add loading state
        const submitButton = form.querySelector('.submit-button');
        const originalText = submitButton.textContent;
        submitButton.textContent = 'Gönderiliyor...';
        submitButton.disabled = true;
        form.classList.add('loading');
        
        // Simulate form submission
        setTimeout(() => {
            form.classList.remove('loading');
            submitButton.textContent = originalText;
            submitButton.disabled = false;
            
            // Show success message
            const successMessage = document.createElement('div');
            successMessage.className = 'success-message';
            successMessage.textContent = 'Mesajınız başarıyla gönderildi!';
            form.appendChild(successMessage);
            
            // Reset form
            form.reset();
            
            // Remove success message after 3 seconds
            setTimeout(() => {
                successMessage.remove();
            }, 3000);
        }, 2000);
    });
}

// Accessibility improvements
function initAccessibility() {
    // Add skip link
    const skipLink = document.createElement('a');
    skipLink.href = '#main-content';
    skipLink.className = 'skip-link';
    skipLink.textContent = 'Ana içeriğe geç';
    document.body.insertBefore(skipLink, document.body.firstChild);
    
    // Update hamburger button accessibility
    const hamburger = document.getElementById('hamburger');
    if (hamburger) {
        hamburger.addEventListener('click', function() {
            const isExpanded = hamburger.getAttribute('aria-expanded') === 'true';
            hamburger.setAttribute('aria-expanded', !isExpanded);
            hamburger.setAttribute('aria-label', isExpanded ? 'Menüyü aç' : 'Menüyü kapat');
        });
    }
    
    // Enhanced keyboard navigation
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeMenu();
        }
    });
}

// Performance optimizations
function initPerformanceOptimizations() {
    // Lazy load images
    const images = document.querySelectorAll('img[data-src]');
    const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.remove('lazy');
                imageObserver.unobserve(img);
            }
        });
    });
    
    images.forEach(img => imageObserver.observe(img));
    
    // Preload critical resources
    const preloadLinks = [
        'assets/css/style.css',
        'assets/css/optimized-styles.css'
    ];
    
    preloadLinks.forEach(href => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'style';
        link.href = href;
        document.head.appendChild(link);
    });
}

// Update hamburger menu accessibility
function updateHamburgerAccessibility() {
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.getElementById('navLinks');
    
    if (hamburger) {
        hamburger.addEventListener('click', function() {
            const isOpen = navLinks.classList.contains('show');
            hamburger.setAttribute('aria-expanded', isOpen);
            hamburger.setAttribute('aria-label', isOpen ? 'Menüyü kapat' : 'Menüyü aç');
        });
    }
}

// Sayfa yüklendiğinde - ENHANCED VERSION
document.addEventListener('DOMContentLoaded', function() {
    // Load content
    loadHeroCarousel();
    loadLogo();
    loadProfileImage();
    loadSiteSettings();
    loadSiteContent();
    loadSummerClasses();
    loadGallery();
    loadBlog();
    loadContactInfo();
    
    // Hamburger menü event listener (hemen kur)
    const hamburger = document.getElementById('hamburger');
    if (hamburger) {
        hamburger.addEventListener('click', toggleMenu);
    }
    
    // Initialize enhanced features (biraz gecikme ile)
    setTimeout(() => {
        initMemberSystem();
        initSummerClassForm();
        initReservationForm();
        initContactForm();
    }, 500); // Daha kısa gecikme
    
    // Menü dışına tıklandığında kapat
    document.addEventListener('click', function(event) {
        const navLinks = document.getElementById('navLinks');
        const hamburger = document.getElementById('hamburger');
        
        if (navLinks && hamburger) {
            if (navLinks.classList.contains('show') && 
                !navLinks.contains(event.target) && 
                !hamburger.contains(event.target)) {
                closeMenu();
            }
        }
    });
    
    // Smooth scrolling
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const offsetTop = target.offsetTop - 80;
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
                closeMenu();
            }
        });
    });
    
    // Close menu on scroll
    window.addEventListener('scroll', function() {
        closeMenu();
    });
    
    // Close gallery modal on escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeGalleryModal();
        }
    });

    // Newsletter signup functionality
    const newsletterForm = document.getElementById('newsletterForm');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const email = document.getElementById('newsletterEmail').value;
            const submitBtn = this.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            
            // Disable button and show loading
            submitBtn.disabled = true;
            submitBtn.textContent = 'Gönderiliyor...';
            
            try {
                const response = await fetch('api/newsletter.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email: email })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    // Show success message
                    submitBtn.textContent = '✓ Başarılı!';
                    submitBtn.style.background = '#28a745';
                    document.getElementById('newsletterEmail').value = '';
                    
                    // Show notification
                    showNewsletterNotification(data.message, 'success');
                } else {
                    throw new Error(data.error || 'Abonelik işlemi başarısız');
                }
                
            } catch (error) {
                console.error('Newsletter signup error:', error);
                showNewsletterNotification(error.message || 'Bir hata oluştu', 'error');
                
                // Reset button
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
                submitBtn.style.background = '';
            }
            
            // Reset button after delay
            setTimeout(() => {
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
                submitBtn.style.background = '';
            }, 3000);
        });
    }
});

function showNewsletterNotification(message, type) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `newsletter-notification ${type}`;
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
        background: ${type === 'success' ? '#28a745' : '#dc3545'};
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

// ===== BLOG FUNCTIONS =====
let currentBlogPage = 1;
let totalBlogPages = 1;
let isLoadingBlog = false;

async function loadBlogPosts(page = 1, append = false) {
    if (isLoadingBlog) return;
    
    try {
        isLoadingBlog = true;
        const blogGrid = document.getElementById('blogGrid');
        
        if (!append) {
            blogGrid.innerHTML = `
                <div class="loading-spinner">
                    <div class="spinner"></div>
                    <p>Blog yazıları yükleniyor...</p>
                </div>
            `;
        }
        
        const response = await fetch(`api/blog.php?page=${page}&status=published&limit=6`);
        
        if (!response.ok) {
            console.warn('Blog API not available, skipping blog posts load');
            if (!append) {
                blogGrid.innerHTML = '<p>Blog yazıları şu anda yüklenemiyor.</p>';
            }
            return;
        }
        
        const data = await response.json();
        
        // Blog feature henüz aktif değilse
        if (data.success === false) {
            console.info('Blog feature not initialized yet');
            if (!append) {
                blogGrid.innerHTML = '<p>Blog özelliği henüz aktif değil.</p>';
            }
            return;
        }
        
        if (data.posts && data.posts.length > 0) {
            const blogHtml = data.posts.map(post => createBlogCard(post)).join('');
            
            if (append) {
                blogGrid.innerHTML += blogHtml;
            } else {
                blogGrid.innerHTML = blogHtml;
            }
            
            currentBlogPage = data.page;
            totalBlogPages = data.pages;
            
            // Update load more button
            const loadMoreBtn = document.getElementById('loadMoreBlog');
            if (data.page < data.pages) {
                loadMoreBtn.style.display = 'block';
                loadMoreBtn.disabled = false;
            } else {
                loadMoreBtn.style.display = 'none';
            }
        } else {
            if (!append) {
                blogGrid.innerHTML = `
                    <div class="no-content">
                        <p>Henüz blog yazısı bulunmuyor.</p>
                    </div>
                `;
            }
        }
    } catch (error) {
        console.error('Blog yükleme hatası:', error);
        const blogGrid = document.getElementById('blogGrid');
        blogGrid.innerHTML = `
            <div class="error-message">
                <p>Blog yazıları yüklenirken hata oluştu.</p>
            </div>
        `;
    } finally {
        isLoadingBlog = false;
    }
}

function createBlogCard(post) {
    const excerpt = post.excerpt || (post.content ? stripHtmlTags(post.content).substring(0, 150) + '...' : '');
    const tags = Array.isArray(post.tags) ? post.tags : (post.tags ? post.tags.split(',') : []);
    const imageUrl = post.featured_image || 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400';
    
    return `
        <div class="blog-item" role="article">
            <div class="blog-image">
                <img src="${imageUrl}" alt="${post.title}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400'">
                <div class="blog-category">${post.category}</div>
            </div>
            <div class="blog-content">
                <h3 class="blog-title">${post.title}</h3>
                <p class="blog-excerpt">${excerpt}</p>
                <div class="blog-meta">
                    <div class="blog-date">
                        📅 ${new Date(post.created_at).toLocaleDateString('tr-TR')}
                    </div>
                    <div class="blog-views">
                        👁️ ${post.views || 0} görüntülenme
                    </div>
                </div>
                ${tags.length > 0 ? `
                <div class="blog-tags">
                    ${tags.slice(0, 3).map(tag => `<span class="blog-tag">${tag.trim()}</span>`).join('')}
                </div>
                ` : ''}
                <div class="blog-actions">
                    <a href="#" class="blog-read-more" onclick="openBlogPost(${post.id}); return false;">
                        Devamını Oku →
                    </a>
                </div>
            </div>
        </div>
    `;
}

function stripHtmlTags(html) {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || '';
}

async function loadMoreBlog() {
    if (currentBlogPage < totalBlogPages) {
        const loadMoreBtn = document.getElementById('loadMoreBlog');
        loadMoreBtn.disabled = true;
        loadMoreBtn.textContent = 'Yükleniyor...';
        
        await loadBlogPosts(currentBlogPage + 1, true);
        
        loadMoreBtn.textContent = 'Daha Fazla Yazı';
    }
}

function openBlogPost(postId) {
    // This would open a blog post detail modal or page
    alert(`Blog yazısı detayı yakında eklenecek. Post ID: ${postId}`);
    
    // Update view count
    fetch(`api/blog.php`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            action: 'increment_view',
            id: postId
        })
    }).catch(console.error);
}

// Social Media Sharing Functions
function shareOnFacebook(title, excerpt, imageUrl) {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(`${title} - ${excerpt}`);
    const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${text}`;
    window.open(shareUrl, '_blank', 'width=600,height=400');
}

function shareOnTwitter(title, excerpt) {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(`${title} - ${excerpt} #yoga #meditasyon`);
    const shareUrl = `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
    window.open(shareUrl, '_blank', 'width=600,height=400');
}

function shareOnWhatsApp(title, excerpt) {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(`*${title}*\n\n${excerpt}\n\n${window.location.href}`);
    const shareUrl = `https://wa.me/?text=${text}`;
    window.open(shareUrl, '_blank');
}

// Video Social Media Sharing Functions
function shareVideoOnFacebook(title, description) {
    const url = encodeURIComponent(window.location.href + '#videos');
    const text = encodeURIComponent(`${title} - ${description}`);
    const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${text}`;
    window.open(shareUrl, '_blank', 'width=600,height=400');
}

function shareVideoOnTwitter(title, description) {
    const url = encodeURIComponent(window.location.href + '#videos');
    const text = encodeURIComponent(`${title} - ${description} #yoga #meditasyon #yogavideo`);
    const shareUrl = `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
    window.open(shareUrl, '_blank', 'width=600,height=400');
}

function shareVideoOnWhatsApp(title, description) {
    const url = window.location.href + '#videos';
    const text = encodeURIComponent(`*${title}*\n\n${description}\n\n${url}`);
    const shareUrl = `https://wa.me/?text=${text}`;
    window.open(shareUrl, '_blank');
}

function shareOnInstagram() {
    // Instagram doesn't have direct sharing API for web
    // Copy link to clipboard and show instruction
    navigator.clipboard.writeText(window.location.href).then(() => {
        alert('Link kopyalandı! Instagram\'da paylaşmak için link\'i story\'de veya bio\'da kullanabilirsin.');
    });
}

// Smooth Navigation for Sticky Sections
function smoothScrollToSection(targetId) {
    const targetSection = document.getElementById(targetId);
    if (targetSection) {
        // Get current scroll position
        const currentScroll = window.pageYOffset;
        const targetScroll = targetSection.offsetTop - 80; // Account for fixed nav
        
        // Smooth scroll to target
        window.scrollTo({
            top: targetScroll,
            behavior: 'smooth'
        });
    }
}

// Enhanced navigation functionality
function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-links a[href^="#"]');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            smoothScrollToSection(targetId);
        });
    });
}

// Mobile menu functionality
function setupMobileMenu() {
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.getElementById('navLinks');
    
    if (hamburger && navLinks) {
        hamburger.addEventListener('click', function(e) {
            e.preventDefault();
            navLinks.classList.toggle('show');
            hamburger.classList.toggle('active');
            hamburger.setAttribute('aria-expanded', 
                hamburger.classList.contains('active') ? 'true' : 'false'
            );
        });
    }
}

// Close mobile menu function
function closeMenu() {
    const navLinks = document.getElementById('navLinks');
    const hamburger = document.getElementById('hamburger');
    
    if (navLinks) navLinks.classList.remove('show');
    if (hamburger) {
        hamburger.classList.remove('active');
        hamburger.setAttribute('aria-expanded', 'false');
    }
}

// Initialize functions
function initializeApp() {
    // Setup navigation
    setupNavigation();
    setupMobileMenu();
    
    // Load blog posts if blog section exists
    if (document.getElementById('blogGrid')) {
        loadBlogPosts();
        
        // Setup load more button
        const loadMoreBtn = document.getElementById('loadMoreBlog');
        if (loadMoreBtn) {
            loadMoreBtn.addEventListener('click', loadMoreBlog);
        }
    }
}

// Navigation loading function
async function loadActiveNavigation() {
    try {
        const response = await fetch('api/get-active-sections.php');
        const data = await response.json();
        
        if (data.success) {
            const navLinks = document.getElementById('navLinks');
            const sections = data.sections;
            
            // Navigation menu mapping
            const navMapping = {
                'home': { text: 'Ana Sayfa', href: 'index.html' },
                'about': { text: 'Hakkımda', href: 'index.html#about' },
                'classes': { text: 'Dersler', href: 'index.html#classes' },
                'videos': { text: 'Yoga\'ya dair', href: 'index.html#videos' },
                'youtube-videos': { text: 'YouTube Videolarım', href: 'youtube-videos.html' },
                'blog': { text: 'Blog', href: 'index.html#blog' },
                'gallery': { text: 'Galeri', href: 'index.html#gallery' },
                'community': { text: 'Topluluğumuz', href: 'index.html#community' },
                'newsletter': { text: 'Haftalık İpuçları', href: 'index.html#newsletter' },
                'reservation': { text: 'Rezervasyon', href: 'index.html#reservation' }
            };
            
            // Build navigation menu
            navLinks.innerHTML = '';
            // Make sure menu is closed initially
            navLinks.classList.remove('show');
            
            sections.forEach(section => {
                if (navMapping[section.section_name]) {
                    const li = document.createElement('li');
                    li.setAttribute('role', 'none');
                    
                    const a = document.createElement('a');
                    a.href = navMapping[section.section_name].href;
                    a.setAttribute('role', 'menuitem');
                    a.setAttribute('onclick', 'closeMenu()');
                    a.textContent = navMapping[section.section_name].text;
                    
                    li.appendChild(a);
                    navLinks.appendChild(li);
                }
            });
            
            // Load logo and site title
            const logoResponse = await fetch('api/settings.php?key=site_logo');
            const logoData = await logoResponse.json();
            
            if (logoData && logoData.setting_value) {
                const logoImg = document.getElementById('siteLogo');
                const siteTitle = document.getElementById('siteTitle');
                
                if (logoImg && siteTitle) {
                    logoImg.src = logoData.setting_value;
                    logoImg.style.display = 'block';
                    siteTitle.style.display = 'none';
                }
            }
            
            // Load site identity and contact info
            loadContactInfo();
        }
    } catch (error) {
        console.error('Navigation loading error:', error);
    }
}

// Close mobile menu function
function closeMenu() {
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.getElementById('navLinks');
    
    if (hamburger && navLinks) {
        hamburger.classList.remove('active');
        navLinks.classList.remove('active');
        hamburger.setAttribute('aria-expanded', 'false');
    }
}

// YouTube Videos Functions
let allYouTubeVideos = [];
let currentCategory = 'all';

async function loadYouTubeVideos() {
    try {
        const response = await fetch('api/youtube.php');
        const data = await response.json();
        console.log('YouTube API Response:', data); // Debug için bırak
        
        if (data.success && Array.isArray(data.videos)) {
            allYouTubeVideos = data.videos;
            displayYouTubeVideos(allYouTubeVideos);
        } else {
            console.error('No videos found or API error:', data);
        }
    } catch (error) {
        console.error('YouTube videoları yüklenemedi:', error);
    }
}

function displayYouTubeVideos(videos) {
    const youtubeVideosGrid = document.getElementById('youtubeVideosGrid');
    if (!youtubeVideosGrid) return;
    
    if (videos.length === 0) {
        youtubeVideosGrid.innerHTML = '<p>Henüz YouTube videosu bulunmuyor.</p>';
        return;
    }
    
    youtubeVideosGrid.innerHTML = videos.map(video => `
        <div class="youtube-video-item" onclick="openYouTubeVideo('${video.youtube_url}')">
            <div class="youtube-video-thumbnail">
                <img src="${video.thumbnail_url}" alt="${video.title}" 
                     onload="console.log('✅ Thumbnail loaded:', this.src)"
                     onerror="console.log('❌ Thumbnail failed:', this.src); this.src='https://via.placeholder.com/480x270/a0877c/ffffff?text=YouTube+Video'">
                <div class="youtube-play-button">
                    <i class="fab fa-youtube"></i>
                </div>
            </div>
            <div class="youtube-video-content">
                <h3 class="youtube-video-title">${video.title}</h3>
                <p class="youtube-video-description">${video.description || 'YouTube kanalımdan yoga dersi'}</p>
                <div class="youtube-video-meta">
                    <span class="youtube-video-category">${getYouTubeCategoryDisplayName(video.category)}</span>
                </div>
            </div>
        </div>
    `).join('');
}

function getYouTubeCategoryDisplayName(category) {
    const categories = {
        'yoga': 'Yoga',
        'meditation': 'Meditasyon',
        'lifestyle': 'Yaşam Tarzı',
        'tips': 'İpuçları'
    };
    return categories[category] || category;
}

function filterYouTubeVideos(category) {
    currentCategory = category;
    
    // Update active button
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Filter videos
    let filteredVideos = allYouTubeVideos;
    if (category !== 'all') {
        filteredVideos = allYouTubeVideos.filter(video => video.category === category);
    }
    
    displayYouTubeVideos(filteredVideos);
}

function openYouTubeVideo(youtubeUrl) {
    window.open(youtubeUrl, '_blank');
}

// YouTube page initialization
async function initializeYouTubePage() {
    // Load navigation
    await loadActiveNavigation();
    
    // Load YouTube videos
    await loadYouTubeVideos();
    
    // Setup hamburger menu event listener (hemen kur)
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.getElementById('navLinks');
    
    if (hamburger) {
        // Remove existing listeners first
        const newHamburger = hamburger.cloneNode(true);
        hamburger.parentNode.replaceChild(newHamburger, hamburger);
        
        // Add fresh event listener
        newHamburger.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            toggleMenu();
        });
    }
    
    // Menü dışına tıklandığında kapat
    document.addEventListener('click', function(event) {
        const navLinks = document.getElementById('navLinks');
        const hamburger = document.getElementById('hamburger');
        
        if (navLinks && hamburger) {
            if (navLinks.classList.contains('show') && 
                !navLinks.contains(event.target) && 
                !hamburger.contains(event.target)) {
                closeMenu();
            }
        }
    });
    
    // Close menu on scroll
    window.addEventListener('scroll', function() {
        closeMenu();
    });
}

// Call initialization when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        // Check if we're on YouTube videos page
        if (window.location.pathname.includes('youtube-videos.html')) {
            initializeYouTubePage();
        } else {
            initializeApp();
        }
    });
} else {
    // DOM already loaded
    if (window.location.pathname.includes('youtube-videos.html')) {
        initializeYouTubePage();
    } else {
        initializeApp();
    }
}