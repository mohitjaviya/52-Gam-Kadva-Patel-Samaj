// Email Service using Resend (HTTP-based, works on Render/Vercel)
const { Resend } = require('resend');

// Initialize Resend lazily (avoid crash if API key not set yet)
let resend = null;
function getResend() {
    if (!resend && process.env.RESEND_API_KEY) {
        resend = new Resend(process.env.RESEND_API_KEY);
    }
    return resend;
}

// Sender — MUST use resend.dev until you verify your own domain at https://resend.com/domains
const FROM_EMAIL = '52 Gam Kadva Patel Samaj <onboarding@resend.dev>';

// Demo mode flag
const DEMO_MODE = process.env.EMAIL_DEMO_MODE === 'true';

/**
 * Send OTP via Email
 * @param {string} email - Recipient email address
 * @param {string} otp - 6-digit OTP
 * @param {string} name - Recipient name (optional)
 * @returns {Promise<{success: boolean, message: string}>}
 */
async function sendOTPEmail(email, otp, name = 'User') {
    const subject = 'Your 52 ગામ કડવા પટેલ સમાજ Verification Code';

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verification Code</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
            <tr>
                <td style="padding: 40px 30px; background: linear-gradient(135deg, #16A34A 0%, #064E3B 100%); text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 28px;">52 ગામ કડવા પટેલ સમાજ</h1>
                    <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Connecting Our Villages</p>
                </td>
            </tr>
            <tr>
                <td style="padding: 40px 30px;">
                    <h2 style="color: #333333; margin: 0 0 20px 0;">Hello ${name}!</h2>
                    <p style="color: #666666; font-size: 16px; line-height: 1.6;">
                        Your verification code for 52 ગામ કડવા પટેલ સમાજ is:
                    </p>
                    <div style="background: linear-gradient(135deg, #16A34A 0%, #064E3B 100%); padding: 20px; border-radius: 10px; text-align: center; margin: 30px 0;">
                        <span style="font-size: 36px; font-weight: bold; color: #ffffff; letter-spacing: 8px;">${otp}</span>
                    </div>
                    <p style="color: #666666; font-size: 14px; line-height: 1.6;">
                        This code will expire in <strong>10 minutes</strong>.
                    </p>
                    <p style="color: #999999; font-size: 13px; line-height: 1.6; margin-top: 30px;">
                        If you didn't request this code, please ignore this email. Someone might have entered your email by mistake.
                    </p>
                </td>
            </tr>
            <tr>
                <td style="padding: 20px 30px; background-color: #f8f9fa; text-align: center; border-top: 1px solid #eeeeee;">
                    <p style="color: #999999; font-size: 12px; margin: 0;">
                        &copy; ${new Date().getFullYear()} 52 ગામ કડવા પટેલ સમાજ. All rights reserved.
                    </p>
                    <p style="color: #999999; font-size: 12px; margin: 5px 0 0 0;">
                        Connecting 52 villages for a stronger community.
                    </p>
                </td>
            </tr>
        </table>
    </body>
    </html>
    `;

    if (DEMO_MODE) {
        console.log(`📧 [DEMO EMAIL] To: ${email}`);
        console.log(`📧 [DEMO EMAIL] Subject: ${subject}`);
        console.log(`📧 [DEMO EMAIL] OTP: ${otp}`);
        return {
            success: true,
            message: 'Email sent (Demo Mode)',
            demoOTP: otp
        };
    }

    if (!process.env.RESEND_API_KEY) {
        console.error('❌ RESEND_API_KEY not set');
        return {
            success: false,
            message: 'Email service not configured — RESEND_API_KEY missing'
        };
    }

    try {
        const { data, error } = await getResend().emails.send({
            from: FROM_EMAIL,
            to: [email],
            subject: subject,
            html: htmlContent
        });

        if (error) {
            console.error(`❌ Email sending failed:`, error.message);
            return {
                success: false,
                message: 'Failed to send email: ' + error.message
            };
        }

        console.log(`✅ Email sent to ${email}, ID: ${data.id}`);
        return {
            success: true,
            message: 'Email sent successfully',
            messageId: data.id
        };
    } catch (error) {
        console.error(`❌ Email sending failed:`, error.message);
        return {
            success: false,
            message: 'Failed to send email: ' + error.message
        };
    }
}

/**
 * Send Welcome Email
 */
async function sendWelcomeEmail(email, name) {
    const subject = 'Welcome to 52 ગામ કડવા પટેલ સમાજ!';

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
            <tr>
                <td style="padding: 40px 30px; background: linear-gradient(135deg, #16A34A 0%, #064E3B 100%); text-align: center;">
                    <h1 style="color: #fff; margin: 0;">🎉 Welcome!</h1>
                </td>
            </tr>
            <tr>
                <td style="padding: 40px 30px;">
                    <h2 style="color: #333;">Hello ${name}!</h2>
                    <p style="color: #666; line-height: 1.6;">
                        Welcome to 52 ગામ કડવા પટેલ સમાજ! We're excited to have you join our community of 52 villages.
                    </p>
                    <p style="color: #666; line-height: 1.6;">
                        Your registration is pending approval by our admin team. You'll receive a notification once approved.
                    </p>
                    <ul style="color: #666;">
                        <li>Search our community directory</li>
                        <li>Connect with members from all villages</li>
                        <li>Find people by profession</li>
                    </ul>
                </td>
            </tr>
            <tr>
                <td style="padding: 20px 30px; background-color: #f8f9fa; text-align: center;">
                    <p style="color: #999; font-size: 12px;">&copy; ${new Date().getFullYear()} 52 ગામ કડવા પટેલ સમાજ</p>
                </td>
            </tr>
        </table>
    </body>
    </html>
    `;

    if (DEMO_MODE) {
        console.log(`📧 [DEMO EMAIL] Welcome email to: ${email}`);
        return { success: true, message: 'Welcome email sent (Demo Mode)' };
    }

    if (!process.env.RESEND_API_KEY) {
        return { success: false, message: 'Email service not configured' };
    }

    try {
        const { data, error } = await getResend().emails.send({
            from: FROM_EMAIL,
            to: [email],
            subject: subject,
            html: htmlContent
        });
        if (error) throw new Error(error.message);
        return { success: true, message: 'Welcome email sent' };
    } catch (error) {
        console.error('Welcome email failed:', error.message);
        return { success: false, message: 'Failed to send welcome email' };
    }
}

