require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const moderatorsToPromote = [
    'Mohit Sanjaybhai Javiya',
    'Bhargesh Ketanbhai Vamja',
    'Bhargav Ketanbhai Vamja',
    'Shivam Dineshbhai Javiya'
];

async function assignModerators() {
    console.log('Searching for target users to promote to Moderator...');
    let successCount = 0;

    for (const fullName of moderatorsToPromote) {
        const parts = fullName.split(' ');
        const firstName = parts[0];
        const lastNames = parts.slice(1).join(' '); // Middle + Last, or just simple match
        
        // We will do a generic ilike search on first_name and last_name/middle_name combinations
        // since we don't know exactly how they entered it (e.g. middle name could be separate)
        const { data: users, error } = await supabase
            .from('users')
            .select('id, first_name, middle_name, last_name')
            .ilike('first_name', `%${firstName}%`);
            
        if (error) {
            console.error(`Error querying for ${fullName}:`, error.message);
            continue;
        }
        
        // Find the best match
        let foundUser = null;
        for (const user of users) {
             const reconstructedName = `${user.first_name || ''} ${user.middle_name || ''} ${user.last_name || ''}`.trim().toLowerCase().replace(/\s+/g, ' ');
             if (reconstructedName.includes(firstName.toLowerCase()) && 
                 (reconstructedName.includes('vamja') || reconstructedName.includes('javiya') || reconstructedName.includes(parts[parts.length - 1].toLowerCase()))) {
                 foundUser = user;
                 break;
             }
        }

        if (foundUser) {
            console.log(`Found match for ${fullName} -> ID: ${foundUser.id}`);
            const { error: updateError } = await supabase
                .from('users')
                .update({ is_moderator: true })
                .eq('id', foundUser.id);
                
            if (updateError) {
                console.error(`Failed to assign moderator to ${fullName}:`, updateError.message);
            } else {
                console.log(`✅ Successfully promoted ${fullName} to Moderator!`);
                successCount++;
            }
        } else {
            console.warn(`⚠️  User "${fullName}" not found. Ensure they have registered with this exact spelling.`);
        }
    }
    
    console.log(`\nFinished! Promoted ${successCount} out of ${moderatorsToPromote.length} specified users.`);
    process.exit(0);
}

assignModerators();
