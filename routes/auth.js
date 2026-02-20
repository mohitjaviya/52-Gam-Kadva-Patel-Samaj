const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { supabase } = require('../database/init');

// Helper: Store OTP
async function storeOTP(userId, phone, email, otp, type) {
    // Delete old OTPs for this user/type
    if (userId) {
        await supabase
            .from('otp_verifications')
            .delete()
            .eq('user_id', userId)
            .eq('type', type);
    }

    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    const { error } = await supabase
        .from('otp_verifications')
        .insert({
            user_id: userId,
            phone: phone,
            email: email,
            otp: otp,
            type: type,
            expires_at: expiresAt,
            is_used: false
        });

    if (error) {
        console.error('OTP store error:', error.message);
        throw error;
    }
}

// Helper: Verify OTP
async function verifyOTP(userId, otp, type) {
    const { data, error } = await supabase
        .from('otp_verifications')
        .select('*')
        .eq('user_id', userId)
        .eq('type', type)
        .eq('is_used', false)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    if (error || !data) return false;

    // Check expiry
    if (new Date(data.expires_at) < new Date()) return false;

    // Check OTP match
    if (data.otp !== otp) return false;

    // Mark as used
    await supabase
        .from('otp_verifications')
        .update({ is_used: true })
        .eq('id', data.id);

    return true;
}

// SIGNUP
router.post('/signup', async (req, res) => {
    try {
        const { phone, email, password } = req.body;

        if (!phone || !email || !password) {
            return res.status(400).json({ success: false, message: 'Phone, email, and password are required.' });
        }

        // Check if user already exists
        const { data: existingUser } = await supabase
            .from('users')
            .select('id, phone_verified, email_verified, registration_completed')
            .or(`email.eq.${email},phone.eq.${phone}`)
            .single();

        if (existingUser) {
            if (existingUser.registration_completed) {
                return res.status(400).json({ success: false, message: 'An account with this email or phone already exists. Please login.' });
            }
            // Update existing incomplete registration
            const hashedPassword = await bcrypt.hash(password, 10);
            await supabase
                .from('users')
                .update({ phone, email, password: hashedPassword })
                .eq('id', existingUser.id);

            // Generate and store OTP
            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            await storeOTP(existingUser.id, phone, email, otp, 'email');

            // Send OTP via email (non-blocking to avoid timeout)
            const emailService = require('../services/emailService');
            emailService.sendOTPEmail(email, otp).catch(err => console.error('Email send error:', err));

            return res.json({
                success: true,
                message: 'OTP sent to your email for verification.',
                userId: existingUser.id,
                requiresVerification: true
            });
        }

        // Create new user
        const hashedPassword = await bcrypt.hash(password, 10);
        const { data: newUser, error: insertError } = await supabase
            .from('users')
            .insert({
                phone,
                email,
                password: hashedPassword,
                phone_verified: false,
                email_verified: false,
                registration_completed: false,
                is_approved: false,
                is_admin: false,
                can_view_sensitive: false
            })
            .select('id')
            .single();

        if (insertError) {
            console.error('Signup insert error:', insertError);
            if (insertError.code === '23505') {
                return res.status(400).json({ success: false, message: 'An account with this email or phone already exists.' });
            }
            return res.status(500).json({ success: false, message: 'Registration failed. Please try again.' });
        }

        // Generate OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        await storeOTP(newUser.id, phone, email, otp, 'email');

        // Send OTP (non-blocking to avoid timeout)
        const emailService2 = require('../services/emailService');
        emailService2.sendOTPEmail(email, otp).catch(err => console.error('Email send error:', err));

        res.json({
            success: true,
            message: 'Account created! OTP sent to your email.',
            userId: newUser.id,
            requiresVerification: true
        });
    } catch (err) {
        console.error('Signup error:', err);
        res.status(500).json({ success: false, message: 'Server error during signup.' });
    }
});

