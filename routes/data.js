const express = require('express');
const router = express.Router();
const { supabase } = require('../database/init');

// GET Villages
router.get('/villages', async (req, res) => {
    try {
        const { grouped } = req.query;

        const { data: villages, error } = await supabase
            .from('villages')
            .select('id, name, taluka, district')
            .order('name');

        if (error) throw error;

        if (grouped === 'true') {
            // Group by taluka/district
            const grouped = {};
            villages.forEach(v => {
                const key = `${v.district} - ${v.taluka}`;
                if (!grouped[key]) grouped[key] = [];
                grouped[key].push(v);
            });
            return res.json({ success: true, villages: grouped });
        }

        res.json({ success: true, villages });
    } catch (err) {
        console.error('Villages fetch error:', err);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

// GET Cities
router.get('/cities', async (req, res) => {
    try {
        const { data: cities, error } = await supabase
            .from('cities')
            .select('id, name, state')
            .order('name');

        if (error) throw error;
        res.json({ success: true, cities });
    } catch (err) {
        console.error('Cities fetch error:', err);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

// GET Colleges
router.get('/colleges', async (req, res) => {
    try {
        const { city, cityName, cityId, course } = req.query;
        const filterCity = city || cityName;

        let query = supabase
            .from('colleges')
            .select(`
                id, name, type, city_id,
                cities (name, state),
                college_courses (course_name)
            `)
            .order('name');

        if (cityId) {
            query = query.eq('city_id', cityId);
        }

        const { data: colleges, error } = await query;
        if (error) throw error;

        let result = colleges || [];

        // Filter by city name if provided
        if (filterCity) {
            result = result.filter(c =>
                c.cities?.name?.toLowerCase().includes(filterCity.toLowerCase())
            );
        }

        // Filter by course if provided
        if (course) {
            result = result.filter(c =>
                c.college_courses?.some(cc => cc.course_name === course)
            );
        }

        // Format response
        const formatted = result.map(c => ({
            id: c.id,
            name: c.name,
            type: c.type,
            city: c.cities?.name,
            city_name: c.cities?.name,
            state: c.cities?.state,
            courses: (c.college_courses || []).map(cc => cc.course_name)
        }));

        res.json({ success: true, colleges: formatted });
    } catch (err) {
        console.error('Colleges fetch error:', err);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

// GET College Courses for a specific college
router.get('/college-courses', async (req, res) => {
    try {
        const { collegeId } = req.query;
        if (!collegeId) {
            return res.json({ success: true, courses: [] });
        }

        const { data: courses, error } = await supabase
            .from('college_courses')
            .select('course_name')
            .eq('college_id', collegeId)
            .order('course_name');

        if (error) throw error;
        res.json({ success: true, courses: (courses || []).map(c => c.course_name) });
    } catch (err) {
        console.error('College courses fetch error:', err);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

// GET Departments
router.get('/departments', async (req, res) => {
    try {
        const { data: departments, error } = await supabase
            .from('departments')
            .select('id, name, category')
            .order('name');

        if (error) throw error;
        res.json({ success: true, departments });
    } catch (err) {
        console.error('Departments fetch error:', err);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

// GET Sub-departments
router.get('/sub-departments', async (req, res) => {
    try {
        const { departmentId, department } = req.query;

        let query = supabase
            .from('sub_departments')
            .select('id, name, department_id')
            .order('name');

        if (departmentId) {
            query = query.eq('department_id', departmentId);
        }

        if (department) {
            // Look up department ID by name
            const { data: dept } = await supabase
                .from('departments')
                .select('id')
                .eq('name', department)
                .single();

            if (dept) {
                query = query.eq('department_id', dept.id);
            }
        }

        const { data: subDepartments, error } = await query;
        if (error) throw error;
        res.json({ success: true, subDepartments });
    } catch (err) {
        console.error('Sub-departments fetch error:', err);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

// GET Business Types (static list)
router.get('/business-types', (req, res) => {
    const businessTypes = [
        'Retail', 'Manufacturing', 'Construction', 'Agriculture',
        'Services', 'IT & Technology', 'Healthcare', 'Education',
        'Transport & Logistics', 'Food & Hospitality',
        'Textile & Garments', 'Real Estate', 'Financial Services',
        'Media & Entertainment', 'Consulting', 'Other'
    ];
    res.json({ success: true, businessTypes });
});

// GET Business Fields (static list)
router.get('/business-fields', (req, res) => {
    const businessFields = [
        'Grocery & FMCG', 'Clothing & Fashion', 'Electronics & Hardware',
        'Construction & Building Materials', 'Auto Parts & Accessories',
        'Pharmaceutical & Medical', 'Jewellery & Gems', 'Furniture & Interiors',
        'Stationery & Office Supplies', 'Chemicals & Industrial',
        'Agriculture & Seeds', 'Textiles & Fabrics', 'Dairy & Food Processing',
        'Printing & Packaging', 'Oil & Petroleum', 'Handicrafts & Art',
        'Import / Export', 'Scrap & Recycling', 'Travel & Tourism',
        'Event Management', 'Beauty & Wellness', 'Photography & Videography',
        'Catering & Food Services', 'Transportation & Logistics',
        'Interior Design', 'Digital Marketing & IT Services',
        'Coaching & Training', 'Property & Real Estate', 'Other'
    ];
    res.json({ success: true, businessFields });
});

// GET Job Fields (static list)
router.get('/job-fields', (req, res) => {
    const jobFields = [
        'Software Development', 'IT Consulting', 'Data Science & Analytics',
        'IT Support & Helpdesk', 'Cybersecurity', 'Cloud Computing',
        'Banking', 'Insurance', 'Accounting & Finance',
        'Oil & Gas', 'Infrastructure', 'Manufacturing',
        'Healthcare', 'Pharmaceuticals', 'Education & Training',
        'Government / Public Sector', 'Defence',
        'Marketing & Advertising', 'Sales', 'HR & Recruitment',
        'Law & Legal', 'Media & Journalism',
        'Real Estate', 'Agriculture', 'Textile & Fashion',
        'Automobile', 'Telecom', 'E-commerce',
        'Hospitality & Tourism', 'NGO / Social Work', 'Other'
    ];
    res.json({ success: true, jobFields });
});

// GET Years (static list for dropdowns)
router.get('/years', (req, res) => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let y = currentYear + 5; y >= currentYear - 30; y--) {
        years.push(y.toString());
    }
    res.json({ success: true, years });
});

// GET Public Stats
router.get('/public-stats', async (req, res) => {
    try {
        const { count: totalUsers } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true })
            .eq('registration_completed', true)
            .eq('is_approved', true);

        const { count: totalStudents } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true })
            .eq('registration_completed', true)
            .eq('is_approved', true)
            .eq('occupation_type', 'student');

        const { count: totalJobProfessionals } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true })
            .eq('registration_completed', true)
            .eq('is_approved', true)
            .eq('occupation_type', 'job');

        const { count: totalBusinessOwners } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true })
            .eq('registration_completed', true)
            .eq('is_approved', true)
            .eq('occupation_type', 'business');

        const { count: totalVillages } = await supabase
            .from('villages')
            .select('*', { count: 'exact', head: true });

        res.json({
            success: true,
            stats: {
                totalUsers: totalUsers || 0,
                totalStudents: totalStudents || 0,
                totalJobProfessionals: totalJobProfessionals || 0,
                totalBusinessOwners: totalBusinessOwners || 0,
                totalVillages: totalVillages || 0
            }
        });
    } catch (err) {
        console.error('Stats fetch error:', err);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

// Download report (CSV)
router.get('/download-report', async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ success: false, message: 'Not authenticated.' });
        }

        // Check if admin
        const { data: currentUser } = await supabase
            .from('users')
            .select('is_admin')
            .eq('id', req.session.userId)
            .single();

        if (!currentUser?.is_admin) {
            return res.status(403).json({ success: false, message: 'Admin access required.' });
        }

        const { data: users, error } = await supabase
            .from('users')
            .select(`
                id, first_name, middle_name, last_name, gender, phone, email,
                occupation_type, current_address, is_approved, created_at,
                villages (name, taluka, district),
                student_details (department, sub_department, college_city, college_name),
                job_details (company_name, designation, field, working_city),
                business_details (business_name, business_type, business_field, business_city)
            `)
            .eq('registration_completed', true)
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Build CSV
        const headers = [
            'ID', 'First Name', 'Middle Name', 'Last Name', 'Gender',
            'Phone', 'Email', 'Village', 'Taluka', 'District',
            'Current Address', 'Occupation Type', 'Approved',
            'Detail 1', 'Detail 2', 'Detail 3', 'Detail 4', 'Created At'
        ];

        let csv = headers.join(',') + '\n';

        (users || []).forEach(u => {
            let d1 = '', d2 = '', d3 = '', d4 = '';
            if (u.occupation_type === 'student' && u.student_details?.[0]) {
                d1 = u.student_details[0].department || '';
                d2 = u.student_details[0].sub_department || '';
                d3 = u.student_details[0].college_name || '';
                d4 = u.student_details[0].college_city || '';
            } else if (u.occupation_type === 'job' && u.job_details?.[0]) {
                d1 = u.job_details[0].company_name || '';
                d2 = u.job_details[0].designation || '';
                d3 = u.job_details[0].field || '';
                d4 = u.job_details[0].working_city || '';
            } else if (u.occupation_type === 'business' && u.business_details?.[0]) {
                d1 = u.business_details[0].business_name || '';
                d2 = u.business_details[0].business_type || '';
                d3 = u.business_details[0].business_field || '';
                d4 = u.business_details[0].business_city || '';
            }

            const row = [
                u.id,
                `"${u.first_name || ''}"`,
                `"${u.middle_name || ''}"`,
                `"${u.last_name || ''}"`,
                u.gender || '',
                u.phone || '',
                u.email || '',
                `"${u.villages?.name || ''}"`,
                `"${u.villages?.taluka || ''}"`,
                `"${u.villages?.district || ''}"`,
                `"${u.current_address || ''}"`,
                u.occupation_type || '',
                u.is_approved ? 'Yes' : 'No',
                `"${d1}"`,
                `"${d2}"`,
                `"${d3}"`,
                `"${d4}"`,
                u.created_at || ''
            ];
            csv += row.join(',') + '\n';
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=community_report.csv');
        res.send(csv);
    } catch (err) {
        console.error('Report download error:', err);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

module.exports = router;
