const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { supabase } = require('../database/init');

// Middleware to check if user is logged in
const requireAuth = (req, res, next) => {
    if (req.session && req.session.userId) {
        next();
    } else {
        res.status(401).json({ success: false, message: 'Please login first' });
    }
};

// Get user profile
router.get('/profile', requireAuth, async (req, res) => {
    try {
        const userId = req.session.userId;
        console.log('Getting profile for user ID:', userId);

        const { data: user, error } = await supabase
            .from('users')
            .select(`
                *,
                villages (name)
            `)
            .eq('id', userId)
            .single();

        console.log('User found:', user ? 'yes' : 'no');

        if (error || !user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Get occupation-specific details
        let occupationDetails = null;
        if (user.occupation_type === 'student') {
            const { data } = await supabase
                .from('student_details')
                .select('*')
                .eq('user_id', userId)
                .single();
            occupationDetails = data;
        } else if (user.occupation_type === 'job') {
            const { data } = await supabase
                .from('job_details')
                .select('*')
                .eq('user_id', userId)
                .single();
            occupationDetails = data;
        } else if (user.occupation_type === 'business') {
            const { data } = await supabase
                .from('business_details')
                .select('*')
                .eq('user_id', userId)
                .single();
            occupationDetails = data;
        }

        console.log('Occupation details:', occupationDetails);

        // Build response - remove password and flatten village name
        const { password, villages, ...safeUser } = user;

        res.json({
            success: true,
            user: {
                ...safeUser,
                village_name: villages?.name || null,
                occupationDetails
            }
        });

    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ success: false, message: 'Failed to get profile' });
    }
});

// Update user profile
router.put('/profile', requireAuth, async (req, res) => {
    try {
        const userId = req.session.userId;
        const {
            firstName, middleName, lastName, currentAddress,
            studentDetails, jobDetails, businessDetails
        } = req.body;

        // Update basic user info
        const updateData = {};
        if (firstName !== undefined) updateData.first_name = firstName;
        if (middleName !== undefined) updateData.middle_name = middleName;
        if (lastName !== undefined) updateData.last_name = lastName;
        if (currentAddress !== undefined) updateData.current_address = currentAddress;
        updateData.updated_at = new Date().toISOString();

        const { error: updateError } = await supabase
            .from('users')
            .update(updateData)
            .eq('id', userId);

        if (updateError) throw updateError;

        // Get user's occupation type
        const { data: user } = await supabase
            .from('users')
            .select('occupation_type')
            .eq('id', userId)
            .single();

        // Update occupation-specific details
        if (user.occupation_type === 'student' && studentDetails) {
            const updateObj = {};
            if (studentDetails.department !== undefined) updateObj.department = studentDetails.department;
            if (studentDetails.subDepartment !== undefined) updateObj.sub_department = studentDetails.subDepartment;
            if (studentDetails.collegeCity !== undefined) updateObj.college_city = studentDetails.collegeCity;
            if (studentDetails.collegeName !== undefined) updateObj.college_name = studentDetails.collegeName;
            if (studentDetails.yearOfStudy !== undefined) updateObj.year_of_study = studentDetails.yearOfStudy;
            if (studentDetails.expectedGraduation !== undefined) updateObj.expected_graduation = studentDetails.expectedGraduation;
            if (studentDetails.additionalInfo !== undefined) updateObj.additional_info = studentDetails.additionalInfo;
            updateObj.updated_at = new Date().toISOString();

            await supabase
                .from('student_details')
                .update(updateObj)
                .eq('user_id', userId);

        } else if (user.occupation_type === 'job' && jobDetails) {
            const updateObj = {};
            if (jobDetails.graduationYear !== undefined) updateObj.graduation_year = jobDetails.graduationYear;
            if (jobDetails.collegeCity !== undefined) updateObj.college_city = jobDetails.collegeCity;
            if (jobDetails.collegeName !== undefined) updateObj.college_name = jobDetails.collegeName;
            if (jobDetails.department !== undefined) updateObj.department = jobDetails.department;
            if (jobDetails.workingCity !== undefined) updateObj.working_city = jobDetails.workingCity;
            if (jobDetails.companyName !== undefined) updateObj.company_name = jobDetails.companyName;
            if (jobDetails.designation !== undefined) updateObj.designation = jobDetails.designation;
            if (jobDetails.field !== undefined) updateObj.field = jobDetails.field;
            if (jobDetails.experienceYears !== undefined) updateObj.experience_years = jobDetails.experienceYears;
            if (jobDetails.additionalInfo !== undefined) updateObj.additional_info = jobDetails.additionalInfo;
            updateObj.updated_at = new Date().toISOString();

            await supabase
                .from('job_details')
                .update(updateObj)
                .eq('user_id', userId);

        } else if (user.occupation_type === 'business' && businessDetails) {
            const updateObj = {};
            if (businessDetails.businessName !== undefined) updateObj.business_name = businessDetails.businessName;
            if (businessDetails.businessType !== undefined) updateObj.business_type = businessDetails.businessType;
            if (businessDetails.businessField !== undefined) updateObj.business_field = businessDetails.businessField;
            if (businessDetails.businessCity !== undefined) updateObj.business_city = businessDetails.businessCity;
            if (businessDetails.businessAddress !== undefined) updateObj.business_address = businessDetails.businessAddress;
            if (businessDetails.yearsInBusiness !== undefined) updateObj.years_in_business = businessDetails.yearsInBusiness;
            if (businessDetails.employeesCount !== undefined) updateObj.employees_count = businessDetails.employeesCount;
            if (businessDetails.website !== undefined) updateObj.website = businessDetails.website;
            if (businessDetails.additionalInfo !== undefined) updateObj.additional_info = businessDetails.additionalInfo;
            updateObj.updated_at = new Date().toISOString();

            await supabase
                .from('business_details')
                .update(updateObj)
                .eq('user_id', userId);
        }

        res.json({ success: true, message: 'Profile updated successfully' });

    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ success: false, message: 'Failed to update profile' });
    }
});

