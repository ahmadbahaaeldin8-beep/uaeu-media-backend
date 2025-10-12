class PageCustomizer {
    constructor() {
        this.settings = {
            title: 'Media Studio Reservation',
            subtitle: 'UAE University - Media & Creative Industries Department',
            themeColor: '#3b82f6',
            bgStyle: 'gradient',
            fontSize: 16,
            logo: 'images/mci-logo.png'
        };
        
        this.loadSettings();
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.applySettings();
    }

    setupEventListeners() {
        // Settings panel toggle
        document.getElementById('settingsBtn').addEventListener('click', () => {
            this.openSettings();
        });

        document.getElementById('closeSettings').addEventListener('click', () => {
            this.closeSettings();
        });

        // Title and subtitle inputs
        document.getElementById('titleInput').addEventListener('input', (e) => {
            this.updateTitle(e.target.value);
        });

        document.getElementById('subtitleInput').addEventListener('input', (e) => {
            this.updateSubtitle(e.target.value);
        });

        // Theme color buttons
        document.querySelectorAll('.color-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setThemeColor(e.target.dataset.color);
            });
        });

        // Background style radio buttons
        document.querySelectorAll('input[name="bgStyle"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.setBackgroundStyle(e.target.value);
            });
        });

        // Font size slider
        document.getElementById('fontSizeSlider').addEventListener('input', (e) => {
            this.setFontSize(e.target.value);
        });

        // Logo upload
        document.getElementById('logoUpload').addEventListener('change', (e) => {
            this.handleLogoUpload(e.target.files[0]);
        });

        // Save and reset buttons
        document.getElementById('saveSettings').addEventListener('click', () => {
            this.saveSettings();
        });

        document.getElementById('resetSettings').addEventListener('click', () => {
            this.resetSettings();
        });

        // Close settings when clicking outside
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('settings-overlay')) {
                this.closeSettings();
            }
        });
    }

    openSettings() {
        // Create overlay
        if (!document.querySelector('.settings-overlay')) {
            const overlay = document.createElement('div');
            overlay.className = 'settings-overlay';
            document.body.appendChild(overlay);
        }

        document.querySelector('.settings-overlay').classList.add('active');
        document.getElementById('settingsPanel').classList.add('active');
        
        // Update input values
        document.getElementById('titleInput').value = this.settings.title;
        document.getElementById('subtitleInput').value = this.settings.subtitle;
        document.getElementById('fontSizeSlider').value = this.settings.fontSize;
        document.getElementById('fontSizeValue').textContent = this.settings.fontSize + 'px';
        
        // Update color selection
        document.querySelectorAll('.color-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.color === this.settings.themeColor);
        });
        
        // Update background style
        document.querySelector(`input[name="bgStyle"][value="${this.settings.bgStyle}"]`).checked = true;
    }

    closeSettings() {
        document.querySelector('.settings-overlay')?.classList.remove('active');
        document.getElementById('settingsPanel').classList.remove('active');
    }

    updateTitle(title) {
        this.settings.title = title;
        document.getElementById('mainTitle').textContent = title;
    }

    updateSubtitle(subtitle) {
        this.settings.subtitle = subtitle;
        document.getElementById('subtitle').textContent = subtitle;
    }

    setThemeColor(color) {
        this.settings.themeColor = color;
        
        // Update CSS variables
        document.documentElement.style.setProperty('--primary-color', color);
        
        // Calculate hover color (darker version)
        const hoverColor = this.darkenColor(color, 20);
        document.documentElement.style.setProperty('--primary-hover', hoverColor);
        
        // Update active color button
        document.querySelectorAll('.color-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.color === color);
        });
    }

    setBackgroundStyle(style) {
        this.settings.bgStyle = style;
        const body = document.body;
        
        // Remove existing background classes
        body.classList.remove('bg-gradient', 'bg-solid', 'bg-pattern');
        
        switch (style) {
            case 'gradient':
                body.classList.add('bg-gradient');
                break;
            case 'solid':
                body.classList.add('bg-solid');
                break;
            case 'pattern':
                body.classList.add('bg-pattern');
                break;
        }
    }

    setFontSize(size) {
        this.settings.fontSize = parseInt(size);
        document.documentElement.style.setProperty('--base-font-size', size + 'px');
        document.getElementById('fontSizeValue').textContent = size + 'px';
    }

    handleLogoUpload(file) {
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const logoImg = document.querySelector('.logo');
                logoImg.src = e.target.result;
                this.settings.logo = e.target.result;
                
                // Also update admin logo if exists
                const adminLogo = document.querySelector('.sidebar-logo');
                if (adminLogo) {
                    adminLogo.src = e.target.result;
                }
            };
            reader.readAsDataURL(file);
        }
    }

    saveSettings() {
        localStorage.setItem('pageCustomization', JSON.stringify(this.settings));
        this.showNotification('Settings saved successfully!', 'success');
        this.closeSettings();
    }

    loadSettings() {
        const saved = localStorage.getItem('pageCustomization');
        if (saved) {
            this.settings = { ...this.settings, ...JSON.parse(saved) };
        }
    }

    applySettings() {
        // Apply title and subtitle
        if (document.getElementById('mainTitle')) {
            document.getElementById('mainTitle').textContent = this.settings.title;
        }
        if (document.getElementById('subtitle')) {
            document.getElementById('subtitle').textContent = this.settings.subtitle;
        }
        
        // Apply theme color
        this.setThemeColor(this.settings.themeColor);
        
        // Apply background style
        this.setBackgroundStyle(this.settings.bgStyle);
        
        // Apply font size
        this.setFontSize(this.settings.fontSize);
        
        // Apply logo if it's a custom one
        if (this.settings.logo && this.settings.logo.startsWith('data:')) {
            const logoImg = document.querySelector('.logo');
            if (logoImg) {
                logoImg.src = this.settings.logo;
            }
        }
    }

    resetSettings() {
        this.settings = {
            title: 'Media Studio Reservation',
            subtitle: 'UAE University - Media & Creative Industries Department',
            themeColor: '#3b82f6',
            bgStyle: 'gradient',
            fontSize: 16,
            logo: 'images/mci-logo.png'
        };
        
        this.applySettings();
        localStorage.removeItem('pageCustomization');
        this.showNotification('Settings reset to default!', 'info');
        this.closeSettings();
    }

    darkenColor(color, percent) {
        const num = parseInt(color.replace("#", ""), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) - amt;
        const G = (num >> 8 & 0x00FF) - amt;
        const B = (num & 0x0000FF) - amt;
        return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(notification);
        
        // Show notification
        setTimeout(() => notification.classList.add('show'), 100);
        
        // Hide and remove notification
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Initialize customizer when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new PageCustomizer();
});

