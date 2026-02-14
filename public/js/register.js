// ===== Registration Page JavaScript =====

let currentStep = 1;
const totalSteps = 4;
let registeredUserId = null;
let registeredPhone = null;
let registeredEmail = null;

// Initialize registration page
document.addEventListener('DOMContentLoaded', () => {
    loadVillages();
    loadCities();
    loadDepartments();
    loadJobFields();
    loadBusinessTypes();
    loadBusinessFields();
    loadYears();

    // Setup form navigation
    setupFormNavigation();

    // Setup occupation type change handler
    setupOccupationHandler();

    // Setup form submission
    document.getElementById('registrationForm').addEventListener('submit', handleRegistration);
});

// Load villages grouped by taluka
async function loadVillages() {
    try {
        const response = await fetch('/api/data/villages');
        const data = await response.json();

        if (data.success) {
            const select = document.getElementById('village');
            
            // Group villages by district and taluka
            const grouped = {};
            data.villages.forEach(village => {
                const key = `${village.district} - ${village.taluka}`;
                if (!grouped[key]) {
                    grouped[key] = {
                        district: village.district,
                        taluka: village.taluka,
                        villages: []
                    };
                }
                grouped[key].villages.push(village);
            });
            
            // Create optgroups for each district/taluka
            Object.values(grouped).forEach(group => {
                const optgroup = document.createElement('optgroup');
                const lang = localStorage.getItem('language') || 'en';
                
                if (lang === 'gu') {
                    // Gujarati labels
                    const talukaNames = {
                        'Amreli': 'અમરેલી તાલુકો',
                        'Babra': 'બાબરા તાલુકો',
                        'Lathi': 'લાઠી તાલુકો',
                        'Liliya': 'લીલીયા તાલુકો',
                        'Kunkavav': 'કુંકાવાવ તાલુકો',
                        'Bhavnagar': 'ભાવનગર',
                        'Jasdan': 'જસદણ તાલુકો',
                        'Gondal': 'ગોંડલ તાલુકો',
                        'Junagadh': 'જુનાગઢ'
                    };
                    optgroup.label = talukaNames[group.taluka] || `${group.taluka} (${group.district})`;
                } else {
                    optgroup.label = `${group.taluka} Taluka (${group.district} District)`;
                }
                
                group.villages.forEach(village => {
                    const option = document.createElement('option');
                    option.value = village.id;
                    option.textContent = village.name;
                    optgroup.appendChild(option);
                });
                
                select.appendChild(optgroup);
            });
        }
    } catch (error) {
        console.error('Error loading villages:', error);
    }
}

// Load cities
async function loadCities() {
    try {
        const response = await fetch('/api/data/cities');
        const data = await response.json();

        if (data.success) {
            const citySelects = ['collegeCity', 'jobCollegeCity'];
            citySelects.forEach(selectId => {
                const select = document.getElementById(selectId);
                if (select) {
                    data.cities.forEach(city => {
                        const option = document.createElement('option');
                        option.value = city.name;
                        option.textContent = `${city.name}, ${city.state}`;
                        select.appendChild(option);
                    });
                    
                    // Add "Other" option
                    const otherOption = document.createElement('option');
                    otherOption.value = 'other';
                    otherOption.textContent = 'Other (Enter manually)';
                    select.appendChild(otherOption);
                }
            });

            // Setup city change handlers for college selection
            document.getElementById('collegeCity')?.addEventListener('change', (e) => {
                handleOtherOption(e.target, 'collegeCityOther');
                loadCollegesFiltered();
            });

            document.getElementById('jobCollegeCity')?.addEventListener('change', (e) => {
                handleOtherOption(e.target, 'jobCollegeCityOther');
                loadCollegesForJob();
            });
        }
    } catch (error) {
        console.error('Error loading cities:', error);
    }
}