// Change occupation type
router.put('/change-occupation', requireAuth, async (req, res) => {
    try {
        const userId = req.session.userId;
        const { newOccupationType, studentDetails, jobDetails, businessDetails } = req.body;

        if (!['student', 'job', 'business'].includes(newOccupationType)) {
            return res.status(400).json({ success: false, message: 'Invalid occupation type' });
        }

        // Get current occupation type
        const { data: user } = await supabase
            .from('users')
            .select('occupation_type')
            .eq('id', userId)
            .single();

        const oldOccupationType = user.occupation_type;

        // Delete old occupation details
        if (oldOccupationType === 'student') {
            await supabase.from('student_details').delete().eq('user_id', userId);
        } else if (oldOccupationType === 'job') {
            await supabase.from('job_details').delete().eq('user_id', userId);
        } else if (oldOccupationType === 'business') {
            await supabase.from('business_details').delete().eq('user_id', userId);
        }

        // Update occupation type
        await supabase
            .from('users')
            .update({ occupation_type: newOccupationType, updated_at: new Date().toISOString() })
            .eq('id', userId);

        // Insert new occupation details
        if (newOccupationType === 'student' && studentDetails) {
            await supabase.from('student_details').insert({
                user_id: userId,
                department: studentDetails.department,
                sub_department: studentDetails.subDepartment,
                college_city: studentDetails.collegeCity,
                college_name: studentDetails.collegeName,
                year_of_study: studentDetails.yearOfStudy,
                expected_graduation: studentDetails.expectedGraduation,
                additional_info: studentDetails.additionalInfo
            });
        } else if (newOccupationType === 'job' && jobDetails) {
            await supabase.from('job_details').insert({
                user_id: userId,
                graduation_year: jobDetails.graduationYear,
                college_city: jobDetails.collegeCity,
                college_name: jobDetails.collegeName,
                department: jobDetails.department,
                working_city: jobDetails.workingCity,
                company_name: jobDetails.companyName,
                designation: jobDetails.designation,
                field: jobDetails.field,
                experience_years: jobDetails.experienceYears,
                additional_info: jobDetails.additionalInfo
            });
        } else if (newOccupationType === 'business' && businessDetails) {
            await supabase.from('business_details').insert({
                user_id: userId,
                business_name: businessDetails.businessName,
                business_type: businessDetails.businessType,
                business_field: businessDetails.businessField,
                business_city: businessDetails.businessCity,
                business_address: businessDetails.businessAddress,
                years_in_business: businessDetails.yearsInBusiness,
                employees_count: businessDetails.employeesCount,
                website: businessDetails.website,
                additional_info: businessDetails.additionalInfo
            });
        }

        res.json({ success: true, message: 'Occupation updated successfully' });

    } catch (error) {
        console.error('Change occupation error:', error);
        res.status(500).json({ success: false, message: 'Failed to change occupation' });
    }
});

// Change password
router.put('/change-password', requireAuth, async (req, res) => {
    try {
        const userId = req.session.userId;
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ success: false, message: 'Current and new passwords are required' });
        }

        const { data: user } = await supabase
            .from('users')
            .select('password')
            .eq('id', userId)
            .single();

        const isValidPassword = await bcrypt.compare(currentPassword, user.password);

        if (!isValidPassword) {
            return res.status(400).json({ success: false, message: 'Current password is incorrect' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await supabase
            .from('users')
            .update({ password: hashedPassword, updated_at: new Date().toISOString() })
            .eq('id', userId);

        res.json({ success: true, message: 'Password changed successfully' });

    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ success: false, message: 'Failed to change password' });
    }
});

