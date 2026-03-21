require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { getDb } = require('./database/init'); // Requires local database/init.js loading

async function runMigration() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.error("Missing SUPABASE config in .env");
        process.exit(1);
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Wait slightly for SQLite init to finish properly
    await new Promise(resolve => setTimeout(resolve, 1000));
    const db = getDb();
    if (!db) {
        console.error("Local SQLite database not initialized yet");
        process.exit(1);
    }

    console.log("Reading local messages...");
    const messages = db.prepare('SELECT * FROM messages').all();
    
    console.log("Reading local conversation statuses...");
    const statuses = db.prepare('SELECT * FROM conversation_status').all();

    console.log(`Found ${messages.length} messages and ${statuses.length} statuses to migrate.`);

    if (messages.length > 0) {
        console.log("Uploading messages to Supabase...");
        
        // Supabase bulk insert
        const mappedMessages = messages.map(m => ({
            id: m.id,
            sender_id: m.sender_id,
            receiver_id: m.receiver_id,
            content: m.content,
            is_read: m.is_read === 1,
            created_at: m.created_at
        }));

        // Insert in batches of 500
        for (let i = 0; i < mappedMessages.length; i += 500) {
            const batch = mappedMessages.slice(i, i + 500);
            const { error } = await supabase.from('messages').insert(batch);
            if (error) {
                console.error("Error inserting messages:", error.message);
                return;
            }
        }
        console.log("✅ Messages uploaded.");
    }

    if (statuses.length > 0) {
        console.log("Uploading statuses to Supabase...");
        
        const { error } = await supabase.from('conversation_status').insert(statuses);
        
        if (error) {
            console.error("Error inserting statuses:", error.message);
            return;
        }
        console.log("✅ Statuses uploaded.");
    }

    console.log("Migration completed successfully!");
    process.exit(0);
}

runMigration().catch(err => {
    console.error("Migration failed:", err);
    process.exit(1);
});
