require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
    console.log('Checking messages table...');
    const { data: mData, error: mError } = await supabase.from('messages').select('id').limit(1);
    if (mError) console.error('Messages error:', mError.message);
    else console.log('Messages table OK:', mData);

    console.log('Checking conversation_status table...');
    const { data: cData, error: cError } = await supabase.from('conversation_status').select('*').limit(1);
    if (cError) console.error('Conversation_status error:', cError.message);
    else console.log('Conversation_status table OK:', cData);
}

check();
