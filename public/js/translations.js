// Language Translations
const translations = {
    en: {
        // Navigation
        nav_home: 'Home',
        nav_login: 'Login',
        nav_signup: 'Sign Up',
        nav_register: 'Complete Profile',
        nav_search: 'Search',
        nav_profile: 'Profile',
        nav_admin: 'Admin',
        nav_logout: 'Logout',
        
        // Login Page
        login_title: 'Login',
        login_subtitle: 'Welcome back! Please login to continue',
        login_email: 'Email Address',
        login_password: 'Password',
        login_remember: 'Remember me',
        login_forgot: 'Forgot Password?',
        login_button: 'Login',
        login_no_account: "Don't have an account?",
        login_signup_link: 'Sign Up Now',
        
        // Sign Up Page
        signup_title: 'Create Account',
        signup_subtitle: 'Join our community of 52 villages',
        signup_phone: 'Mobile Number',
        signup_email: 'Email Address',
        signup_password: 'Password',
        signup_confirm_password: 'Confirm Password',
        signup_button: 'Create Account',
        signup_have_account: 'Already have an account?',
        signup_login_link: 'Login here',
        
        // OTP Verification
        otp_title: 'Verify Your Email',
        otp_subtitle: 'Enter the OTP sent to',
        otp_label: 'Enter OTP',
        otp_button: 'Verify OTP',
        otp_resend: "Didn't receive OTP?",
        otp_resend_btn: 'Resend OTP',
        
        // Registration Form
        reg_title: 'Complete Your Profile',
        reg_personal_info: 'Personal Information',
        reg_first_name: 'First Name',
        reg_middle_name: 'Middle Name',
        reg_last_name: 'Last Name',
        reg_gender: 'Gender',
        reg_male: 'Male',
        reg_female: 'Female',
        reg_other: 'Other',
        reg_village: 'Select Village',
        reg_current_address: 'Current Address',
        reg_occupation: 'Occupation Type',
        reg_student: 'Student',
        reg_job: 'Job/Service',
        reg_business: 'Business',
        
        // Student Fields
        student_course: 'Course/Degree',
        student_branch: 'Branch/Specialization',
        student_college: 'College Name',
        student_city: 'College City',
        student_year: 'Year of Study',
        
        // Job Fields
        job_company: 'Company Name',
        job_designation: 'Designation',
        job_field: 'Job Field',
        job_city: 'Working City',
        job_experience: 'Experience (Years)',
        
        // Business Fields
        business_name: 'Business Name',
        business_type: 'Business Type',
        business_field: 'Business Field',
        business_city: 'Business City',
        business_address: 'Business Address',
        
        // Buttons
        btn_next: 'Next',
        btn_prev: 'Previous',
        btn_submit: 'Submit',
        btn_save: 'Save',
        btn_cancel: 'Cancel',
        btn_search: 'Search',
        btn_clear: 'Clear',
        
        // Search Page
        search_title: 'Search Directory',
        search_subtitle: 'Find members from our community',
        search_name: 'Search by Name',
        search_village: 'Filter by Village',
        search_occupation: 'Filter by Occupation',
        search_all: 'All',
        search_results: 'Search Results',
        search_no_results: 'No results found',
        
        // Messages
        msg_success: 'Success!',
        msg_error: 'Error!',
        msg_loading: 'Loading...',
        msg_required: 'This field is required',
        msg_invalid_email: 'Please enter a valid email',
        msg_invalid_phone: 'Please enter a valid 10-digit mobile number',
        msg_password_mismatch: 'Passwords do not match',
        msg_password_short: 'Password must be at least 6 characters',
        
        // Language
        select_language: 'Select Language',
        lang_english: 'English',
        lang_gujarati: 'ગુજરાતી'
    },
    
    gu: {
        // Navigation
        nav_home: 'હોમ',
        nav_login: 'લોગિન',
        nav_signup: 'સાઇન અપ',
        nav_register: 'પ્રોફાઇલ પૂર્ણ કરો',
        nav_search: 'શોધો',
        nav_profile: 'પ્રોફાઇલ',
        nav_admin: 'એડમિન',
        nav_logout: 'લોગઆઉટ',
        
        // Login Page
        login_title: 'લોગિન',
        login_subtitle: 'પાછા આવ્યા! કૃપા કરીને ચાલુ રાખવા માટે લોગિન કરો',
        login_email: 'ઈમેલ એડ્રેસ',
        login_password: 'પાસવર્ડ',
        login_remember: 'મને યાદ રાખો',
        login_forgot: 'પાસવર્ડ ભૂલી ગયા?',
        login_button: 'લોગિન',
        login_no_account: 'એકાઉન્ટ નથી?',
        login_signup_link: 'હમણાં સાઇન અપ કરો',
        
        // Sign Up Page
        signup_title: 'એકાઉન્ટ બનાવો',
        signup_subtitle: 'અમારા 52 ગામના સમુદાયમાં જોડાઓ',
        signup_phone: 'મોબાઇલ નંબર',
        signup_email: 'ઈમેલ એડ્રેસ',
        signup_password: 'પાસવર્ડ',
        signup_confirm_password: 'પાસવર્ડ કન્ફર્મ કરો',
        signup_button: 'એકાઉન્ટ બનાવો',
        signup_have_account: 'પહેલેથી એકાઉન્ટ છે?',
        signup_login_link: 'અહીં લોગિન કરો',
        
        // OTP Verification
        otp_title: 'તમારો ઈમેલ વેરિફાય કરો',
        otp_subtitle: 'OTP મોકલવામાં આવ્યો છે',
        otp_label: 'OTP દાખલ કરો',
        otp_button: 'OTP વેરિફાય કરો',
        otp_resend: 'OTP મળ્યો નથી?',
        otp_resend_btn: 'OTP ફરીથી મોકલો',
        
        // Registration Form
        reg_title: 'તમારી પ્રોફાઇલ પૂર્ણ કરો',
        reg_personal_info: 'વ્યક્તિગત માહિતી',
        reg_first_name: 'પ્રથમ નામ',
        reg_middle_name: 'પિતાનું નામ',
        reg_last_name: 'અટક',
        reg_gender: 'લિંગ',
        reg_male: 'પુરુષ',
        reg_female: 'સ્ત્રી',
        reg_other: 'અન્ય',
        reg_village: 'ગામ પસંદ કરો',
        reg_current_address: 'હાલનું સરનામું',
        reg_occupation: 'વ્યવસાય પ્રકાર',
        reg_student: 'વિદ્યાર્થી',
        reg_job: 'નોકરી/સર્વિસ',
        reg_business: 'ધંધો',
        
        // Student Fields
        student_course: 'કોર્સ/ડિગ્રી',
        student_branch: 'બ્રાન્ચ/સ્પેશિયલાઇઝેશન',
        student_college: 'કોલેજનું નામ',
        student_city: 'કોલેજ શહેર',
        student_year: 'અભ્યાસનું વર્ષ',
        
        // Job Fields
        job_company: 'કંપનીનું નામ',
        job_designation: 'હોદ્દો',
        job_field: 'કાર્યક્ષેત્ર',
        job_city: 'કામનું શહેર',
        job_experience: 'અનુભવ (વર્ષો)',
        
        // Business Fields
        business_name: 'ધંધાનું નામ',
        business_type: 'ધંધાનો પ્રકાર',
        business_field: 'ધંધાનું ક્ષેત્ર',
        business_city: 'ધંધાનું શહેર',
        business_address: 'ધંધાનું સરનામું',
        
        // Buttons
        btn_next: 'આગળ',
        btn_prev: 'પાછળ',
        btn_submit: 'સબમિટ કરો',
        btn_save: 'સાચવો',
        btn_cancel: 'રદ કરો',
        btn_search: 'શોધો',
        btn_clear: 'સાફ કરો',
        
        // Search Page
        search_title: 'ડિરેક્ટરી શોધો',
        search_subtitle: 'અમારા સમુદાયના સભ્યો શોધો',
        search_name: 'નામથી શોધો',
        search_village: 'ગામ દ્વારા ફિલ્ટર',
        search_occupation: 'વ્યવસાય દ્વારા ફિલ્ટર',
        search_all: 'બધા',
        search_results: 'શોધ પરિણામો',
        search_no_results: 'કોઈ પરિણામ મળ્યું નથી',
        
        // Messages
        msg_success: 'સફળ!',
        msg_error: 'ભૂલ!',
        msg_loading: 'લોડ થઈ રહ્યું છે...',
        msg_required: 'આ ક્ષેત્ર જરૂરી છે',
        msg_invalid_email: 'કૃપા કરીને માન્ય ઈમેલ દાખલ કરો',
        msg_invalid_phone: 'કૃપા કરીને માન્ય 10 અંકનો મોબાઇલ નંબર દાખલ કરો',
        msg_password_mismatch: 'પાસવર્ડ મેળ ખાતો નથી',
        msg_password_short: 'પાસવર્ડ ઓછામાં ઓછો 6 અક્ષરોનો હોવો જોઈએ',
        
        // Language
        select_language: 'ભાષા પસંદ કરો',
        lang_english: 'English',
        lang_gujarati: 'ગુજરાતી'
    }
};

