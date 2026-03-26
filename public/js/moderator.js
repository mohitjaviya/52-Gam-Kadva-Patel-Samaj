// ===== Moderator Page JavaScript =====

let currentModeratorPage = 1;
let totalModeratorPages = 1;
let usersCache = {}; // Store users for quick access

// Initialize moderator page
document.addEventListener('DOMContentLoaded', async () => {
    const user = await checkSession();

    if (!user) {
        showNotification('Please login to access moderator panel', 'warning');
        setTimeout(() => {
            window.location.href = '/login';
        }, 1500);
        return;
    }

    if (!user.isModerator && !user.isAdmin) {
        showNotification('You do not have moderator access', 'error');
        setTimeout(() => {
            window.location.href = '/';
        }, 1500);
        return;
    }

    loadPendingApprovals();

    // Auto-refresh pending list every 30 seconds
    setInterval(() => {
        loadPendingApprovals(currentModeratorPage);
    }, 30000);
});

// Load pending approvals
async function loadPendingApprovals(page = 1) {
    try {
        const response = await fetch(`/api/admin/pending?page=${page}&limit=20`);
        const data = await response.json();

        if (data.success) {
            const tbody = document.getElementById('pendingTableBody');
            const emptyState = document.getElementById('pendingEmpty');
            
            // Update the pending count indicator if it exists
            const pendingCountEl = document.getElementById('pendingCount');
            if (pendingCountEl) {
                // The actual count logic for totally accurate numbers might need the stats endpoint,
                // but since moderators don't have access to /stats by default, we just show 
                // the length of the current list or fetch a separate simple count.
                // We'll leave it simple for now based on current page size.
                pendingCountEl.textContent = data.users.length;
            }

            if (data.users.length === 0) {
                tbody.innerHTML = '';
                emptyState.style.display = 'block';
                document.getElementById('moderatorPagination').style.display = 'none';
            } else {
                emptyState.style.display = 'none';
                displayPendingUsers(data.users);

                totalModeratorPages = data.pagination.totalPages || 1;
                currentModeratorPage = data.pagination.page || 1;
                updateModeratorPagination();
            }
        }
    } catch (error) {
        showNotification('Failed to load pending approvals', 'error');
    }
}