// Search users
router.get('/search', async (req, res) => {
    try {
        const { village, occupation, department, field, name, college, course, specialization, company, jobField, businessType, page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * parseInt(limit);

        let query = supabase
            .from('users')
            .select(`
                id, first_name, middle_name, last_name, gender,
                current_address, occupation_type, is_approved,
                phone, email,
                villages (name)
            `, { count: 'exact' })
            .eq('is_approved', true);

        if (village) {
            query = query.ilike('villages.name', `%${village}%`);
        }

        if (occupation) {
            query = query.eq('occupation_type', occupation);
        }

        if (name) {
            query = query.or(`first_name.ilike.%${name}%,middle_name.ilike.%${name}%,last_name.ilike.%${name}%`);
        }

        query = query.order('created_at', { ascending: false })
            .range(offset, offset + parseInt(limit) - 1);

        const { data: users, count: total, error } = await query;

        if (error) throw error;

        // Get occupation details for each user
        const usersWithDetails = await Promise.all((users || []).map(async (user) => {
            let details = null;
            const { villages, ...userData } = user;

            if (user.occupation_type === 'student') {
                const { data } = await supabase
                    .from('student_details')
                    .select('department, sub_department, college_name, college_city')
                    .eq('user_id', user.id)
                    .single();
                details = data;

                // Filter by college
                if (college && details && !details.college_name?.toLowerCase().includes(college.toLowerCase())) return null;
                // Filter by course
                if (course && details && !details.department?.toLowerCase().includes(course.toLowerCase())) return null;
                // Filter by specialization
                if (specialization && details && !details.sub_department?.toLowerCase().includes(specialization.toLowerCase())) return null;

            } else if (user.occupation_type === 'job') {
                const { data } = await supabase
                    .from('job_details')
                    .select('company_name, designation, working_city, field, experience_years')
                    .eq('user_id', user.id)
                    .single();
                details = data;

                // Filter by company
                if (company && details && !details.company_name?.toLowerCase().includes(company.toLowerCase())) return null;
                // Filter by jobField
                if (jobField && details && !details.field?.toLowerCase().includes(jobField.toLowerCase())) return null;

            } else if (user.occupation_type === 'business') {
                const { data } = await supabase
                    .from('business_details')
                    .select('business_name, business_type, business_field, business_city')
                    .eq('user_id', user.id)
                    .single();
                details = data;

                // Filter by businessType
                if (businessType && details && !details.business_type?.toLowerCase().includes(businessType.toLowerCase())) return null;
            }

            // Filter by department/field
            if (department && details) {
                if (user.occupation_type === 'student' && details.department !== department) return null;
            }
            if (field && details) {
                if (user.occupation_type === 'student' && details.sub_department !== field) return null;
                if (user.occupation_type === 'job' && details.field !== field) return null;
                if (user.occupation_type === 'business' && details.business_field !== field) return null;
            }

            // Hide phone and email for female users
            const userResult = { ...userData, village_name: villages?.name || null, occupationDetails: details };
            if (user.gender && user.gender.toLowerCase() === 'female') {
                delete userResult.phone;
                delete userResult.email;
            }
            return userResult;
        }));

        const filteredUsers = usersWithDetails.filter(u => u !== null);

        res.json({
            success: true,
            users: filteredUsers,
            pagination: {
                total: total || 0,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil((total || 0) / parseInt(limit))
            }
        });

    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ success: false, message: 'Search failed' });
    }
});

// Get user by ID (public profile)
router.get('/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);

        const { data: user, error } = await supabase
            .from('users')
            .select(`
                id, first_name, middle_name, last_name, gender,
                current_address, occupation_type, is_approved,
                phone, email,
                villages (name)
            `)
            .eq('id', id)
            .eq('is_approved', true)
            .single();

        if (error || !user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Get occupation details
        let occupationDetails = null;
        if (user.occupation_type === 'student') {
            const { data } = await supabase.from('student_details').select('*').eq('user_id', id).single();
            occupationDetails = data;
        } else if (user.occupation_type === 'job') {
            const { data } = await supabase.from('job_details').select('*').eq('user_id', id).single();
            occupationDetails = data;
        } else if (user.occupation_type === 'business') {
            const { data } = await supabase.from('business_details').select('*').eq('user_id', id).single();
            occupationDetails = data;
        }

        const { villages, ...userData } = user;

        // Hide phone and email for female users
        const userResult = { ...userData, village_name: villages?.name || null, occupationDetails };
        if (user.gender && user.gender.toLowerCase() === 'female') {
            delete userResult.phone;
            delete userResult.email;
        }

        res.json({
            success: true,
            user: userResult
        });

    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ success: false, message: 'Failed to get user' });
    }
});

module.exports = router;
