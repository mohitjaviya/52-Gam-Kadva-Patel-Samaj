const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

let supabase = null;
if (supabaseUrl && supabaseKey) {
    supabase = createClient(supabaseUrl, supabaseKey);
    console.log('✅ Supabase client initialized');
} else {
    console.warn('⚠️  Supabase credentials not found in .env — Supabase client not initialized');
}

const dbPath = path.join(__dirname, 'community.db');

let db = null;
let SQL = null;
let dbWrapper = null;

// Save database to file
const saveDatabase = () => {
    if (db) {
        const data = db.export();
        const buffer = Buffer.from(data);
        fs.writeFileSync(dbPath, buffer);
    }
};

// Helper functions for SQL.js queries
const getOne = (sql, params = []) => {
    try {
        const stmt = db.prepare(sql);
        if (params.length > 0) stmt.bind(params);
        if (stmt.step()) {
            const row = stmt.getAsObject();
            stmt.free();
            return row;
        }
        stmt.free();
        return null;
    } catch (e) {
        console.error('getOne error:', e.message, sql);
        return null;
    }
};

const getAll = (sql, params = []) => {
    try {
        const stmt = db.prepare(sql);
        if (params.length > 0) stmt.bind(params);
        const results = [];
        while (stmt.step()) {
            results.push(stmt.getAsObject());
        }
        stmt.free();
        return results;
    } catch (e) {
        console.error('getAll error:', e.message, sql);
        return [];
    }
};

// Create a wrapper object that mimics better-sqlite3 API
const createDbWrapper = () => {
    return {
        prepare: (sql) => {
            return {
                run: (...params) => {
                    try {
                        // sql.js needs parameters passed to run() directly
                        const stmt = db.prepare(sql);
                        if (params.length > 0) {
                            stmt.bind(params);
                        }
                        stmt.step();
                        stmt.free();
                        saveDatabase();
                        const lastId = getOne('SELECT last_insert_rowid() as id');
                        return { changes: db.getRowsModified(), lastInsertRowid: lastId?.id };
                    } catch (e) {
                        console.error('run error:', e.message, sql, params);
                        return { changes: 0 };
                    }
                },
                get: (...params) => {
                    return getOne(sql, params);
                },
                all: (...params) => {
                    return getAll(sql, params);
                }
            };
        },
        exec: (sql) => {
            try {
                db.exec(sql);
                saveDatabase();
            } catch (e) {
                console.error('exec error:', e.message, sql);
            }
        },
        pragma: (pragma) => {
            try {
                db.run(`PRAGMA ${pragma}`);
            } catch (e) {
                console.error('pragma error:', e.message);
            }
        },
        transaction: (fn) => {
            return (...args) => {
                db.run('BEGIN TRANSACTION');
                try {
                    fn(...args);
                    db.run('COMMIT');
                    saveDatabase();
                } catch (e) {
                    db.run('ROLLBACK');
                    throw e;
                }
            };
        }
    };
};

// Safe column addition - adds column if it doesn't exist (preserves data)
const addColumnIfNotExists = (table, column, type, defaultValue = null) => {
    try {
        const columns = dbWrapper.prepare(`PRAGMA table_info(${table})`).all();
        const columnExists = columns.some(col => col.name === column);

        if (!columnExists) {
            let sql = `ALTER TABLE ${table} ADD COLUMN ${column} ${type}`;
            if (defaultValue !== null) {
                sql += ` DEFAULT ${defaultValue}`;
            }
            dbWrapper.exec(sql);
            console.log(`✅ Added column '${column}' to table '${table}'`);
        }
    } catch (e) {
        // Table might not exist yet, that's ok
    }
};

// Run migrations - add new columns without deleting data
const runMigrations = () => {
    console.log('Running migrations...');

    // Add graduation_branch to job_details if it doesn't exist
    addColumnIfNotExists('job_details', 'graduation_branch', 'TEXT');

    // Future migrations can be added here
    // addColumnIfNotExists('table_name', 'new_column', 'TEXT');

    console.log('Migrations complete!');
};