// Load colleges filtered by city AND course (for student form)
async function loadCollegesFiltered() {
    try {
        const citySelect = document.getElementById('collegeCity');
        const departmentSelect = document.getElementById('department');
        const collegeSelect = document.getElementById('collegeName');
        
        if (!collegeSelect) return;

        // Clear existing options
        collegeSelect.innerHTML = '<option value="">Select college</option>';
        
        const cityName = citySelect?.value;
        const course = departmentSelect?.value;
        
        // Don't load if city is "other"
        if (cityName === 'other') {
            const otherOption = document.createElement('option');
            otherOption.value = 'other';
            otherOption.textContent = 'Other (Enter manually)';
            collegeSelect.appendChild(otherOption);
            return;
        }
        
        // Build query params - filter by course even if city not selected
        let url = '/api/data/colleges?';
        const params = [];
        
        if (cityName) {
            params.push(`cityName=${encodeURIComponent(cityName)}`);
        }
        if (course && course !== 'other') {
            params.push(`course=${encodeURIComponent(course)}`);
        }
        
        // If no filters, just add Other option
        if (params.length === 0) {
            const otherOption = document.createElement('option');
            otherOption.value = 'other';
            otherOption.textContent = 'Other (Enter manually)';
            collegeSelect.appendChild(otherOption);
            return;
        }
        
        url += params.join('&');

        const response = await fetch(url);
        const data = await response.json();

        if (data.success && data.colleges.length > 0) {
            data.colleges.forEach(college => {
                const option = document.createElement('option');
                option.value = college.name;
                // Show city name if filtering by course only (no city selected)
                if (college.city_name && !cityName) {
                    option.textContent = `${college.name} (${college.city_name})`;
                } else {
                    option.textContent = college.name;
                }
                collegeSelect.appendChild(option);
            });
        }

        // Always add "Other" option
        const otherOption = document.createElement('option');
        otherOption.value = 'other';
        otherOption.textContent = 'Other (Enter manually)';
        collegeSelect.appendChild(otherOption);
        
        // Setup change handler for "Other" option
        collegeSelect.onchange = function() {
            handleOtherOption(this, 'collegeNameOther');
        };
        
    } catch (error) {
        console.error('Error loading colleges:', error);
    }
}

// Load colleges for job form (by city only)
async function loadCollegesForJob() {
    try {
        const citySelect = document.getElementById('jobCollegeCity');
        const collegeSelect = document.getElementById('jobCollegeName');
        
        if (!collegeSelect) return;

        // Clear existing options
        collegeSelect.innerHTML = '<option value="">Select college</option>';
        
        const cityName = citySelect?.value;
        
        if (!cityName || cityName === 'other') {
            const otherOption = document.createElement('option');
            otherOption.value = 'other';
            otherOption.textContent = 'Other (Enter manually)';
            collegeSelect.appendChild(otherOption);
            return;
        }

        const response = await fetch(`/api/data/colleges?cityName=${encodeURIComponent(cityName)}`);
        const data = await response.json();

        if (data.success && data.colleges.length > 0) {
            data.colleges.forEach(college => {
                const option = document.createElement('option');
                option.value = college.name;
                option.textContent = college.name;
                collegeSelect.appendChild(option);
            });
        }

        // Always add "Other" option
        const otherOption = document.createElement('option');
        otherOption.value = 'other';
        otherOption.textContent = 'Other (Enter manually)';
        collegeSelect.appendChild(otherOption);
        
        // Setup change handler for "Other" option
        collegeSelect.onchange = function() {
            handleOtherOption(this, 'jobCollegeNameOther');
        };
        
    } catch (error) {
        console.error('Error loading colleges:', error);
    }
}

// Legacy function for backward compatibility
async function loadColleges(cityName, selectId) {
    if (selectId === 'collegeName') {
        await loadCollegesFiltered();
    } else if (selectId === 'jobCollegeName') {
        await loadCollegesForJob();
    }
}