// Course and Branch mapping
const courseBranches = {
    'B.Tech': [
        'Computer Engineering',
        'Information Technology',
        'Mechanical Engineering',
        'Civil Engineering',
        'Electrical Engineering',
        'Electronics & Communication',
        'Chemical Engineering',
        'Automobile Engineering',
        'Biomedical Engineering',
        'Aerospace Engineering',
        'Agricultural Engineering'
    ],
    'M.Tech': [
        'Computer Engineering',
        'Information Technology',
        'Mechanical Engineering',
        'Civil Engineering',
        'Electrical Engineering',
        'Electronics & Communication',
        'VLSI Design',
        'Power Systems',
        'Structural Engineering'
    ],
    'B.E.': [
        'Computer Engineering',
        'Mechanical Engineering',
        'Civil Engineering',
        'Electrical Engineering',
        'Electronics & Communication',
        'Production Engineering'
    ],
    'BCA': [
        'Computer Applications',
        'Software Development',
        'Web Development',
        'Data Science'
    ],
    'MCA': [
        'Computer Applications',
        'Software Engineering',
        'Data Science',
        'Artificial Intelligence'
    ],
    'B.Sc': [
        'Physics',
        'Chemistry',
        'Mathematics',
        'Biology',
        'Computer Science',
        'Information Technology',
        'Biotechnology',
        'Microbiology',
        'Agriculture',
        'Nursing'
    ],
    'M.Sc': [
        'Physics',
        'Chemistry',
        'Mathematics',
        'Computer Science',
        'Biotechnology',
        'Microbiology'
    ],
    'B.Com': [
        'Accountancy',
        'Banking & Finance',
        'Taxation',
        'Business Management'
    ],
    'M.Com': [
        'Accountancy',
        'Banking & Finance',
        'Business Administration'
    ],
    'BBA': [
        'General Management',
        'Finance',
        'Marketing',
        'Human Resource',
        'International Business'
    ],
    'MBA': [
        'Finance',
        'Marketing',
        'Human Resource',
        'Operations',
        'International Business',
        'Information Technology',
        'Healthcare Management'
    ],
    'B.Pharm': [
        'Pharmaceutical Chemistry',
        'Pharmacology',
        'Pharmaceutics',
        'Pharmacognosy'
    ],
    'B.Arch': [
        'Architecture Design',
        'Urban Planning',
        'Interior Design',
        'Landscape Architecture',
        'Sustainable Architecture'
    ],
    'M.Arch': [
        'Urban Design',
        'Landscape Architecture',
        'Interior Design',
        'Conservation'
    ],
    'MBBS': [
        'General Medicine'
    ],
    'BDS': [
        'Dental Surgery'
    ],
    'LLB': [
        'General Law',
        'Corporate Law',
        'Criminal Law',
        'Civil Law'
    ],
    'B.Ed': [
        'Primary Education',
        'Secondary Education',
        'Special Education'
    ],
    'BA': [
        'English',
        'Hindi',
        'Gujarati',
        'History',
        'Political Science',
        'Economics',
        'Psychology',
        'Sociology'
    ],
    'MA': [
        'English',
        'Hindi',
        'Gujarati',
        'History',
        'Political Science',
        'Economics',
        'Psychology'
    ],
    'Diploma': [
        'Computer Engineering',
        'Mechanical Engineering',
        'Civil Engineering',
        'Electrical Engineering',
        'Electronics',
        'Automobile Engineering'
    ],
    'ITI': [
        'Fitter',
        'Turner',
        'Electrician',
        'Welder',
        'Mechanic',
        'COPA',
        'Plumber'
    ],
    'Nursing': [
        'General Nursing',
        'BSc Nursing',
        'GNM',
        'ANM'
    ],
    'LLM': [
        'Constitutional Law',
        'Corporate Law',
        'Criminal Law',
        'International Law'
    ],
    'M.Ed': [
        'Educational Administration',
        'Curriculum Development',
        'Educational Technology'
    ],
    'PhD': [
        'Research'
    ],
    '10th': [
        'General'
    ],
    '12th Science': [
        'PCM (Physics, Chemistry, Maths)',
        'PCB (Physics, Chemistry, Biology)'
    ],
    '12th Commerce': [
        'Commerce with Maths',
        'Commerce without Maths'
    ],
    '12th Arts': [
        'Arts/Humanities'
    ]
};

