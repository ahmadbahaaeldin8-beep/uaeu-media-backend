// Modern Reservation System JavaScript
class ReservationSystem {
    constructor() {
        this.reservations = JSON.parse(localStorage.getItem('reservations')) || [];
        this.classes = JSON.parse(localStorage.getItem('classes')) || [];
        this.init();
    }

    init() {
        this.setupEventListeners();
        const dateInputExists = document.getElementById('date');
        if (dateInputExists) {
            this.setMinDate();
        }
        if (document.getElementById('availabilityGrid')) {
            this.loadAvailability();
        }
        this.animateElements();
    }

    setupEventListeners() {
        const form = document.getElementById('reservationForm');
        const dateInput = document.getElementById('date');
        const studioSelect = document.getElementById('studio');

        if (form) {
            form.addEventListener('submit', (e) => this.handleSubmit(e));
        }
        if (dateInput) {
            dateInput.addEventListener('change', () => this.updateAvailability());
        }
        if (studioSelect) {
            studioSelect.addEventListener('change', () => this.updateAvailability());
        }

        // Rules modal interactions
        const readRulesBtn = document.getElementById('readRulesBtn');
        const agreeRulesBtn = document.getElementById('agreeRulesBtn');
        if (readRulesBtn) {
            readRulesBtn.addEventListener('click', () => {
                const rulesModal = document.getElementById('rulesModal');
                if (rulesModal) rulesModal.classList.add('show');
            });
        }
        if (agreeRulesBtn) {
            agreeRulesBtn.addEventListener('click', () => {
                const rulesAgree = document.getElementById('rulesAgree');
                if (rulesAgree) rulesAgree.checked = true;
                const rulesModal = document.getElementById('rulesModal');
                if (rulesModal) rulesModal.classList.remove('show');
            });
        }

        // Real-time validation
        const inputs = form.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.addEventListener('blur', () => this.validateField(input));
            input.addEventListener('input', () => this.clearFieldError(input));
        });
    }

    setMinDate() {
        const dateInput = document.getElementById('date');
        if (!dateInput) return;
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const minDate = tomorrow.toISOString().split('T')[0];
        dateInput.setAttribute('min', minDate);
        
        // Set max date to 30 days from now
        const maxDate = new Date(today);
        maxDate.setDate(maxDate.getDate() + 30);
        dateInput.setAttribute('max', maxDate.toISOString().split('T')[0]);
    }

    validateField(field) {
        const value = field.value.trim();
        let isValid = true;
        let errorMessage = '';

        // Remove existing error styling
        this.clearFieldError(field);

        // Required field validation
        if (field.hasAttribute('required') && !value) {
            isValid = false;
            errorMessage = 'This field is required';
        }

        // Specific field validations
        switch (field.type) {
            case 'email':
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (value && !emailRegex.test(value)) {
                    isValid = false;
                    errorMessage = 'Please enter a valid email address';
                }
                break;
            case 'tel':
                const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,}$/;
                if (value && !phoneRegex.test(value)) {
                    isValid = false;
                    errorMessage = 'Please enter a valid phone number';
                }
                break;
            case 'text':
                if (field.id === 'studentId' && value) {
                    const idRegex = /^[0-9]{8,12}$/;
                    if (!idRegex.test(value)) {
                        isValid = false;
                        errorMessage = 'Student ID should be 8-12 digits';
                    }
                }
                break;
        }

        if (!isValid) {
            this.showFieldError(field, errorMessage);
        }

        return isValid;
    }

    showFieldError(field, message) {
        field.classList.add('error');
        
        // Remove existing error message
        const existingError = field.parentNode.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }

        // Add new error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        errorDiv.style.cssText = `
            color: #ef4444;
            font-size: 0.875rem;
            margin-top: 0.25rem;
            display: flex;
            align-items: center;
            gap: 0.25rem;
        `;
        
        const icon = document.createElement('i');
        icon.className = 'fas fa-exclamation-circle';
        errorDiv.prepend(icon);
        
        field.parentNode.appendChild(errorDiv);

        // Add error styling to field
        field.style.borderColor = '#ef4444';
        field.style.boxShadow = '0 0 0 3px rgb(239 68 68 / 0.1)';
    }

    clearFieldError(field) {
        field.classList.remove('error');
        field.style.borderColor = '';
        field.style.boxShadow = '';
        
        const errorMessage = field.parentNode.querySelector('.error-message');
        if (errorMessage) {
            errorMessage.remove();
        }
    }

    async handleSubmit(e) {
        e.preventDefault();
        
        const form = e.target;
        const formData = new FormData(form);
        
        // Validate all fields
        const inputs = form.querySelectorAll('input[required], select[required], textarea[required]');
        let isFormValid = true;
        
        inputs.forEach(input => {
            if (!this.validateField(input)) {
                isFormValid = false;
            }
        });

        if (!isFormValid) {
            this.showNotification('Please fix the errors in the form', 'error');
            return;
        }

        // Check time conflicts against existing reservations and classes
        const date = (formData.get('date') || new Date().toISOString().split('T')[0]);
        const fromTime = formData.get('fromTime');
        const toTime = formData.get('toTime');
        const conflicts = this.checkConflicts(date, fromTime, toTime);

        if (conflicts.length > 0) {
            this.showNotification(
                `Selected time is not available. Conflicts: ${conflicts.join('; ')}`,
                'error'
            );
            return;
        }

        // Studio Rules and Terms confirmation removed per request

        // Show loading state
        const submitBtn = form.querySelector('.submit-btn');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<div class="spinner"></div> Submitting...';
        submitBtn.disabled = true;

        try {
            // Simulate API call
            await this.delay(2000);
            
            // Create reservation object
            const reservation = {
                id: Date.now().toString(),
                studentName: formData.get('studentName'),
                studentId: formData.get('studentId'),
                email: formData.get('email'),
                phone: formData.get('phone'),
                college: formData.get('collegeText'),
                department: formData.get('departmentText'),
                // If date field is removed, default to today's date (YYYY-MM-DD)
                date: (formData.get('date') || new Date().toISOString().split('T')[0]),
                fromTime: formData.get('fromTime'),
                toTime: formData.get('toTime'),
                duration: formData.get('duration'),
                projectName: formData.get('projectName'),
                aboutProject: formData.get('aboutProject'),
                neededTools: formData.get('neededTools'),
                supervisor: formData.get('supervisor'),
                status: 'pending',
                submittedAt: new Date().toISOString()
            };

            // Save reservation
            this.reservations.push(reservation);
            localStorage.setItem('reservations', JSON.stringify(this.reservations));

            // Send email notification to admin
            try {
                const emailResponse = await fetch('https://mediabook-backend.manus.space/api/submit-reservation', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        studentName: reservation.studentName,
                        studentId: reservation.studentId,
                        email: reservation.email,
                        phone: reservation.phone,
                        collegeText: reservation.college,
                        departmentText: reservation.department,
                        date: reservation.date,
                        fromTime: reservation.fromTime,
                        toTime: reservation.toTime,
                        duration: reservation.duration,
                        studioType: formData.get('studio') || 'N/A',
                        projectTitle: reservation.projectName,
                        projectDescription: reservation.aboutProject,
                        equipmentNeeded: reservation.neededTools,
                        supervisor: reservation.supervisor
                    })
                });
                
                if (!emailResponse.ok) {
                    console.warn('Email notification failed, but reservation was saved');
                }
            } catch (emailError) {
                console.warn('Failed to send email notification:', emailError);
            }

            // Show success modal
            this.showSuccessModal(reservation);
            
            // Reset form
            form.reset();
            this.updateAvailability();

        } catch (error) {
            this.showNotification('Failed to submit reservation. Please try again.', 'error');
        } finally {
            // Restore button
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }

    // Check conflicts with existing reservations and classes for given date/time range
    checkConflicts(date, fromTime, toTime) {
        const conflicts = [];
        if (!date || !fromTime || !toTime) return conflicts;

        const [startMins, endMins] = [this.timeToMinutes(fromTime), this.timeToMinutes(toTime)];
        if (isNaN(startMins) || isNaN(endMins) || endMins <= startMins) return conflicts;

        // Existing reservations (pending or approved)
        const reservations = JSON.parse(localStorage.getItem('reservations')) || [];
        reservations
            .filter(r => r.date === date && r.status !== 'rejected')
            .forEach(r => {
                const rStart = this.timeToMinutes(r.fromTime || (r.time?.split('-')[0]));
                const rEnd = this.timeToMinutes(r.toTime || (r.time?.split('-')[1]));
                if (!isNaN(rStart) && !isNaN(rEnd) && this.isOverlap(startMins, endMins, rStart, rEnd)) {
                    conflicts.push(`Reservation (${r.studentName}) ${r.fromTime || ''}-${r.toTime || ''}`);
                }
            });

        // Classes (date + "HH:MM-HH:MM" time format)
        const classes = JSON.parse(localStorage.getItem('classes')) || [];
        classes
            .filter(c => c.date === date && c.time)
            .forEach(c => {
                const [cStartStr, cEndStr] = c.time.split('-');
                const cStart = this.timeToMinutes(cStartStr);
                const cEnd = this.timeToMinutes(cEndStr);
                if (!isNaN(cStart) && !isNaN(cEnd) && this.isOverlap(startMins, endMins, cStart, cEnd)) {
                    conflicts.push(`Class (${c.name}) ${c.time}`);
                }
            });

        return conflicts;
    }

    // Convert time string to total minutes (supports 24h and 12h with AM/PM)
    timeToMinutes(t) {
        if (!t) return NaN;
        const s = String(t).trim();
        const ampmMatch = s.match(/\b(am|pm)\b/i);
        if (ampmMatch) {
            const isPM = ampmMatch[1].toLowerCase() === 'pm';
            const core = s.replace(/\s*(am|pm)\s*/i, '').trim();
            const parts = core.split(':');
            let hour = parseInt(parts[0], 10);
            let minute = parseInt(parts[1] || '0', 10);
            if (isNaN(hour) || isNaN(minute)) return NaN;
            hour = hour % 12; // 12 -> 0
            if (isPM) hour += 12;
            return (hour * 60) + minute;
        }
        const parts = s.split(':');
        const hour = parseInt(parts[0], 10);
        const minute = parseInt(parts[1] || '0', 10);
        if (isNaN(hour) || isNaN(minute)) return NaN;
        return (hour * 60) + minute;
    }

    isOverlap(aStart, aEnd, bStart, bEnd) {
        return aStart < bEnd && bStart < aEnd;
    }

    isTimeSlotAvailable(date, startTime, studio, duration) {
        const startHour = parseInt(startTime.split(':')[0]);
        const endHour = startHour + duration;

        // Check against existing reservations
        const conflictingReservations = this.reservations.filter(reservation => 
            reservation.date === date &&
            reservation.studio === studio &&
            reservation.status !== 'rejected'
        );

        for (let reservation of conflictingReservations) {
            const resStartHour = parseInt(reservation.startTime.split(':')[0]);
            const resEndHour = resStartHour + parseInt(reservation.duration);
            
            // Check for overlap
            if (startHour < resEndHour && endHour > resStartHour) {
                return false;
            }
        }

        // Check against class schedules
        const dayOfWeek = new Date(date).getDay();
        const conflictingClasses = this.classes.filter(classItem =>
            classItem.studio === studio &&
            classItem.dayOfWeek === dayOfWeek
        );

        for (let classItem of conflictingClasses) {
            const classStartHour = parseInt(classItem.startTime.split(':')[0]);
            const classEndHour = parseInt(classItem.endTime.split(':')[0]);
            
            // Check for overlap
            if (startHour < classEndHour && endHour > classStartHour) {
                return false;
            }
        }

        return true;
    }

    updateAvailability() {
        const dateInput = document.getElementById('date');
        const studioSelect = document.getElementById('studio');
        const availabilityGrid = document.getElementById('availabilityGrid');

        if (!availabilityGrid) return;

        if (!dateInput || !dateInput.value || !studioSelect || !studioSelect.value) {
            availabilityGrid.innerHTML = '<p style="text-align: center; color: #64748b;">Select date and studio to view availability</p>';
            return;
        }

        const selectedDate = dateInput.value;
        const selectedStudio = studioSelect.value;
        const dayOfWeek = new Date(selectedDate).getDay();
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

        // Generate time slots for the day
        const timeSlots = [];
        for (let hour = 8; hour <= 17; hour++) {
            const timeString = `${hour.toString().padStart(2, '0')}:00`;
            const isAvailable = this.isTimeSlotAvailable(selectedDate, timeString, selectedStudio, 1);
            
            timeSlots.push({
                time: timeString,
                display: hour <= 12 ? `${hour}:00 AM` : `${hour - 12}:00 PM`,
                available: isAvailable
            });
        }

        // Render availability
        availabilityGrid.innerHTML = `
            <div class="availability-day">
                <h4>${dayNames[dayOfWeek]}, ${new Date(selectedDate).toLocaleDateString()}</h4>
                <div class="time-slots">
                    ${timeSlots.map(slot => `
                        <span class="time-slot ${slot.available ? 'available' : 'occupied'}">
                            ${slot.display}
                        </span>
                    `).join('')}
                </div>
            </div>
        `;
    }

    loadAvailability() {
        const availabilityGrid = document.getElementById('availabilityGrid');
        if (!availabilityGrid) return;
        availabilityGrid.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: #64748b;">
                <i class="fas fa-calendar-alt" style="font-size: 2rem; margin-bottom: 1rem; display: block;"></i>
                <p>Select a date and studio type to view availability</p>
            </div>
        `;
    }

    showSuccessModal(reservation) {
        const modal = document.getElementById('successModal');
        const summaryDiv = document.getElementById('reservationSummary');
        
        summaryDiv.innerHTML = `
            <h4 style="margin-bottom: 1rem; color: #1e293b;">Reservation Details:</h4>
            <div style="display: grid; gap: 0.5rem; font-size: 0.875rem;">
                <div><strong>Name:</strong> ${reservation.studentName}</div>
                <div><strong>Student ID:</strong> ${reservation.studentId}</div>
                <div><strong>College:</strong> ${reservation.college || '—'}</div>
                <div><strong>Department:</strong> ${reservation.department || '—'}</div>
                <div><strong>Date:</strong> ${new Date(reservation.date).toLocaleDateString()}</div>
                <div><strong>Time:</strong> ${reservation.fromTime} to ${reservation.toTime}</div>
                <div><strong>Duration:</strong> ${reservation.duration}</div>
                <div><strong>Project Name:</strong> ${reservation.projectName}</div>
                <div><strong>Supervisor:</strong> ${reservation.supervisor}</div>
                <div><strong>Needed Tools:</strong> ${reservation.neededTools || 'None'}</div>
                <div><strong>Status:</strong> <span class="status-pending">Pending Approval</span></div>
            </div>
        `;

        modal.classList.add('show');
        modal.classList.add('fade-in');
    }

    getStudioDisplayName(studioValue) {
        const studioNames = {
            'video-production': 'Video Production Studio',
            'audio-recording': 'Audio Recording Studio',
            'photography': 'Photography Studio',
            'editing-suite': 'Editing Suite',
            'live-streaming': 'Live Streaming Studio'
        };
        return studioNames[studioValue] || studioValue;
    }

    formatTime(timeString) {
        const hour = parseInt(timeString.split(':')[0]);
        return hour <= 12 ? `${hour}:00 AM` : `${hour - 12}:00 PM`;
    }

    showNotification(message, type = 'info') {
        // Remove existing notifications
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(notification => notification.remove());

        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;
        
        notification.style.cssText = `
            position: fixed;
            top: 2rem;
            right: 2rem;
            background: ${type === 'error' ? '#ef4444' : '#10b981'};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 0.5rem;
            box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
            z-index: 1001;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-weight: 500;
            animation: slideInRight 0.3s ease-out;
        `;

        document.body.appendChild(notification);

        // Auto remove after 5 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease-in';
            setTimeout(() => notification.remove(), 300);
        }, 5000);
    }

    animateElements() {
        // Add fade-in animation to cards
        const cards = document.querySelectorAll('.reservation-card, .availability-card');
        cards.forEach((card, index) => {
            setTimeout(() => {
                card.classList.add('fade-in');
            }, index * 200);
        });
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Global functions for modal
function closeModal() {
    const modal = document.getElementById('successModal');
    modal.classList.remove('show');
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Initialize the reservation system when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ReservationSystem();
});