// Add background style classes to CSS
const backgroundStyles = `
    .bg-gradient {
        background: linear-gradient(135deg, var(--primary-color, #3b82f6) 0%, #1e40af 100%);
    }
    
    .bg-solid {
        background: var(--primary-color, #3b82f6);
    }
    
    .bg-pattern {
        background: var(--primary-color, #3b82f6);
        background-image: 
            radial-gradient(circle at 25% 25%, rgba(255,255,255,0.1) 2px, transparent 2px),
            radial-gradient(circle at 75% 75%, rgba(255,255,255,0.1) 2px, transparent 2px);
        background-size: 20px 20px;
    }
    
    .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        background: white;
        padding: 16px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        display: flex;
        align-items: center;
        gap: 12px;
        transform: translateX(400px);
        transition: transform 0.3s ease;
        z-index: 1001;
        max-width: 400px;
    }
    
    .notification.show {
        transform: translateX(0);
    }
    
    .notification-success {
        border-left: 4px solid #10b981;
        color: #065f46;
    }
    
    .notification-error {
        border-left: 4px solid #ef4444;
        color: #991b1b;
    }
    
    .notification-info {
        border-left: 4px solid #3b82f6;
        color: #1e40af;
    }
`;

// Add styles to document
const styleSheet = document.createElement('style');
styleSheet.textContent = backgroundStyles;
document.head.appendChild(styleSheet);