// Load departments
async function loadDepartments() {
    try {
        // Use courseBranches from translations.js if available
        if (typeof courseBranches !== 'undefined') {
            const courses = Object.keys(courseBranches);
            const selects = ['department', 'jobDepartment'];
            
            // Categorize courses
            const categories = {
                'Engineering': ['B.Tech', 'M.Tech', 'B.E.', 'Diploma'],
                'Architecture': ['B.Arch', 'M.Arch'],
                'Computer & IT': ['BCA', 'MCA'],
                'Science': ['B.Sc', 'M.Sc'],
                'Commerce & Business': ['B.Com', 'M.Com', 'BBA', 'MBA'],
                'Medical & Pharmacy': ['MBBS', 'BDS', 'B.Pharm'],
                'Law': ['LLB'],
                'Education': ['B.Ed'],
                'Arts': ['BA', 'MA'],
                'Vocational': ['ITI'],
                'School': ['10th', '12th Science', '12th Commerce', '12th Arts'],
                'Other': ['Other']
            };
            
            selects.forEach(selectId => {
                const select = document.getElementById(selectId);
                if (select) {
                    Object.entries(categories).forEach(([category, courseList]) => {
                        const optgroup = document.createElement('optgroup');
                        optgroup.label = category;
                        
                        courseList.forEach(course => {
                            if (courseBranches[course]) {
                                const option = document.createElement('option');
                                option.value = course;
                                option.textContent = course;
                                optgroup.appendChild(option);
                            }
                        });
                        
                        if (optgroup.children.length > 0) {
                            select.appendChild(optgroup);
                        }
                    });
                    
                    // Add "Other" option at the end
                    const otherOption = document.createElement('option');
                    otherOption.value = 'other';
                    otherOption.textContent = 'Other (Enter manually)';
                    select.appendChild(otherOption);
                }
            });

            // Setup department change handler - also reload colleges when course changes
            document.getElementById('department')?.addEventListener('change', (e) => {
                loadSubDepartments(e.target.value);
                handleOtherOption(e.target, 'departmentOther');
                // Reload colleges based on new course selection
                loadCollegesFiltered();
            });
            
            document.getElementById('jobDepartment')?.addEventListener('change', (e) => {
                handleOtherOption(e.target, 'jobDepartmentOther');
            });
            
            return;
        }

        // Fallback to API
        const response = await fetch('/api/data/departments');
        const data = await response.json();

        if (data.success) {
            const selects = ['department', 'jobDepartment'];
            selects.forEach(selectId => {
                const select = document.getElementById(selectId);
                if (select) {
                    let currentCategory = '';
                    data.departments.forEach(dept => {
                        if (dept.category !== currentCategory) {
                            currentCategory = dept.category;
                            const optgroup = document.createElement('optgroup');
                            optgroup.label = dept.category;
                            select.appendChild(optgroup);
                        }
                        const option = document.createElement('option');
                        option.value = dept.name;
                        option.textContent = dept.name;
                        select.lastElementChild.appendChild(option);
                    });
                }
            });

            // Setup department change handler - also reload colleges when course changes
            document.getElementById('department')?.addEventListener('change', (e) => {
                loadSubDepartments(e.target.value);
                loadCollegesFiltered();
            });
        }
    } catch (error) {
        console.error('Error loading departments:', error);
    }
}

// Handle "Other" option for dropdowns
function handleOtherOption(select, otherInputId) {
    const otherInput = document.getElementById(otherInputId);
    if (!otherInput) return;
    
    if (select.value === 'other') {
        otherInput.classList.add('show');
        otherInput.required = true;
    } else {
        otherInput.classList.remove('show');
        otherInput.required = false;
    }
}

