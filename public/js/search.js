// ===== Search Page JavaScript =====

let currentPage = 1;
let totalPages = 1;
let currentView = 'grid';

// Initialize search page
document.addEventListener('DOMContentLoaded', () => {
    loadVillages();
    searchUsers(); // Load initial results

    // Setup search on Enter key for all search inputs
    ['searchName', 'searchCollege', 'searchCourse', 'searchSpecialization', 'searchCompany', 'searchJobField', 'searchBusinessType'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    searchUsers();
                }
            });
        }
    });

    // Setup view toggle buttons
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', function (e) {
            e.preventDefault();
            const view = this.getAttribute('data-view');
            if (view) {
                setView(view, this);
            }
        });
    });
});

// Handle occupation type change - show/hide relevant filters
function onOccupationChange() {
    const occupation = document.getElementById('searchOccupation').value;
    const filtersRow = document.getElementById('occupationFilters');
    const collegeFilter = document.getElementById('collegeFilter');
    const courseFilter = document.getElementById('courseFilter');
    const specializationFilter = document.getElementById('specializationFilter');
    const companyFilter = document.getElementById('companyFilter');
    const jobFieldFilter = document.getElementById('jobFieldFilter');
    const businessTypeFilter = document.getElementById('businessTypeFilter');

    // Hide all occupation-specific filters first
    collegeFilter.style.display = 'none';
    courseFilter.style.display = 'none';
    specializationFilter.style.display = 'none';
    companyFilter.style.display = 'none';
    jobFieldFilter.style.display = 'none';
    businessTypeFilter.style.display = 'none';

    // Clear the hidden filter values
    document.getElementById('searchCollege').value = '';
    document.getElementById('searchCourse').value = '';
    document.getElementById('searchSpecialization').value = '';
    document.getElementById('searchCompany').value = '';
    document.getElementById('searchJobField').value = '';
    document.getElementById('searchBusinessType').value = '';

    // Show relevant filter based on occupation
    if (occupation === 'student') {
        filtersRow.style.display = 'flex';
        collegeFilter.style.display = 'block';
        courseFilter.style.display = 'block';
        specializationFilter.style.display = 'block';
    } else if (occupation === 'job') {
        filtersRow.style.display = 'flex';
        companyFilter.style.display = 'block';
        jobFieldFilter.style.display = 'block';
    } else if (occupation === 'business') {
        filtersRow.style.display = 'flex';
        businessTypeFilter.style.display = 'block';
    } else {
        filtersRow.style.display = 'none';
    }
}

