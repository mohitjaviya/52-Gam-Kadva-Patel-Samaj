// SMS Service using Twilio
const twilio = require('twilio');

// Twilio Configuration
// Sign up at https://www.twilio.com to get these credentials
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || 'YOUR_TWILIO_ACCOUNT_SID';
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || 'YOUR_TWILIO_AUTH_TOKEN';
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER || '+1234567890';

// Demo mode flag - set to false in production
const DEMO_MODE = process.env.SMS_DEMO_MODE !== 'false';

let twilioClient = null;

// Initialize Twilio client only if not in demo mode
if (!DEMO_MODE && TWILIO_ACCOUNT_SID !== 'YOUR_TWILIO_ACCOUNT_SID') {
    try {
        twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
        console.log('✅ Twilio SMS service initialized');
    } catch (error) {
        console.error('❌ Failed to initialize Twilio:', error.message);
    }
}

/**
 * Send OTP via SMS
 * @param {string} phoneNumber - Phone number with country code (e.g., +919876543210)
 * @param {string} otp - 6-digit OTP
 * @returns {Promise<{success: boolean, message: string}>}
 */
async function sendOTP(phoneNumber, otp) {
    // Format phone number (add +91 for Indian numbers if not present)
    let formattedPhone = phoneNumber;
    if (!phoneNumber.startsWith('+')) {
        formattedPhone = '+91' + phoneNumber;
    }

    const message = `Your 52 ગામ કડવા પટેલ સમાજ verification code is: ${otp}. Valid for 10 minutes. Do not share this code with anyone.`;

    if (DEMO_MODE) {
        console.log(`📱 [DEMO SMS] To: ${formattedPhone}`);
        console.log(`📱 [DEMO SMS] Message: ${message}`);
        console.log(`📱 [DEMO SMS] OTP: ${otp}`);
        return { 
            success: true, 
            message: 'OTP sent (Demo Mode)',
            demoOTP: otp 
        };
    }

    if (!twilioClient) {
        console.error('❌ Twilio client not initialized');
        return { 
            success: false, 
            message: 'SMS service not configured' 
        };
    }

    try {
        const result = await twilioClient.messages.create({
            body: message,
            from: TWILIO_PHONE_NUMBER,
            to: formattedPhone
        });

        console.log(`✅ SMS sent to ${formattedPhone}, SID: ${result.sid}`);
        return { 
            success: true, 
            message: 'OTP sent successfully',
            sid: result.sid
        };
    } catch (error) {
        console.error(`❌ SMS sending failed:`, error.message);
        return { 
            success: false, 
            message: 'Failed to send SMS: ' + error.message 
        };
    }
}

/**
 * Send custom SMS message
 * @param {string} phoneNumber - Phone number with country code
 * @param {string} message - Message to send
 * @returns {Promise<{success: boolean, message: string}>}
 */
async function sendSMS(phoneNumber, message) {
    let formattedPhone = phoneNumber;
    if (!phoneNumber.startsWith('+')) {
        formattedPhone = '+91' + phoneNumber;
    }

    if (DEMO_MODE) {
        console.log(`📱 [DEMO SMS] To: ${formattedPhone}`);
        console.log(`📱 [DEMO SMS] Message: ${message}`);
        return { success: true, message: 'SMS sent (Demo Mode)' };
    }

    if (!twilioClient) {
        return { success: false, message: 'SMS service not configured' };
    }

    try {
        const result = await twilioClient.messages.create({
            body: message,
            from: TWILIO_PHONE_NUMBER,
            to: formattedPhone
        });

        return { success: true, message: 'SMS sent successfully', sid: result.sid };
    } catch (error) {
        console.error('SMS sending failed:', error.message);
        return { success: false, message: 'Failed to send SMS' };
    }
}

module.exports = {
    sendOTP,
    sendSMS,
    DEMO_MODE
};