// Load sub-departments based on course/department selected
async function loadSubDepartments(departmentName) {
    try {
        const select = document.getElementById('subDepartment');
        if (!select) return;

        // Clear existing options
        select.innerHTML = '<option value="">Select specialization</option>';

        if (!departmentName || departmentName === 'other') {
            // Add "Other" option only
            const otherOption = document.createElement('option');
            otherOption.value = 'other';
            otherOption.textContent = 'Other (Enter manually)';
            select.appendChild(otherOption);
            return;
        }

        // First check if we have branches defined in courseBranches (from translations.js)
        if (typeof courseBranches !== 'undefined' && courseBranches[departmentName]) {
            const branches = courseBranches[departmentName];
            branches.forEach(branch => {
                const option = document.createElement('option');
                option.value = branch;
                option.textContent = branch;
                select.appendChild(option);
            });
            // Add "Other" option
            const otherOption = document.createElement('option');
            otherOption.value = 'other';
            otherOption.textContent = 'Other (Enter manually)';
            select.appendChild(otherOption);
            
            // Setup change handler
            select.onchange = function() {
                handleOtherOption(this, 'subDepartmentOther');
            };
            return;
        }

        // Fallback to API if no local branches defined
        const response = await fetch(`/api/data/sub-departments?departmentName=${encodeURIComponent(departmentName)}`);
        const data = await response.json();

        if (data.success) {
            data.subDepartments.forEach(subDept => {
                const option = document.createElement('option');
                option.value = subDept.name;
                option.textContent = subDept.name;
                select.appendChild(option);
            });
        }
        
        // Add "Other" option
        const otherOption = document.createElement('option');
        otherOption.value = 'other';
        otherOption.textContent = 'Other (Enter manually)';
        select.appendChild(otherOption);
        
        // Setup change handler
        select.onchange = function() {
            handleOtherOption(this, 'subDepartmentOther');
        };
    } catch (error) {
        console.error('Error loading sub-departments:', error);
    }
}

// Load job fields
async function loadJobFields() {
    try {
        const response = await fetch('/api/data/job-fields');
        const data = await response.json();

        if (data.success) {
            const select = document.getElementById('jobField');
            if (select) {
                data.jobFields.forEach(field => {
                    const option = document.createElement('option');
                    option.value = field;
                    option.textContent = field;
                    select.appendChild(option);
                });
            }
        }
    } catch (error) {
        console.error('Error loading job fields:', error);
    }
}

// Load business types
async function loadBusinessTypes() {
    try {
        const response = await fetch('/api/data/business-types');
        const data = await response.json();

        if (data.success) {
            const select = document.getElementById('businessType');
            if (select) {
                data.businessTypes.forEach(type => {
                    const option = document.createElement('option');
                    option.value = type;
                    option.textContent = type;
                    select.appendChild(option);
                });
            }
        }
    } catch (error) {
        console.error('Error loading business types:', error);
    }
}

// Load business fields
async function loadBusinessFields() {
    try {
        const response = await fetch('/api/data/business-fields');
        const data = await response.json();

        if (data.success) {
            const select = document.getElementById('businessField');
            if (select) {
                data.businessFields.forEach(field => {
                    const option = document.createElement('option');
                    option.value = field;
                    option.textContent = field;
                    select.appendChild(option);
                });
            }
        }
    } catch (error) {
        console.error('Error loading business fields:', error);
    }
}

// Load years
async function loadYears() {
    try {
        const response = await fetch('/api/data/years');
        const data = await response.json();

        if (data.success) {
            // Graduation year (past years)
            const graduationSelect = document.getElementById('jobGraduationYear');
            if (graduationSelect) {
                data.pastYears.forEach(year => {
                    const option = document.createElement('option');
                    option.value = year;
                    option.textContent = year;
                    graduationSelect.appendChild(option);
                });
            }

            // Expected graduation (future years)
            const expectedSelect = document.getElementById('expectedGraduation');
            if (expectedSelect) {
                data.allYears.forEach(year => {
                    const option = document.createElement('option');
                    option.value = year;
                    option.textContent = year;
                    expectedSelect.appendChild(option);
                });
            }
        }
    } catch (error) {
        console.error('Error loading years:', error);
    }
}

// Setup form navigation
function setupFormNavigation() {
    const nextBtns = document.querySelectorAll('.next-btn');
    const prevBtns = document.querySelectorAll('.prev-btn');

    nextBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (validateStep(currentStep)) {
                if (currentStep < totalSteps) {
                    goToStep(currentStep + 1);
                }
            }
        });
    });

    prevBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (currentStep > 1) {
                goToStep(currentStep - 1);
            }
        });
    });
}

