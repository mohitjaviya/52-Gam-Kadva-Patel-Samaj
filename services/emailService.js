// Email Service — AWS SES (Primary) + Brevo (Fallback) + Resend (Fallback)
// SES: 200/day sandbox, 50,000+/day production
// Brevo: 300/day | Resend: 100/day

// Demo mode flag

// Sender config
const SENDER_EMAIL = 'noreply@52gamkps.in';
const SENDER_NAME = '52 Gam Kadva Patel Samaj';

// ============ AWS SES (Primary — 50,000+/day in production) ============
async function sendViaSES(to, subject, html) {
    const region = process.env.AWS_SES_REGION;
    const accessKey = process.env.AWS_SES_ACCESS_KEY;
    const secretKey = process.env.AWS_SES_SECRET_KEY;

    if (!region || !accessKey || !secretKey) {
        return { success: false, message: 'AWS SES credentials not configured' };
    }

    try {
        const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');

        const client = new SESClient({
            region: region,
            credentials: {
                accessKeyId: accessKey,
                secretAccessKey: secretKey
            }
        });

        const command = new SendEmailCommand({
            Source: `${SENDER_NAME} <${SENDER_EMAIL}>`,
            Destination: {
                ToAddresses: [to]
            },
            Message: {
                Subject: {
                    Data: subject,
                    Charset: 'UTF-8'
                },
                Body: {
                    Html: {
                        Data: html,
                        Charset: 'UTF-8'
                    }
                }
            }
        });

        const result = await client.send(command);
        console.log(`✅ Email sent via AWS SES to ${to}, ID: ${result.MessageId}`);
        return { success: true, message: 'Email sent via AWS SES', messageId: result.MessageId };
    } catch (error) {
        console.error(`❌ AWS SES error for ${to}:`, error.message);
        return { success: false, message: 'AWS SES error: ' + error.message };
    }
}

// ============ Brevo HTTP API (Fallback — 300/day) ============
async function sendViaBrevo(to, subject, html) {
    const apiKey = process.env.BREVO_API_KEY;
    if (!apiKey) return { success: false, message: 'Brevo API key not configured' };

    try {
        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
                'api-key': apiKey,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                sender: { name: SENDER_NAME, email: SENDER_EMAIL },
                to: [{ email: to }],
                subject: subject,
                htmlContent: html
            })
        });

        const data = await response.json();

        if (response.ok) {
            console.log(`✅ Email sent via Brevo to ${to}, ID: ${data.messageId}`);
            return { success: true, message: 'Email sent via Brevo', messageId: data.messageId };
        } else {
            console.error(`❌ Brevo failed for ${to}:`, data.message || JSON.stringify(data));
            return { success: false, message: 'Brevo error: ' + (data.message || 'Unknown error') };
        }
    } catch (error) {
        console.error(`❌ Brevo error for ${to}:`, error.message);
        return { success: false, message: 'Brevo error: ' + error.message };
    }
}

// ============ Resend HTTP API (Last Fallback — 100/day) ============
async function sendViaResend(to, subject, html) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) return { success: false, message: 'Resend API key not configured' };

    try {
        const { Resend } = require('resend');
        const resend = new Resend(apiKey);

        const { data, error } = await resend.emails.send({
            from: `${SENDER_NAME} <noreply@52gamkps.in>`,
            to: [to],
            subject: subject,
            html: html
        });

        if (error) {
            console.error(`❌ Resend failed for ${to}:`, error.message);
            return { success: false, message: 'Resend error: ' + error.message };
        }

        console.log(`✅ Email sent via Resend to ${to}, ID: ${data.id}`);
        return { success: true, message: 'Email sent via Resend', messageId: data.id };
    } catch (error) {
        console.error(`❌ Resend error for ${to}:`, error.message);
        return { success: false, message: 'Resend error: ' + error.message };
    }
}

// ============ Send Email (SES → Brevo → Resend fallback) ============
async function sendEmail(to, subject, html) {
    // Try AWS SES first (50,000+/day in production)
    const sesResult = await sendViaSES(to, subject, html);
    if (sesResult.success) return sesResult;

    // Fallback to Brevo (300/day)
    console.log('📧 SES failed, trying Brevo fallback...');
    const brevoResult = await sendViaBrevo(to, subject, html);
    if (brevoResult.success) return brevoResult;

    // Last fallback to Resend (100/day)
    console.log('📧 Brevo failed, trying Resend fallback...');
    const resendResult = await sendViaResend(to, subject, html);
    if (resendResult.success) return resendResult;

    // All failed
    console.error('❌ All email services failed');
    return { success: false, message: 'Failed to send email — all services unavailable' };
}

// ============ Email Templates ============