// VERIFY OTP
router.post('/verify-otp', async (req, res) => {
    try {
        let { userId, contact, otp, type } = req.body;

        // If contact was sent instead of userId, look up the user
        if (!userId && contact) {
            const { data: foundUser } = await supabase
                .from('users')
                .select('id')
                .or(`email.eq.${contact},phone.eq.${contact}`)
                .single();
            if (foundUser) userId = foundUser.id;
        }

        if (!userId || !otp) {
            return res.status(400).json({ success: false, message: 'User ID and OTP are required.' });
        }

        const otpType = type || 'email';
        const isValid = await verifyOTP(userId, otp, otpType);

        if (!isValid) {
            return res.status(400).json({ success: false, message: 'Invalid or expired OTP.' });
        }

        // Update user verification status
        const updateField = otpType === 'phone' ? 'phone_verified' : 'email_verified';
        await supabase
            .from('users')
            .update({ [updateField]: true })
            .eq('id', userId);

        res.json({ success: true, message: 'OTP verified successfully!' });
    } catch (err) {
        console.error('OTP verification error:', err);
        res.status(500).json({ success: false, message: 'Server error during OTP verification.' });
    }
});

// LOGIN
router.post('/login', async (req, res) => {
    try {
        const emailOrPhone = req.body.emailOrPhone || req.body.email || req.body.phone;
        const { password } = req.body;

        if (!emailOrPhone || !password) {
            return res.status(400).json({ success: false, message: 'Email/Phone and password are required.' });
        }

        // Find user
        const { data: user, error } = await supabase
            .from('users')
            .select('id, email, phone, password, is_admin, registration_completed, is_approved, first_name, email_verified, phone_verified')
            .or(`email.eq.${emailOrPhone},phone.eq.${emailOrPhone}`)
            .single();

        if (error || !user) {
            return res.status(401).json({ success: false, message: 'Invalid credentials.' });
        }

        // Check password
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials.' });
        }

        // OTP verification required for login
        // Generate and send OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        await storeOTP(user.id, user.phone, user.email, otp, 'email');

        // Log OTP to console (since nodemailer is not configured)
        console.log(`\n🔑 OTP for ${user.email}: ${otp}\n`);

        // Send email (non-blocking to avoid timeout)
        const emailService = require('../services/emailService');
        emailService.sendOTPEmail(user.email, otp).catch(err => console.log('⚠️  Email not sent:', err.message));

        return res.json({
            success: true,
            requiresVerification: true,
            userId: user.id,
            email: user.email,
            message: 'OTP sent. Check your email or server console.'
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ success: false, message: 'Server error during login.' });
    }
});