/**
 * Send Approval Notification Email
 */
async function sendApprovalEmail(email, name, approved = true) {
    const subject = approved
        ? '✅ Your 52 ગામ કડવા પટેલ સમાજ Profile is Approved!'
        : '❌ 52 ગામ કડવા પટેલ સમાજ Registration Update';

    const htmlContent = approved ? `
    <!DOCTYPE html>
    <html>
    <body style="margin: 0; padding: 0; font-family: sans-serif; background-color: #f4f4f4;">
        <table width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
            <tr>
                <td style="padding: 40px; background: linear-gradient(135deg, #16A34A 0%, #064E3B 100%); text-align: center;">
                    <h1 style="color: #fff; margin: 0;">🎉 Approved!</h1>
                </td>
            </tr>
            <tr>
                <td style="padding: 40px;">
                    <h2 style="color: #333;">Congratulations ${name}!</h2>
                    <p style="color: #666; line-height: 1.6;">
                        Your profile has been approved by our admin team. You can now:
                    </p>
                    <ul style="color: #666;">
                        <li>Search the community directory</li>
                        <li>View other members' profiles</li>
                        <li>Connect with community members</li>
                    </ul>
                </td>
            </tr>
        </table>
    </body>
    </html>
    ` : `
    <!DOCTYPE html>
    <html>
    <body style="margin: 0; padding: 0; font-family: sans-serif; background-color: #f4f4f4;">
        <table width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
            <tr>
                <td style="padding: 40px; background: #f5576c; text-align: center;">
                    <h1 style="color: #fff; margin: 0;">Registration Update</h1>
                </td>
            </tr>
            <tr>
                <td style="padding: 40px;">
                    <h2 style="color: #333;">Hello ${name},</h2>
                    <p style="color: #666; line-height: 1.6;">
                        Unfortunately, your registration could not be approved at this time. 
                        Please contact the admin for more information.
                    </p>
                </td>
            </tr>
        </table>
    </body>
    </html>
    `;

    if (DEMO_MODE) {
        console.log(`📧 [DEMO EMAIL] Approval email to: ${email}, Approved: ${approved}`);
        return { success: true, message: 'Approval email sent (Demo Mode)' };
    }

    if (!process.env.RESEND_API_KEY) {
        return { success: false, message: 'Email service not configured' };
    }

    try {
        const { data, error } = await resend.emails.send({
            from: FROM_EMAIL,
            to: [email],
            subject: subject,
            html: htmlContent
        });
        if (error) throw new Error(error.message);
        return { success: true, message: 'Approval email sent' };
    } catch (error) {
        console.error('Approval email failed:', error.message);
        return { success: false, message: 'Failed to send approval email' };
    }
}

module.exports = {
    sendOTPEmail,
    sendWelcomeEmail,
    sendApprovalEmail,
    DEMO_MODE
};
