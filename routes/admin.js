const express = require('express');
const router = express.Router();
const { supabase } = require('../database/init');

// GET Pending Approvals
router.get('/pending', async (req, res) => {
    try {
        const { data: users, error } = await supabase
            .from('users')
            .select(`
                id, first_name, middle_name, last_name, gender, phone, email,
                occupation_type, current_address, created_at,
                phone_verified, email_verified, is_approved,
                villages (name, taluka, district),
                student_details (department, sub_department, college_city, college_name, year_of_study, additional_info),
                job_details (company_name, designation, field, working_city, experience_years, graduation_year, college_city, college_name, department, graduation_branch, additional_info),
                business_details (business_name, business_type, business_field, business_city, business_address, years_in_business, employees_count, website, additional_info)
            `)
            .eq('registration_completed', true)
            .eq('is_approved', false)
            .eq('is_admin', false)
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Helper to extract occupation details (handles both array and object from Supabase)
        function getOccupationDetail(u) {
            let detail = null;
            if (u.occupation_type === 'student') {
                detail = Array.isArray(u.student_details) ? u.student_details[0] : u.student_details;
            } else if (u.occupation_type === 'job') {
                detail = Array.isArray(u.job_details) ? u.job_details[0] : u.job_details;
            } else if (u.occupation_type === 'business') {
                detail = Array.isArray(u.business_details) ? u.business_details[0] : u.business_details;
            }
            return detail || null;
        }

        // Format to match what frontend expects (snake_case with village_name)
        const formatted = (users || []).map(u => ({
            id: u.id,
            first_name: u.first_name,
            middle_name: u.middle_name,
            last_name: u.last_name,
            gender: u.gender,
            phone: u.phone,
            email: u.email,
            occupation_type: u.occupation_type,
            current_address: u.current_address,
            created_at: u.created_at,
            phone_verified: u.phone_verified ? 1 : 0,
            email_verified: u.email_verified ? 1 : 0,
            is_approved: u.is_approved ? 1 : 0,
            village_name: u.villages?.name || '-',
            taluka: u.villages?.taluka,
            district: u.villages?.district,
            occupationDetails: getOccupationDetail(u)
        }));

        res.json({
            success: true,
            users: formatted,
            pagination: {
                page: 1,
                totalPages: 1
            }
        });
    } catch (err) {
        console.error('Pending approvals error:', err);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

// APPROVE User
router.post('/approve/:id', async (req, res) => {
    try {
        const userId = parseInt(req.params.id);

        const { error } = await supabase
            .from('users')
            .update({ is_approved: true })
            .eq('id', userId);

        if (error) throw error;

        // Send approval email
        try {
            const { data: user } = await supabase
                .from('users')
                .select('email, first_name')
                .eq('id', userId)
                .single();

            if (user) {
                const emailService = require('../services/emailService');
                await emailService.sendApprovalEmail(user.email, user.first_name);
            }
        } catch (emailErr) {
            console.error('Approval email error:', emailErr);
        }

        res.json({ success: true, message: 'User approved successfully!' });
    } catch (err) {
        console.error('Approve error:', err);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

// REJECT (Delete) User — accept both POST and DELETE
router.post('/reject/:id', rejectHandler);
router.delete('/reject/:id', rejectHandler);

async function rejectHandler(req, res) {
    try {
        const userId = parseInt(req.params.id);

        // Get user info for email before deletion
        let userEmail, userName;
        try {
            const { data: user } = await supabase
                .from('users')
                .select('email, first_name')
                .eq('id', userId)
                .single();
            userEmail = user?.email;
            userName = user?.first_name;
        } catch (e) { }

        // Delete related records first due to foreign keys
        await supabase.from('student_details').delete().eq('user_id', userId);
        await supabase.from('job_details').delete().eq('user_id', userId);
        await supabase.from('business_details').delete().eq('user_id', userId);
        await supabase.from('otp_verifications').delete().eq('user_id', userId);

        // Delete user
        const { error } = await supabase
            .from('users')
            .delete()
            .eq('id', userId);

        if (error) throw error;

        // Send rejection email
        if (userEmail) {
            try {
                const emailService = require('../services/emailService');
                await emailService.sendRejectionEmail(userEmail, userName);
            } catch (emailErr) {
                console.error('Rejection email error:', emailErr);
            }
        }

        res.json({ success: true, message: 'User rejected and removed.' });
    } catch (err) {
        console.error('Reject error:', err);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
}

// GET All Users (Admin)
router.get('/users', async (req, res) => {
    try {
        const { page = 1, limit = 20, search, occupationType, approved } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        let query = supabase
            .from('users')
            .select(`
                id, first_name, middle_name, last_name, gender, phone, email,
                occupation_type, current_address, is_approved, is_admin,
                can_view_sensitive, registration_completed, created_at,
                phone_verified, email_verified, village_id,
                villages (name, taluka, district),
                student_details (*),
                job_details (*),
                business_details (*)
            `, { count: 'exact' })
            .eq('registration_completed', true)
            .eq('is_admin', false)
            .order('created_at', { ascending: false });

        if (occupationType) {
            query = query.eq('occupation_type', occupationType);
        }

        if (approved !== undefined && approved !== '' && approved !== 'all') {
            query = query.eq('is_approved', approved === 'true');
        }

        if (search) {
            query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
        }

        query = query.range(offset, offset + parseInt(limit) - 1);

        const { data: users, error, count } = await query;
        if (error) throw error;

        // Debug: Log raw Supabase join data for first user
        if (users && users.length > 0) {
            console.log('DEBUG Admin /users - raw first user join data:', JSON.stringify({
                occupation_type: users[0].occupation_type,
                student_details: users[0].student_details,
                job_details: users[0].job_details,
                business_details: users[0].business_details
            }, null, 2));
        }

        // Helper to extract occupation details (handles both array and object from Supabase)
        function getOccupationDetail(u) {
            let detail = null;
            if (u.occupation_type === 'student') {
                detail = Array.isArray(u.student_details) ? u.student_details[0] : u.student_details;
            } else if (u.occupation_type === 'job') {
                detail = Array.isArray(u.job_details) ? u.job_details[0] : u.job_details;
            } else if (u.occupation_type === 'business') {
                detail = Array.isArray(u.business_details) ? u.business_details[0] : u.business_details;
            }
            return detail || null;
        }

        // Format — keep snake_case to match what admin.js frontend expects
        const formatted = (users || []).map(u => ({
            id: u.id,
            first_name: u.first_name,
            middle_name: u.middle_name,
            last_name: u.last_name,
            gender: u.gender,
            phone: u.phone,
            email: u.email,
            occupation_type: u.occupation_type,
            current_address: u.current_address,
            is_approved: u.is_approved ? 1 : 0,
            is_admin: u.is_admin ? 1 : 0,
            can_view_sensitive: u.can_view_sensitive ? 1 : 0,
            phone_verified: u.phone_verified ? 1 : 0,
            email_verified: u.email_verified ? 1 : 0,
            created_at: u.created_at,
            village_id: u.village_id,
            village_name: u.villages?.name || '-',
            taluka: u.villages?.taluka,
            district: u.villages?.district,
            occupationDetails: getOccupationDetail(u)
        }));

        const totalPages = Math.ceil((count || 0) / parseInt(limit));

        res.json({
            success: true,
            users: formatted,
            total: count || 0,
            pagination: {
                page: parseInt(page),
                totalPages: totalPages
            },
            page: parseInt(page),
            totalPages: totalPages
        });
    } catch (err) {
        console.error('Admin users error:', err);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

// TOGGLE Sensitive Access
router.post('/toggle-sensitive-access/:id', async (req, res) => {
    try {
        const userId = parseInt(req.params.id);

        const { data: user, error: fetchError } = await supabase
            .from('users')
            .select('can_view_sensitive')
            .eq('id', userId)
            .single();

        if (fetchError || !user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        const { error } = await supabase
            .from('users')
            .update({ can_view_sensitive: !user.can_view_sensitive })
            .eq('id', userId);

        if (error) throw error;

        res.json({
            success: true,
            message: `Sensitive access ${!user.can_view_sensitive ? 'granted' : 'revoked'}.`,
            canViewSensitive: !user.can_view_sensitive
        });
    } catch (err) {
        console.error('Toggle sensitive access error:', err);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

// ADMIN Stats
router.get('/stats', async (req, res) => {
    try {
        const { count: totalUsers } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true })
            .eq('registration_completed', true);

        const { count: approvedUsers } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true })
            .eq('registration_completed', true)
            .eq('is_approved', true);

        const { count: pendingUsers } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true })
            .eq('registration_completed', true)
            .eq('is_approved', false)
            .eq('is_admin', false);

        const { count: students } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true })
            .eq('registration_completed', true)
            .eq('occupation_type', 'student');

        const { count: jobs } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true })
            .eq('registration_completed', true)
            .eq('occupation_type', 'job');

        const { count: businesses } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true })
            .eq('registration_completed', true)
            .eq('occupation_type', 'business');

        // Village-wise distribution
        const { data: villageData } = await supabase
            .from('users')
            .select('village_id, villages(name)')
            .eq('registration_completed', true);

        const villageCounts = {};
        (villageData || []).forEach(u => {
            const vName = u.villages?.name || 'Unknown';
            villageCounts[vName] = (villageCounts[vName] || 0) + 1;
        });
        const villageStats = Object.entries(villageCounts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 15);

        res.json({
            success: true,
            stats: {
                totalUsers: totalUsers || 0,
                approvedUsers: approvedUsers || 0,
                pendingUsers: pendingUsers || 0,
                students: students || 0,
                jobs: jobs || 0,
                businesses: businesses || 0,
                villageStats: villageStats
            }
        });
    } catch (err) {
        console.error('Admin stats error:', err);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

// Download report (CSV/JSON) with optional village filter
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

        const { type = 'all', format = 'csv', village } = req.query;

        let query = supabase
            .from('users')
            .select(`
                id, first_name, middle_name, last_name, gender, phone, email,
                occupation_type, current_address, is_approved, created_at,
                village_id,
                villages (name, taluka, district),
                student_details (department, sub_department, college_city, college_name),
                job_details (company_name, designation, field, working_city),
                business_details (business_name, business_type, business_field, business_city)
            `)
            .eq('registration_completed', true)
            .order('created_at', { ascending: false });

        // Filter by occupation type
        if (type && type !== 'all') {
            query = query.eq('occupation_type', type);
        }

        // Filter by village
        if (village) {
            query = query.eq('village_id', parseInt(village));
        }

        const { data: users, error } = await query;
        if (error) throw error;

        if (format === 'json') {
            return res.json({ success: true, data: users });
        }

        // Build CSV
        const headers = [
            'ID', 'First Name', 'Middle Name', 'Last Name', 'Gender',
            'Phone', 'Email', 'Village', 'Taluka', 'District',
            'Current Address', 'Occupation Type', 'Approved',
            'Detail 1', 'Detail 2', 'Detail 3', 'Detail 4', 'Created At'
        ];

        // Add UTF-8 BOM for proper Gujarati text display in Excel
        let csv = '\ufeff' + headers.join(',') + '\n';

        (users || []).forEach(u => {
            let d1 = '', d2 = '', d3 = '', d4 = '';
            const det = Array.isArray(u.student_details) ? u.student_details[0] : u.student_details;
            const jobDet = Array.isArray(u.job_details) ? u.job_details[0] : u.job_details;
            const bizDet = Array.isArray(u.business_details) ? u.business_details[0] : u.business_details;

            if (u.occupation_type === 'student' && det) {
                d1 = det.department || '';
                d2 = det.sub_department || '';
                d3 = det.college_name || '';
                d4 = det.college_city || '';
            } else if (u.occupation_type === 'job' && jobDet) {
                d1 = jobDet.company_name || '';
                d2 = jobDet.designation || '';
                d3 = jobDet.field || '';
                d4 = jobDet.working_city || '';
            } else if (u.occupation_type === 'business' && bizDet) {
                d1 = bizDet.business_name || '';
                d2 = bizDet.business_type || '';
                d3 = bizDet.business_field || '';
                d4 = bizDet.business_city || '';
            }

            const villageName = Array.isArray(u.villages) ? (u.villages[0]?.name || '') : (u.villages?.name || '');
            const taluka = Array.isArray(u.villages) ? (u.villages[0]?.taluka || '') : (u.villages?.taluka || '');
            const district = Array.isArray(u.villages) ? (u.villages[0]?.district || '') : (u.villages?.district || '');

            const row = [
                u.id,
                `"${(u.first_name || '').replace(/"/g, '""')}"`,
                `"${(u.middle_name || '').replace(/"/g, '""')}"`,
                `"${(u.last_name || '').replace(/"/g, '""')}"`,
                u.gender || '',
                u.phone || '',
                u.email || '',
                `"${villageName.replace(/"/g, '""')}"`,
                `"${taluka.replace(/"/g, '""')}"`,
                `"${district.replace(/"/g, '""')}"`,
                `"${(u.current_address || '').replace(/"/g, '""')}"`,
                u.occupation_type || '',
                u.is_approved ? 'Yes' : 'No',
                `"${d1.replace(/"/g, '""')}"`,
                `"${d2.replace(/"/g, '""')}"`,
                `"${d3.replace(/"/g, '""')}"`,
                `"${d4.replace(/"/g, '""')}"`,
                u.created_at || ''
            ];
            csv += row.join(',') + '\n';
        });

        const filename = village ? `community_report_village_${village}_${Date.now()}.csv` : `community_report_${type}_${Date.now()}.csv`;
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
        res.send(csv);
    } catch (err) {
        console.error('Report download error:', err);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

module.exports = router;
