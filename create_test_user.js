require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function createTestUser() {
    const email = 'testuser2@example.com';
    const phone = '9998887776';
    
    // Check if user already exists
    const { data: existing } = await supabase.from('users').select('id').eq('email', email).single();
    if (existing) {
        console.log('User already exists! ID:', existing.id);
        console.log('Email:', email);
        console.log('Password:', 'Test@123');
        return;
    }

    const password = await bcrypt.hash('Test@123', 10);

    const { data, error } = await supabase.from('users').insert({
        first_name: 'Test',
        last_name: 'User 2',
        email: email,
        phone: phone,
        password: password,
        gender: 'Male',
        village_id: 1, // Assuming village 1 exists
        current_address: 'Test City',
        occupation_type: 'business',
        registration_completed: true,
        is_approved: true,
        phone_verified: true,
        email_verified: true,
        can_view_sensitive: true,
        is_admin: false
    }).select('id');

    if (error) {
        console.error('Error creating user:', error.message);
    } else {
        console.log('Test user created successfully! ID:', data[0].id);
        console.log('Email:', email);
        console.log('Password:', 'Test@123');
    }
}

createTestUser();