// Load villages for filter
async function loadVillages() {
    try {
        const response = await fetch('/api/data/villages');
        const data = await response.json();

        if (data.success) {
            const select = document.getElementById('searchVillage');
            data.villages.forEach(village => {
                const option = document.createElement('option');
                option.value = village.name;
                option.textContent = village.name;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading villages:', error);
    }
}

// Search users
async function searchUsers(page = 1) {
    const village = document.getElementById('searchVillage').value;
    const occupation = document.getElementById('searchOccupation').value;
    const name = document.getElementById('searchName').value;
    const college = document.getElementById('searchCollege').value;
    const course = document.getElementById('searchCourse').value;
    const specialization = document.getElementById('searchSpecialization').value;
    const company = document.getElementById('searchCompany').value;
    const jobField = document.getElementById('searchJobField').value;
    const businessType = document.getElementById('searchBusinessType').value;

    // Show loading state
    document.getElementById('loadingState').style.display = 'block';
    document.getElementById('resultsContainer').innerHTML = '';
    document.getElementById('emptyState').style.display = 'none';
    document.getElementById('pagination').style.display = 'none';

    try {
        const params = new URLSearchParams({
            page: page.toString(),
            limit: '20'
        });

        if (village) params.append('village', village);
        if (occupation) params.append('occupation', occupation);
        if (name) params.append('name', name);
        if (college) params.append('college', college);
        if (course) params.append('course', course);
        if (specialization) params.append('specialization', specialization);
        if (company) params.append('company', company);
        if (jobField) params.append('jobField', jobField);
        if (businessType) params.append('businessType', businessType);

        const response = await fetch(`/api/users/search?${params}`);
        const data = await response.json();

        // Hide loading state
        document.getElementById('loadingState').style.display = 'none';

        if (data.success) {
            currentPage = data.pagination.page;
            totalPages = data.pagination.totalPages;

            document.getElementById('resultsCount').textContent =
                `${data.pagination.total} member${data.pagination.total !== 1 ? 's' : ''} found`;

            if (data.users.length === 0) {
                document.getElementById('emptyState').style.display = 'block';
            } else {
                displayResults(data.users);
                updatePagination();
            }
        } else {
            showNotification(data.message || 'Search failed', 'error');
        }
    } catch (error) {
        document.getElementById('loadingState').style.display = 'none';
        showNotification('An error occurred. Please try again.', 'error');
    }
}

// Display search results
function displayResults(users) {
    const container = document.getElementById('resultsContainer');
    container.className = currentView === 'grid' ? 'results-grid' : 'results-list';
    container.innerHTML = '';

    users.forEach(user => {
        const card = document.createElement('div');
        card.className = 'user-card';
        card.onclick = () => showUserDetail(user.id);

        let detailsHTML = '';
        if (user.occupationDetails) {
            if (user.occupation_type === 'student') {
                detailsHTML = `
                    <div class="user-detail">
                        <i class="fas fa-book"></i>
                        <span>${user.occupationDetails.department || '-'}</span>
                    </div>
                    <div class="user-detail">
                        <i class="fas fa-university"></i>
                        <span>${user.occupationDetails.college_name || '-'}</span>
                    </div>
                `;
            } else if (user.occupation_type === 'job') {
                detailsHTML = `
                    <div class="user-detail">
                        <i class="fas fa-building"></i>
                        <span>${user.occupationDetails.company_name || '-'}</span>
                    </div>
                    <div class="user-detail">
                        <i class="fas fa-map-marker-alt"></i>
                        <span>${user.occupationDetails.working_city || '-'}</span>
                    </div>
                `;
            } else if (user.occupation_type === 'business') {
                detailsHTML = `
                    <div class="user-detail">
                        <i class="fas fa-store"></i>
                        <span>${user.occupationDetails.business_name || '-'}</span>
                    </div>
                    <div class="user-detail">
                        <i class="fas fa-tag"></i>
                        <span>${user.occupationDetails.business_type || '-'}</span>
                    </div>
                `;
            }
        }

        card.innerHTML = `
            <div class="user-card-header">
                <div class="user-avatar">
                    <i class="fas fa-user"></i>
                </div>
                <div>
                    <div class="user-name">${user.first_name} ${user.middle_name || ''} ${user.last_name}</div>
                    <div class="user-village"><i class="fas fa-map-marker-alt"></i> ${user.village_name}</div>
                </div>
            </div>
            <div class="user-card-body">
                ${detailsHTML}
            </div>
            <div class="user-card-footer">
                ${getOccupationBadge(user.occupation_type)}
            </div>
        `;

        container.appendChild(card);
    });
}

// Update pagination
function updatePagination() {
    const pagination = document.getElementById('pagination');

    if (totalPages > 1) {
        pagination.style.display = 'flex';
        document.getElementById('pageInfo').textContent = `Page ${currentPage} of ${totalPages}`;
        document.getElementById('prevBtn').disabled = currentPage === 1;
        document.getElementById('nextBtn').disabled = currentPage === totalPages;
    } else {
        pagination.style.display = 'none';
    }
}

// Change page
function changePage(direction) {
    if (direction === 'prev' && currentPage > 1) {
        searchUsers(currentPage - 1);
    } else if (direction === 'next' && currentPage < totalPages) {
        searchUsers(currentPage + 1);
    }
}

// Clear filters
function clearFilters() {
    document.getElementById('searchVillage').value = '';
    document.getElementById('searchOccupation').value = '';
    document.getElementById('searchName').value = '';
    document.getElementById('searchCollege').value = '';
    document.getElementById('searchCourse').value = '';
    document.getElementById('searchSpecialization').value = '';
    document.getElementById('searchCompany').value = '';
    document.getElementById('searchJobField').value = '';
    document.getElementById('searchBusinessType').value = '';

    // Hide occupation-specific filters
    document.getElementById('occupationFilters').style.display = 'none';
    document.getElementById('collegeFilter').style.display = 'none';
    document.getElementById('courseFilter').style.display = 'none';
    document.getElementById('specializationFilter').style.display = 'none';
    document.getElementById('companyFilter').style.display = 'none';
    document.getElementById('jobFieldFilter').style.display = 'none';
    document.getElementById('businessTypeFilter').style.display = 'none';

    searchUsers();
}

// Set view mode
function setView(view, btn) {
    currentView = view;

    document.querySelectorAll('.view-btn').forEach(b => {
        b.classList.remove('active');
    });

    if (btn) {
        btn.classList.add('active');
    }

    const container = document.getElementById('resultsContainer');
    if (view === 'list') {
        container.classList.remove('results-grid');
        container.classList.add('results-list');
    } else {
        container.classList.remove('results-list');
        container.classList.add('results-grid');
    }
}

// Show user detail modal
async function showUserDetail(userId) {
    try {
        const response = await fetch(`/api/users/${userId}`);
        const data = await response.json();

        if (data.success) {
            const user = data.user;
            const content = document.getElementById('userDetailContent');

            let occupationHTML = '';
            if (user.occupationDetails) {
                if (user.occupation_type === 'student') {
                    occupationHTML = `
                        <div class="detail-section">
                            <h4><i class="fas fa-graduation-cap"></i> Education</h4>
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
                            <h4><i class="fas fa-briefcase"></i> Work</h4>
                            <p><strong>Company:</strong> ${user.occupationDetails.company_name || '-'}</p>
                            <p><strong>Designation:</strong> ${user.occupationDetails.designation || '-'}</p>
                            <p><strong>Field:</strong> ${user.occupationDetails.field || '-'}</p>
                            <p><strong>Working City:</strong> ${user.occupationDetails.working_city || '-'}</p>
                            <p><strong>Experience:</strong> ${user.occupationDetails.experience_years || 0} years</p>
                            ${user.occupationDetails.additional_info ? `<p><strong>Additional Info:</strong> ${user.occupationDetails.additional_info}</p>` : ''}
                        </div>
                    `;
                } else if (user.occupation_type === 'business') {
                    occupationHTML = `
                        <div class="detail-section">
                            <h4><i class="fas fa-store"></i> Business</h4>
                            <p><strong>Business Name:</strong> ${user.occupationDetails.business_name || '-'}</p>
                            <p><strong>Type:</strong> ${user.occupationDetails.business_type || '-'}</p>
                            <p><strong>Field:</strong> ${user.occupationDetails.business_field || '-'}</p>
                            <p><strong>City:</strong> ${user.occupationDetails.business_city || '-'}</p>
                            ${user.occupationDetails.business_address ? `<p><strong>Address:</strong> ${user.occupationDetails.business_address}</p>` : ''}
                            ${user.occupationDetails.years_in_business ? `<p><strong>Years in Business:</strong> ${user.occupationDetails.years_in_business}</p>` : ''}
                            ${user.occupationDetails.website ? `<p><strong>Website:</strong> <a href="${user.occupationDetails.website}" target="_blank">${user.occupationDetails.website}</a></p>` : ''}
                            ${user.occupationDetails.additional_info ? `<p><strong>Additional Info:</strong> ${user.occupationDetails.additional_info}</p>` : ''}
                        </div>
                    `;
                }
            }

            content.innerHTML = `
                <div class="user-detail-header">
                    <div class="user-avatar" style="width: 5rem; height: 5rem; font-size: 2rem;">
                        <i class="fas fa-user"></i>
                    </div>
                    <div class="user-detail-info">
                        <h2>${user.first_name} ${user.middle_name || ''} ${user.last_name}</h2>
                        <p><i class="fas fa-map-marker-alt"></i> ${user.village_name}</p>
                        ${getOccupationBadge(user.occupation_type)}
                    </div>
                </div>
                <div class="user-detail-body">
                    <div class="detail-section">
                        <h4><i class="fas fa-user"></i> Personal Details</h4>
                        <p><strong>Gender:</strong> ${user.gender}</p>
                        <p><strong>Address:</strong> ${user.current_address}</p>
                        ${user.phone ? `<p><strong>Phone:</strong> ${user.phone}</p>` : ''}
                        ${user.email ? `<p><strong>Email:</strong> ${user.email}</p>` : ''}
                    </div>
                    ${occupationHTML}
                </div>
            `;

            document.getElementById('userModal').style.display = 'flex';
        }
    } catch (error) {
        showNotification('Failed to load user details', 'error');
    }
}

// Close modal
function closeModal() {
    document.getElementById('userModal').style.display = 'none';
}

// Close modal on outside click
document.getElementById('userModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'userModal') {
        closeModal();
    }
});
