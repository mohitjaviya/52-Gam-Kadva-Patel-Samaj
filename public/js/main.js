// ===== Main JavaScript - Common functionality =====

// Check session and update navigation
async function checkSession() {
    try {
        const response = await fetch('/api/auth/session', {
            credentials: 'include'
        });
        const data = await response.json();

        const registerLink = document.getElementById('registerLink');
        const loginLink = document.getElementById('loginLink');
        const profileLink = document.getElementById('profileLink');
        const adminLink = document.getElementById('adminLink');
        const logoutLink = document.getElementById('logoutLink');

        if (data.loggedIn && data.user) {
            localStorage.setItem('user', JSON.stringify(data.user));

            if (registerLink) registerLink.style.display = 'none';
            if (loginLink) loginLink.style.display = 'none';
            if (profileLink) profileLink.style.display = 'block';
            if (logoutLink) logoutLink.style.display = 'block';

            if (data.user.isAdmin && adminLink) {
                adminLink.style.display = 'block';
            }

            return data.user;
        } else {
            localStorage.removeItem('user');

            if (registerLink) registerLink.style.display = 'block';
            if (loginLink) loginLink.style.display = 'block';
            if (profileLink) profileLink.style.display = 'none';
            if (adminLink) adminLink.style.display = 'none';
            if (logoutLink) logoutLink.style.display = 'none';

            return null;
        }
    } catch (error) {
        console.error('Session check error:', error);
        return null;
    }
}

// Logout function
async function logout() {
    try {
        const response = await fetch('/api/auth/logout', {
            method: 'POST',
            credentials: 'include'
        });

        if (response.ok) {
            localStorage.removeItem('user');
            showNotification('Logged out successfully', 'success');
            setTimeout(() => {
                window.location.href = '/';
            }, 1000);
        }
    } catch (error) {
        showNotification('Logout failed', 'error');
    }
}

// Show notification
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existing = document.querySelector('.notification');
    if (existing) {
        existing.remove();
    }

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;

    let icon = 'fas fa-info-circle';
    if (type === 'success') icon = 'fas fa-check-circle';
    if (type === 'error') icon = 'fas fa-exclamation-circle';
    if (type === 'warning') icon = 'fas fa-exclamation-triangle';

    notification.innerHTML = `
        <i class="${icon}"></i>
        <span>${message}</span>
    `;

    document.body.appendChild(notification);

    // Auto remove after 5 seconds
    setTimeout(() => {
        notification.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

// Toggle password visibility
function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const button = input.parentElement.querySelector('.toggle-password i');

    if (input.type === 'password') {
        input.type = 'text';
        button.classList.remove('fa-eye');
        button.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        button.classList.remove('fa-eye-slash');
        button.classList.add('fa-eye');
    }
}

// Mobile navigation toggle
document.addEventListener('DOMContentLoaded', () => {
    const navToggle = document.getElementById('navToggle');
    const navLinks = document.getElementById('navLinks');

    if (navToggle && navLinks) {
        navToggle.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            navLinks.classList.toggle('active');
        });

        // Close nav menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!navToggle.contains(e.target) && !navLinks.contains(e.target)) {
                navLinks.classList.remove('active');
            }
        });
    }

    // Check session on page load
    checkSession();

    // Load public stats on home page
    loadPublicStats();
});

// Load public stats for home page
async function loadPublicStats() {
    try {
        const statMembers = document.getElementById('statMembers');
        const statStudents = document.getElementById('statStudents');
        const statProfessionals = document.getElementById('statProfessionals');
        const statVillages = document.getElementById('statVillages');

        // Only run on pages with stat elements (home page)
        if (!statMembers && !statStudents && !statProfessionals) {
            return;
        }

        const response = await fetch('/api/data/public-stats');
        const data = await response.json();

        if (data.success && data.stats) {
            // Animate counting up with correct property names
            if (statMembers) {
                animateCounter(statMembers, data.stats.totalUsers || 0);
            }
            if (statStudents) {
                animateCounter(statStudents, data.stats.totalStudents || 0);
            }
            if (statProfessionals) {
                animateCounter(statProfessionals, (data.stats.totalJobProfessionals || 0) + (data.stats.totalBusinessOwners || 0));
            }
            if (statVillages) {
                animateCounter(statVillages, data.stats.totalVillages || 78);
            }
        }
    } catch (error) {
        console.error('Error loading public stats:', error);
    }
}

// Animate counter from 0 to target value
function animateCounter(element, target) {
    target = parseInt(target) || 0;
    const duration = 1500; // 1.5 seconds
    const start = 0;
    const startTime = performance.now();

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Easing function for smooth animation
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        const current = Math.floor(start + (target - start) * easeOutQuart);

        element.textContent = current;

        if (progress < 1) {
            requestAnimationFrame(update);
        } else {
            element.textContent = target;
        }
    }

    requestAnimationFrame(update);
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
}

// Get occupation badge class
function getOccupationBadge(type) {
    switch (type) {
        case 'student':
            return '<span class="badge badge-student"><i class="fas fa-graduation-cap"></i> Student</span>';
        case 'job':
            return '<span class="badge badge-job"><i class="fas fa-briefcase"></i> Working</span>';
        case 'business':
            return '<span class="badge badge-business"><i class="fas fa-store"></i> Business</span>';
        default:
            return '';
    }
}

// Get approval badge
function getApprovalBadge(isApproved) {
    if (isApproved) {
        return '<span class="badge badge-approved"><i class="fas fa-check"></i> Approved</span>';
    } else {
        return '<span class="badge badge-pending"><i class="fas fa-clock"></i> Pending</span>';
    }
}

// Capitalize first letter
function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// Get initials from name
function getInitials(firstName, lastName) {
    const first = firstName ? firstName.charAt(0).toUpperCase() : '';
    const last = lastName ? lastName.charAt(0).toUpperCase() : '';
    return first + last;
}