// Get current language
function getCurrentLang() {
    return localStorage.getItem('language') || 'en';
}

// Set language
function setLanguage(lang) {
    localStorage.setItem('language', lang);
    applyTranslations();
}

// Apply translations to page
function applyTranslations() {
    const lang = getCurrentLang();
    const t = translations[lang];
    
    // Update all elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (t[key]) {
            if (el.tagName === 'INPUT' && el.type !== 'submit') {
                el.placeholder = t[key];
            } else {
                el.textContent = t[key];
            }
        }
    });
    
    // Update document title if available
    const pageTitle = document.querySelector('title');
    if (pageTitle && pageTitle.getAttribute('data-i18n')) {
        const key = pageTitle.getAttribute('data-i18n');
        if (t[key]) {
            pageTitle.textContent = t[key] + ' - 52 ગામ કડવા પટેલ સમાજ';
        }
    }
}

// Get translation
function t(key) {
    const lang = getCurrentLang();
    return translations[lang][key] || key;
}

// Get branches for a course
function getBranchesForCourse(course) {
    return courseBranches[course] || [];
}

// Initialize language on page load
document.addEventListener('DOMContentLoaded', () => {
    // Check if language is selected
    if (!localStorage.getItem('language')) {
        // Show language selection modal
        showLanguageModal();
    } else {
        applyTranslations();
    }
});

// Show language selection modal
function showLanguageModal() {
    // Check if modal already exists
    if (document.getElementById('languageModal')) return;
    
    const modal = document.createElement('div');
    modal.id = 'languageModal';
    modal.className = 'language-modal';
    modal.innerHTML = `
        <div class="language-modal-content">
            <div class="language-modal-header">
                <h2>🌐 Select Language / ભાષા પસંદ કરો</h2>
            </div>
            <div class="language-modal-body">
                <button class="language-btn" onclick="selectLanguage('en')">
                    <span class="lang-icon">🇬🇧</span>
                    <span class="lang-name">English</span>
                </button>
                <button class="language-btn" onclick="selectLanguage('gu')">
                    <span class="lang-icon">🇮🇳</span>
                    <span class="lang-name">ગુજરાતી</span>
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

// Select language and close modal
function selectLanguage(lang) {
    setLanguage(lang);
    const modal = document.getElementById('languageModal');
    if (modal) {
        modal.remove();
    }
    // Reload page to apply translations
    window.location.reload();
}
