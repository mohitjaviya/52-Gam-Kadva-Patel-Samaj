// ===== Profile Page JavaScript =====

let isEditMode = false;
let currentUser = null;

// Initialize profile page
document.addEventListener('DOMContentLoaded', async () => {
    const user = await checkSession();
    
    if (!user) {
        showNotification('Please login to view your profile', 'warning');
        setTimeout(() => {
            window.location.href = '/login';
        }, 1500);
        return;
    }

    loadProfile();

    // Setup change password form
    document.getElementById('changePasswordForm').addEventListener('submit', handlePasswordChange);
});

// Load profile
async function loadProfile() {
    try {
        const response = await fetch('/api/users/profile');
        const data = await response.json();

        if (data.success) {
            currentUser = data.user;
            displayProfile(data.user);
        } else {
            showNotification(data.message || 'Failed to load profile', 'error');
        }
    } catch (error) {
        showNotification('Failed to load profile', 'error');
    }
}

// Display profile
function displayProfile(user) {
    // Header
    document.getElementById('profileName').textContent = 
        `${user.first_name} ${user.middle_name || ''} ${user.last_name}`;
    document.getElementById('profileVillage').innerHTML = 
        `<i class="fas fa-map-marker-alt"></i> ${user.village_name}`;

    // Badges
    document.getElementById('occupationBadge').outerHTML = getOccupationBadge(user.occupation_type);
    document.getElementById('approvalBadge').outerHTML = getApprovalBadge(user.is_approved === 1);

    // Personal Details
    document.getElementById('firstName').textContent = user.first_name;
    document.getElementById('middleName').textContent = user.middle_name || '-';
    document.getElementById('lastName').textContent = user.last_name;
    document.getElementById('gender').textContent = user.gender;
    document.getElementById('village').textContent = user.village_name;
    document.getElementById('currentAddress').textContent = user.current_address;

    // Contact Details
    document.getElementById('phone').textContent = user.phone;
    document.getElementById('email').textContent = user.email;

    // Verification status
    document.getElementById('phoneStatus').innerHTML = user.phone_verified === 1
        ? '<span class="verification-status verified"><i class="fas fa-check-circle"></i> Verified</span>'
        : '<span class="verification-status not-verified"><i class="fas fa-exclamation-circle"></i> Not Verified</span>';
    
    document.getElementById('emailStatus').innerHTML = user.email_verified === 1
        ? '<span class="verification-status verified"><i class="fas fa-check-circle"></i> Verified</span>'
        : '<span class="verification-status not-verified"><i class="fas fa-exclamation-circle"></i> Not Verified</span>';

    // Occupation Details
    displayOccupationDetails(user);

    // Setup edit inputs
    document.getElementById('editFirstName').value = user.first_name;
    document.getElementById('editMiddleName').value = user.middle_name || '';
    document.getElementById('editLastName').value = user.last_name;
    document.getElementById('editCurrentAddress').value = user.current_address;
}

// Display occupation details
function displayOccupationDetails(user) {
    const container = document.getElementById('occupationDetails');
    
    if (!user.occupationDetails) {
        container.innerHTML = '<p>No occupation details available</p>';
        return;
    }

    const details = user.occupationDetails;
    let html = '';

    if (user.occupation_type === 'student') {
        html = `
            <div class="detail-row">
                <span class="detail-label">Course</span>
                <span class="detail-value">${details.department || '-'}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Specialization</span>
                <span class="detail-value">${details.sub_department || '-'}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">College</span>
                <span class="detail-value">${details.college_name || '-'}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">City</span>
                <span class="detail-value">${details.college_city || '-'}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Year of Study</span>
                <span class="detail-value">${details.year_of_study || '-'}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Expected Graduation</span>
                <span class="detail-value">${details.expected_graduation || '-'}</span>
            </div>
            ${details.additional_info ? `
            <div class="detail-row">
                <span class="detail-label">Additional Info</span>
                <span class="detail-value">${details.additional_info}</span>
            </div>
            ` : ''}
        `;
    } else if (user.occupation_type === 'job') {
        html = `
            <div class="detail-row">
                <span class="detail-label">Company</span>
                <span class="detail-value">${details.company_name || '-'}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Designation</span>
                <span class="detail-value">${details.designation || '-'}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Field</span>
                <span class="detail-value">${details.field || '-'}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Working City</span>
                <span class="detail-value">${details.working_city || '-'}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Experience</span>
                <span class="detail-value">${details.experience_years || 0} years</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Graduation Year</span>
                <span class="detail-value">${details.graduation_year || '-'}</span>
            </div>
            ${details.additional_info ? `
            <div class="detail-row">
                <span class="detail-label">Additional Info</span>
                <span class="detail-value">${details.additional_info}</span>
            </div>
            ` : ''}
        `;
    } else if (user.occupation_type === 'business') {
        html = `
            <div class="detail-row">
                <span class="detail-label">Business Name</span>
                <span class="detail-value">${details.business_name || '-'}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Business Type</span>
                <span class="detail-value">${details.business_type || '-'}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Field</span>
                <span class="detail-value">${details.business_field || '-'}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">City</span>
                <span class="detail-value">${details.business_city || '-'}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Address</span>
                <span class="detail-value">${details.business_address || '-'}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Years in Business</span>
                <span class="detail-value">${details.years_in_business || 0}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Employees</span>
                <span class="detail-value">${details.employees_count || 0}</span>
            </div>
            ${details.website ? `
            <div class="detail-row">
                <span class="detail-label">Website</span>
                <span class="detail-value"><a href="${details.website}" target="_blank">${details.website}</a></span>
            </div>
            ` : ''}
            ${details.additional_info ? `
            <div class="detail-row">
                <span class="detail-label">Additional Info</span>
                <span class="detail-value">${details.additional_info}</span>
            </div>
            ` : ''}
        `;
    }

    container.innerHTML = html;
}

