// ===== Admin Page JavaScript =====

let currentAdminPage = 1;
let totalAdminPages = 1;
let currentTab = 'pending';
let usersCache = {}; // Store users for quick access

// Initialize admin page
document.addEventListener('DOMContentLoaded', async () => {
    const user = await checkSession();

    if (!user) {
        showNotification('Please login to access admin panel', 'warning');
        setTimeout(() => {
            window.location.href = '/login';
        }, 1500);
        return;
    }

    if (!user.isAdmin) {
        showNotification('You do not have admin access', 'error');
        setTimeout(() => {
            window.location.href = '/';
        }, 1500);
        return;
    }

    loadStats();
    loadPendingApprovals();
    loadVillageFilter();

    // Auto-refresh stats every 30 seconds
    setInterval(() => {
        loadStats();
    }, 30000);
});

// Load statistics
async function loadStats() {
    try {
        const response = await fetch('/api/admin/stats');
        const data = await response.json();

        console.log('Stats API response:', data);

        if (data.success) {
            document.getElementById('totalUsers').textContent = data.stats.totalUsers || 0;
            document.getElementById('approvedUsers').textContent = data.stats.approvedUsers || 0;
            document.getElementById('pendingUsers').textContent = data.stats.pendingUsers || 0;
            document.getElementById('students').textContent = data.stats.students || 0;
            document.getElementById('jobs').textContent = data.stats.jobs || 0;
            document.getElementById('businesses').textContent = data.stats.businesses || 0;
            document.getElementById('pendingCount').textContent = data.stats.pendingUsers || 0;

            // Render village chart
            if (data.stats.villageStats && data.stats.villageStats.length > 0) {
                renderVillageChart(data.stats.villageStats);
            }
        } else {
            console.error('Stats API error:', data.message);
        }
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Render village distribution chart
function renderVillageChart(villageStats) {
    const container = document.getElementById('villageChart');

    const maxCount = Math.max(...villageStats.map(v => v.count));

    let html = '<div class="bar-chart">';
    villageStats.forEach(village => {
        const percentage = (village.count / maxCount) * 100;
        html += `
            <div class="bar-item">
                <span class="bar-label">${village.name}</span>
                <div class="bar-container">
                    <div class="bar" style="width: ${percentage}%"></div>
                    <span class="bar-value">${village.count}</span>
                </div>
            </div>
        `;
    });
    html += '</div>';

    container.innerHTML = html;

    // Add styles for chart
    if (!document.getElementById('chartStyles')) {
        const style = document.createElement('style');
        style.id = 'chartStyles';
        style.textContent = `
            .bar-chart { display: flex; flex-direction: column; gap: 0.75rem; }
            .bar-item { display: flex; align-items: center; gap: 1rem; }
            .bar-label { width: 120px; font-size: 0.875rem; color: var(--gray-600); }
            .bar-container { flex: 1; display: flex; align-items: center; gap: 0.5rem; }
            .bar { height: 1.5rem; background: linear-gradient(135deg, var(--primary-color), var(--primary-dark)); border-radius: var(--radius); min-width: 4px; }
            .bar-value { font-size: 0.875rem; font-weight: 600; color: var(--gray-700); }
        `;
        document.head.appendChild(style);
    }
}

// Switch tab
function switchTab(tab) {
    currentTab = tab;
    currentAdminPage = 1;

    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.currentTarget.classList.add('active');

    // Hide all tab panes
    document.querySelectorAll('.tab-pane').forEach(pane => {
        pane.style.display = 'none';
    });

    // Show selected tab pane
    document.getElementById(`${tab}Tab`).style.display = 'block';

    // Load data for selected tab
    if (tab === 'pending') {
        loadPendingApprovals();
    } else if (tab === 'approved') {
        loadApprovedUsers();
    } else if (tab === 'all') {
        loadAllUsers();
    }
}

// Load pending approvals
async function loadPendingApprovals(page = 1) {
    try {
        const response = await fetch(`/api/admin/pending?page=${page}&limit=20`);
        const data = await response.json();

        if (data.success) {
            const tbody = document.getElementById('pendingTableBody');
            const emptyState = document.getElementById('pendingEmpty');

            if (data.users.length === 0) {
                tbody.innerHTML = '';
                emptyState.style.display = 'block';
                document.getElementById('adminPagination').style.display = 'none';
            } else {
                emptyState.style.display = 'none';
                displayPendingUsers(data.users);

                totalAdminPages = data.pagination.totalPages;
                currentAdminPage = data.pagination.page;
                updateAdminPagination();
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
                <button class="btn btn-success btn-small" onclick="approveUser(${user.id})">
                    <i class="fas fa-check"></i>
                </button>
                <button class="btn btn-secondary btn-small" onclick="viewUserDetail(${user.id})">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-danger btn-small" onclick="rejectUser(${user.id})">
                    <i class="fas fa-times"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Load approved users
async function loadApprovedUsers(page = 1) {
    try {
        const response = await fetch(`/api/admin/users?approved=true&page=${page}&limit=20`);
        const data = await response.json();

        if (data.success) {
            displayApprovedUsers(data.users);

            totalAdminPages = data.pagination.totalPages;
            currentAdminPage = data.pagination.page;
            updateAdminPagination();
        }
    } catch (error) {
        showNotification('Failed to load approved users', 'error');
    }
}

// Display approved users
function displayApprovedUsers(users) {
    const tbody = document.getElementById('approvedTableBody');
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
            </td>
            <td>${user.village_name}</td>
            <td>${getOccupationBadge(user.occupation_type)}</td>
            <td><small>${detailText}</small></td>
            <td>${user.phone}</td>
            <td>${user.email}</td>
            <td>
                <label class="toggle-switch">
                    <input type="checkbox" ${user.can_view_sensitive === 1 ? 'checked' : ''} 
                           onchange="toggleSensitiveAccess(${user.id})">
                    <span class="toggle-slider"></span>
                </label>
            </td>
            <td class="actions">
                <button class="btn btn-secondary btn-small" onclick="viewUserDetail(${user.id})">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-danger btn-small" onclick="rejectUser(${user.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    // Add toggle switch styles
    if (!document.getElementById('toggleStyles')) {
        const style = document.createElement('style');
        style.id = 'toggleStyles';
        style.textContent = `
            .toggle-switch { position: relative; display: inline-block; width: 50px; height: 24px; }
            .toggle-switch input { opacity: 0; width: 0; height: 0; }
            .toggle-slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: var(--gray-300); transition: .4s; border-radius: 24px; }
            .toggle-slider:before { position: absolute; content: ""; height: 18px; width: 18px; left: 3px; bottom: 3px; background-color: white; transition: .4s; border-radius: 50%; }
            .toggle-switch input:checked + .toggle-slider { background-color: var(--success-color); }
            .toggle-switch input:checked + .toggle-slider:before { transform: translateX(26px); }
        `;
        document.head.appendChild(style);
    }
}

// Load village filter dropdown
async function loadVillageFilter() {
    try {
        const response = await fetch('/api/data/villages');
        const data = await response.json();
        if (data.success) {
            const select = document.getElementById('filterVillage');
            if (select) {
                data.villages.forEach(v => {
                    const option = document.createElement('option');
                    option.value = v.id;
                    option.textContent = v.name;
                    select.appendChild(option);
                });
            }
        }
    } catch (error) {
        console.error('Failed to load villages:', error);
    }
}

// Load all users
async function loadAllUsers(page = 1) {
    try {
        const occupation = document.getElementById('filterOccupation')?.value || '';
        const village = document.getElementById('filterVillage')?.value || '';
        let url = `/api/admin/users?approved=all&page=${page}&limit=20`;
        if (occupation) url += `&occupationType=${occupation}`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.success) {
            let filteredUsers = data.users;
            if (occupation) {
                filteredUsers = filteredUsers.filter(u => u.occupation_type === occupation);
            }
            if (village) {
                filteredUsers = filteredUsers.filter(u => String(u.village_id) === village);
            }

            displayAllUsers(filteredUsers);

            totalAdminPages = data.pagination.totalPages;
            currentAdminPage = data.pagination.page;
            updateAdminPagination();
        }
    } catch (error) {
        showNotification('Failed to load users', 'error');
    }
}

// Download CSV with current filters (village + occupation)
function downloadVillageCSV() {
    const occupation = document.getElementById('filterOccupation')?.value || 'all';
    const village = document.getElementById('filterVillage')?.value || '';
    let url = `/api/admin/download-report?type=${occupation}&format=csv`;
    if (village) url += `&village=${village}`;
    window.open(url, '_blank');
}

// Display all users
function displayAllUsers(users) {
    const tbody = document.getElementById('allTableBody');
    tbody.innerHTML = '';

    users.forEach(user => {
        // Cache the user for later retrieval
        usersCache[user.id] = user;

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
            </td>
            <td>${user.village_name}</td>
            <td>${getOccupationBadge(user.occupation_type)}</td>
            <td><small>${detailText}</small></td>
            <td>${user.phone}</td>
            <td>${user.email}</td>
            <td>${getApprovalBadge(user.is_approved === 1)}</td>
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
            loadStats();
            loadPendingApprovals(currentAdminPage);
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
            loadStats();

            if (currentTab === 'pending') {
                loadPendingApprovals(currentAdminPage);
            } else if (currentTab === 'approved') {
                loadApprovedUsers(currentAdminPage);
            } else {
                loadAllUsers(currentAdminPage);
            }
        } else {
            showNotification(data.message || 'Failed to reject user', 'error');
        }
    } catch (error) {
        showNotification('Failed to reject user', 'error');
    }
}

// Toggle sensitive data access
async function toggleSensitiveAccess(userId) {
    try {
        const response = await fetch(`/api/admin/toggle-sensitive-access/${userId}`, {
            method: 'POST'
        });
        const data = await response.json();

        if (data.success) {
            showNotification(data.message, 'success');
        } else {
            showNotification(data.message || 'Failed to update access', 'error');
            // Reload to reset checkbox state
            loadApprovedUsers(currentAdminPage);
        }
    } catch (error) {
        showNotification('Failed to update access', 'error');
        loadApprovedUsers(currentAdminPage);
    }
}

// View user detail
function viewUserDetail(userId) {
    console.log('viewUserDetail called with userId:', userId);
    console.log('usersCache:', usersCache);

    const user = usersCache[userId];
    console.log('User from cache:', user);

    if (!user) {
        showNotification('User data not found', 'error');
        return;
    }

    const content = document.getElementById('userDetailContent');
    console.log('occupationDetails:', user.occupationDetails);
    console.log('occupation_type:', user.occupation_type);

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
                    ${user.occupationDetails.business_address ? `<p><strong>Address:</strong> ${user.occupationDetails.business_address}</p>` : ''}
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

// Download report
async function downloadReport(type, format) {
    try {
        const response = await fetch(`/api/admin/download-report?type=${type}&format=${format}`);

        if (format === 'csv') {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `community_report_${type}_${Date.now()}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            showNotification('Report downloaded successfully', 'success');
        } else {
            const data = await response.json();
            if (data.success) {
                // Create JSON download
                const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: 'application/json' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `community_report_${type}_${Date.now()}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
                showNotification('Report downloaded successfully', 'success');
            }
        }
    } catch (error) {
        showNotification('Failed to download report', 'error');
    }
}

// Update admin pagination
function updateAdminPagination() {
    const pagination = document.getElementById('adminPagination');

    if (totalAdminPages > 1) {
        pagination.style.display = 'flex';
        document.getElementById('adminPageInfo').textContent = `Page ${currentAdminPage} of ${totalAdminPages}`;
        document.getElementById('adminPrevBtn').disabled = currentAdminPage === 1;
        document.getElementById('adminNextBtn').disabled = currentAdminPage === totalAdminPages;
    } else {
        pagination.style.display = 'none';
    }
}

// Change admin page
function changeAdminPage(direction) {
    if (direction === 'prev' && currentAdminPage > 1) {
        currentAdminPage--;
    } else if (direction === 'next' && currentAdminPage < totalAdminPages) {
        currentAdminPage++;
    }

    if (currentTab === 'pending') {
        loadPendingApprovals(currentAdminPage);
    } else if (currentTab === 'approved') {
        loadApprovedUsers(currentAdminPage);
    } else if (currentTab === 'all') {
        loadAllUsers(currentAdminPage);
    }
}

// Close modal on outside click
document.getElementById('userDetailModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'userDetailModal') {
        closeUserModal();
    }
});
