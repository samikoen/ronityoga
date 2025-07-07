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
            // Eğer carousel resmi yoksa, eski tek resim sistemini kullan
            loadHeroImage();
        }
    } catch (error) {
        console.log('Hero carousel load error:', error);
        // Hata durumunda eski sistemi kullan
        loadHeroImage();
    }
}

// Hero carousel'i başlat
function initHeroCarousel(images) {
    const heroSection = document.querySelector('.hero');
    if (!heroSection) return;
    
    let currentIndex = 0;
    
    // İlk resmi göster
    updateHeroBackground(images[currentIndex].image_url);
    heroSection.classList.add('animate'); // ← BU SATIRI EKLEYİN
    
    // Eğer birden fazla resim varsa carousel'i başlat
    if (images.length > 1) {
        // Her 5 saniyede bir resmi değiştir
        setInterval(() => {
            currentIndex = (currentIndex + 1) % images.length;
            updateHeroBackground(images[currentIndex].image_url);
        }, 5000);
        
        // Opsiyonel: Carousel göstergeleri ekle
        addCarouselIndicators(images, currentIndex);
    }
}

// Hero arka planını güncelle (fade ve zoom efekti ile)
function updateHeroBackground(imageUrl) {
    const heroSection = document.querySelector('.hero');
    if (!heroSection) return;
    
    // Zoom animasyonunu yeniden başlat için sınıfları güncelle
    heroSection.classList.remove('animate');
    heroSection.classList.add('transitioning');
    
    // Fade efekti için geçici bir div oluştur
    const newBg = document.createElement('div');
    newBg.className = 'hero-bg-transition';
    newBg.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url('${imageUrl}') center/cover;
        opacity: 0;
        transition: opacity 1s ease-in-out;
        z-index: -1;
    `;
    
    heroSection.appendChild(newBg);
    
    // Fade in
    setTimeout(() => {
        newBg.style.opacity = '1';
    }, 50);
    
    // Eski arka planı kaldır
    setTimeout(() => {
        heroSection.style.background = `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url('${imageUrl}') center/cover`;
        const oldBgs = heroSection.querySelectorAll('.hero-bg-transition');
        oldBgs.forEach(bg => bg.remove());
        
        // Zoom animasyonunu yeniden başlat
        setTimeout(() => {
            heroSection.classList.remove('transitioning');
            heroSection.classList.add('animate');
        }, 100);
    }, 1000);
}

// Carousel göstergeleri ekle (opsiyonel)
function addCarouselIndicators(images, currentIndex) {
    const heroSection = document.querySelector('.hero');
    if (!heroSection) return;
    
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
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background: ${index === currentIndex ? 'white' : 'rgba(255,255,255,0.5)'};
            cursor: pointer;
            transition: all 0.3s ease;
        `;
        
        dot.addEventListener('click', () => {
            updateHeroBackground(img.image_url);
            updateIndicators(index);
        });
        
        indicators.appendChild(dot);
    });
    
    heroSection.appendChild(indicators);
}

// Göstergeleri güncelle
function updateIndicators(activeIndex) {
    const dots = document.querySelectorAll('.carousel-indicators span');
    dots.forEach((dot, index) => {
        dot.style.background = index === activeIndex ? 'white' : 'rgba(255,255,255,0.5)';
    });
}

// DOMContentLoaded'da loadHeroImage yerine loadHeroCarousel çağır
document.addEventListener('DOMContentLoaded', function() {
    loadHeroCarousel(); // loadHeroImage() yerine
    loadLogo();
    loadProfileImage();
    loadSiteSettings();
    loadClasses();
    
    // ... diğer kodlar
});
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
                const siteTitle = document.getElementById('siteTitle');
                if (siteTitle) {
                    siteTitle.textContent = settings.site_title.replace(' Studio', '').toUpperCase();
                }
            }
            
            // Hakkımda bölümü - İsim güncelleme - DOĞRU SELECTOR
            if (settings.name) {
                const aboutTitle = document.querySelector('#about-title'); // # ile ID seçici
                if (aboutTitle) {
                    aboutTitle.textContent = `Merhaba, Ben ${settings.name}`;
                    console.log('İsim güncellendi:', settings.name); // DEBUG
                }
            }
            
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
                    console.log('about-text elementi bulunamadı!'); // DEBUG
                }
            }
            
            // Sosyal medya linkleri
            updateSocialLinks(settings);
            
            // İletişim bilgileri
            if (settings.email || settings.phone) {
                updateContactInfo(settings);
            }
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