// Go to specific step
function goToStep(step) {
    // Hide current step
    document.querySelector(`.form-step[data-step="${currentStep}"]`).classList.remove('active');
    document.querySelector(`.progress-steps .step[data-step="${currentStep}"]`).classList.remove('active');

    // Mark previous steps as completed
    for (let i = 1; i < step; i++) {
        document.querySelector(`.progress-steps .step[data-step="${i}"]`).classList.add('completed');
    }

    // Show new step
    currentStep = step;
    document.querySelector(`.form-step[data-step="${currentStep}"]`).classList.add('active');
    document.querySelector(`.progress-steps .step[data-step="${currentStep}"]`).classList.add('active');

    // If going to step 4, populate summary
    if (step === 4) {
        populateSummary();
    }

    // Scroll to top of form
    document.querySelector('.form-container').scrollIntoView({ behavior: 'smooth' });
}

// Validate step
function validateStep(step) {
    const stepElement = document.querySelector(`.form-step[data-step="${step}"]`);
    const requiredFields = stepElement.querySelectorAll('[required]');
    let isValid = true;

    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            isValid = false;
            field.style.borderColor = 'var(--danger-color)';
            field.addEventListener('input', () => {
                field.style.borderColor = '';
            }, { once: true });
        }
    });

    // Step 2: Validate password match
    if (step === 2) {
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (password !== confirmPassword) {
            isValid = false;
            showNotification('Passwords do not match', 'error');
            document.getElementById('confirmPassword').style.borderColor = 'var(--danger-color)';
        }

        // Validate phone number
        const phone = document.getElementById('phone').value;
        if (!/^[0-9]{10}$/.test(phone)) {
            isValid = false;
            showNotification('Please enter a valid 10-digit phone number', 'error');
            document.getElementById('phone').style.borderColor = 'var(--danger-color)';
        }
    }

    // Step 3: Validate occupation type is selected
    if (step === 3) {
        const occupationType = document.querySelector('input[name="occupationType"]:checked');
        if (!occupationType) {
            isValid = false;
            showNotification('Please select your occupation type', 'error');
        }
    }

    if (!isValid) {
        showNotification('Please fill in all required fields', 'error');
    }

    return isValid;
}

// Setup occupation type handler
function setupOccupationHandler() {
    const occupationRadios = document.querySelectorAll('input[name="occupationType"]');

    occupationRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            // Hide all occupation details
            document.getElementById('studentDetails').style.display = 'none';
            document.getElementById('jobDetails').style.display = 'none';
            document.getElementById('businessDetails').style.display = 'none';

            // Show relevant occupation details
            const type = e.target.value;
            if (type === 'student') {
                document.getElementById('studentDetails').style.display = 'block';
            } else if (type === 'job') {
                document.getElementById('jobDetails').style.display = 'block';
            } else if (type === 'business') {
                document.getElementById('businessDetails').style.display = 'block';
            }
        });
    });
}