async function sendOTPEmail(email, otp, name = 'User') {
    const subject = 'Your 52 ગામ કડવા પટેલ સમાજ Verification Code';
    const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
    <body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background-color:#f4f4f4;">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background-color:#ffffff;">
            <tr>
                <td style="padding:40px 30px;background:linear-gradient(135deg,#16A34A 0%,#064E3B 100%);text-align:center;">
                    <h1 style="color:#ffffff;margin:0;font-size:28px;">52 ગામ કડવા પટેલ સમાજ</h1>
                    <p style="color:rgba(255,255,255,0.9);margin:10px 0 0 0;">Connecting Our Villages</p>
                </td>
            </tr>
            <tr>
                <td style="padding:40px 30px;">
                    <h2 style="color:#333333;margin:0 0 20px 0;">Hello ${name}!</h2>
                    <p style="color:#666666;font-size:16px;line-height:1.6;">Your verification code for 52 ગામ કડવા પટેલ સમાજ is:</p>
                    <div style="background:linear-gradient(135deg,#16A34A 0%,#064E3B 100%);padding:20px;border-radius:10px;text-align:center;margin:30px 0;">
                        <span style="font-size:36px;font-weight:bold;color:#ffffff;letter-spacing:8px;">${otp}</span>
                    </div>
                    <p style="color:#666666;font-size:14px;line-height:1.6;">This code will expire in <strong>10 minutes</strong>.</p>
                    <p style="color:#999999;font-size:13px;line-height:1.6;margin-top:30px;">If you didn't request this code, please ignore this email.</p>
                </td>
            </tr>
            <tr>
                <td style="padding:20px 30px;background-color:#f8f9fa;text-align:center;border-top:1px solid #eeeeee;">
                    <p style="color:#999999;font-size:12px;margin:0;">&copy; ${new Date().getFullYear()} 52 ગામ કડવા પટેલ સમાજ. All rights reserved.</p>
                </td>
            </tr>
        </table>
    </body>
    </html>`;


    return sendEmail(email, subject, html);
}

async function sendWelcomeEmail(email, name) {
    const subject = 'Welcome to 52 ગામ કડવા પટેલ સમાજ!';
    const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,sans-serif;background-color:#f4f4f4;">
        <table width="100%" style="max-width:600px;margin:0 auto;background-color:#ffffff;">
            <tr><td style="padding:40px 30px;background:linear-gradient(135deg,#16A34A 0%,#064E3B 100%);text-align:center;"><h1 style="color:#fff;margin:0;">🎉 Welcome!</h1></td></tr>
            <tr><td style="padding:40px 30px;">
                <h2 style="color:#333;">Hello ${name}!</h2>
                <p style="color:#666;line-height:1.6;">Welcome to 52 ગામ કડવા પટેલ સમાજ! Your registration is pending approval by our admin team.</p>
                <ul style="color:#666;"><li>Search our community directory</li><li>Connect with members from all villages</li><li>Find people by profession</li></ul>
            </td></tr>
            <tr><td style="padding:20px 30px;background-color:#f8f9fa;text-align:center;"><p style="color:#999;font-size:12px;">&copy; ${new Date().getFullYear()} 52 ગામ કડવા પટેલ સમાજ</p></td></tr>
        </table>
    </body>
    </html>`;


    return sendEmail(email, subject, html);
}

async function sendApprovalEmail(email, name, approved = true) {
    const subject = approved
        ? '✅ Your 52 ગામ કડવા પટેલ સમાજ Profile is Approved!'
        : '❌ 52 ગામ કડવા પટેલ સમાજ Registration Update';

    const html = approved ? `
    <!DOCTYPE html>
    <html>
    <body style="margin:0;padding:0;font-family:sans-serif;background-color:#f4f4f4;">
        <table width="100%" style="max-width:600px;margin:0 auto;background-color:#ffffff;">
            <tr><td style="padding:40px;background:linear-gradient(135deg,#16A34A 0%,#064E3B 100%);text-align:center;"><h1 style="color:#fff;margin:0;">🎉 Approved!</h1></td></tr>
            <tr><td style="padding:40px;">
                <h2 style="color:#333;">Congratulations ${name}!</h2>
                <p style="color:#666;line-height:1.6;">Your profile has been approved! You can now search the community directory and connect with members.</p>
            </td></tr>
        </table>
    </body>
    </html>` : `
    <!DOCTYPE html>
    <html>
    <body style="margin:0;padding:0;font-family:sans-serif;background-color:#f4f4f4;">
        <table width="100%" style="max-width:600px;margin:0 auto;background-color:#ffffff;">
            <tr><td style="padding:40px;background:#f5576c;text-align:center;"><h1 style="color:#fff;margin:0;">Registration Update</h1></td></tr>
            <tr><td style="padding:40px;">
                <h2 style="color:#333;">Hello ${name},</h2>
                <p style="color:#666;line-height:1.6;">Unfortunately, your registration could not be approved at this time. Please contact the admin.</p>
            </td></tr>
        </table>
    </body>
    </html>`;


    return sendEmail(email, subject, html);
}

module.exports = { sendOTPEmail, sendWelcomeEmail, sendApprovalEmail };
