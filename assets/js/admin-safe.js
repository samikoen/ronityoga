// Safe Admin.js - sadece temel özellikler
console.log('🎯 Safe Admin.js loading...');

// Main.js'i durdur
if (window.loadClasses) {
    console.log('🛑 Blocking main.js functions');
    window.loadClasses = function() { console.log('loadClasses blocked'); };
    window.loadBlog = function() { console.log('loadBlog blocked'); };
    window.loadSettings = function() { console.log('loadSettings blocked'); };
}

// Sadece temel fonksiyonları yükle, API çağrıları yapma

// Mobile menu toggle
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔧 Setting up basic admin features...');
    
    // Mobile menu
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    
    if (mobileMenuToggle && sidebar) {
        console.log('Mobile menu setup...');
        mobileMenuToggle.addEventListener('click', function() {
            sidebar.classList.toggle('active');
            sidebarOverlay.classList.toggle('active');
        });
    }
    
    // Sidebar navigation
    const navLinks = document.querySelectorAll('.nav-link');
    const contentSections = document.querySelectorAll('.content-section');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetSection = this.getAttribute('data-section');
            console.log('Switching to section:', targetSection);
            
            // Hide all sections
            contentSections.forEach(section => {
                section.classList.remove('active');
            });
            
            // Remove active from all nav links
            navLinks.forEach(navLink => {
                navLink.classList.remove('active');
            });
            
            // Show target section
            const targetElement = document.getElementById(targetSection);
            if (targetElement) {
                targetElement.classList.add('active');
                this.classList.add('active');
            }
        });
    });
    
    // Logout function
    window.logout = function() {
        if (confirm('Çıkış yapmak istediğinize emin misiniz?')) {
            window.location.href = '../api/logout.php';
        }
    };
    
    // Load summer classes data when section is active
    loadSummerAttendanceData();
    
    console.log('✅ Basic admin features loaded');
});

// Summer Classes functions
async function loadSummerAttendanceData() {
    try {
        console.log('🔄 Loading summer attendance data...');
        
        const response = await fetch('../api/summer-classes.php');
        console.log('📥 Response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const text = await response.text();
        console.log('📄 Raw response:', text.substring(0, 200) + '...');
        
        const data = JSON.parse(text);
        console.log('📊 Parsed data:', data);
        
        if (data.success) {
            console.log('📈 Stats:', data.stats);
            console.log('📝 Attendance records:', data.attendance?.length || 0);
            
            displaySummerStats(data.stats);
            displaySummerAttendance(data.attendance);
            console.log('✅ Summer data loaded successfully');
        } else {
            console.error('❌ Summer data error:', data.error);
        }
    } catch (error) {
        console.error('❌ Summer data fetch error:', error);
        console.error('Error details:', error.message);
    }
}

function displaySummerStats(stats) {
    // Update stats cards
    document.getElementById('summerTotalRegistrations').textContent = stats.total_registrations || 0;
    document.getElementById('summerUniqueParticipants').textContent = stats.unique_participants || 0;
    document.getElementById('summerAttendedCount').textContent = stats.attended_count || 0;
    document.getElementById('summerNotAttendedCount').textContent = stats.not_attended_count || 0;
    
    // Next class info
    document.getElementById('summerNextClassCount').textContent = stats.registered_count || 0;
    document.getElementById('summerNextClassLabel').textContent = 'Kayıtlı Katılımcı';
}

function displaySummerAttendance(attendance) {
    const tbody = document.getElementById('summerAttendanceTableBody');
    
    if (!tbody) return;
    
    if (attendance.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align: center;">Henüz katılım kaydı yok</td></tr>';
        return;
    }
    
    tbody.innerHTML = attendance.map(record => `
        <tr>
            <td>${record.class_date}</td>
            <td class="hide-mobile">${record.class_day}</td>
            <td>${record.participant_name}</td>
            <td class="hide-mobile">${record.participant_email || '-'}</td>
            <td class="hide-mobile">${record.participant_phone || '-'}</td>
            <td class="hide-mobile">${record.experience_level || '-'}</td>
            <td class="hide-mobile">${record.registration_date ? new Date(record.registration_date).toLocaleDateString('tr-TR') : '-'}</td>
            <td>
                <span class="status-badge ${getStatusClass(record.status)}">
                    ${record.status}
                </span>
            </td>
            <td>
                <select onchange="updateAttendanceStatus(${record.id}, this.value)" class="status-select">
                    <option value="Kayıtlı" ${record.status === 'Kayıtlı' ? 'selected' : ''}>Kayıtlı</option>
                    <option value="Katıldı" ${record.status === 'Katıldı' ? 'selected' : ''}>Katıldı</option>
                    <option value="Katılmadı" ${record.status === 'Katılmadı' ? 'selected' : ''}>Katılmadı</option>
                </select>
            </td>
        </tr>
    `).join('');
}

function getStatusClass(status) {
    switch(status) {
        case 'Katıldı': return 'status-success';
        case 'Katılmadı': return 'status-danger';
        case 'Kayıtlı': return 'status-warning';
        default: return 'status-secondary';
    }
}

window.updateAttendanceStatus = async function(id, status) {
    try {
        const response = await fetch(`../api/summer-classes.php?id=${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: status })
        });
        
        const result = await response.json();
        if (result.success) {
            console.log('Status updated');
            loadSummerAttendanceData(); // Reload data
        }
    } catch (error) {
        console.error('Update error:', error);
    }
};