// Populate summary
function populateSummary() {
    const summaryDiv = document.getElementById('registrationSummary');
    const occupationType = document.querySelector('input[name="occupationType"]:checked')?.value || '';

    let occupationSummary = '';
    if (occupationType === 'student') {
        occupationSummary = `
            <div class="summary-section">
                <h4><i class="fas fa-graduation-cap"></i> Student Details</h4>
                <div class="summary-row">
                    <span class="summary-label">Course</span>
                    <span class="summary-value">${document.getElementById('department').value || '-'}</span>
                </div>
                <div class="summary-row">
                    <span class="summary-label">Specialization</span>
                    <span class="summary-value">${document.getElementById('subDepartment').value || '-'}</span>
                </div>
                <div class="summary-row">
                    <span class="summary-label">College</span>
                    <span class="summary-value">${document.getElementById('collegeName').value || document.getElementById('collegeNameOther').value || '-'}</span>
                </div>
                <div class="summary-row">
                    <span class="summary-label">City</span>
                    <span class="summary-value">${document.getElementById('collegeCity').value || '-'}</span>
                </div>
            </div>
        `;
    } else if (occupationType === 'job') {
        occupationSummary = `
            <div class="summary-section">
                <h4><i class="fas fa-briefcase"></i> Job Details</h4>
                <div class="summary-row">
                    <span class="summary-label">Company</span>
                    <span class="summary-value">${document.getElementById('companyName').value || '-'}</span>
                </div>
                <div class="summary-row">
                    <span class="summary-label">Designation</span>
                    <span class="summary-value">${document.getElementById('designation').value || '-'}</span>
                </div>
                <div class="summary-row">
                    <span class="summary-label">Field</span>
                    <span class="summary-value">${document.getElementById('jobField').value || '-'}</span>
                </div>
                <div class="summary-row">
                    <span class="summary-label">Working City</span>
                    <span class="summary-value">${document.getElementById('workingCity').value || '-'}</span>
                </div>
            </div>
        `;
    } else if (occupationType === 'business') {
        occupationSummary = `
            <div class="summary-section">
                <h4><i class="fas fa-store"></i> Business Details</h4>
                <div class="summary-row">
                    <span class="summary-label">Business Name</span>
                    <span class="summary-value">${document.getElementById('businessName').value || '-'}</span>
                </div>
                <div class="summary-row">
                    <span class="summary-label">Type</span>
                    <span class="summary-value">${document.getElementById('businessType').value || '-'}</span>
                </div>
                <div class="summary-row">
                    <span class="summary-label">Field</span>
                    <span class="summary-value">${document.getElementById('businessField').value || '-'}</span>
                </div>
                <div class="summary-row">
                    <span class="summary-label">City</span>
                    <span class="summary-value">${document.getElementById('businessCity').value || '-'}</span>
                </div>
            </div>
        `;
    }

    summaryDiv.innerHTML = `
        <div class="summary-section">
            <h4><i class="fas fa-user"></i> Personal Information</h4>
            <div class="summary-row">
                <span class="summary-label">Name</span>
                <span class="summary-value">${document.getElementById('firstName').value} ${document.getElementById('middleName').value} ${document.getElementById('lastName').value}</span>
            </div>
            <div class="summary-row">
                <span class="summary-label">Gender</span>
                <span class="summary-value">${document.getElementById('gender').value || '-'}</span>
            </div>
            <div class="summary-row">
                <span class="summary-label">Village</span>
                <span class="summary-value">${document.getElementById('village').options[document.getElementById('village').selectedIndex]?.text || '-'}</span>
            </div>
            <div class="summary-row">
                <span class="summary-label">Address</span>
                <span class="summary-value">${document.getElementById('currentAddress').value || '-'}</span>
            </div>
        </div>
        <div class="summary-section">
            <h4><i class="fas fa-address-book"></i> Contact Details</h4>
            <div class="summary-row">
                <span class="summary-label">Phone</span>
                <span class="summary-value">${document.getElementById('phone').value || '-'}</span>
            </div>
            <div class="summary-row">
                <span class="summary-label">Email</span>
                <span class="summary-value">${document.getElementById('email').value || '-'}</span>
            </div>
        </div>
        ${occupationSummary}
    `;
}

