// Admin Dashboard JavaScript
class AdminDashboard {
    constructor() {
        this.currentSection = 'dashboard';
        this.reservations = [];
        this.classes = [];
        this.studios = [];
        this.borrows = [];
        this.currentReservationId = null;
        this.currentBorrowId = null;
        this.editingClassId = null;
        this.init();
    }

    init() {
        this.loadData();
        this.setupEventListeners();
        this.showSection('dashboard');
        // Initialize date picker to today
        const initialDate = this.getTodayISO();
        const dateInput = document.getElementById('scheduleDate');
        if (dateInput) {
            dateInput.value = initialDate;
        }
        // Defer heavier renders so initial UI paints faster
        const doRender = () => {
            this.updateStats();
            this.renderRecentReservations();
            this.renderScheduleForDate(this.getSelectedDate());
        };
        if (typeof window.requestIdleCallback === 'function') {
            window.requestIdleCallback(doRender, { timeout: 500 });
        } else {
            setTimeout(doRender, 0);
        }
    }

    loadData() {
        // Load reservations from localStorage (synced with reservation page)
        try {
            const storedReservations = JSON.parse(localStorage.getItem('reservations')) || [];
            this.reservations = storedReservations;
        } catch (e) {
            this.reservations = [];
        }

        // Load classes from localStorage or use minimal sample
        try {
            const storedClasses = JSON.parse(localStorage.getItem('classes')) || [];
            this.classes = storedClasses.length ? storedClasses : [
                {
                    id: 1,
                    name: 'Digital Photography Basics',
                    instructor: 'Dr. Sarah Ahmed',
                    studio: 'photography',
                    date: new Date().toISOString().split('T')[0],
                    time: '09:00-12:00',
                    students: 15,
                    maxStudents: 20
                }
            ];
            // Normalize any existing class times to 24h HH:MM-HH:MM for consistency
            this.classes = this.classes.map(c => {
                if (c && typeof c.time === 'string' && c.time.includes('-')) {
                    const [s, e] = c.time.split('-').map(x => String(x).trim());
                    const s24 = this.to24Hour(s);
                    const e24 = this.to24Hour(e);
                    return { ...c, time: `${s24}-${e24}` };
                }
                return c;
            });
        } catch (e) {
            this.classes = [];
        }

        // Load borrows from localStorage (synced with borrow page)
        try {
            const storedBorrows = JSON.parse(localStorage.getItem('borrows')) || [];
            this.borrows = storedBorrows;
        } catch (e) {
            this.borrows = [];
        }

        // Sample studios data
        this.studios = [
            {
                id: 1,
                name: 'Photography Studio A',
                type: 'Photography Studio',
                capacity: 20,
                equipment: ['Professional Cameras', 'Lighting Equipment', 'Backdrops'],
                status: 'available',
                currentBooking: null
            }
        ];
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const section = item.getAttribute('data-section');
                this.showSection(section);
            });
        });

        // Filter listeners
        const statusFilter = document.getElementById('statusFilter');
        const studioFilter = document.getElementById('studioFilter');
        
        if (statusFilter) {
            statusFilter.addEventListener('change', () => this.filterReservations());
        }
        
        if (studioFilter) {
            studioFilter.addEventListener('change', () => this.filterReservations());
        }

        // Modal listeners
        this.setupModalListeners();

        // Form listeners
        this.setupFormListeners();

        // Daily schedule date selector
        const scheduleDateInput = document.getElementById('scheduleDate');
        if (scheduleDateInput) {
            // Ensure a default value
            if (!scheduleDateInput.value) {
                scheduleDateInput.value = this.getTodayISO();
            }
            scheduleDateInput.addEventListener('change', () => {
                this.renderScheduleForDate(scheduleDateInput.value);
            });
        }
    }

    setupModalListeners() {
        // Close modal listeners
        document.querySelectorAll('.modal-close, .modal-overlay').forEach(element => {
            element.addEventListener('click', (e) => {
                if (e.target === element) {
                    this.closeModal();
                }
            });
        });

        // Add class button
        const addClassBtn = document.getElementById('addClassBtn');
        if (addClassBtn) {
            addClassBtn.addEventListener('click', () => {
                this.showAddClassModal();
            });
        }
    }

    setupFormListeners() {
        // Class form submission
        const classForm = document.getElementById('classForm');
        if (classForm) {
            classForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleAddClass();
            });
        }
    }

    showSection(sectionName) {
        // Update navigation (guard against missing elements)
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        const navItem = document.querySelector(`[data-section="${sectionName}"]`);
        if (navItem) navItem.classList.add('active');

        // Update content
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });
        const targetSection = document.getElementById(`${sectionName}-section`);
        if (targetSection) targetSection.classList.add('active');

        this.currentSection = sectionName;

        // Load section-specific data
        switch (sectionName) {
            case 'reservations':
                this.renderReservationsTable();
                break;
            case 'classes':
                this.renderClassesGrid();
                break;
            case 'studios':
                this.renderStudiosGrid();
                break;
            case 'borrowing':
                this.renderBorrowTable();
                break;
        }
    }

    updateStats() {
        const totalReservations = this.reservations.length;
        const pendingReservations = this.reservations.filter(r => r.status === 'pending').length;
        const todayStr = this.getTodayISO();
        const approvedToday = this.reservations.filter(r => r.status === 'approved' && r.date === todayStr).length;
        const totalClasses = this.classes.length;

        document.getElementById('totalCount').textContent = totalReservations;
        document.getElementById('pendingCount').textContent = pendingReservations;
        document.getElementById('approvedCount').textContent = approvedToday;
        document.getElementById('classesCount').textContent = totalClasses;
    }

    renderRecentReservations() {
        const container = document.getElementById('recentPending');
        if (!container) return;

        const recentReservations = this.reservations
            .filter(r => r.status === 'pending')
            .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))
            .slice(0, 5);

        if (recentReservations.length === 0) {
            container.innerHTML = '<div class="empty-state"><p>No recent reservations</p></div>';
            return;
        }

        container.innerHTML = recentReservations.map(reservation => `
            <div class="reservation-item">
                <div class="item-header">
                    <span class="item-title">${reservation.studentName}</span>
                    <span class="status-badge status-${reservation.status}">${reservation.status}</span>
                </div>
                <div class="item-details">
                    ${this.formatDate(reservation.date)} • ${(reservation.fromTime || reservation.time) || ''}${reservation.toTime ? ' - ' + reservation.toTime : ''}
                </div>
            </div>
        `).join('');
    }

    renderScheduleForDate(dateStr) {
        const container = document.getElementById('todaySchedule');
        if (!container) return;

        const selectedDate = dateStr || this.getTodayISO();

        const dayClasses = this.classes
            .filter(c => c.date === selectedDate)
            .map(c => {
                const [start, end] = (c.time || '').split('-');
                return {
                    type: 'class',
                    title: c.name,
                    subtitle: `${c.instructor} • ${c.studio || ''}`.trim(),
                    start,
                    end
                };
            });

        const approvedForDay = this.reservations
            .filter(r => r.date === selectedDate && r.status === 'approved')
            .map(r => ({
                type: 'reservation',
                title: r.studentName,
                subtitle: `${r.projectName || ''}`.trim(),
                start: r.fromTime || (r.time ? r.time.split('-')[0] : ''),
                end: r.toTime || (r.time ? r.time.split('-')[1] : '')
            }));

        const items = [...dayClasses, ...approvedForDay]
            .sort((a, b) => this.timeToMinutes(a.start) - this.timeToMinutes(b.start));

        if (items.length === 0) {
            container.innerHTML = '<div class="empty-state"><p>No schedule for selected day</p></div>';
            return;
        }

        container.innerHTML = items.map(item => `
            <div class="schedule-item">
                <div class="item-header">
                    <span class="item-title">${item.title}</span>
                    <span class="text-sm text-secondary">${item.type === 'class' ? 'Class' : 'Reservation'}</span>
                </div>
                <div class="item-details">
                    ${item.subtitle} • ${item.start || ''}${item.end ? ' - ' + item.end : ''}
                </div>
            </div>
        `).join('');
    }

    renderReservationsTable() {
        const tbody = document.getElementById('reservationsTableBody');
        if (!tbody) return;

        let filteredReservations = [...this.reservations];

        // Apply filters
        // Avoid optional chaining for broader Safari compatibility
        const statusFilterEl = document.getElementById('statusFilter');
        const studioFilterEl = document.getElementById('studioFilter');
        const statusFilter = statusFilterEl ? statusFilterEl.value : '';
        const studioFilter = studioFilterEl ? studioFilterEl.value : '';

        if (statusFilter && statusFilter !== 'all') {
            filteredReservations = filteredReservations.filter(r => r.status === statusFilter);
        }

        if (studioFilter && studioFilter !== 'all') {
            filteredReservations = filteredReservations.filter(r => (r.studioType === studioFilter) || (r.studio === studioFilter));
        }

        if (filteredReservations.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">No reservations found</td></tr>';
            return;
        }

        tbody.innerHTML = filteredReservations.map(reservation => `
            <tr>
                <td>
                    <strong>${reservation.studentName}</strong><br>
                    <small class="text-secondary">${reservation.studentId}</small>
                </td>
                <td>${reservation.studioType || reservation.studio || '—'}</td>
                <td>${this.formatDate(reservation.date)} ${reservation.fromTime && reservation.toTime ? `${reservation.fromTime} - ${reservation.toTime}` : (reservation.time || '—')}</td>
                <td>${reservation.duration || '—'}</td>
                <td><span class="status-badge status-${reservation.status}">${reservation.status}</span></td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-sm btn-info" onclick="adminDashboard.viewReservation('${reservation.id}')">
                            <i class="fas fa-eye"></i>
                        </button>
                        ${reservation.status === 'pending' ? `
                            <button class="btn-sm btn-success" onclick="adminDashboard.approveReservation('${reservation.id}')">
                                <i class="fas fa-check"></i>
                            </button>
                            <button class="btn-sm btn-danger" onclick="adminDashboard.rejectReservation('${reservation.id}')">
                                <i class="fas fa-times"></i>
                            </button>
                        ` : ''}
                        <button class="btn-sm btn-danger" title="Delete" onclick="adminDashboard.deleteReservation('${reservation.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    renderClassesGrid() {
        const container = document.getElementById('classesGrid');
        if (!container) return;

        if (this.classes.length === 0) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-calendar-alt"></i><h3>No Classes Scheduled</h3><p>Click "Add New Class" to create your first class.</p></div>';
            return;
        }

        container.innerHTML = this.classes.map(cls => `
            <div class="class-card">
                <div class="class-header">
                    <h3>${cls.name}</h3>
                    <p><i class="fas fa-user"></i> ${cls.instructor}</p>
                </div>
                <div class="class-info">
                    ${cls.studio ? `<p><strong>Studio:</strong> ${cls.studio}</p>` : ''}
                    <p><strong>Date:</strong> ${this.formatDate(cls.date)}</p>
                    <p><strong>Time:</strong> ${cls.time}</p>
                    <p><strong>Students:</strong> ${cls.students}/${cls.maxStudents}</p>
                </div>
                <div class="class-actions">
                    <button class="btn-sm btn-info" onclick="adminDashboard.editClass(${cls.id})">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn-sm btn-danger" onclick="adminDashboard.deleteClass(${cls.id})">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `).join('');
    }

    renderStudiosGrid() {
        const container = document.getElementById('studiosGrid');
        if (!container) return;

        container.innerHTML = this.studios.map(studio => `
            <div class="studio-card">
                <div class="studio-header">
                    <i class="fas fa-video"></i>
                    <h3>${studio.name}</h3>
                </div>
                <div class="studio-status ${studio.status}">
                    <i class="fas fa-circle"></i>
                    <span>${studio.status === 'available' ? 'Available' : 'Occupied'}</span>
                </div>
                ${studio.currentBooking ? `<p><strong>Current:</strong> ${studio.currentBooking}</p>` : ''}
                <p><strong>Type:</strong> ${studio.type}</p>
                <p><strong>Capacity:</strong> ${studio.capacity} people</p>
                <p><strong>Equipment:</strong> ${studio.equipment.join(', ')}</p>
            </div>
        `).join('');
    }

    filterReservations() {
        this.renderReservationsTable();
    }

    viewReservation(id) {
        const reservation = this.reservations.find(r => String(r.id) === String(id));
        if (!reservation) return;

        this.currentReservationId = String(id);

        const modal = document.getElementById('reservationModal');
        const content = document.getElementById('reservationDetails');
        
        content.innerHTML = `
            <div class="reservation-details">
                <h3>Reservation Details</h3>
                <div class="details-grid">
                    <div class="detail-item">
                        <strong>Student Name:</strong>
                        <span>${reservation.studentName}</span>
                    </div>
                    <div class="detail-item">
                        <strong>Student ID:</strong>
                        <span>${reservation.studentId}</span>
                    </div>
                    <div class="detail-item">
                        <strong>Email:</strong>
                        <span>${reservation.email}</span>
                    </div>
                    <div class="detail-item">
                        <strong>Phone:</strong>
                        <span>${reservation.phone}</span>
                    </div>
                    <div class="detail-item">
                        <strong>Supervisor:</strong>
                        <span>${reservation.supervisor || '—'}</span>
                    </div>
                    <div class="detail-item">
                        <strong>Date:</strong>
                        <span>${this.formatDate(reservation.date)}</span>
                    </div>
                    <div class="detail-item">
                        <strong>Time:</strong>
                        <span>${reservation.fromTime && reservation.toTime ? `${reservation.fromTime} - ${reservation.toTime}` : (reservation.time || '—')}</span>
                    </div>
                    <div class="detail-item">
                        <strong>Duration:</strong>
                        <span>${reservation.duration || '—'}</span>
                    </div>
                    <div class="detail-item">
                        <strong>Project Name:</strong>
                        <span>${reservation.projectName || '—'}</span>
                    </div>
                    <div class="detail-item">
                        <strong>About Project:</strong>
                        <span>${reservation.aboutProject || '—'}</span>
                    </div>
                    <div class="detail-item">
                        <strong>Needed Tools:</strong>
                        <span>${reservation.neededTools || '—'}</span>
                    </div>
                    <div class="detail-item">
                        <strong>Status:</strong>
                        <span class="status-badge status-${reservation.status}">${reservation.status}</span>
                    </div>
                    <div class="detail-item">
                        <strong>Submitted:</strong>
                        <span>${this.formatDateTime(reservation.submittedAt)}</span>
                    </div>
                </div>
            </div>
        `;

        modal.style.display = 'flex';
    }

    approveReservation(id) {
        const reservation = this.reservations.find(r => String(r.id) === String(id));
        if (reservation) {
            reservation.status = 'approved';
            localStorage.setItem('reservations', JSON.stringify(this.reservations));
            this.updateStats();
            this.renderReservationsTable();
            this.renderRecentReservations();
            this.renderScheduleForDate(this.getSelectedDate());
            this.showNotification('Reservation approved successfully!', 'success');
        }
    }

    rejectReservation(id) {
        const reservation = this.reservations.find(r => String(r.id) === String(id));
        if (reservation) {
            reservation.status = 'rejected';
            localStorage.setItem('reservations', JSON.stringify(this.reservations));
            this.updateStats();
            this.renderReservationsTable();
            this.renderRecentReservations();
            this.renderScheduleForDate(this.getSelectedDate());
            this.showNotification('Reservation rejected.', 'error');
        }
    }

    deleteReservation(id) {
        if (!confirm('Are you sure you want to delete this reservation?')) return;
        const beforeLength = this.reservations.length;
        this.reservations = this.reservations.filter(r => String(r.id) !== String(id));
        localStorage.setItem('reservations', JSON.stringify(this.reservations));
        if (String(this.currentReservationId) === String(id)) {
            this.closeModal();
            this.currentReservationId = null;
        }
        this.updateStats();
        this.renderReservationsTable();
        this.renderRecentReservations();
        this.renderScheduleForDate(this.getSelectedDate());
        const deleted = this.reservations.length < beforeLength;
        this.showNotification(deleted ? 'Reservation deleted successfully!' : 'Reservation not found.', deleted ? 'success' : 'error');
    }

    showAddClassModal() {
        const modal = document.getElementById('addClassModal');
        if (modal) modal.style.display = 'flex';
    }

    handleAddClass() {
        const form = document.getElementById('addClassForm') || document.getElementById('classForm');
        const formData = new FormData(form);

        // Read explicit date and free-form times from the form
        const dateStr = formData.get('date') || this.getTodayISO();
        const startRaw = (formData.get('startTime') || '').trim();
        const endRaw = (formData.get('endTime') || '').trim();

        // Convert to 24-hour HH:MM to match reservation form
        const start24 = this.to24Hour(startRaw);
        const end24 = this.to24Hour(endRaw);

        const newClass = {
            id: this.classes.length + 1,
            name: formData.get('className'),
            instructor: formData.get('instructor'),
            date: dateStr,
            time: `${start24}-${end24}`,
            students: 0,
            maxStudents: parseInt(formData.get('maxStudents')) || 20
        };

        this.classes.push(newClass);
        localStorage.setItem('classes', JSON.stringify(this.classes));
        this.updateStats();
        this.renderClassesGrid();
        this.renderScheduleForDate(this.getSelectedDate());
        this.closeModal();
        this.showNotification('Class added successfully!', 'success');
        form.reset();
    }

    editClass(id) {
        const cls = this.classes.find(c => c.id === id);
        if (!cls) return;

        this.editingClassId = id;
        const modal = document.getElementById('editClassModal');
        const form = document.getElementById('editClassForm');
        if (!modal || !form) return;

        const [start, end] = (cls.time || '').split('-').map(s => s.trim());

        // Populate form fields
        document.getElementById('editClassId').value = String(cls.id);
        document.getElementById('editClassName').value = cls.name || '';
        document.getElementById('editInstructor').value = cls.instructor || '';
        document.getElementById('editClassDate').value = cls.date || this.getTodayISO();
        document.getElementById('editClassStartTime').value = this.to24Hour(start || '') || '';
        document.getElementById('editClassEndTime').value = this.to24Hour(end || '') || '';
        document.getElementById('editMaxStudents').value = cls.maxStudents || 20;

        modal.style.display = 'flex';
    }

    updateClass() {
        const form = document.getElementById('editClassForm');
        if (!form) return;
        const formData = new FormData(form);

        const id = parseInt(formData.get('id')) || this.editingClassId;
        const clsIdx = this.classes.findIndex(c => c.id === id);
        if (clsIdx === -1) return;

        const startRaw = (formData.get('startTime') || '').trim();
        const endRaw = (formData.get('endTime') || '').trim();
        const start24 = this.to24Hour(startRaw);
        const end24 = this.to24Hour(endRaw);

        const updated = {
            ...this.classes[clsIdx],
            name: formData.get('className'),
            instructor: formData.get('instructor'),
            date: formData.get('date') || this.getTodayISO(),
            time: `${start24}-${end24}`,
            maxStudents: parseInt(formData.get('maxStudents')) || this.classes[clsIdx].maxStudents
        };

        this.classes[clsIdx] = updated;
        localStorage.setItem('classes', JSON.stringify(this.classes));
        this.renderClassesGrid();
        this.renderScheduleForDate(this.getSelectedDate());
        this.closeModal();
        this.showNotification('Class updated successfully!', 'success');
        this.editingClassId = null;
    }

    deleteClass(id) {
        if (confirm('Are you sure you want to delete this class?')) {
            this.classes = this.classes.filter(c => c.id !== id);
            this.updateStats();
            this.renderClassesGrid();
            this.renderScheduleForDate(this.getSelectedDate());
            this.showNotification('Class deleted successfully!', 'success');
        }
    }

    closeModal() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.style.display = 'none';
        });
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;

        // Add to page
        document.body.appendChild(notification);

        // Show notification
        setTimeout(() => notification.classList.add('show'), 100);

        // Remove notification
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    formatDateTime(dateString) {
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    getTodayISO() {
        const d = new Date();
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    }

    getSelectedDate() {
        const el = document.getElementById('scheduleDate');
        return (el && el.value) ? el.value : this.getTodayISO();
    }

    // Parse flexible time like "9", "9:30", "9 AM", "2 pm", "14:00"
    timeToMinutes(t) {
        if (!t) return 0;
        const s = String(t).trim().toLowerCase();
        const m = s.match(/^\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\s*$/);
        if (!m) return 0;
        let h = parseInt(m[1], 10);
        let minutes = m[2] ? parseInt(m[2], 10) : 0;
        const meridiem = m[3];
        // If meridiem is provided, convert to 24h. If not, assume 24h already.
        if (meridiem) {
            if (meridiem === 'pm' && h !== 12) h += 12;
            if (meridiem === 'am' && h === 12) h = 0;
        }
        if (isNaN(h) || isNaN(minutes)) return 0;
        return h * 60 + minutes;
    }

    // Normalize input to display format like "9:00 AM"
    normalizeTimeDisplay(input) {
        const s = String(input || '').trim().toLowerCase();
        const m = s.match(/^\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\s*$/);
        if (!m) return input;
        let h = parseInt(m[1], 10);
        let minutes = m[2] ? parseInt(m[2], 10) : 0;
        let meridiem = m[3];
        // If no meridiem provided but hour >= 0 and <= 23, infer 24h input
        if (!meridiem) {
            if (h === 0) { h = 12; meridiem = 'am'; }
            else if (h === 12) { meridiem = 'pm'; }
            else if (h > 12) { h = h - 12; meridiem = 'pm'; }
            else { meridiem = 'am'; }
        }
        const hh = h; // 1-12 for display
        const mm = String(minutes).padStart(2, '0');
        return `${hh}:${mm} ${meridiem.toUpperCase()}`;
    }

    // Convert input time to 24h HH:MM
    to24Hour(input) {
        const s = String(input || '').trim().toLowerCase();
        const m = s.match(/^\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\s*$/);
        if (!m) return input;
        let h = parseInt(m[1], 10);
        let minutes = m[2] ? parseInt(m[2], 10) : 0;
        const meridiem = m[3];
        if (meridiem === 'pm' && h !== 12) h += 12;
        if (meridiem === 'am' && h === 12) h = 0;
        if (isNaN(h) || isNaN(minutes)) return input;
        const hh = String(h).padStart(2, '0');
        const mm = String(minutes).padStart(2, '0');
        return `${hh}:${mm}`;
    }

    // Borrow Equipment Management Methods
    renderBorrowTable() {
        const tbody = document.getElementById('borrowTableBody');
        const statusFilter = document.getElementById('borrowStatusFilter');
        
        if (!tbody) return;

        const filterValue = statusFilter ? statusFilter.value : '';
        let filteredBorrows = this.borrows;

        if (filterValue) {
            filteredBorrows = this.borrows.filter(b => b.status === filterValue);
        }

        // Sort by submission date (newest first)
        filteredBorrows.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

        if (filteredBorrows.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 2rem; color: #64748b;">
                        <i class="fas fa-inbox" style="font-size: 2rem; margin-bottom: 0.5rem; display: block;"></i>
                        No borrow requests found
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = filteredBorrows.map(borrow => `
            <tr>
                <td>
                    <div style="font-weight: 600;">${borrow.studentName}</div>
                    <div style="font-size: 0.875rem; color: #64748b;">${borrow.studentId}</div>
                </td>
                <td>${borrow.classType}${borrow.classOther !== 'N/A' ? ` (${borrow.classOther})` : ''}</td>
                <td>${new Date(borrow.borrowDate).toLocaleDateString()}</td>
                <td>${new Date(borrow.returnDate).toLocaleDateString()}</td>
                <td>
                    <div style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${borrow.tools}">
                        ${borrow.tools}
                    </div>
                </td>
                <td>
                    <span class="status-badge ${borrow.status}">
                        ${borrow.status.charAt(0).toUpperCase() + borrow.status.slice(1)}
                    </span>
                </td>
                <td>
                    <button class="btn-icon" onclick="viewBorrowDetails('${borrow.id}')" title="View Details">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            </tr>
        `).join('');

        // Setup filter listener
        if (statusFilter) {
            statusFilter.removeEventListener('change', this.borrowFilterHandler);
            this.borrowFilterHandler = () => this.renderBorrowTable();
            statusFilter.addEventListener('change', this.borrowFilterHandler);
        }
    }

    viewBorrowDetails(borrowId) {
        const borrow = this.borrows.find(b => b.id === borrowId);
        if (!borrow) return;

        this.currentBorrowId = borrowId;
        const modal = document.getElementById('borrowModal');
        const detailsDiv = document.getElementById('borrowDetails');

        detailsDiv.innerHTML = `
            <div class="details-grid">
                <div class="detail-item">
                    <strong>Student Name</strong>
                    <span>${borrow.studentName}</span>
                </div>
                <div class="detail-item">
                    <strong>Student ID</strong>
                    <span>${borrow.studentId}</span>
                </div>
                <div class="detail-item">
                    <strong>Email</strong>
                    <span>${borrow.email}</span>
                </div>
                <div class="detail-item">
                    <strong>Phone</strong>
                    <span>${borrow.phone}</span>
                </div>
                <div class="detail-item">
                    <strong>Borrow Date</strong>
                    <span>${new Date(borrow.borrowDate).toLocaleDateString()}</span>
                </div>
                <div class="detail-item">
                    <strong>Return Date</strong>
                    <span>${new Date(borrow.returnDate).toLocaleDateString()}</span>
                </div>
                <div class="detail-item">
                    <strong>DR</strong>
                    <span>${borrow.dr}</span>
                </div>
                <div class="detail-item">
                    <strong>Class</strong>
                    <span>${borrow.classType}${borrow.classOther !== 'N/A' ? ` (${borrow.classOther})` : ''}</span>
                </div>
                <div class="detail-item">
                    <strong>Supervisor</strong>
                    <span>${borrow.supervisor}</span>
                </div>
                <div class="detail-item" style="grid-column: 1 / -1;">
                    <strong>Needed Tools</strong>
                    <span style="white-space: pre-wrap;">${borrow.tools}</span>
                </div>
                <div class="detail-item">
                    <strong>Status</strong>
                    <span class="status-badge ${borrow.status}">
                        ${borrow.status.charAt(0).toUpperCase() + borrow.status.slice(1)}
                    </span>
                </div>
                <div class="detail-item">
                    <strong>Submitted At</strong>
                    <span>${new Date(borrow.submittedAt).toLocaleString()}</span>
                </div>
            </div>
        `;

        modal.classList.add('show');
    }

    approveBorrow() {
        if (!this.currentBorrowId) return;

        const borrow = this.borrows.find(b => b.id === this.currentBorrowId);
        if (!borrow) return;

        borrow.status = 'approved';
        localStorage.setItem('borrows', JSON.stringify(this.borrows));
        
        this.closeBorrowModal();
        this.renderBorrowTable();
        this.showNotification('Borrow request approved successfully', 'success');
    }

    rejectBorrow() {
        if (!this.currentBorrowId) return;

        const borrow = this.borrows.find(b => b.id === this.currentBorrowId);
        if (!borrow) return;

        borrow.status = 'rejected';
        localStorage.setItem('borrows', JSON.stringify(this.borrows));
        
        this.closeBorrowModal();
        this.renderBorrowTable();
        this.showNotification('Borrow request rejected', 'info');
    }

    markAsReturned() {
        if (!this.currentBorrowId) return;

        const borrow = this.borrows.find(b => b.id === this.currentBorrowId);
        if (!borrow) return;

        borrow.status = 'returned';
        localStorage.setItem('borrows', JSON.stringify(this.borrows));
        
        this.closeBorrowModal();
        this.renderBorrowTable();
        this.showNotification('Equipment marked as returned', 'success');
    }

    closeBorrowModal() {
        const modal = document.getElementById('borrowModal');
        if (modal) {
            modal.classList.remove('show');
        }
        this.currentBorrowId = null;
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.adminDashboard = new AdminDashboard();
    // Global adapters for HTML inline handlers
    window.openAddClassModal = () => window.adminDashboard.showAddClassModal();
    window.closeAddClassModal = () => window.adminDashboard.closeModal();
    window.addClass = () => window.adminDashboard.handleAddClass();
    window.closeEditClassModal = () => window.adminDashboard.closeModal();
    window.updateClass = () => window.adminDashboard.updateClass();
    window.closeReservationModal = () => window.adminDashboard.closeModal();
    window.approveReservation = () => {
        const id = window.adminDashboard.currentReservationId;
        if (id) window.adminDashboard.approveReservation(id);
        // Refresh day schedule for currently selected date
        window.adminDashboard.renderScheduleForDate(window.adminDashboard.getSelectedDate());
    };
    window.rejectReservation = () => {
        const id = window.adminDashboard.currentReservationId;
        if (id) window.adminDashboard.rejectReservation(id);
        window.adminDashboard.renderScheduleForDate(window.adminDashboard.getSelectedDate());
    };
    // Borrow equipment functions
    window.viewBorrowDetails = (id) => window.adminDashboard.viewBorrowDetails(id);
    window.closeBorrowModal = () => window.adminDashboard.closeBorrowModal();
    window.approveBorrow = () => window.adminDashboard.approveBorrow();
    window.rejectBorrow = () => window.adminDashboard.rejectBorrow();
    window.markAsReturned = () => window.adminDashboard.markAsReturned();
});

// Add notification styles
const notificationStyles = `
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
        z-index: 1000;
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

    .notification i {
        font-size: 18px;
    }

    .details-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 16px;
        margin-top: 20px;
    }

    .detail-item {
        display: flex;
        flex-direction: column;
        gap: 4px;
    }

    .detail-item strong {
        color: #374151;
        font-size: 14px;
    }

    .detail-item span {
        color: #6b7280;
        font-size: 14px;
    }
`;

// Add styles to head
const styleSheet = document.createElement('style');
styleSheet.textContent = notificationStyles;
document.head.appendChild(styleSheet);