// LOGIN AFTER VERIFY
router.post('/login-after-verify', async (req, res) => {
    try {
        const { userId, email, phone } = req.body;
        const identifier = userId || email || phone;

        if (!identifier) {
            return res.status(400).json({ success: false, message: 'User identifier is required.' });
        }

        let query = supabase
            .from('users')
            .select('id, email, phone, is_admin, registration_completed, is_approved, first_name');

        if (userId) {
            query = query.eq('id', userId);
        } else {
            query = query.or(`email.eq.${identifier},phone.eq.${identifier}`);
        }

        const { data: user, error } = await query.single();

        if (error || !user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        // Set session
        req.session.userId = user.id;
        req.session.isAdmin = user.is_admin;
        req.session.registrationCompleted = user.registration_completed;

        req.session.save((err) => {
            if (err) {
                console.error('Session save error:', err);
                return res.status(500).json({ success: false, message: 'Session error.' });
            }

            console.log('✅ Session saved for user:', user.id, 'registrationCompleted:', user.registration_completed);

            res.json({
                success: true,
                message: 'Login successful!',
                user: {
                    id: user.id,
                    firstName: user.first_name,
                    isAdmin: user.is_admin,
                    registrationCompleted: user.registration_completed,
                    isApproved: user.is_approved
                }
            });
        });
    } catch (err) {
        console.error('Login after verify error:', err);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

// RESEND OTP
router.post('/resend-otp', async (req, res) => {
    try {
        const { userId, type } = req.body;

        if (!userId) {
            return res.status(400).json({ success: false, message: 'User ID is required.' });
        }

        const { data: user, error } = await supabase
            .from('users')
            .select('id, phone, email')
            .eq('id', userId)
            .single();

        if (error || !user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpType = type || 'email';
        await storeOTP(user.id, user.phone, user.email, otp, otpType);

        if (otpType === 'email') {
            try {
                const emailService = require('../services/emailService');
                await emailService.sendOTPEmail(user.email, otp);
            } catch (emailErr) {
                console.error('Email send error:', emailErr);
            }
        } else {
            try {
                const smsService = require('../services/smsService');
                await smsService.sendOTP(user.phone, otp);
            } catch (smsErr) {
                console.error('SMS send error:', smsErr);
            }
        }

        res.json({ success: true, message: `OTP resent to your ${otpType}.` });
    } catch (err) {
        console.error('Resend OTP error:', err);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

// REGISTER (Complete Profile)
router.post('/register', async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ success: false, message: 'Not authenticated.' });
        }

        const userId = req.session.userId;
        const {
            firstName, middleName, lastName, gender, villageId,
            currentAddress, occupationType,
            // Nested occupation detail objects from the form
            studentDetails, jobDetails, businessDetails: bizDetails
        } = req.body;

        // Extract occupation-specific fields from nested objects
        const department = studentDetails?.department;
        const subDepartment = studentDetails?.subDepartment;
        const collegeCity = studentDetails?.collegeCity;
        const collegeName = studentDetails?.collegeName;
        const yearOfStudy = studentDetails?.yearOfStudy;

        const graduationYear = jobDetails?.graduationYear;
        const gradCollegeCity = jobDetails?.collegeCity;
        const gradCollegeName = jobDetails?.collegeName;
        const gradDepartment = jobDetails?.department;
        const gradBranch = jobDetails?.subDepartment;
        const workingCity = jobDetails?.workingCity;
        const companyName = jobDetails?.companyName;
        const designation = jobDetails?.designation;
        const jobField = jobDetails?.field;
        const experienceYears = jobDetails?.experienceYears;

        const businessName = bizDetails?.businessName;
        const businessType = bizDetails?.businessType;
        const businessField = bizDetails?.businessField;
        const businessCity = bizDetails?.businessCity;
        const businessAddress = bizDetails?.businessAddress;
        const yearsInBusiness = bizDetails?.yearsInBusiness;

        // Additional info for all types
        const studentAdditionalInfo = studentDetails?.additionalInfo;
        const jobAdditionalInfo = jobDetails?.additionalInfo;
        const businessAdditionalInfo = bizDetails?.additionalInfo;

        // Validate required fields
        if (!firstName || !lastName || !gender || !villageId || !currentAddress || !occupationType) {
            return res.status(400).json({ success: false, message: 'All required fields must be filled.' });
        }

        // Update user profile
        const { error: updateError } = await supabase
            .from('users')
            .update({
                first_name: firstName,
                middle_name: middleName || '',
                last_name: lastName,
                gender,
                village_id: villageId,
                current_address: currentAddress,
                occupation_type: occupationType,
                registration_completed: true
            })
            .eq('id', userId);

        if (updateError) {
            console.error('Profile update error:', updateError);
            return res.status(500).json({ success: false, message: 'Failed to update profile.' });
        }

        // Insert occupation-specific details
        if (occupationType === 'student') {
            // Delete any existing details
            await supabase.from('student_details').delete().eq('user_id', userId);
            await supabase.from('job_details').delete().eq('user_id', userId);
            await supabase.from('business_details').delete().eq('user_id', userId);

            const { error } = await supabase
                .from('student_details')
                .insert({
                    user_id: userId,
                    department: department || '',
                    sub_department: subDepartment || '',
                    college_city: collegeCity || '',
                    college_name: collegeName || '',
                    year_of_study: yearOfStudy || '',
                    additional_info: studentAdditionalInfo || ''
                });

            if (error) console.error('Student details insert error:', error);
        } else if (occupationType === 'job') {
            await supabase.from('student_details').delete().eq('user_id', userId);
            await supabase.from('job_details').delete().eq('user_id', userId);
            await supabase.from('business_details').delete().eq('user_id', userId);

            const { error } = await supabase
                .from('job_details')
                .insert({
                    user_id: userId,
                    graduation_year: graduationYear || '',
                    college_city: gradCollegeCity || '',
                    college_name: gradCollegeName || '',
                    department: gradDepartment || '',
                    graduation_branch: gradBranch || '',
                    working_city: workingCity || '',
                    company_name: companyName || '',
                    designation: designation || '',
                    field: jobField || '',
                    experience_years: experienceYears || null,
                    additional_info: jobAdditionalInfo || ''
                });

            if (error) console.error('Job details insert error:', error);
        } else if (occupationType === 'business') {
            await supabase.from('student_details').delete().eq('user_id', userId);
            await supabase.from('job_details').delete().eq('user_id', userId);
            await supabase.from('business_details').delete().eq('user_id', userId);

            const { error } = await supabase
                .from('business_details')
                .insert({
                    user_id: userId,
                    business_name: businessName || '',
                    business_type: businessType || '',
                    business_field: businessField || '',
                    business_city: businessCity || '',
                    business_address: businessAddress || '',
                    years_in_business: yearsInBusiness || null,
                    additional_info: businessAdditionalInfo || ''
                });

            if (error) console.error('Business details insert error:', error);
        }

        // Update session
        req.session.registrationCompleted = true;
        req.session.save((err) => {
            if (err) console.error('Session save error:', err);
            res.json({ success: true, message: 'Registration completed successfully!' });
        });
    } catch (err) {
        console.error('Registration error:', err);
        res.status(500).json({ success: false, message: 'Server error during registration.' });
    }
});

// SESSION CHECK
router.get('/session', async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.json({ loggedIn: false });
        }

        const { data: user, error } = await supabase
            .from('users')
            .select(`
                id, first_name, middle_name, last_name, email, phone,
                is_admin, registration_completed, is_approved, can_view_sensitive,
                occupation_type, profile_photo,
                villages (name, taluka, district)
            `)
            .eq('id', req.session.userId)
            .single();

        if (error || !user) {
            req.session.destroy();
            return res.json({ loggedIn: false });
        }

        res.json({
            loggedIn: true,
            user: {
                id: user.id,
                firstName: user.first_name,
                middleName: user.middle_name,
                lastName: user.last_name,
                email: user.email,
                phone: user.phone,
                isAdmin: user.is_admin,
                registrationCompleted: user.registration_completed,
                isApproved: user.is_approved,
                canViewSensitive: user.can_view_sensitive,
                occupationType: user.occupation_type,
                profilePhoto: user.profile_photo,
                village: user.villages ? user.villages.name : null,
                taluka: user.villages ? user.villages.taluka : null,
                district: user.villages ? user.villages.district : null
            }
        });
    } catch (err) {
        console.error('Session check error:', err);
        res.json({ loggedIn: false });
    }
});