// İletişim bilgilerini güncelle
function updateContactInfo(settings) {
    // Footer'a iletişim bilgileri ekle
    const footer = document.querySelector('footer');
    if (footer && !document.getElementById('contactInfo')) {
        const contactDiv = document.createElement('div');
        contactDiv.id = 'contactInfo';
        contactDiv.style.marginBottom = '1rem';
        contactDiv.style.textAlign = 'center';
        
        let html = '';
        if (settings.email) html += `<p>E-posta: ${settings.email}</p>`;
        if (settings.phone) html += `<p>Telefon: ${settings.phone}</p>`;
        
        contactDiv.innerHTML = html;
        footer.insertBefore(contactDiv, footer.firstChild);
    }
}

// Dersleri yükle
async function loadClasses() {
    try {
        const response = await fetch('api/classes.php');
        const classes = await response.json();
        
        const classesGrid = document.getElementById('classesGrid');
        
        if (classesGrid && Array.isArray(classes)) {
            classesGrid.innerHTML = classes.map(cls => `
                <div class="class-card">
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
                            <a href="#contact" class="book-button">Rezervasyon</a>
                        </div>
                    </div>
                </div>
            `).join('');
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
                        <h3>Dersler Yükleniyor...</h3>
                        <p>Lütfen daha sonra tekrar deneyin.</p>
                    </div>
                </div>
            `;
        }
    }
}

// Rezervasyon fonksiyonu
function bookClass(classId, className) {
    alert(`${className} dersi için rezervasyon formu yakında eklenecek!`);
}

// Hamburger Menu Functions
function toggleMenu() {
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.getElementById('navLinks');
    
    hamburger.classList.toggle('active');
    navLinks.classList.toggle('show');
}

function closeMenu() {
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.getElementById('navLinks');
    
    hamburger.classList.remove('active');
    navLinks.classList.remove('show');
}

// Sayfa yüklendiğinde - CAROUSEL İÇİN GÜNCELLENDİ
document.addEventListener('DOMContentLoaded', function() {
    loadHeroCarousel(); // loadHeroImage() yerine carousel yükle
    loadLogo();
    loadProfileImage();
    loadSiteSettings();
    loadClasses();
    
    // DEBUG: Elementlerin varlığını kontrol et
    console.log('about-title elementi:', document.querySelector('#about-title'));
    console.log('about-text elementi:', document.querySelector('#about-text'));
    
    // Hamburger menü event listener
    const hamburger = document.getElementById('hamburger');
    if (hamburger) {
        hamburger.addEventListener('click', toggleMenu);
    }
    
    // Menü dışına tıklandığında kapat
    document.addEventListener('click', function(event) {
        const navLinks = document.getElementById('navLinks');
        const hamburger = document.getElementById('hamburger');
        
        if (navLinks && hamburger) {
            // Eğer menü açıksa ve tıklanan yer menü veya hamburger değilse kapat
            if (navLinks.classList.contains('show') && 
                !navLinks.contains(event.target) && 
                !hamburger.contains(event.target)) {
                closeMenu();
            }
        }
    });
    
    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                // 40px aşağı offset ekle
                const offsetTop = target.offsetTop - 40;
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
                // Mobilde menüyü kapat
                closeMenu();
            }
        });
    });
    
    // Sayfa kaydırıldığında menüyü kapat
    window.addEventListener('scroll', function() {
        closeMenu();
    });
});