// Create tables
const createTables = () => {
    dbWrapper.exec(`
        CREATE TABLE IF NOT EXISTS villages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            taluka TEXT,
            district TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    dbWrapper.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            first_name TEXT,
            middle_name TEXT,
            last_name TEXT,
            gender TEXT,
            village_id INTEGER,
            current_address TEXT,
            phone TEXT NOT NULL UNIQUE,
            email TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            occupation_type TEXT CHECK(occupation_type IN ('student', 'job', 'business')),
            registration_completed INTEGER DEFAULT 0,
            is_approved INTEGER DEFAULT 0,
            is_admin INTEGER DEFAULT 0,
            can_view_sensitive INTEGER DEFAULT 0,
            phone_verified INTEGER DEFAULT 0,
            email_verified INTEGER DEFAULT 0,
            profile_photo TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (village_id) REFERENCES villages(id)
        )
    `);

    dbWrapper.exec(`
        CREATE TABLE IF NOT EXISTS student_details (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL UNIQUE,
            department TEXT NOT NULL,
            sub_department TEXT,
            college_city TEXT NOT NULL,
            college_name TEXT NOT NULL,
            year_of_study TEXT,
            expected_graduation TEXT,
            additional_info TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    `);

    dbWrapper.exec(`
        CREATE TABLE IF NOT EXISTS job_details (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL UNIQUE,
            graduation_year TEXT,
            college_city TEXT,
            college_name TEXT,
            department TEXT,
            graduation_branch TEXT,
            working_city TEXT NOT NULL,
            company_name TEXT NOT NULL,
            designation TEXT,
            field TEXT NOT NULL,
            experience_years INTEGER,
            additional_info TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    `);

    dbWrapper.exec(`
        CREATE TABLE IF NOT EXISTS business_details (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL UNIQUE,
            business_name TEXT NOT NULL,
            business_type TEXT NOT NULL,
            business_field TEXT NOT NULL,
            business_city TEXT NOT NULL,
            business_address TEXT NOT NULL,
            years_in_business INTEGER,
            employees_count INTEGER,
            website TEXT,
            additional_info TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    `);

    dbWrapper.exec(`
        CREATE TABLE IF NOT EXISTS otp_verifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            phone TEXT,
            email TEXT,
            otp TEXT NOT NULL,
            type TEXT NOT NULL CHECK(type IN ('phone', 'email')),
            expires_at DATETIME NOT NULL,
            is_used INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    dbWrapper.exec(`
        CREATE TABLE IF NOT EXISTS cities (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            state TEXT
        )
    `);

    dbWrapper.exec(`
        CREATE TABLE IF NOT EXISTS colleges (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            city_id INTEGER NOT NULL,
            type TEXT,
            FOREIGN KEY (city_id) REFERENCES cities(id),
            UNIQUE(name, city_id)
        )
    `);

    dbWrapper.exec(`
        CREATE TABLE IF NOT EXISTS departments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            category TEXT
        )
    `);

    dbWrapper.exec(`
        CREATE TABLE IF NOT EXISTS sub_departments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            department_id INTEGER NOT NULL,
            FOREIGN KEY (department_id) REFERENCES departments(id),
            UNIQUE(name, department_id)
        )
    `);

    // College courses mapping table
    dbWrapper.exec(`
        CREATE TABLE IF NOT EXISTS college_courses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            college_id INTEGER NOT NULL,
            course_name TEXT NOT NULL,
            FOREIGN KEY (college_id) REFERENCES colleges(id),
            UNIQUE(college_id, course_name)
        )
    `);

    console.log('All tables created successfully!');
};

// Insert sample villages
const insertVillages = () => {
    const count = dbWrapper.prepare('SELECT COUNT(*) as count FROM villages').get();
    if (count && count.count > 0) {
        console.log('Villages already exist, skipping insertion.');
        return;
    }

    const villages = [
        { name: 'અમરેલી (Amreli)', taluka: 'Amreli', district: 'Amreli' },
        { name: 'વરસડા (Varsada)', taluka: 'Amreli', district: 'Amreli' },
        { name: 'હરીપુરા (Haripura)', taluka: 'Amreli', district: 'Amreli' },
        { name: 'શેડુભાર (Shedubhar)', taluka: 'Amreli', district: 'Amreli' },
        { name: 'નાના માચિયાળા (Nana Machiyala)', taluka: 'Amreli', district: 'Amreli' },
        { name: 'મોટા માચિયાળા (Mota Machiyala)', taluka: 'Amreli', district: 'Amreli' },
        { name: 'વેણીવદર (Venivader)', taluka: 'Amreli', district: 'Amreli' },
        { name: 'વરુડી (Varudi)', taluka: 'Amreli', district: 'Amreli' },
        { name: 'સાંગાડેરી (Sangaderi)', taluka: 'Amreli', district: 'Amreli' },
        { name: 'નાના આંકડીયા (Nana Ankadiya)', taluka: 'Amreli', district: 'Amreli' },
        { name: 'લાલાવદર (Lalavader)', taluka: 'Amreli', district: 'Amreli' },
        { name: 'કેરીયાનાગસ (Keriyangas)', taluka: 'Amreli', district: 'Amreli' },
        { name: 'ઈશ્વરીયા (Ishwariya)', taluka: 'Amreli', district: 'Amreli' },
        { name: 'કમીગઢ (Kamigadh)', taluka: 'Amreli', district: 'Amreli' },
        { name: 'બાબરા (Babra)', taluka: 'Babra', district: 'Amreli' },
        { name: 'વલારડી (Valardi)', taluka: 'Babra', district: 'Amreli' },
        { name: 'પીર ખીજડીયા (Pir Khijadiya)', taluka: 'Babra', district: 'Amreli' },
        { name: 'વાલપુર અમર (Valpur Amar)', taluka: 'Babra', district: 'Amreli' },
        { name: 'કુંવરગઢ (Kunvargadh)', taluka: 'Babra', district: 'Amreli' },
        { name: 'નવાણીયા (Navaniya)', taluka: 'Babra', district: 'Amreli' },
        { name: 'ખંભાળા (Khambhala)', taluka: 'Babra', district: 'Amreli' },
        { name: 'ખાખરીયા (Khakhariya)', taluka: 'Babra', district: 'Amreli' },
        { name: 'બરવાળા જામ (Barvala Jam)', taluka: 'Babra', district: 'Amreli' },
        { name: 'ગળકોટડી (Galkotdi)', taluka: 'Babra', district: 'Amreli' },
        { name: 'રાણપરડા (Ranparda)', taluka: 'Babra', district: 'Amreli' },
        { name: 'નડાળા (Nadala)', taluka: 'Babra', district: 'Amreli' },
        { name: 'લોન કોટડા (Lon Kotda)', taluka: 'Babra', district: 'Amreli' },
        { name: 'મોટા દેવળીયા (Mota Devaliya)', taluka: 'Babra', district: 'Amreli' },
        { name: 'ખીજડીયા કોટડા (Khijadiya Kotda)', taluka: 'Babra', district: 'Amreli' },
        { name: 'સારીગપુર (Sarigpur)', taluka: 'Babra', district: 'Amreli' },
        { name: 'લાઠી (Lathi)', taluka: 'Lathi', district: 'Amreli' },
        { name: 'ચાવંડ (Chavand)', taluka: 'Lathi', district: 'Amreli' },
        { name: 'હરસુરપુર દેવળીયા (Harsurpur Devaliya)', taluka: 'Lathi', district: 'Amreli' },
        { name: 'લાઠી કેરીયા (Lathi Keriya)', taluka: 'Lathi', district: 'Amreli' },
        { name: 'કરકોલીયા (Karkoliya)', taluka: 'Lathi', district: 'Amreli' },
        { name: 'ભુરખીયા (Bhurakhiya)', taluka: 'Lathi', district: 'Amreli' },
        { name: 'પ્રતાપગઢ (Pratapgadh)', taluka: 'Lathi', district: 'Amreli' },
        { name: 'મતિરાળા (Matirala)', taluka: 'Lathi', district: 'Amreli' },
        { name: 'લીલીયા (Liliya)', taluka: 'Liliya', district: 'Amreli' },
        { name: 'સલડી (Saladi)', taluka: 'Liliya', district: 'Amreli' },
        { name: 'ઉમિયાનગર (Umiyanagar)', taluka: 'Liliya', district: 'Amreli' },
        { name: 'ખારા (Khara)', taluka: 'Liliya', district: 'Amreli' },
        { name: 'સનાળીયા (Sanaliya)', taluka: 'Liliya', district: 'Amreli' },
        { name: 'રામપુર (Rampur)', taluka: 'Kunkavav', district: 'Amreli' },
        { name: 'સૂર્યપ્રતાપગઢ (Suryapratapgadh)', taluka: 'Kunkavav', district: 'Amreli' },
        { name: 'પીપળીયા (Pipliya)', taluka: 'Kunkavav', district: 'Amreli' },
        { name: 'ખજુરી (Khajuri)', taluka: 'Kunkavav', district: 'Amreli' },
        { name: 'અનીડા (Anida)', taluka: 'Kunkavav', district: 'Amreli' },
        { name: 'તરઘરી (Targhari)', taluka: 'Kunkavav', district: 'Amreli' },
        { name: 'તાલાળી (Talali)', taluka: 'Kunkavav', district: 'Amreli' },
        { name: 'વાવડી રોડ (Vavdi Road)', taluka: 'Kunkavav', district: 'Amreli' },
        { name: 'નવા ઉજળા (Nava Ujla)', taluka: 'Kunkavav', district: 'Amreli' },
        { name: 'નાની કુંકાવાવ (Nani Kunkavav)', taluka: 'Kunkavav', district: 'Amreli' },
        { name: 'લાખાપાદર (Lakhapadar)', taluka: 'Kunkavav', district: 'Amreli' },
        { name: 'અમરનગર (Amarnagar)', taluka: 'Kunkavav', district: 'Amreli' },
        { name: 'વાવ (Vav)', taluka: 'Bhavnagar', district: 'Bhavnagar' },
        { name: 'ચુરકા (Churka)', taluka: 'Bhavnagar', district: 'Bhavnagar' },
        { name: 'ધારૂકા (Dharuka)', taluka: 'Bhavnagar', district: 'Bhavnagar' },
        { name: 'લીંબાળી (Limbali)', taluka: 'Bhavnagar', district: 'Bhavnagar' },
        { name: 'જસદણ (Jasdan)', taluka: 'Jasdan', district: 'Rajkot' },
        { name: 'કાનપર (Kanpar)', taluka: 'Jasdan', district: 'Rajkot' },
        { name: 'આટકોટ (Atkot)', taluka: 'Jasdan', district: 'Rajkot' },
        { name: 'કાળાસર (Kalasar)', taluka: 'Jasdan', district: 'Rajkot' },
        { name: 'માધવીપુર (Madhavipur)', taluka: 'Jasdan', district: 'Rajkot' },
        { name: 'રાણપર (Ranpar)', taluka: 'Jasdan', district: 'Rajkot' },
        { name: 'કમળાપુર (Kamlapur)', taluka: 'Jasdan', district: 'Rajkot' },
        { name: 'સરધાર (Sardhar)', taluka: 'Jasdan', district: 'Rajkot' },
        { name: 'કરમાળકોટડા (Karmalkotda)', taluka: 'Jasdan', district: 'Rajkot' },
        { name: 'ગઢકા (Gadhka)', taluka: 'Jasdan', district: 'Rajkot' },
        { name: 'હરીપર (Haripar)', taluka: 'Jasdan', district: 'Rajkot' },
        { name: 'દેરડી કુંભાજી (Derdi Kumbhaji)', taluka: 'Gondal', district: 'Rajkot' },
        { name: 'મેતા ખંભાળીયા (Meta Khambhaliya)', taluka: 'Gondal', district: 'Rajkot' },
        { name: 'કમર કોટડા (Kamar Kotda)', taluka: 'Gondal', district: 'Rajkot' },
        { name: 'વિંજીવડ (Vinjivad)', taluka: 'Gondal', district: 'Rajkot' },
        { name: 'પ્રેમગઢ (Premgadh)', taluka: 'Gondal', district: 'Rajkot' },
        { name: 'સરધારપુર (Sardharpur)', taluka: 'Junagadh', district: 'Junagadh' },
        { name: 'રફાળીયા (Rafaliya)', taluka: 'Junagadh', district: 'Junagadh' },
        { name: 'કાલસરી (Kalsari)', taluka: 'Junagadh', district: 'Junagadh' }
    ];

    const stmt = dbWrapper.prepare('INSERT OR IGNORE INTO villages (name, taluka, district) VALUES (?, ?, ?)');
    for (const village of villages) {
        stmt.run(village.name, village.taluka, village.district);
    }
    console.log('Villages inserted successfully!');
};

// Insert sample cities
const insertCities = () => {
    const cities = [
        // Gujarat - All 33 District Headquarters + Major Cities
        { name: 'Ahmedabad', state: 'Gujarat' },
        { name: 'Amreli', state: 'Gujarat' },
        { name: 'Anand', state: 'Gujarat' },
        { name: 'Aravalli (Modasa)', state: 'Gujarat' },
        { name: 'Banaskantha (Palanpur)', state: 'Gujarat' },
        { name: 'Bharuch', state: 'Gujarat' },
        { name: 'Bhavnagar', state: 'Gujarat' },
        { name: 'Botad', state: 'Gujarat' },
        { name: 'Chhota Udepur', state: 'Gujarat' },
        { name: 'Dahod', state: 'Gujarat' },
        { name: 'Dang (Ahwa)', state: 'Gujarat' },
        { name: 'Devbhoomi Dwarka (Khambhalia)', state: 'Gujarat' },
        { name: 'Gandhinagar', state: 'Gujarat' },
        { name: 'Gir Somnath (Veraval)', state: 'Gujarat' },
        { name: 'Jamnagar', state: 'Gujarat' },
        { name: 'Junagadh', state: 'Gujarat' },
        { name: 'Kheda (Nadiad)', state: 'Gujarat' },
        { name: 'Kutch (Bhuj)', state: 'Gujarat' },
        { name: 'Mahisagar (Lunawada)', state: 'Gujarat' },
        { name: 'Mehsana', state: 'Gujarat' },
        { name: 'Morbi', state: 'Gujarat' },
        { name: 'Narmada (Rajpipla)', state: 'Gujarat' },
        { name: 'Navsari', state: 'Gujarat' },
        { name: 'Panchmahal (Godhra)', state: 'Gujarat' },
        { name: 'Patan', state: 'Gujarat' },
        { name: 'Porbandar', state: 'Gujarat' },
        { name: 'Rajkot', state: 'Gujarat' },
        { name: 'Sabarkantha (Himmatnagar)', state: 'Gujarat' },
        { name: 'Surat', state: 'Gujarat' },
        { name: 'Surendranagar', state: 'Gujarat' },
        { name: 'Tapi (Vyara)', state: 'Gujarat' },
        { name: 'Vadodara', state: 'Gujarat' },
        { name: 'Valsad', state: 'Gujarat' },
        // Gujarat - Other Major Cities/Towns
        { name: 'Gondal', state: 'Gujarat' },
        { name: 'Jetpur', state: 'Gujarat' },
        { name: 'Gandhidham', state: 'Gujarat' },
        { name: 'Mundra', state: 'Gujarat' },
        { name: 'Dhoraji', state: 'Gujarat' },
        { name: 'Upleta', state: 'Gujarat' },
        { name: 'Jasdan', state: 'Gujarat' },
        { name: 'Wankaner', state: 'Gujarat' },
        { name: 'Tankara', state: 'Gujarat' },
        { name: 'Dhrangadhra', state: 'Gujarat' },
        { name: 'Viramgam', state: 'Gujarat' },
        { name: 'Sanand', state: 'Gujarat' },
        { name: 'Dholka', state: 'Gujarat' },
        { name: 'Kalol', state: 'Gujarat' },
        { name: 'Kadi', state: 'Gujarat' },
        { name: 'Unjha', state: 'Gujarat' },
        { name: 'Visnagar', state: 'Gujarat' },
        { name: 'Deesa', state: 'Gujarat' },
        { name: 'Dhanera', state: 'Gujarat' },
        { name: 'Idar', state: 'Gujarat' },
        { name: 'Shamlaji', state: 'Gujarat' },
        { name: 'Petlad', state: 'Gujarat' },
        { name: 'Borsad', state: 'Gujarat' },
        { name: 'Khambhat (Cambay)', state: 'Gujarat' },
        { name: 'Umreth', state: 'Gujarat' },
        { name: 'Tarapur', state: 'Gujarat' },
        { name: 'Kapadvanj', state: 'Gujarat' },
        { name: 'Thasra', state: 'Gujarat' },
        { name: 'Mahuva', state: 'Gujarat' },
        { name: 'Palitana', state: 'Gujarat' },
        { name: 'Sihor', state: 'Gujarat' },
        { name: 'Talaja', state: 'Gujarat' },
        { name: 'Gariadhar', state: 'Gujarat' },
        { name: 'Vallabhipur', state: 'Gujarat' },
        { name: 'Una', state: 'Gujarat' },
        { name: 'Kodinar', state: 'Gujarat' },
        { name: 'Sutrapada', state: 'Gujarat' },
        { name: 'Mangrol', state: 'Gujarat' },
        { name: 'Keshod', state: 'Gujarat' },
        { name: 'Visavadar', state: 'Gujarat' },
        { name: 'Manavadar', state: 'Gujarat' },
        { name: 'Vanthali', state: 'Gujarat' },
        { name: 'Rajula', state: 'Gujarat' },
        { name: 'Savarkundla', state: 'Gujarat' },
        { name: 'Babra', state: 'Gujarat' },
        { name: 'Jafrabad', state: 'Gujarat' },
        { name: 'Lathi', state: 'Gujarat' },
        { name: 'Damnagar', state: 'Gujarat' },
        { name: 'Dwarka', state: 'Gujarat' },
        { name: 'Okha', state: 'Gujarat' },
        { name: 'Bhanvad', state: 'Gujarat' },
        { name: 'Lalpur', state: 'Gujarat' },
        { name: 'Kalavad', state: 'Gujarat' },
        { name: 'Dhrol', state: 'Gujarat' },
        { name: 'Jodia', state: 'Gujarat' },
        { name: 'Anjar', state: 'Gujarat' },
        { name: 'Adipur', state: 'Gujarat' },
        { name: 'Mandvi', state: 'Gujarat' },
        { name: 'Nakhatrana', state: 'Gujarat' },
        { name: 'Rapar', state: 'Gujarat' },
        { name: 'Halvad', state: 'Gujarat' },
        { name: 'Limbdi', state: 'Gujarat' },
        { name: 'Chotila', state: 'Gujarat' },
        { name: 'Muli', state: 'Gujarat' },
        { name: 'Sayla', state: 'Gujarat' },
        { name: 'Wadhwan', state: 'Gujarat' },
        { name: 'Bardoli', state: 'Gujarat' },
        { name: 'Kamrej', state: 'Gujarat' },
        { name: 'Mandvi (Surat)', state: 'Gujarat' },
        { name: 'Olpad', state: 'Gujarat' },
        { name: 'Palsana', state: 'Gujarat' },
        { name: 'Songadh', state: 'Gujarat' },
        { name: 'Mahuva (Surat)', state: 'Gujarat' },
        { name: 'Mangrol (Surat)', state: 'Gujarat' },
        { name: 'Valod', state: 'Gujarat' },
        { name: 'Nizar', state: 'Gujarat' },
        { name: 'Fort Songadh', state: 'Gujarat' },
        { name: 'Uchchhal', state: 'Gujarat' },
        { name: 'Ankleshwar', state: 'Gujarat' },
        { name: 'Jambusar', state: 'Gujarat' },
        { name: 'Amod', state: 'Gujarat' },
        { name: 'Vagra', state: 'Gujarat' },
        { name: 'Hansot', state: 'Gujarat' },
        { name: 'Savli', state: 'Gujarat' },
        { name: 'Padra', state: 'Gujarat' },
        { name: 'Dabhoi', state: 'Gujarat' },
        { name: 'Karjan', state: 'Gujarat' },
        { name: 'Shinor', state: 'Gujarat' },
        { name: 'Sankheda', state: 'Gujarat' },
        { name: 'Bodeli', state: 'Gujarat' },
        { name: 'Naswadi', state: 'Gujarat' },
        { name: 'Kawant', state: 'Gujarat' },
        { name: 'Limkheda', state: 'Gujarat' },
        { name: 'Fatepura', state: 'Gujarat' },
        { name: 'Garbada', state: 'Gujarat' },
        { name: 'Jhalod', state: 'Gujarat' },
        { name: 'Devgad Baria', state: 'Gujarat' },
        { name: 'Santrampur', state: 'Gujarat' },
        { name: 'Kadana', state: 'Gujarat' },
        { name: 'Khanpur', state: 'Gujarat' },
        { name: 'Balasinor', state: 'Gujarat' },
        { name: 'Virpur', state: 'Gujarat' },
        { name: 'Halol', state: 'Gujarat' },
        { name: 'Kalol (Panchmahal)', state: 'Gujarat' },
        { name: 'Jambughoda', state: 'Gujarat' },
        { name: 'Morva Hadaf', state: 'Gujarat' },
        { name: 'Shehera', state: 'Gujarat' },
        { name: 'Bilimora', state: 'Gujarat' },
        { name: 'Chikhli', state: 'Gujarat' },
        { name: 'Gandevi', state: 'Gujarat' },
        { name: 'Jalalpore', state: 'Gujarat' },
        { name: 'Dungri', state: 'Gujarat' },
        { name: 'Vansda', state: 'Gujarat' },
        { name: 'Dharampur', state: 'Gujarat' },
        { name: 'Kaprada', state: 'Gujarat' },
        { name: 'Pardi', state: 'Gujarat' },
        { name: 'Umbergaon', state: 'Gujarat' },
        { name: 'Sarigam', state: 'Gujarat' },
        { name: 'Vapi', state: 'Gujarat' },
        { name: 'Daman', state: 'Gujarat' },
        { name: 'Silvassa', state: 'Gujarat' },
        // Maharashtra
        { name: 'Mumbai', state: 'Maharashtra' },
        { name: 'Pune', state: 'Maharashtra' },
        { name: 'Nagpur', state: 'Maharashtra' },
        { name: 'Nashik', state: 'Maharashtra' },
        { name: 'Aurangabad', state: 'Maharashtra' },
        { name: 'Bangalore', state: 'Karnataka' },
        { name: 'Mysore', state: 'Karnataka' },
        { name: 'Mangalore', state: 'Karnataka' },
        { name: 'Delhi', state: 'Delhi' },
        { name: 'Noida', state: 'Uttar Pradesh' },
        { name: 'Gurgaon', state: 'Haryana' },
        { name: 'Faridabad', state: 'Haryana' },
        { name: 'Ghaziabad', state: 'Uttar Pradesh' },
        { name: 'Chennai', state: 'Tamil Nadu' },
        { name: 'Coimbatore', state: 'Tamil Nadu' },
        { name: 'Madurai', state: 'Tamil Nadu' },
        { name: 'Hyderabad', state: 'Telangana' },
        { name: 'Visakhapatnam', state: 'Andhra Pradesh' },
        { name: 'Vijayawada', state: 'Andhra Pradesh' },
        { name: 'Jaipur', state: 'Rajasthan' },
        { name: 'Jodhpur', state: 'Rajasthan' },
        { name: 'Udaipur', state: 'Rajasthan' },
        { name: 'Kota', state: 'Rajasthan' },
        { name: 'Indore', state: 'Madhya Pradesh' },
        { name: 'Bhopal', state: 'Madhya Pradesh' },
        { name: 'Gwalior', state: 'Madhya Pradesh' },
        { name: 'Kolkata', state: 'West Bengal' },
        { name: 'Kochi', state: 'Kerala' },
        { name: 'Thiruvananthapuram', state: 'Kerala' },
        { name: 'Chandigarh', state: 'Punjab' },
        { name: 'Ludhiana', state: 'Punjab' },
        { name: 'Amritsar', state: 'Punjab' },
        { name: 'Lucknow', state: 'Uttar Pradesh' },
        { name: 'Kanpur', state: 'Uttar Pradesh' },
        { name: 'Varanasi', state: 'Uttar Pradesh' },
        { name: 'Allahabad', state: 'Uttar Pradesh' },
        { name: 'Patna', state: 'Bihar' },
        { name: 'Bhubaneswar', state: 'Odisha' },
        { name: 'Ranchi', state: 'Jharkhand' },
        { name: 'Guwahati', state: 'Assam' },
        { name: 'Dehradun', state: 'Uttarakhand' },
        { name: 'Shimla', state: 'Himachal Pradesh' },
        { name: 'Panaji', state: 'Goa' }
    ];

    const stmt = dbWrapper.prepare('INSERT OR IGNORE INTO cities (name, state) VALUES (?, ?)');
    for (const city of cities) {
        stmt.run(city.name, city.state);
    }
    console.log('Cities inserted successfully!');
};

// Insert sample colleges with course mappings
const insertColleges = () => {
    // Comprehensive college data with courses offered
    const collegesWithCourses = [
        // Ahmedabad Colleges
        { name: 'Nirma University', city: 'Ahmedabad', courses: ['B.Tech', 'M.Tech', 'MBA', 'B.Pharm', 'LLB', 'B.Com', 'BBA', 'B.Sc', 'MCA', 'BCA'] },
        { name: 'Gujarat University', city: 'Ahmedabad', courses: ['BA', 'MA', 'B.Com', 'M.Com', 'B.Sc', 'M.Sc', 'BBA', 'MBA', 'LLB', 'B.Ed'] },
        { name: 'LD College of Engineering', city: 'Ahmedabad', courses: ['B.Tech', 'M.Tech', 'Diploma'] },
        { name: 'CEPT University', city: 'Ahmedabad', courses: ['B.Arch', 'M.Arch', 'MBA'] },
        { name: 'GLS University', city: 'Ahmedabad', courses: ['BBA', 'MBA', 'BCA', 'MCA', 'B.Com', 'M.Com', 'BA', 'LLB'] },
        { name: 'B.J. Medical College', city: 'Ahmedabad', courses: ['MBBS', 'MD', 'MS'] },
        { name: 'Adani University', city: 'Ahmedabad', courses: ['B.Tech', 'M.Tech', 'MBA', 'BBA'] },
        { name: 'Ahmedabad University', city: 'Ahmedabad', courses: ['B.Tech', 'MBA', 'BA', 'B.Sc', 'BBA', 'MCA'] },
        { name: 'Pandit Deendayal Energy University (PDEU)', city: 'Ahmedabad', courses: ['B.Tech', 'M.Tech', 'MBA'] },
        { name: 'Silver Oak University', city: 'Ahmedabad', courses: ['B.Tech', 'M.Tech', 'Diploma', 'BCA', 'MCA', 'B.Pharm'] },
        { name: 'GMERS Medical College', city: 'Ahmedabad', courses: ['MBBS', 'MD', 'MS'] },
        { name: 'Government Dental College', city: 'Ahmedabad', courses: ['BDS', 'MDS'] },
        { name: 'IIT Gandhinagar', city: 'Ahmedabad', courses: ['B.Tech', 'M.Tech', 'PhD'] },
        { name: 'DAIICT', city: 'Ahmedabad', courses: ['B.Tech', 'M.Tech', 'MCA', 'PhD'] },
        { name: 'L.J. University', city: 'Ahmedabad', courses: ['B.Tech', 'MBA', 'B.Pharm', 'BCA', 'Diploma'] },
        { name: 'Indus University', city: 'Ahmedabad', courses: ['B.Tech', 'MBA', 'B.Arch', 'Diploma', 'B.Pharm'] },
        { name: 'Gujarat Law Society', city: 'Ahmedabad', courses: ['LLB', 'LLM'] },
        { name: 'H.L. College of Commerce', city: 'Ahmedabad', courses: ['B.Com', 'M.Com', 'BBA'] },
        { name: 'St. Xavier\'s College', city: 'Ahmedabad', courses: ['BA', 'B.Sc', 'B.Com', 'BCA'] },
        { name: 'Gujarat Vidyapith', city: 'Ahmedabad', courses: ['BA', 'MA', 'B.Ed', 'B.Sc'] },

        // Vadodara Colleges
        { name: 'MS University (MSU)', city: 'Vadodara', courses: ['B.Tech', 'M.Tech', 'MBA', 'BA', 'MA', 'B.Sc', 'M.Sc', 'B.Com', 'M.Com', 'BCA', 'MCA', 'LLB', 'B.Ed', 'B.Pharm'] },
        { name: 'Parul University', city: 'Vadodara', courses: ['B.Tech', 'M.Tech', 'MBBS', 'BDS', 'B.Pharm', 'MBA', 'BBA', 'BCA', 'MCA', 'Diploma', 'B.Arch', 'LLB'] },
        { name: 'Medical College Baroda', city: 'Vadodara', courses: ['MBBS', 'MD', 'MS'] },
        { name: 'Government Polytechnic Vadodara', city: 'Vadodara', courses: ['Diploma'] },
        { name: 'ITM Universe', city: 'Vadodara', courses: ['B.Tech', 'MBA', 'BBA', 'BCA'] },
        { name: 'Navrachana University', city: 'Vadodara', courses: ['B.Tech', 'B.Arch', 'BBA', 'B.Sc'] },

        // Surat Colleges
        { name: 'SVNIT', city: 'Surat', courses: ['B.Tech', 'M.Tech', 'PhD'] },
        { name: 'VNSGU', city: 'Surat', courses: ['BA', 'MA', 'B.Com', 'M.Com', 'B.Sc', 'M.Sc', 'BBA', 'MBA', 'BCA', 'MCA', 'LLB', 'B.Ed'] },
        { name: 'Government Medical College Surat', city: 'Surat', courses: ['MBBS', 'MD', 'MS'] },
        { name: 'SCET', city: 'Surat', courses: ['B.Tech', 'M.Tech', 'Diploma'] },
        { name: 'UKA Tarsadia University', city: 'Surat', courses: ['B.Tech', 'MBA', 'B.Pharm', 'BCA', 'Diploma'] },

        // Rajkot Colleges
        { name: 'Saurashtra University', city: 'Rajkot', courses: ['BA', 'MA', 'B.Com', 'M.Com', 'B.Sc', 'M.Sc', 'BBA', 'MBA', 'BCA', 'MCA', 'LLB', 'B.Ed'] },
        { name: 'RK University', city: 'Rajkot', courses: ['B.Tech', 'M.Tech', 'MBA', 'BBA', 'BCA', 'B.Pharm', 'Diploma'] },
        { name: 'Marwadi University', city: 'Rajkot', courses: ['B.Tech', 'M.Tech', 'MBA', 'BBA', 'BCA', 'MCA', 'Diploma'] },
        { name: 'PDU Medical College', city: 'Rajkot', courses: ['MBBS', 'MD', 'MS'] },
        { name: 'Government Engineering College Rajkot', city: 'Rajkot', courses: ['B.Tech', 'M.Tech', 'Diploma'] },
        { name: 'ATMIYA University', city: 'Rajkot', courses: ['B.Tech', 'MBA', 'BCA', 'B.Com', 'B.Sc'] },

        // Bhavnagar Colleges
        { name: 'Bhavnagar University', city: 'Bhavnagar', courses: ['BA', 'MA', 'B.Com', 'M.Com', 'B.Sc', 'M.Sc', 'BBA', 'MBA', 'BCA', 'MCA', 'LLB', 'B.Ed'] },
        { name: 'Sir PP Science Institute', city: 'Bhavnagar', courses: ['B.Sc', 'M.Sc'] },
        { name: 'Government Medical College Bhavnagar', city: 'Bhavnagar', courses: ['MBBS', 'MD', 'MS'] },
        { name: 'Government Engineering College Bhavnagar', city: 'Bhavnagar', courses: ['B.Tech', 'Diploma'] },

        // Gandhinagar Colleges
        { name: 'GIFT University', city: 'Gandhinagar', courses: ['MBA', 'B.Tech'] },
        { name: 'Raksha Shakti University', city: 'Gandhinagar', courses: ['BA', 'MA', 'LLB'] },
        { name: 'Children\'s University', city: 'Gandhinagar', courses: ['B.Ed', 'BA'] },

        // Mumbai Colleges
        { name: 'IIT Bombay', city: 'Mumbai', courses: ['B.Tech', 'M.Tech', 'PhD'] },
        { name: 'Mumbai University', city: 'Mumbai', courses: ['BA', 'MA', 'B.Com', 'M.Com', 'B.Sc', 'M.Sc', 'BBA', 'MBA', 'BCA', 'MCA', 'LLB', 'B.Ed'] },
        { name: 'VJTI', city: 'Mumbai', courses: ['B.Tech', 'M.Tech', 'Diploma'] },
        { name: 'SPJIMR', city: 'Mumbai', courses: ['MBA'] },
        { name: 'NMIMS University', city: 'Mumbai', courses: ['MBA', 'B.Tech', 'B.Pharm', 'BBA', 'B.Com'] },
        { name: 'Tata Institute of Social Sciences (TISS)', city: 'Mumbai', courses: ['MA', 'MBA', 'PhD'] },
        { name: 'St. Xavier\'s College Mumbai', city: 'Mumbai', courses: ['BA', 'B.Sc', 'B.Com', 'BMS'] },
        { name: 'KJ Somaiya College', city: 'Mumbai', courses: ['B.Tech', 'MBA', 'BCA', 'B.Com'] },
        { name: 'DJ Sanghvi College of Engineering', city: 'Mumbai', courses: ['B.Tech', 'M.Tech'] },

        // Pune Colleges
        { name: 'Pune University (SPPU)', city: 'Pune', courses: ['BA', 'MA', 'B.Com', 'M.Com', 'B.Sc', 'M.Sc', 'BBA', 'MBA', 'BCA', 'MCA', 'LLB', 'B.Ed', 'B.Tech'] },
        { name: 'COEP', city: 'Pune', courses: ['B.Tech', 'M.Tech'] },
        { name: 'Symbiosis University', city: 'Pune', courses: ['MBA', 'BBA', 'BA', 'B.Sc', 'LLB', 'B.Tech'] },
        { name: 'MIT Pune', city: 'Pune', courses: ['B.Tech', 'M.Tech', 'MBA', 'Diploma'] },
        { name: 'VIT Pune', city: 'Pune', courses: ['B.Tech', 'M.Tech', 'MCA'] },
        { name: 'Fergusson College', city: 'Pune', courses: ['BA', 'B.Sc', 'B.Com'] },

        // Bangalore Colleges
        { name: 'IISc Bangalore', city: 'Bangalore', courses: ['B.Sc', 'M.Sc', 'PhD', 'M.Tech'] },
        { name: 'Christ University', city: 'Bangalore', courses: ['BA', 'B.Com', 'BBA', 'MBA', 'B.Sc', 'BCA', 'MCA', 'LLB'] },
        { name: 'PES University', city: 'Bangalore', courses: ['B.Tech', 'M.Tech', 'MBA', 'MCA'] },
        { name: 'RV College of Engineering', city: 'Bangalore', courses: ['B.Tech', 'M.Tech'] },
        { name: 'BMS College of Engineering', city: 'Bangalore', courses: ['B.Tech', 'M.Tech', 'MBA'] },
        { name: 'Bangalore University', city: 'Bangalore', courses: ['BA', 'MA', 'B.Com', 'M.Com', 'B.Sc', 'M.Sc', 'BBA', 'MBA', 'LLB', 'B.Ed'] },
        { name: 'MSRIT', city: 'Bangalore', courses: ['B.Tech', 'M.Tech', 'MBA'] },
        { name: 'Jain University', city: 'Bangalore', courses: ['B.Tech', 'MBA', 'BBA', 'B.Com', 'BA'] },

        // Delhi Colleges
        { name: 'IIT Delhi', city: 'Delhi', courses: ['B.Tech', 'M.Tech', 'PhD', 'MBA'] },
        { name: 'Delhi University', city: 'Delhi', courses: ['BA', 'MA', 'B.Com', 'M.Com', 'B.Sc', 'M.Sc', 'BBA', 'MBA', 'LLB', 'B.Ed'] },
        { name: 'JNU', city: 'Delhi', courses: ['BA', 'MA', 'M.Sc', 'PhD'] },
        { name: 'AIIMS Delhi', city: 'Delhi', courses: ['MBBS', 'MD', 'MS', 'PhD'] },
        { name: 'DTU', city: 'Delhi', courses: ['B.Tech', 'M.Tech', 'MBA'] },
        { name: 'NSIT', city: 'Delhi', courses: ['B.Tech', 'M.Tech'] },
        { name: 'IP University', city: 'Delhi', courses: ['B.Tech', 'MBA', 'BBA', 'BCA', 'LLB', 'B.Ed'] },
        { name: 'Jamia Millia Islamia', city: 'Delhi', courses: ['B.Tech', 'BA', 'B.Com', 'MBA', 'LLB', 'B.Arch'] },

        // Hyderabad Colleges
        { name: 'IIT Hyderabad', city: 'Hyderabad', courses: ['B.Tech', 'M.Tech', 'PhD'] },
        { name: 'Osmania University', city: 'Hyderabad', courses: ['BA', 'MA', 'B.Com', 'M.Com', 'B.Sc', 'M.Sc', 'B.Tech', 'MBA', 'LLB'] },
        { name: 'BITS Pilani Hyderabad', city: 'Hyderabad', courses: ['B.Tech', 'M.Tech', 'PhD'] },
        { name: 'JNTU Hyderabad', city: 'Hyderabad', courses: ['B.Tech', 'M.Tech', 'MBA', 'B.Pharm'] },
        { name: 'University of Hyderabad', city: 'Hyderabad', courses: ['BA', 'MA', 'B.Sc', 'M.Sc', 'PhD'] },

        // Chennai Colleges
        { name: 'IIT Madras', city: 'Chennai', courses: ['B.Tech', 'M.Tech', 'PhD', 'MBA'] },
        { name: 'Anna University', city: 'Chennai', courses: ['B.Tech', 'M.Tech', 'MBA', 'B.Arch'] },
        { name: 'Madras University', city: 'Chennai', courses: ['BA', 'MA', 'B.Com', 'M.Com', 'B.Sc', 'M.Sc', 'MBA', 'LLB'] },
        { name: 'SRM University', city: 'Chennai', courses: ['B.Tech', 'M.Tech', 'MBBS', 'BDS', 'MBA', 'B.Pharm'] },
        { name: 'VIT Chennai', city: 'Chennai', courses: ['B.Tech', 'M.Tech', 'MBA'] },
        { name: 'Loyola College', city: 'Chennai', courses: ['BA', 'B.Com', 'B.Sc', 'BCA'] },

        // Kolkata Colleges
        { name: 'IIT Kharagpur', city: 'Kolkata', courses: ['B.Tech', 'M.Tech', 'PhD', 'MBA'] },
        { name: 'Jadavpur University', city: 'Kolkata', courses: ['B.Tech', 'M.Tech', 'BA', 'MA', 'B.Sc', 'PhD'] },
        { name: 'Calcutta University', city: 'Kolkata', courses: ['BA', 'MA', 'B.Com', 'M.Com', 'B.Sc', 'M.Sc', 'LLB'] },
        { name: 'Presidency University', city: 'Kolkata', courses: ['BA', 'B.Sc', 'MA', 'M.Sc'] },

        // Jaipur Colleges
        { name: 'MNIT Jaipur', city: 'Jaipur', courses: ['B.Tech', 'M.Tech', 'PhD'] },
        { name: 'Rajasthan University', city: 'Jaipur', courses: ['BA', 'MA', 'B.Com', 'M.Com', 'B.Sc', 'M.Sc', 'LLB', 'B.Ed'] },
        { name: 'JECRC University', city: 'Jaipur', courses: ['B.Tech', 'M.Tech', 'MBA', 'BCA'] },
        { name: 'Manipal University Jaipur', city: 'Jaipur', courses: ['B.Tech', 'MBA', 'BBA', 'B.Sc', 'B.Arch'] },
        { name: 'Poornima University', city: 'Jaipur', courses: ['B.Tech', 'MBA', 'BBA', 'Diploma'] },

        // Indore Colleges  
        { name: 'IIT Indore', city: 'Indore', courses: ['B.Tech', 'M.Tech', 'PhD'] },
        { name: 'IIM Indore', city: 'Indore', courses: ['MBA', 'PhD'] },
        { name: 'Devi Ahilya University', city: 'Indore', courses: ['BA', 'MA', 'B.Com', 'M.Com', 'B.Sc', 'M.Sc', 'BBA', 'MBA', 'LLB'] },
        { name: 'Medicaps University', city: 'Indore', courses: ['B.Tech', 'M.Tech', 'MBA', 'B.Pharm'] },

        // Lucknow Colleges
        { name: 'IIT Kanpur', city: 'Lucknow', courses: ['B.Tech', 'M.Tech', 'PhD', 'MBA'] },
        { name: 'Lucknow University', city: 'Lucknow', courses: ['BA', 'MA', 'B.Com', 'M.Com', 'B.Sc', 'M.Sc', 'LLB', 'B.Ed'] },
        { name: 'Amity University Lucknow', city: 'Lucknow', courses: ['B.Tech', 'MBA', 'BBA', 'BCA', 'B.Arch', 'LLB'] },
        { name: 'BBAU', city: 'Lucknow', courses: ['BA', 'MA', 'B.Sc', 'M.Sc', 'MBA'] },

        // Chandigarh Colleges
        { name: 'Punjab University', city: 'Chandigarh', courses: ['BA', 'MA', 'B.Com', 'M.Com', 'B.Sc', 'M.Sc', 'BBA', 'MBA', 'LLB', 'B.Ed', 'B.Tech'] },
        { name: 'PEC Chandigarh', city: 'Chandigarh', courses: ['B.Tech', 'M.Tech'] },
        { name: 'Chandigarh University', city: 'Chandigarh', courses: ['B.Tech', 'M.Tech', 'MBA', 'BBA', 'BCA', 'MCA', 'B.Pharm', 'LLB'] },
        { name: 'Chitkara University', city: 'Chandigarh', courses: ['B.Tech', 'MBA', 'BBA', 'B.Pharm'] }
    ];

    for (const college of collegesWithCourses) {
        const city = dbWrapper.prepare('SELECT id FROM cities WHERE name = ?').get(college.city);
        if (city) {
            // Insert college
            dbWrapper.prepare('INSERT OR IGNORE INTO colleges (name, city_id) VALUES (?, ?)').run(college.name, city.id);

            // Get college ID
            const collegeRow = dbWrapper.prepare('SELECT id FROM colleges WHERE name = ? AND city_id = ?').get(college.name, city.id);
            if (collegeRow && college.courses) {
                // Insert course mappings
                for (const course of college.courses) {
                    dbWrapper.prepare('INSERT OR IGNORE INTO college_courses (college_id, course_name) VALUES (?, ?)').run(collegeRow.id, course);
                }
            }
        }
    }
    console.log('Colleges and course mappings inserted successfully!');
};

// Insert departments and sub-departments
const insertDepartments = () => {
    const departments = [
        { name: 'B.Tech / B.E.', category: 'Engineering', subDepartments: ['Computer Science & Engineering', 'Information Technology', 'Mechanical Engineering', 'Civil Engineering', 'Electrical Engineering', 'Electronics & Communication', 'Chemical Engineering', 'Biotechnology', 'Aerospace Engineering', 'Automobile Engineering'] },
        { name: 'MBBS', category: 'Medical', subDepartments: ['General Medicine', 'Surgery', 'Pediatrics', 'Orthopedics', 'Gynecology', 'Cardiology', 'Neurology', 'Dermatology', 'Ophthalmology', 'ENT'] },
        { name: 'BDS', category: 'Medical', subDepartments: ['Oral Surgery', 'Orthodontics', 'Periodontics', 'Prosthodontics', 'Pedodontics'] },
        { name: 'MBA', category: 'Management', subDepartments: ['Finance', 'Marketing', 'Human Resources', 'Operations', 'Information Technology', 'International Business', 'Entrepreneurship', 'Healthcare Management'] },
        { name: 'BBA', category: 'Management', subDepartments: ['Finance', 'Marketing', 'Human Resources', 'International Business', 'Entrepreneurship'] },
        { name: 'B.Sc', category: 'Science', subDepartments: ['Physics', 'Chemistry', 'Mathematics', 'Biology', 'Biotechnology', 'Computer Science', 'Microbiology', 'Zoology', 'Botany'] },
        { name: 'M.Sc', category: 'Science', subDepartments: ['Physics', 'Chemistry', 'Mathematics', 'Biology', 'Biotechnology', 'Computer Science', 'Microbiology'] },
        { name: 'B.Com', category: 'Commerce', subDepartments: ['Accounting', 'Finance', 'Banking', 'Taxation', 'Business Management'] },
        { name: 'M.Com', category: 'Commerce', subDepartments: ['Accounting', 'Finance', 'Banking', 'Business Management'] },
        { name: 'BA', category: 'Arts', subDepartments: ['English', 'Hindi', 'Gujarati', 'Psychology', 'Sociology', 'Political Science', 'History', 'Economics', 'Geography'] },
        { name: 'MA', category: 'Arts', subDepartments: ['English', 'Hindi', 'Psychology', 'Sociology', 'Political Science', 'Economics'] },
        { name: 'LLB', category: 'Law', subDepartments: ['Criminal Law', 'Corporate Law', 'Civil Law', 'Constitutional Law', 'International Law'] },
        { name: 'B.Pharm', category: 'Pharmacy', subDepartments: ['Pharmaceutical Chemistry', 'Pharmacology', 'Pharmaceutics', 'Pharmacognosy'] },
        { name: 'B.Arch', category: 'Architecture', subDepartments: ['Architecture Design', 'Urban Planning', 'Interior Design', 'Landscape Architecture'] },
        { name: 'CA', category: 'Professional', subDepartments: ['Accounting', 'Auditing', 'Taxation', 'Financial Management'] },
        { name: 'Diploma', category: 'Technical', subDepartments: ['Mechanical Engineering', 'Civil Engineering', 'Electrical Engineering', 'Computer Engineering', 'Electronics Engineering'] },
        { name: 'ITI', category: 'Technical', subDepartments: ['Electrician', 'Fitter', 'Turner', 'Welder', 'Mechanic', 'COPA'] },
        { name: 'PhD', category: 'Research', subDepartments: ['Engineering', 'Science', 'Medical', 'Management', 'Arts & Humanities', 'Law'] },
        { name: 'Other', category: 'Other', subDepartments: ['Other'] }
    ];

    for (const dept of departments) {
        dbWrapper.prepare('INSERT OR IGNORE INTO departments (name, category) VALUES (?, ?)').run(dept.name, dept.category);
        const deptRow = dbWrapper.prepare('SELECT id FROM departments WHERE name = ?').get(dept.name);
        if (deptRow) {
            for (const subDept of dept.subDepartments) {
                dbWrapper.prepare('INSERT OR IGNORE INTO sub_departments (name, department_id) VALUES (?, ?)').run(subDept, deptRow.id);
            }
        }
    }
    console.log('Departments and sub-departments inserted successfully!');
};

// Create default admin user
const createDefaultAdmin = () => {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@community.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'ChangeMe123!';
    const adminPhone = process.env.ADMIN_PHONE || '9999999999';

    const adminExists = dbWrapper.prepare('SELECT id FROM users WHERE email = ? OR phone = ?').get(adminEmail, adminPhone);

    if (!adminExists) {
        const village = dbWrapper.prepare('SELECT id FROM villages LIMIT 1').get();
        if (village) {
            const hashedPassword = bcrypt.hashSync(adminPassword, 10);
            dbWrapper.prepare(`
                INSERT INTO users (
                    first_name, middle_name, last_name, gender, village_id,
                    current_address, phone, email, password, occupation_type,
                    registration_completed, is_approved, is_admin, can_view_sensitive, phone_verified, email_verified
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).run(
                'Admin', '', 'User', 'Male', village.id,
                'Admin Office', adminPhone, adminEmail, hashedPassword, 'job',
                1, 1, 1, 1, 1, 1
            );

            const adminUser = dbWrapper.prepare('SELECT id FROM users WHERE email = ?').get(adminEmail);
            if (adminUser) {
                dbWrapper.prepare(`
                    INSERT INTO job_details (user_id, company_name, designation, field, working_city)
                    VALUES (?, ?, ?, ?, ?)
                `).run(adminUser.id, 'Community Connect', 'Administrator', 'IT Support & Helpdesk', 'Local');
            }

            console.log('Default admin created! Email:', adminEmail);
        }
    }
};

