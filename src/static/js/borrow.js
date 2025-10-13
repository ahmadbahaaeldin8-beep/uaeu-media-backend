// Borrow Equipment System JavaScript
class BorrowSystem {
    constructor() {
        this.borrows = JSON.parse(localStorage.getItem('borrows')) || [];
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setMinDate();
        this.animateElements();
    }

    setupEventListeners() {
        const form = document.getElementById('borrowForm');
        const borrowDateInput = document.getElementById('borrowDate');
        const returnDateInput = document.getElementById('returnDate');

        if (form) {
            form.addEventListener('submit', (e) => this.handleSubmit(e));
        }

        // Set return date minimum based on borrow date
        if (borrowDateInput && returnDateInput) {
            borrowDateInput.addEventListener('change', () => {
                const borrowDate = new Date(borrowDateInput.value);
                borrowDate.setDate(borrowDate.getDate() + 1);
                returnDateInput.setAttribute('min', borrowDate.toISOString().split('T')[0]);
                
                // Reset return date if it's before the new minimum
                if (returnDateInput.value && new Date(returnDateInput.value) <= new Date(borrowDateInput.value)) {
                    returnDateInput.value = '';
                }
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
        const borrowDateInput = document.getElementById('borrowDate');
        const returnDateInput = document.getElementById('returnDate');
        
        if (!borrowDateInput || !returnDateInput) return;
        
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const minDate = tomorrow.toISOString().split('T')[0];
        borrowDateInput.setAttribute('min', minDate);
        
        // Set max date to 30 days from now
        const maxDate = new Date(today);
        maxDate.setDate(maxDate.getDate() + 30);
        borrowDateInput.setAttribute('max', maxDate.toISOString().split('T')[0]);
    }

    validateField(field) {
        const value = field.value.trim();
        let isValid = true;
        let errorMessage = '';

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
        
        const existingError = field.parentNode.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }

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

        // Validate return date is after borrow date
        const borrowDate = new Date(formData.get('borrowDate'));
        const returnDate = new Date(formData.get('returnDate'));
        
        if (returnDate <= borrowDate) {
            this.showNotification('Return date must be after borrow date', 'error');
            return;
        }

        // Show loading state
        const submitBtn = form.querySelector('.submit-btn');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<div class="spinner"></div> Submitting...';
        submitBtn.disabled = true;

        try {
            // Create borrow object
            const borrow = {
                id: Date.now().toString(),
                studentName: formData.get('studentName'),
                studentId: formData.get('studentId'),
                email: formData.get('email'),
                phone: formData.get('phone'),
                borrowDate: formData.get('borrowDate'),
                returnDate: formData.get('returnDate'),
                dr: formData.get('dr') || 'N/A',
                classType: formData.get('classType'),
                classOther: formData.get('classOther') || 'N/A',
                tools: formData.get('tools'),
                supervisor: formData.get('supervisor'),
                status: 'pending',
                submittedAt: new Date().toISOString()
            };

            // Save borrow request
            this.borrows.push(borrow);
            localStorage.setItem('borrows', JSON.stringify(this.borrows));

            // Send email notification to admin
            try {
                const emailResponse = await fetch('https://mzhyi8c1mgmj.manus.space/api/submit-borrow', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(borrow)
                });
                
                if (!emailResponse.ok) {
                    console.warn('Email notification failed, but borrow request was saved');
                }
            } catch (emailError) {
                console.warn('Failed to send email notification:', emailError);
            }

            // Show success modal
            this.showSuccessModal(borrow);
            
            // Reset form
            form.reset();

        } catch (error) {
            this.showNotification('Failed to submit borrow request. Please try again.', 'error');
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }

    showSuccessModal(borrow) {
        const modal = document.getElementById('successModal');
        const summaryDiv = document.getElementById('borrowSummary');
        
        summaryDiv.innerHTML = `
            <h4 style="margin-bottom: 1rem; color: #1e293b;">Borrow Request Details:</h4>
            <div style="display: grid; gap: 0.5rem; font-size: 0.875rem;">
                <div><strong>Name:</strong> ${borrow.studentName}</div>
                <div><strong>Student ID:</strong> ${borrow.studentId}</div>
                <div><strong>Borrow Date:</strong> ${new Date(borrow.borrowDate).toLocaleDateString()}</div>
                <div><strong>Return Date:</strong> ${new Date(borrow.returnDate).toLocaleDateString()}</div>
                <div><strong>Class:</strong> ${borrow.classType}</div>
                <div><strong>Supervisor:</strong> ${borrow.supervisor}</div>
                <div><strong>Tools:</strong> ${borrow.tools}</div>
            </div>
        `;
        
        modal.classList.add('show');
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'error' ? '#ef4444' : '#3b82f6'};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            display: flex;
            align-items: center;
            gap: 0.75rem;
            animation: slideIn 0.3s ease-out;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    animateElements() {
        const elements = document.querySelectorAll('.form-section, .card-header');
        elements.forEach((el, index) => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
                el.style.opacity = '1';
                el.style.transform = 'translateY(0)';
            }, index * 100);
        });
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Close modal function
function closeModal() {
    const modal = document.getElementById('successModal');
    if (modal) {
        modal.classList.remove('show');
    }
}

// Initialize the system when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new BorrowSystem();
});

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    .spinner {
        display: inline-block;
        width: 16px;
        height: 16px;
        border: 2px solid rgba(255,255,255,0.3);
        border-top-color: white;
        border-radius: 50%;
        animation: spin 0.6s linear infinite;
    }
    
    @keyframes spin {
        to { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);

