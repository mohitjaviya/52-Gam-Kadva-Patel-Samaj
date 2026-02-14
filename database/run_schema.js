/**
 * Run SQL schema against Supabase
 * Usage: node database/run_schema.js
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function runSchema() {
    const schemaSQL = fs.readFileSync(path.join(__dirname, 'supabase_schema.sql'), 'utf8');

    // Split into individual statements
    const statements = schemaSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`📋 Running ${statements.length} SQL statements...`);

    // Use Supabase's REST endpoint to execute SQL via pg
    // We'll use the /rest/v1/rpc endpoint isn't suitable for DDL,
    // so we use the PostgREST query endpoint with raw SQL via the management API

    // Alternative: Use fetch against the Supabase SQL API
    const projectRef = SUPABASE_URL.replace('https://', '').replace('.supabase.co', '');

    // Run all SQL as one batch
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'apikey': SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
        },
        body: JSON.stringify({})
    });

    // PostgREST doesn't support raw DDL, so let's use the pg module approach
    // Actually, let's just run each statement via the postgres connection
    // The simplest approach: use supabase-js and pg

    // For now, output the SQL for the user to paste into SQL Editor
    console.log('\n⚠️  Supabase REST API does not support DDL (CREATE TABLE) directly.');
    console.log('Please run the schema manually:\n');
    console.log('1. Go to https://supabase.com/dashboard/project/' + projectRef + '/sql/new');
    console.log('2. Paste the contents of database/supabase_schema.sql');
    console.log('3. Click "Run"\n');
    console.log('Or, copying SQL to clipboard for you...\n');

    // Try to copy to clipboard on Windows
    try {
        const { execSync } = require('child_process');
        execSync('clip', { input: schemaSQL });
        console.log('✅ Schema SQL copied to clipboard! Paste it into Supabase SQL Editor.');
    } catch (e) {
        console.log('Could not copy to clipboard. Please copy manually from database/supabase_schema.sql');
    }
}

runSchema().catch(console.error);
