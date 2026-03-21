const fs = require('fs');
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

supabase.from('otp_verifications')
  .select('*')
  .eq('email', 'test1@example.com')
  .order('created_at', { ascending: false })
  .limit(2)
  .then(res => {
    fs.writeFileSync('temp_login_otp.json', JSON.stringify(res.data, null, 2));
    console.log('Saved temp_login_otp.json');
  })
  .catch(err => console.error(err));