// Handle registration submission
async function handleRegistration(e) {
    e.preventDefault();

    if (!document.getElementById('termsAgree').checked) {
        showNotification('Please agree to the terms and conditions', 'error');
        return;
    }

    const occupationType = document.querySelector('input[name="occupationType"]:checked')?.value;

    // Build request body
    const requestBody = {
        firstName: document.getElementById('firstName').value,
        middleName: document.getElementById('middleName').value,
        lastName: document.getElementById('lastName').value,
        gender: document.getElementById('gender').value,
        villageId: parseInt(document.getElementById('village').value),
        currentAddress: document.getElementById('currentAddress').value,
        phone: document.getElementById('phone').value,
        email: document.getElementById('email').value,
        password: document.getElementById('password').value,
        occupationType: occupationType
    };

    // Add occupation-specific details
    if (occupationType === 'student') {
        requestBody.studentDetails = {
            department: document.getElementById('department').value,
            subDepartment: document.getElementById('subDepartment').value,
            collegeCity: document.getElementById('collegeCity').value,
            collegeName: document.getElementById('collegeName').value === 'other' 
                ? document.getElementById('collegeNameOther').value 
                : document.getElementById('collegeName').value,
            yearOfStudy: document.getElementById('yearOfStudy').value,
            expectedGraduation: document.getElementById('expectedGraduation').value,
            additionalInfo: document.getElementById('studentAdditionalInfo').value
        };
    } else if (occupationType === 'job') {
        requestBody.jobDetails = {
            graduationYear: document.getElementById('jobGraduationYear').value,
            collegeCity: document.getElementById('jobCollegeCity').value,
            collegeName: document.getElementById('jobCollegeName').value,
            department: document.getElementById('jobDepartment').value,
            workingCity: document.getElementById('workingCity').value,
            companyName: document.getElementById('companyName').value,
            designation: document.getElementById('designation').value,
            field: document.getElementById('jobField').value,
            experienceYears: parseInt(document.getElementById('experienceYears').value) || 0,
            additionalInfo: document.getElementById('jobAdditionalInfo').value
        };
    } else if (occupationType === 'business') {
        requestBody.businessDetails = {
            businessName: document.getElementById('businessName').value,
            businessType: document.getElementById('businessType').value,
            businessField: document.getElementById('businessField').value,
            businessCity: document.getElementById('businessCity').value,
            businessAddress: document.getElementById('businessAddress').value,
            yearsInBusiness: parseInt(document.getElementById('yearsInBusiness').value) || 0,
            employeesCount: parseInt(document.getElementById('employeesCount').value) || 0,
            website: document.getElementById('businessWebsite').value,
            additionalInfo: document.getElementById('businessAdditionalInfo').value
        };
    }

    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        const data = await response.json();

        if (data.success) {
            showNotification('Registration successful! Please verify your phone and email.', 'success');
            
            // Store user info for OTP verification
            registeredUserId = data.userId;
            registeredPhone = document.getElementById('phone').value;
            registeredEmail = document.getElementById('email').value;

            // Show demo OTPs
            if (data.demoOTPs) {
                document.getElementById('demoPhoneOtp').textContent = data.demoOTPs.phoneOTP;
                document.getElementById('demoEmailOtp').textContent = data.demoOTPs.emailOTP;
            }

            // Show OTP modal
            document.getElementById('otpModal').style.display = 'flex';
        } else {
            showNotification(data.message || 'Registration failed', 'error');
        }
    } catch (error) {
        console.error('Registration error:', error);
        showNotification('An error occurred. Please try again.', 'error');
    }
}

// Verify OTP
async function verifyOTP(type) {
    const otpInput = type === 'phone' 
        ? document.getElementById('phoneOtp') 
        : document.getElementById('emailOtp');
    
    const contact = type === 'phone' ? registeredPhone : registeredEmail;
    const otp = otpInput.value;

    if (!otp || otp.length !== 6) {
        showNotification('Please enter a valid 6-digit OTP', 'error');
        return;
    }

    try {
        const response = await fetch('/api/auth/verify-otp', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contact,
                otp,
                type,
                userId: registeredUserId
            })
        });

        const data = await response.json();

        if (data.success) {
            showNotification(`${type === 'phone' ? 'Phone' : 'Email'} verified successfully!`, 'success');
            document.getElementById(`${type}Verified`).style.display = 'flex';
            otpInput.disabled = true;
        } else {
            showNotification(data.message || 'Invalid OTP', 'error');
        }
    } catch (error) {
        showNotification('Verification failed. Please try again.', 'error');
    }
}

// Resend OTP
async function resendOTP(type) {
    const contact = type === 'phone' ? registeredPhone : registeredEmail;

    try {
        const response = await fetch('/api/auth/send-otp', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contact,
                type,
                userId: registeredUserId
            })
        });

        const data = await response.json();

        if (data.success) {
            showNotification(`OTP resent to your ${type}`, 'success');
            
            // Update demo OTP display
            if (data.demoOTP) {
                if (type === 'phone') {
                    document.getElementById('demoPhoneOtp').textContent = data.demoOTP;
                } else {
                    document.getElementById('demoEmailOtp').textContent = data.demoOTP;
                }
            }
        } else {
            showNotification(data.message || 'Failed to resend OTP', 'error');
        }
    } catch (error) {
        showNotification('Failed to resend OTP. Please try again.', 'error');
    }
}

// Complete registration
function completeRegistration() {
    showNotification('Registration complete! Please login to continue.', 'success');
    setTimeout(() => {
        window.location.href = '/login';
    }, 1500);
}