// Create test users for different occupation types
const createTestUsers = () => {
    const hashedPassword = bcrypt.hashSync('test123', 10);
    const villages = dbWrapper.prepare('SELECT id FROM villages LIMIT 5').all();

    if (villages.length === 0) return;

    // Test Students
    const students = [
        { first: 'Raj', middle: 'Kishan', last: 'Patel', gender: 'Male', phone: '9876543210', email: 'raj.patel@test.com', college: 'Adani University', city: 'Ahmedabad', dept: 'Engineering', subDept: 'Computer Science' },
        { first: 'Priya', middle: 'Rajesh', last: 'Patel', gender: 'Female', phone: '9876543211', email: 'priya.patel@test.com', college: 'Adani University', city: 'Ahmedabad', dept: 'Engineering', subDept: 'Mechanical Engineering' },
        { first: 'Amit', middle: 'Suresh', last: 'Shah', gender: 'Male', phone: '9876543212', email: 'amit.shah@test.com', college: 'Gujarat University', city: 'Ahmedabad', dept: 'Commerce', subDept: 'Accountancy' },
        { first: 'Neha', middle: 'Prakash', last: 'Desai', gender: 'Female', phone: '9876543213', email: 'neha.desai@test.com', college: 'IIT Gandhinagar', city: 'Gandhinagar', dept: 'Engineering', subDept: 'Civil Engineering' },
        { first: 'Vivek', middle: 'Harish', last: 'Modi', gender: 'Male', phone: '9876543214', email: 'vivek.modi@test.com', college: 'NIRMA University', city: 'Ahmedabad', dept: 'Engineering', subDept: 'Electronics & Communication' }
    ];

    // Test Job Professionals
    const jobProfessionals = [
        { first: 'Kiran', middle: 'Jayesh', last: 'Patel', gender: 'Male', phone: '9876543220', email: 'kiran.patel@test.com', company: 'TCS', designation: 'Software Engineer', field: 'Software Development', city: 'Pune' },
        { first: 'Sneha', middle: 'Ramesh', last: 'Parmar', gender: 'Female', phone: '9876543221', email: 'sneha.parmar@test.com', company: 'Infosys', designation: 'Business Analyst', field: 'IT Consulting', city: 'Bangalore' },
        { first: 'Rohit', middle: 'Naresh', last: 'Solanki', gender: 'Male', phone: '9876543222', email: 'rohit.solanki@test.com', company: 'Reliance Industries', designation: 'Manager', field: 'Oil & Gas', city: 'Mumbai' },
        { first: 'Meera', middle: 'Sunil', last: 'Trivedi', gender: 'Female', phone: '9876543223', email: 'meera.trivedi@test.com', company: 'HDFC Bank', designation: 'Branch Manager', field: 'Banking', city: 'Ahmedabad' },
        { first: 'Deepak', middle: 'Mahesh', last: 'Joshi', gender: 'Male', phone: '9876543224', email: 'deepak.joshi@test.com', company: 'Adani Group', designation: 'Project Lead', field: 'Infrastructure', city: 'Ahmedabad' }
    ];

    // Test Business Owners
    const businessOwners = [
        { first: 'Bharat', middle: 'Ramanbhai', last: 'Patel', gender: 'Male', phone: '9876543230', email: 'bharat.patel@test.com', bizName: 'Patel Textiles', bizType: 'Retail', bizField: 'Textile & Garments', city: 'Surat' },
        { first: 'Hiral', middle: 'Dinesh', last: 'Shah', gender: 'Female', phone: '9876543231', email: 'hiral.shah@test.com', bizName: 'Shah Jewellers', bizType: 'Retail', bizField: 'Jewellery', city: 'Ahmedabad' },
        { first: 'Mukesh', middle: 'Pravin', last: 'Chauhan', gender: 'Male', phone: '9876543232', email: 'mukesh.chauhan@test.com', bizName: 'Chauhan Constructions', bizType: 'Construction', bizField: 'Real Estate', city: 'Rajkot' },
        { first: 'Sonal', middle: 'Ashwin', last: 'Mehta', gender: 'Female', phone: '9876543233', email: 'sonal.mehta@test.com', bizName: 'Mehta Foods', bizType: 'Manufacturing', bizField: 'Food Processing', city: 'Vadodara' },
        { first: 'Jayesh', middle: 'Kantilal', last: 'Patel', gender: 'Male', phone: '9876543234', email: 'jayesh.patel@test.com', bizName: 'Patel Agro Industries', bizType: 'Agriculture', bizField: 'Farming & Agriculture', city: 'Anand' }
    ];

    // Insert Students
    students.forEach((s, i) => {
        const exists = dbWrapper.prepare('SELECT id FROM users WHERE email = ?').get(s.email);
        if (!exists) {
            const villageId = villages[i % villages.length].id;
            dbWrapper.prepare(`
                INSERT INTO users (first_name, middle_name, last_name, gender, village_id, current_address, phone, email, password, occupation_type, registration_completed, is_approved)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).run(s.first, s.middle, s.last, s.gender, villageId, s.city, s.phone, s.email, hashedPassword, 'student', 1, 1);

            const user = dbWrapper.prepare('SELECT id FROM users WHERE email = ?').get(s.email);
            if (user) {
                dbWrapper.prepare(`
                    INSERT INTO student_details (user_id, department, sub_department, college_city, college_name)
                    VALUES (?, ?, ?, ?, ?)
                `).run(user.id, s.dept, s.subDept, s.city, s.college);
            }
        }
    });

    // Insert Job Professionals
    jobProfessionals.forEach((j, i) => {
        const exists = dbWrapper.prepare('SELECT id FROM users WHERE email = ?').get(j.email);
        if (!exists) {
            const villageId = villages[i % villages.length].id;
            dbWrapper.prepare(`
                INSERT INTO users (first_name, middle_name, last_name, gender, village_id, current_address, phone, email, password, occupation_type, registration_completed, is_approved)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).run(j.first, j.middle, j.last, j.gender, villageId, j.city, j.phone, j.email, hashedPassword, 'job', 1, 1);

            const user = dbWrapper.prepare('SELECT id FROM users WHERE email = ?').get(j.email);
            if (user) {
                dbWrapper.prepare(`
                    INSERT INTO job_details (user_id, company_name, designation, field, working_city)
                    VALUES (?, ?, ?, ?, ?)
                `).run(user.id, j.company, j.designation, j.field, j.city);
            }
        }
    });

    // Insert Business Owners
    businessOwners.forEach((b, i) => {
        const exists = dbWrapper.prepare('SELECT id FROM users WHERE email = ?').get(b.email);
        if (!exists) {
            const villageId = villages[i % villages.length].id;
            dbWrapper.prepare(`
                INSERT INTO users (first_name, middle_name, last_name, gender, village_id, current_address, phone, email, password, occupation_type, registration_completed, is_approved)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).run(b.first, b.middle, b.last, b.gender, villageId, b.city, b.phone, b.email, hashedPassword, 'business', 1, 1);

            const user = dbWrapper.prepare('SELECT id FROM users WHERE email = ?').get(b.email);
            if (user) {
                dbWrapper.prepare(`
                    INSERT INTO business_details (user_id, business_name, business_type, business_field, business_city, business_address)
                    VALUES (?, ?, ?, ?, ?, ?)
                `).run(user.id, b.bizName, b.bizType, b.bizField, b.city, b.city + ' Main Road');
            }
        }
    });

    console.log('Test users created! Password for all: test123');
};

// Initialize database (async)
const initDatabase = async () => {
    SQL = await initSqlJs();

    // Try to load existing database
    if (fs.existsSync(dbPath)) {
        const fileBuffer = fs.readFileSync(dbPath);
        db = new SQL.Database(fileBuffer);
    } else {
        db = new SQL.Database();
    }

    // Enable foreign keys
    db.run('PRAGMA foreign_keys = ON');

    // Create wrapper
    dbWrapper = createDbWrapper();

    createTables();
    runMigrations(); // Add new columns without deleting data
    insertVillages();
    insertCities();
    insertColleges();
    insertDepartments();
    createDefaultAdmin();

    // Only create test users in development mode
    if (process.env.NODE_ENV !== 'production') {
        createTestUsers(); // Add test data for students, jobs, business
    }

    console.log('Database initialized successfully!');
    return dbWrapper;
};

// Getter for the db wrapper
const getDb = () => {
    if (!dbWrapper) {
        throw new Error('Database not initialized. Call initDatabase() first.');
    }
    return dbWrapper;
};

module.exports = {
    initDatabase,
    getDb,
    supabase,
    get db() {
        return dbWrapper;
    }
};
