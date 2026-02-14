/**
 * Seed Data Script for Supabase
 * Run this AFTER creating tables via supabase_schema.sql
 * Usage: node database/seed_data.js
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function seed() {
    console.log('🌱 Starting seed...');

    // ========== VILLAGES ==========
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

    const { error: vErr } = await supabase.from('villages').upsert(villages, { onConflict: 'name' });
    if (vErr) console.error('Villages error:', vErr.message);
    else console.log(`✅ ${villages.length} villages inserted`);

    // ========== CITIES ==========
    const cities = [
        { name: 'Ahmedabad', state: 'Gujarat' }, { name: 'Amreli', state: 'Gujarat' },
        { name: 'Anand', state: 'Gujarat' }, { name: 'Aravalli (Modasa)', state: 'Gujarat' },
        { name: 'Banaskantha (Palanpur)', state: 'Gujarat' }, { name: 'Bharuch', state: 'Gujarat' },
        { name: 'Bhavnagar', state: 'Gujarat' }, { name: 'Botad', state: 'Gujarat' },
        { name: 'Chhota Udepur', state: 'Gujarat' }, { name: 'Dahod', state: 'Gujarat' },
        { name: 'Dang (Ahwa)', state: 'Gujarat' }, { name: 'Devbhoomi Dwarka (Khambhalia)', state: 'Gujarat' },
        { name: 'Gandhinagar', state: 'Gujarat' }, { name: 'Gir Somnath (Veraval)', state: 'Gujarat' },
        { name: 'Jamnagar', state: 'Gujarat' }, { name: 'Junagadh', state: 'Gujarat' },
        { name: 'Kheda (Nadiad)', state: 'Gujarat' }, { name: 'Kutch (Bhuj)', state: 'Gujarat' },
        { name: 'Mahisagar (Lunawada)', state: 'Gujarat' }, { name: 'Mehsana', state: 'Gujarat' },
        { name: 'Morbi', state: 'Gujarat' }, { name: 'Narmada (Rajpipla)', state: 'Gujarat' },
        { name: 'Navsari', state: 'Gujarat' }, { name: 'Panchmahal (Godhra)', state: 'Gujarat' },
        { name: 'Patan', state: 'Gujarat' }, { name: 'Porbandar', state: 'Gujarat' },
        { name: 'Rajkot', state: 'Gujarat' }, { name: 'Sabarkantha (Himmatnagar)', state: 'Gujarat' },
        { name: 'Surat', state: 'Gujarat' }, { name: 'Surendranagar', state: 'Gujarat' },
        { name: 'Tapi (Vyara)', state: 'Gujarat' }, { name: 'Vadodara', state: 'Gujarat' },
        { name: 'Valsad', state: 'Gujarat' },
        { name: 'Gondal', state: 'Gujarat' }, { name: 'Jetpur', state: 'Gujarat' },
        { name: 'Gandhidham', state: 'Gujarat' }, { name: 'Mundra', state: 'Gujarat' },
        { name: 'Dhoraji', state: 'Gujarat' }, { name: 'Upleta', state: 'Gujarat' },
        { name: 'Jasdan', state: 'Gujarat' }, { name: 'Wankaner', state: 'Gujarat' },
        { name: 'Tankara', state: 'Gujarat' }, { name: 'Dhrangadhra', state: 'Gujarat' },
        { name: 'Viramgam', state: 'Gujarat' }, { name: 'Sanand', state: 'Gujarat' },
        { name: 'Dholka', state: 'Gujarat' }, { name: 'Kalol', state: 'Gujarat' },
        { name: 'Kadi', state: 'Gujarat' }, { name: 'Unjha', state: 'Gujarat' },
        { name: 'Visnagar', state: 'Gujarat' }, { name: 'Deesa', state: 'Gujarat' },
        { name: 'Dhanera', state: 'Gujarat' }, { name: 'Idar', state: 'Gujarat' },
        { name: 'Shamlaji', state: 'Gujarat' }, { name: 'Petlad', state: 'Gujarat' },
        { name: 'Borsad', state: 'Gujarat' }, { name: 'Khambhat (Cambay)', state: 'Gujarat' },
        { name: 'Umreth', state: 'Gujarat' }, { name: 'Tarapur', state: 'Gujarat' },
        { name: 'Kapadvanj', state: 'Gujarat' }, { name: 'Thasra', state: 'Gujarat' },
        { name: 'Mahuva', state: 'Gujarat' }, { name: 'Palitana', state: 'Gujarat' },
        { name: 'Sihor', state: 'Gujarat' }, { name: 'Talaja', state: 'Gujarat' },
        { name: 'Gariadhar', state: 'Gujarat' }, { name: 'Vallabhipur', state: 'Gujarat' },
        { name: 'Una', state: 'Gujarat' }, { name: 'Kodinar', state: 'Gujarat' },
        { name: 'Sutrapada', state: 'Gujarat' }, { name: 'Mangrol', state: 'Gujarat' },
        { name: 'Keshod', state: 'Gujarat' }, { name: 'Visavadar', state: 'Gujarat' },
        { name: 'Manavadar', state: 'Gujarat' }, { name: 'Vanthali', state: 'Gujarat' },
        { name: 'Rajula', state: 'Gujarat' }, { name: 'Savarkundla', state: 'Gujarat' },
        { name: 'Babra', state: 'Gujarat' }, { name: 'Jafrabad', state: 'Gujarat' },
        { name: 'Lathi', state: 'Gujarat' }, { name: 'Damnagar', state: 'Gujarat' },
        { name: 'Dwarka', state: 'Gujarat' }, { name: 'Okha', state: 'Gujarat' },
        { name: 'Bhanvad', state: 'Gujarat' }, { name: 'Lalpur', state: 'Gujarat' },
        { name: 'Kalavad', state: 'Gujarat' }, { name: 'Dhrol', state: 'Gujarat' },
        { name: 'Jodia', state: 'Gujarat' }, { name: 'Anjar', state: 'Gujarat' },
        { name: 'Adipur', state: 'Gujarat' }, { name: 'Mandvi', state: 'Gujarat' },
        { name: 'Nakhatrana', state: 'Gujarat' }, { name: 'Rapar', state: 'Gujarat' },
        { name: 'Halvad', state: 'Gujarat' }, { name: 'Limbdi', state: 'Gujarat' },
        { name: 'Chotila', state: 'Gujarat' }, { name: 'Muli', state: 'Gujarat' },
        { name: 'Sayla', state: 'Gujarat' }, { name: 'Wadhwan', state: 'Gujarat' },
        { name: 'Bardoli', state: 'Gujarat' }, { name: 'Kamrej', state: 'Gujarat' },
        { name: 'Mandvi (Surat)', state: 'Gujarat' }, { name: 'Olpad', state: 'Gujarat' },
        { name: 'Palsana', state: 'Gujarat' }, { name: 'Songadh', state: 'Gujarat' },
        { name: 'Mahuva (Surat)', state: 'Gujarat' }, { name: 'Mangrol (Surat)', state: 'Gujarat' },
        { name: 'Valod', state: 'Gujarat' }, { name: 'Nizar', state: 'Gujarat' },
        { name: 'Fort Songadh', state: 'Gujarat' }, { name: 'Uchchhal', state: 'Gujarat' },
        { name: 'Ankleshwar', state: 'Gujarat' }, { name: 'Jambusar', state: 'Gujarat' },
        { name: 'Amod', state: 'Gujarat' }, { name: 'Vagra', state: 'Gujarat' },
        { name: 'Hansot', state: 'Gujarat' }, { name: 'Savli', state: 'Gujarat' },
        { name: 'Padra', state: 'Gujarat' }, { name: 'Dabhoi', state: 'Gujarat' },
        { name: 'Karjan', state: 'Gujarat' }, { name: 'Shinor', state: 'Gujarat' },
        { name: 'Sankheda', state: 'Gujarat' }, { name: 'Bodeli', state: 'Gujarat' },
        { name: 'Naswadi', state: 'Gujarat' }, { name: 'Kawant', state: 'Gujarat' },
        { name: 'Limkheda', state: 'Gujarat' }, { name: 'Fatepura', state: 'Gujarat' },
        { name: 'Garbada', state: 'Gujarat' }, { name: 'Jhalod', state: 'Gujarat' },
        { name: 'Devgad Baria', state: 'Gujarat' }, { name: 'Santrampur', state: 'Gujarat' },
        { name: 'Kadana', state: 'Gujarat' }, { name: 'Khanpur', state: 'Gujarat' },
        { name: 'Balasinor', state: 'Gujarat' }, { name: 'Virpur', state: 'Gujarat' },
        { name: 'Halol', state: 'Gujarat' }, { name: 'Kalol (Panchmahal)', state: 'Gujarat' },
        { name: 'Jambughoda', state: 'Gujarat' }, { name: 'Morva Hadaf', state: 'Gujarat' },
        { name: 'Shehera', state: 'Gujarat' }, { name: 'Bilimora', state: 'Gujarat' },
        { name: 'Chikhli', state: 'Gujarat' }, { name: 'Gandevi', state: 'Gujarat' },
        { name: 'Jalalpore', state: 'Gujarat' }, { name: 'Dungri', state: 'Gujarat' },
        { name: 'Vansda', state: 'Gujarat' }, { name: 'Dharampur', state: 'Gujarat' },
        { name: 'Kaprada', state: 'Gujarat' }, { name: 'Pardi', state: 'Gujarat' },
        { name: 'Umbergaon', state: 'Gujarat' }, { name: 'Sarigam', state: 'Gujarat' },
        { name: 'Vapi', state: 'Gujarat' }, { name: 'Daman', state: 'Gujarat' },
        { name: 'Silvassa', state: 'Gujarat' },
        { name: 'Mumbai', state: 'Maharashtra' }, { name: 'Pune', state: 'Maharashtra' },
        { name: 'Nagpur', state: 'Maharashtra' }, { name: 'Nashik', state: 'Maharashtra' },
        { name: 'Aurangabad', state: 'Maharashtra' },
        { name: 'Bangalore', state: 'Karnataka' }, { name: 'Mysore', state: 'Karnataka' },
        { name: 'Mangalore', state: 'Karnataka' },
        { name: 'Delhi', state: 'Delhi' }, { name: 'Noida', state: 'Uttar Pradesh' },
        { name: 'Gurgaon', state: 'Haryana' }, { name: 'Faridabad', state: 'Haryana' },
        { name: 'Ghaziabad', state: 'Uttar Pradesh' },
        { name: 'Chennai', state: 'Tamil Nadu' }, { name: 'Coimbatore', state: 'Tamil Nadu' },
        { name: 'Madurai', state: 'Tamil Nadu' },
        { name: 'Hyderabad', state: 'Telangana' },
        { name: 'Visakhapatnam', state: 'Andhra Pradesh' }, { name: 'Vijayawada', state: 'Andhra Pradesh' },
        { name: 'Jaipur', state: 'Rajasthan' }, { name: 'Jodhpur', state: 'Rajasthan' },
        { name: 'Udaipur', state: 'Rajasthan' }, { name: 'Kota', state: 'Rajasthan' },
        { name: 'Indore', state: 'Madhya Pradesh' }, { name: 'Bhopal', state: 'Madhya Pradesh' },
        { name: 'Gwalior', state: 'Madhya Pradesh' },
        { name: 'Kolkata', state: 'West Bengal' },
        { name: 'Kochi', state: 'Kerala' }, { name: 'Thiruvananthapuram', state: 'Kerala' },
        { name: 'Chandigarh', state: 'Punjab' }, { name: 'Ludhiana', state: 'Punjab' },
        { name: 'Amritsar', state: 'Punjab' },
        { name: 'Lucknow', state: 'Uttar Pradesh' }, { name: 'Kanpur', state: 'Uttar Pradesh' },
        { name: 'Varanasi', state: 'Uttar Pradesh' }, { name: 'Allahabad', state: 'Uttar Pradesh' },
        { name: 'Patna', state: 'Bihar' }, { name: 'Bhubaneswar', state: 'Odisha' },
        { name: 'Ranchi', state: 'Jharkhand' }, { name: 'Guwahati', state: 'Assam' },
        { name: 'Dehradun', state: 'Uttarakhand' }, { name: 'Shimla', state: 'Himachal Pradesh' },
        { name: 'Panaji', state: 'Goa' }
    ];

    const { error: cErr } = await supabase.from('cities').upsert(cities, { onConflict: 'name' });
    if (cErr) console.error('Cities error:', cErr.message);
    else console.log(`✅ ${cities.length} cities inserted`);

    // ========== DEPARTMENTS ==========
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
        const { data: inserted, error: dErr } = await supabase
            .from('departments')
            .upsert({ name: dept.name, category: dept.category }, { onConflict: 'name' })
            .select('id')
            .single();

        if (dErr) { console.error(`Dept ${dept.name} error:`, dErr.message); continue; }

        const subDepts = dept.subDepartments.map(sd => ({
            name: sd,
            department_id: inserted.id
        }));

        const { error: sdErr } = await supabase
            .from('sub_departments')
            .upsert(subDepts, { onConflict: 'name,department_id' });

        if (sdErr) console.error(`Sub-depts for ${dept.name} error:`, sdErr.message);
    }
    console.log('✅ Departments and sub-departments inserted');

    // ========== COLLEGES ==========
    const collegesWithCourses = [
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
        { name: "St. Xavier's College", city: 'Ahmedabad', courses: ['BA', 'B.Sc', 'B.Com', 'BCA'] },
        { name: 'Gujarat Vidyapith', city: 'Ahmedabad', courses: ['BA', 'MA', 'B.Ed', 'B.Sc'] },
        { name: 'MS University (MSU)', city: 'Vadodara', courses: ['B.Tech', 'M.Tech', 'MBA', 'BA', 'MA', 'B.Sc', 'M.Sc', 'B.Com', 'M.Com', 'BCA', 'MCA', 'LLB', 'B.Ed', 'B.Pharm'] },
        { name: 'Parul University', city: 'Vadodara', courses: ['B.Tech', 'M.Tech', 'MBBS', 'BDS', 'B.Pharm', 'MBA', 'BBA', 'BCA', 'MCA', 'Diploma', 'B.Arch', 'LLB'] },
        { name: 'Medical College Baroda', city: 'Vadodara', courses: ['MBBS', 'MD', 'MS'] },
        { name: 'Government Polytechnic Vadodara', city: 'Vadodara', courses: ['Diploma'] },
        { name: 'ITM Universe', city: 'Vadodara', courses: ['B.Tech', 'MBA', 'BBA', 'BCA'] },
        { name: 'Navrachana University', city: 'Vadodara', courses: ['B.Tech', 'B.Arch', 'BBA', 'B.Sc'] },
        { name: 'SVNIT', city: 'Surat', courses: ['B.Tech', 'M.Tech', 'PhD'] },
        { name: 'VNSGU', city: 'Surat', courses: ['BA', 'MA', 'B.Com', 'M.Com', 'B.Sc', 'M.Sc', 'BBA', 'MBA', 'BCA', 'MCA', 'LLB', 'B.Ed'] },
        { name: 'Government Medical College Surat', city: 'Surat', courses: ['MBBS', 'MD', 'MS'] },
        { name: 'SCET', city: 'Surat', courses: ['B.Tech', 'M.Tech', 'Diploma'] },
        { name: 'UKA Tarsadia University', city: 'Surat', courses: ['B.Tech', 'MBA', 'B.Pharm', 'BCA', 'Diploma'] },
        { name: 'Saurashtra University', city: 'Rajkot', courses: ['BA', 'MA', 'B.Com', 'M.Com', 'B.Sc', 'M.Sc', 'BBA', 'MBA', 'BCA', 'MCA', 'LLB', 'B.Ed'] },
        { name: 'RK University', city: 'Rajkot', courses: ['B.Tech', 'M.Tech', 'MBA', 'BBA', 'BCA', 'B.Pharm', 'Diploma'] },
        { name: 'Marwadi University', city: 'Rajkot', courses: ['B.Tech', 'M.Tech', 'MBA', 'BBA', 'BCA', 'MCA', 'Diploma'] },
        { name: 'PDU Medical College', city: 'Rajkot', courses: ['MBBS', 'MD', 'MS'] },
        { name: 'Government Engineering College Rajkot', city: 'Rajkot', courses: ['B.Tech', 'M.Tech', 'Diploma'] },
        { name: 'ATMIYA University', city: 'Rajkot', courses: ['B.Tech', 'MBA', 'BCA', 'B.Com', 'B.Sc'] },
        { name: 'Bhavnagar University', city: 'Bhavnagar', courses: ['BA', 'MA', 'B.Com', 'M.Com', 'B.Sc', 'M.Sc', 'BBA', 'MBA', 'BCA', 'MCA', 'LLB', 'B.Ed'] },
        { name: 'Sir PP Science Institute', city: 'Bhavnagar', courses: ['B.Sc', 'M.Sc'] },
        { name: 'Government Medical College Bhavnagar', city: 'Bhavnagar', courses: ['MBBS', 'MD', 'MS'] },
        { name: 'Government Engineering College Bhavnagar', city: 'Bhavnagar', courses: ['B.Tech', 'Diploma'] },
        { name: 'GIFT University', city: 'Gandhinagar', courses: ['MBA', 'B.Tech'] },
        { name: 'Raksha Shakti University', city: 'Gandhinagar', courses: ['BA', 'MA', 'LLB'] },
        { name: "Children's University", city: 'Gandhinagar', courses: ['B.Ed', 'BA'] },
        { name: 'IIT Bombay', city: 'Mumbai', courses: ['B.Tech', 'M.Tech', 'PhD'] },
        { name: 'Mumbai University', city: 'Mumbai', courses: ['BA', 'MA', 'B.Com', 'M.Com', 'B.Sc', 'M.Sc', 'BBA', 'MBA', 'BCA', 'MCA', 'LLB', 'B.Ed'] },
        { name: 'VJTI', city: 'Mumbai', courses: ['B.Tech', 'M.Tech', 'Diploma'] },
        { name: 'SPJIMR', city: 'Mumbai', courses: ['MBA'] },
        { name: 'NMIMS University', city: 'Mumbai', courses: ['MBA', 'B.Tech', 'B.Pharm', 'BBA', 'B.Com'] },
        { name: 'Tata Institute of Social Sciences (TISS)', city: 'Mumbai', courses: ['MA', 'MBA', 'PhD'] },
        { name: "St. Xavier's College Mumbai", city: 'Mumbai', courses: ['BA', 'B.Sc', 'B.Com', 'BMS'] },
        { name: 'KJ Somaiya College', city: 'Mumbai', courses: ['B.Tech', 'MBA', 'BCA', 'B.Com'] },
        { name: 'DJ Sanghvi College of Engineering', city: 'Mumbai', courses: ['B.Tech', 'M.Tech'] },
        { name: 'Pune University (SPPU)', city: 'Pune', courses: ['BA', 'MA', 'B.Com', 'M.Com', 'B.Sc', 'M.Sc', 'BBA', 'MBA', 'BCA', 'MCA', 'LLB', 'B.Ed', 'B.Tech'] },
        { name: 'COEP', city: 'Pune', courses: ['B.Tech', 'M.Tech'] },
        { name: 'Symbiosis University', city: 'Pune', courses: ['MBA', 'BBA', 'BA', 'B.Sc', 'LLB', 'B.Tech'] },
        { name: 'MIT Pune', city: 'Pune', courses: ['B.Tech', 'M.Tech', 'MBA', 'Diploma'] },
        { name: 'VIT Pune', city: 'Pune', courses: ['B.Tech', 'M.Tech', 'MCA'] },
        { name: 'Fergusson College', city: 'Pune', courses: ['BA', 'B.Sc', 'B.Com'] },
        { name: 'IISc Bangalore', city: 'Bangalore', courses: ['B.Sc', 'M.Sc', 'PhD', 'M.Tech'] },
        { name: 'Christ University', city: 'Bangalore', courses: ['BA', 'B.Com', 'BBA', 'MBA', 'B.Sc', 'BCA', 'MCA', 'LLB'] },
        { name: 'PES University', city: 'Bangalore', courses: ['B.Tech', 'M.Tech', 'MBA', 'MCA'] },
        { name: 'RV College of Engineering', city: 'Bangalore', courses: ['B.Tech', 'M.Tech'] },
        { name: 'BMS College of Engineering', city: 'Bangalore', courses: ['B.Tech', 'M.Tech', 'MBA'] },
        { name: 'Bangalore University', city: 'Bangalore', courses: ['BA', 'MA', 'B.Com', 'M.Com', 'B.Sc', 'M.Sc', 'BBA', 'MBA', 'LLB', 'B.Ed'] },
        { name: 'MSRIT', city: 'Bangalore', courses: ['B.Tech', 'M.Tech', 'MBA'] },
        { name: 'Jain University', city: 'Bangalore', courses: ['B.Tech', 'MBA', 'BBA', 'B.Com', 'BA'] },
        { name: 'IIT Delhi', city: 'Delhi', courses: ['B.Tech', 'M.Tech', 'PhD', 'MBA'] },
        { name: 'Delhi University', city: 'Delhi', courses: ['BA', 'MA', 'B.Com', 'M.Com', 'B.Sc', 'M.Sc', 'BBA', 'MBA', 'LLB', 'B.Ed'] },
        { name: 'JNU', city: 'Delhi', courses: ['BA', 'MA', 'M.Sc', 'PhD'] },
        { name: 'AIIMS Delhi', city: 'Delhi', courses: ['MBBS', 'MD', 'MS', 'PhD'] },
        { name: 'DTU', city: 'Delhi', courses: ['B.Tech', 'M.Tech', 'MBA'] },
        { name: 'NSIT', city: 'Delhi', courses: ['B.Tech', 'M.Tech'] },
        { name: 'IP University', city: 'Delhi', courses: ['B.Tech', 'MBA', 'BBA', 'BCA', 'LLB', 'B.Ed'] },
        { name: 'Jamia Millia Islamia', city: 'Delhi', courses: ['B.Tech', 'BA', 'B.Com', 'MBA', 'LLB', 'B.Arch'] },
        { name: 'IIT Hyderabad', city: 'Hyderabad', courses: ['B.Tech', 'M.Tech', 'PhD'] },
        { name: 'Osmania University', city: 'Hyderabad', courses: ['BA', 'MA', 'B.Com', 'M.Com', 'B.Sc', 'M.Sc', 'B.Tech', 'MBA', 'LLB'] },
        { name: 'BITS Pilani Hyderabad', city: 'Hyderabad', courses: ['B.Tech', 'M.Tech', 'PhD'] },
        { name: 'JNTU Hyderabad', city: 'Hyderabad', courses: ['B.Tech', 'M.Tech', 'MBA', 'B.Pharm'] },
        { name: 'University of Hyderabad', city: 'Hyderabad', courses: ['BA', 'MA', 'B.Sc', 'M.Sc', 'PhD'] },
        { name: 'IIT Madras', city: 'Chennai', courses: ['B.Tech', 'M.Tech', 'PhD', 'MBA'] },
        { name: 'Anna University', city: 'Chennai', courses: ['B.Tech', 'M.Tech', 'MBA', 'B.Arch'] },
        { name: 'Madras University', city: 'Chennai', courses: ['BA', 'MA', 'B.Com', 'M.Com', 'B.Sc', 'M.Sc', 'MBA', 'LLB'] },
        { name: 'SRM University', city: 'Chennai', courses: ['B.Tech', 'M.Tech', 'MBBS', 'BDS', 'MBA', 'B.Pharm'] },
        { name: 'VIT Chennai', city: 'Chennai', courses: ['B.Tech', 'M.Tech', 'MBA'] },
        { name: 'Loyola College', city: 'Chennai', courses: ['BA', 'B.Com', 'B.Sc', 'BCA'] },
        { name: 'IIT Kharagpur', city: 'Kolkata', courses: ['B.Tech', 'M.Tech', 'PhD', 'MBA'] },
        { name: 'Jadavpur University', city: 'Kolkata', courses: ['B.Tech', 'M.Tech', 'BA', 'MA', 'B.Sc', 'PhD'] },
        { name: 'Calcutta University', city: 'Kolkata', courses: ['BA', 'MA', 'B.Com', 'M.Com', 'B.Sc', 'M.Sc', 'LLB'] },
        { name: 'Presidency University', city: 'Kolkata', courses: ['BA', 'B.Sc', 'MA', 'M.Sc'] },
        { name: 'MNIT Jaipur', city: 'Jaipur', courses: ['B.Tech', 'M.Tech', 'PhD'] },
        { name: 'Rajasthan University', city: 'Jaipur', courses: ['BA', 'MA', 'B.Com', 'M.Com', 'B.Sc', 'M.Sc', 'LLB', 'B.Ed'] },
        { name: 'JECRC University', city: 'Jaipur', courses: ['B.Tech', 'M.Tech', 'MBA', 'BCA'] },
        { name: 'Manipal University Jaipur', city: 'Jaipur', courses: ['B.Tech', 'MBA', 'BBA', 'B.Sc', 'B.Arch'] },
        { name: 'Poornima University', city: 'Jaipur', courses: ['B.Tech', 'MBA', 'BBA', 'Diploma'] },
        { name: 'IIT Indore', city: 'Indore', courses: ['B.Tech', 'M.Tech', 'PhD'] },
        { name: 'IIM Indore', city: 'Indore', courses: ['MBA', 'PhD'] },
        { name: 'Devi Ahilya University', city: 'Indore', courses: ['BA', 'MA', 'B.Com', 'M.Com', 'B.Sc', 'M.Sc', 'BBA', 'MBA', 'LLB'] },
        { name: 'Medicaps University', city: 'Indore', courses: ['B.Tech', 'M.Tech', 'MBA', 'B.Pharm'] },
        { name: 'IIT Kanpur', city: 'Lucknow', courses: ['B.Tech', 'M.Tech', 'PhD', 'MBA'] },
        { name: 'Lucknow University', city: 'Lucknow', courses: ['BA', 'MA', 'B.Com', 'M.Com', 'B.Sc', 'M.Sc', 'LLB', 'B.Ed'] },
        { name: 'Amity University Lucknow', city: 'Lucknow', courses: ['B.Tech', 'MBA', 'BBA', 'BCA', 'B.Arch', 'LLB'] },
        { name: 'BBAU', city: 'Lucknow', courses: ['BA', 'MA', 'B.Sc', 'M.Sc', 'MBA'] },
        { name: 'Punjab University', city: 'Chandigarh', courses: ['BA', 'MA', 'B.Com', 'M.Com', 'B.Sc', 'M.Sc', 'BBA', 'MBA', 'LLB', 'B.Ed', 'B.Tech'] },
        { name: 'PEC Chandigarh', city: 'Chandigarh', courses: ['B.Tech', 'M.Tech'] },
        { name: 'Chandigarh University', city: 'Chandigarh', courses: ['B.Tech', 'M.Tech', 'MBA', 'BBA', 'BCA', 'MCA', 'B.Pharm', 'LLB'] },
        { name: 'Chitkara University', city: 'Chandigarh', courses: ['B.Tech', 'MBA', 'BBA', 'B.Pharm'] }
    ];

    // Get all city IDs in bulk
    const { data: allCities } = await supabase.from('cities').select('id, name');
    const cityMap = {};
    (allCities || []).forEach(c => cityMap[c.name] = c.id);

    for (const college of collegesWithCourses) {
        const cityId = cityMap[college.city];
        if (!cityId) { console.warn(`City not found: ${college.city}`); continue; }

        const { data: inserted, error: colErr } = await supabase
            .from('colleges')
            .upsert({ name: college.name, city_id: cityId }, { onConflict: 'name,city_id' })
            .select('id')
            .single();

        if (colErr) { console.error(`College ${college.name} error:`, colErr.message); continue; }

        if (college.courses && inserted) {
            const courseMappings = college.courses.map(course => ({
                college_id: inserted.id,
                course_name: course
            }));

            const { error: ccErr } = await supabase
                .from('college_courses')
                .upsert(courseMappings, { onConflict: 'college_id,course_name' });

            if (ccErr) console.error(`Courses for ${college.name} error:`, ccErr.message);
        }
    }
    console.log('✅ Colleges and courses inserted');

    // ========== DEFAULT ADMIN ==========
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@community.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'ChangeMe123!';
    const adminPhone = process.env.ADMIN_PHONE || '9999999999';

    const { data: existingAdmin } = await supabase
        .from('users')
        .select('id')
        .or(`email.eq.${adminEmail},phone.eq.${adminPhone}`)
        .single();

    if (!existingAdmin) {
        const { data: firstVillage } = await supabase
            .from('villages')
            .select('id')
            .limit(1)
            .single();

        if (firstVillage) {
            const hashedPassword = bcrypt.hashSync(adminPassword, 10);
            const { data: admin, error: adminErr } = await supabase
                .from('users')
                .insert({
                    first_name: 'Admin',
                    middle_name: '',
                    last_name: 'User',
                    gender: 'Male',
                    village_id: firstVillage.id,
                    current_address: 'Admin Office',
                    phone: adminPhone,
                    email: adminEmail,
                    password: hashedPassword,
                    occupation_type: 'job',
                    registration_completed: true,
                    is_approved: true,
                    is_admin: true,
                    can_view_sensitive: true,
                    phone_verified: true,
                    email_verified: true
                })
                .select('id')
                .single();

            if (adminErr) {
                console.error('Admin creation error:', adminErr.message);
            } else {
                await supabase.from('job_details').insert({
                    user_id: admin.id,
                    company_name: 'Community Connect',
                    designation: 'Administrator',
                    field: 'IT Support & Helpdesk',
                    working_city: 'Local'
                });
                console.log(`✅ Admin created! Email: ${adminEmail}`);
            }
        }
    } else {
        console.log('✅ Admin already exists');
    }

    console.log('\n🎉 Seeding complete!');
}

seed().catch(err => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
});