// Display pending users
function displayPendingUsers(users) {
    const tbody = document.getElementById('pendingTableBody');
    tbody.innerHTML = '';

    users.forEach(user => {
        // Cache the user for later retrieval
        usersCache[user.id] = user;

        // Get occupation details text
        let detailText = '-';
        if (user.occupationDetails) {
            if (user.occupation_type === 'student') {
                detailText = `${user.occupationDetails.department || '-'} at ${user.occupationDetails.college_name || '-'}`;
            } else if (user.occupation_type === 'job') {
                detailText = `${user.occupationDetails.designation || '-'} at ${user.occupationDetails.company_name || '-'}`;
            } else if (user.occupation_type === 'business') {
                detailText = `${user.occupationDetails.business_name || '-'} (${user.occupationDetails.business_type || '-'})`;
            }
        }

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <strong>${user.first_name} ${user.middle_name || ''} ${user.last_name}</strong>
                <br><small class="text-muted">${user.gender}</small>
            </td>
            <td>${user.village_name}</td>
            <td>${getOccupationBadge(user.occupation_type)}</td>
            <td><small>${detailText}</small></td>
            <td>${user.phone}</td>
            <td>${user.email}</td>
            <td>${formatDate(user.created_at)}</td>
            <td class="actions">
                <button class="btn btn-success btn-small" onclick="approveUser(${user.id})" title="Approve">
                    <i class="fas fa-check"></i>
                </button>
                <button class="btn btn-secondary btn-small" onclick="viewUserDetail(${user.id})" title="View Details">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-danger btn-small" onclick="rejectUser(${user.id})" title="Reject">
                    <i class="fas fa-times"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Approve user
async function approveUser(userId) {
    if (!confirm('Are you sure you want to approve this user?')) return;

    try {
        const response = await fetch(`/api/admin/approve/${userId}`, {
            method: 'POST'
        });
        const data = await response.json();

        if (data.success) {
            showNotification('User approved successfully', 'success');
            loadPendingApprovals(currentModeratorPage);
        } else {
            showNotification(data.message || 'Failed to approve user', 'error');
        }
    } catch (error) {
        showNotification('Failed to approve user', 'error');
    }
}

// Reject user
async function rejectUser(userId) {
    if (!confirm('Are you sure you want to reject and delete this user? This action cannot be undone.')) return;

    try {
        const response = await fetch(`/api/admin/reject/${userId}`, {
            method: 'DELETE'
        });
        const data = await response.json();

        if (data.success) {
            showNotification('User rejected and deleted', 'success');
            loadPendingApprovals(currentModeratorPage);
        } else {
            showNotification(data.message || 'Failed to reject user', 'error');
        }
    } catch (error) {
        showNotification('Failed to reject user', 'error');
    }
}

// View user detail
function viewUserDetail(userId) {
    const user = usersCache[userId];
    if (!user) {
        showNotification('User data not found', 'error');
        return;
    }

    const content = document.getElementById('userDetailContent');
    let occupationHTML = '';

    if (user.occupationDetails) {
        if (user.occupation_type === 'student') {
            occupationHTML = `
                <div class="detail-section">
                    <h4><i class="fas fa-graduation-cap"></i> Student Details</h4>
                    <p><strong>Course:</strong> ${user.occupationDetails.department || '-'}</p>
                    <p><strong>Specialization:</strong> ${user.occupationDetails.sub_department || '-'}</p>
                    <p><strong>College:</strong> ${user.occupationDetails.college_name || '-'}</p>
                    <p><strong>City:</strong> ${user.occupationDetails.college_city || '-'}</p>
                    <p><strong>Year:</strong> ${user.occupationDetails.year_of_study || '-'}</p>
                    ${user.occupationDetails.additional_info ? `<p><strong>Additional Info:</strong> ${user.occupationDetails.additional_info}</p>` : ''}
                </div>
            `;
        } else if (user.occupation_type === 'job') {
            occupationHTML = `
                <div class="detail-section">
                    <h4><i class="fas fa-briefcase"></i> Job Details</h4>
                    <p><strong>Company:</strong> ${user.occupationDetails.company_name || '-'}</p>
                    <p><strong>Designation:</strong> ${user.occupationDetails.designation || '-'}</p>
                    <p><strong>Field:</strong> ${user.occupationDetails.field || '-'}</p>
                    <p><strong>Working City:</strong> ${user.occupationDetails.working_city || '-'}</p>
                    <p><strong>Experience:</strong> ${user.occupationDetails.experience_years || 0} years</p>
                    ${user.occupationDetails.graduation_year ? `<p><strong>Graduation Year:</strong> ${user.occupationDetails.graduation_year}</p>` : ''}
                    ${user.occupationDetails.college_name ? `<p><strong>College:</strong> ${user.occupationDetails.college_name}</p>` : ''}
                    ${user.occupationDetails.department ? `<p><strong>Department:</strong> ${user.occupationDetails.department}</p>` : ''}
                    ${user.occupationDetails.graduation_branch ? `<p><strong>Branch:</strong> ${user.occupationDetails.graduation_branch}</p>` : ''}
                    ${user.occupationDetails.additional_info ? `<p><strong>Additional Info:</strong> ${user.occupationDetails.additional_info}</p>` : ''}
                </div>
            `;
        } else if (user.occupation_type === 'business') {
            occupationHTML = `
                <div class="detail-section">
                    <h4><i class="fas fa-store"></i> Business Details</h4>
                    <p><strong>Business Name:</strong> ${user.occupationDetails.business_name || '-'}</p>
                    <p><strong>Type:</strong> ${user.occupationDetails.business_type || '-'}</p>
                    <p><strong>Field:</strong> ${user.occupationDetails.business_field || '-'}</p>
                    <p><strong>City:</strong> ${user.occupationDetails.business_city || '-'}</p>
                    <p><strong>Address:</strong> ${user.occupationDetails.business_address || '-'}</p>
                    <p><strong>Years in Business:</strong> ${user.occupationDetails.years_in_business || 0}</p>
                    ${user.occupationDetails.employees_count ? `<p><strong>Employees:</strong> ${user.occupationDetails.employees_count}</p>` : ''}
                    ${user.occupationDetails.website ? `<p><strong>Website:</strong> <a href="${user.occupationDetails.website}" target="_blank">${user.occupationDetails.website}</a></p>` : ''}
                    ${user.occupationDetails.additional_info ? `<p><strong>Additional Info:</strong> ${user.occupationDetails.additional_info}</p>` : ''}
                </div>
            `;
        }
    }

    content.innerHTML = `
        <h2><i class="fas fa-user"></i> ${user.first_name} ${user.middle_name || ''} ${user.last_name}</h2>
        <div class="user-detail-badges">
            ${getOccupationBadge(user.occupation_type)}
            ${getApprovalBadge(user.is_approved === 1)}
        </div>
        <div class="detail-section">
            <h4><i class="fas fa-id-card"></i> Personal Details</h4>
            <p><strong>Gender:</strong> ${user.gender}</p>
            <p><strong>Village:</strong> ${user.village_name}</p>
            <p><strong>Address:</strong> ${user.current_address}</p>
            <p><strong>Phone:</strong> ${user.phone}</p>
            <p><strong>Email:</strong> ${user.email}</p>
            <p><strong>Phone Verified:</strong> ${user.phone_verified === 1 ? 'Yes' : 'No'}</p>
            <p><strong>Email Verified:</strong> ${user.email_verified === 1 ? 'Yes' : 'No'}</p>
            <p><strong>Registered:</strong> ${formatDate(user.created_at)}</p>
        </div>
        ${occupationHTML}
    `;

    document.getElementById('userDetailModal').style.display = 'flex';
}

// Close user modal
function closeUserModal() {
    document.getElementById('userDetailModal').style.display = 'none';
}

// Update moderator pagination
function updateModeratorPagination() {
    const pagination = document.getElementById('moderatorPagination');

    if (totalModeratorPages > 1) {
        pagination.style.display = 'flex';
        document.getElementById('moderatorPageInfo').textContent = `Page ${currentModeratorPage} of ${totalModeratorPages}`;
        document.getElementById('moderatorPrevBtn').disabled = currentModeratorPage === 1;
        document.getElementById('moderatorNextBtn').disabled = currentModeratorPage === totalModeratorPages;
    } else {
        pagination.style.display = 'none';
    }
}

// Change moderator page
function changeModeratorPage(direction) {
    if (direction === 'prev' && currentModeratorPage > 1) {
        currentModeratorPage--;
    } else if (direction === 'next' && currentModeratorPage < totalModeratorPages) {
        currentModeratorPage++;
    }
    loadPendingApprovals(currentModeratorPage);
}

// Close modal on outside click
document.getElementById('userDetailModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'userDetailModal') {
        closeUserModal();
    }
});