// Toggle edit mode
function toggleEditMode() {
    isEditMode = !isEditMode;

    const editInputs = document.querySelectorAll('.edit-input');
    const detailValues = document.querySelectorAll('.detail-value');
    const editActions = document.getElementById('editActions');

    if (isEditMode) {
        editInputs.forEach(input => input.style.display = 'block');
        document.querySelectorAll('#firstName, #middleName, #lastName, #currentAddress').forEach(el => {
            el.style.display = 'none';
        });
        editActions.style.display = 'flex';
    } else {
        editInputs.forEach(input => input.style.display = 'none');
        document.querySelectorAll('#firstName, #middleName, #lastName, #currentAddress').forEach(el => {
            el.style.display = 'inline';
        });
        editActions.style.display = 'none';
    }
}

// Save profile
async function saveProfile() {
    const updateData = {
        firstName: document.getElementById('editFirstName').value,
        middleName: document.getElementById('editMiddleName').value,
        lastName: document.getElementById('editLastName').value,
        currentAddress: document.getElementById('editCurrentAddress').value
    };

    try {
        const response = await fetch('/api/users/profile', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updateData)
        });

        const data = await response.json();

        if (data.success) {
            showNotification('Profile updated successfully', 'success');
            toggleEditMode();
            loadProfile();
        } else {
            showNotification(data.message || 'Failed to update profile', 'error');
        }
    } catch (error) {
        showNotification('Failed to update profile', 'error');
    }
}

// Cancel edit
function cancelEdit() {
    toggleEditMode();
    
    // Reset inputs to current values
    if (currentUser) {
        document.getElementById('editFirstName').value = currentUser.first_name;
        document.getElementById('editMiddleName').value = currentUser.middle_name || '';
        document.getElementById('editLastName').value = currentUser.last_name;
        document.getElementById('editCurrentAddress').value = currentUser.current_address;
    }
}

// Show change password modal
function showChangePasswordModal() {
    document.getElementById('passwordModal').style.display = 'flex';
}

// Close password modal
function closePasswordModal() {
    document.getElementById('passwordModal').style.display = 'none';
    document.getElementById('changePasswordForm').reset();
}

// Handle password change
async function handlePasswordChange(e) {
    e.preventDefault();

    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmNewPassword = document.getElementById('confirmNewPassword').value;

    if (newPassword !== confirmNewPassword) {
        showNotification('New passwords do not match', 'error');
        return;
    }

    if (newPassword.length < 6) {
        showNotification('Password must be at least 6 characters', 'error');
        return;
    }

    try {
        const response = await fetch('/api/users/change-password', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ currentPassword, newPassword })
        });

        const data = await response.json();

        if (data.success) {
            showNotification('Password changed successfully', 'success');
            closePasswordModal();
        } else {
            showNotification(data.message || 'Failed to change password', 'error');
        }
    } catch (error) {
        showNotification('Failed to change password', 'error');
    }
}

// Close modal on outside click
document.getElementById('passwordModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'passwordModal') {
        closePasswordModal();
    }
});