// LOGOUT
router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Logout error:', err);
            return res.status(500).json({ success: false, message: 'Logout failed.' });
        }
        res.clearCookie('connect.sid');
        res.json({ success: true, message: 'Logged out successfully.' });
    });
});

// FORGOT PASSWORD - Send OTP
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ success: false, message: 'Email is required.' });
        }

        // Look up user by email
        const { data: user, error } = await supabase
            .from('users')
            .select('id, phone, email')
            .eq('email', email)
            .single();

        if (error || !user) {
            // Don't reveal whether user exists for security
            return res.json({ success: true, message: 'If an account with that email exists, an OTP has been sent.' });
        }

        // Generate OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        await storeOTP(user.id, user.phone, user.email, otp, 'email');

        console.log(`\n🔑 Password Reset OTP for ${user.email}: ${otp}\n`);

        // Send via email
        try {
            const emailService = require('../services/emailService');
            await emailService.sendOTPEmail(user.email, otp);
        } catch (emailErr) {
            console.log('⚠️  Email not sent — use OTP from console above');
        }

        res.json({
            success: true,
            message: 'If an account with that email exists, an OTP has been sent.',
            userId: user.id
        });
    } catch (err) {
        console.error('Forgot password error:', err);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

// RESET PASSWORD - Verify OTP and set new password
router.post('/reset-password', async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;

        if (!email || !otp || !newPassword) {
            return res.status(400).json({ success: false, message: 'Email, OTP, and new password are required.' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
        }

        // Look up user
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('id')
            .eq('email', email)
            .single();

        if (userError || !user) {
            return res.status(400).json({ success: false, message: 'Invalid request.' });
        }

        // Verify OTP
        const otpValid = await verifyOTP(user.id, otp, 'email');
        if (!otpValid) {
            return res.status(400).json({ success: false, message: 'Invalid or expired OTP.' });
        }

        // Hash and update password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const { error: updateError } = await supabase
            .from('users')
            .update({ password: hashedPassword, updated_at: new Date().toISOString() })
            .eq('id', user.id);

        if (updateError) {
            throw updateError;
        }

        res.json({ success: true, message: 'Password reset successfully! You can now login with your new password.' });
    } catch (err) {
        console.error('Reset password error:', err);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

module.exports = router;
