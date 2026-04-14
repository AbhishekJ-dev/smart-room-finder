const { sendEmail } = require('./emailService');

/**
 * Generates a random 6-digit numeric OTP
 */
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Sends an OTP email using Brevo
 * @param {string} email - Recipient email
 * @param {string} otp - The OTP code
 * @param {string} type - 'verification' or 'change' or 'login'
 */
const sendOTP = async (email, otp, type = 'verification') => {
    const subject = type === 'reset' ? "Password Reset OTP - Smart Room Finder" : "OTP Verification - Smart Room Finder";
    const title = type === 'verification' ? 'Verify Your Account' : 
                  type === 'change' ? 'Change Your Email Address' : 
                  type === 'reset' ? 'Reset Your Password' :
                  'Login Verification';
    
    const htmlContent = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; padding: 40px; border-radius: 16px; background-color: #ffffff;">
            <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #2563eb; margin: 0; font-size: 28px;">Smart Room Finder</h1>
                <p style="color: #64748b; font-size: 14px; margin-top: 5px;">Secure Property Search</p>
            </div>
            
            <div style="background: #f8fafc; padding: 30px; border-radius: 12px; border: 1px solid #f1f5f9; text-align: center;">
                <h3 style="margin-top: 0; color: #1e293b; font-size: 18px;">${title}</h3>
                <p style="color: #475569; font-size: 16px; margin-bottom: 25px;">Please use the following One-Time Password (OTP) to complete your action:</p>
                
                <div style="background: #ffffff; display: inline-block; padding: 15px 40px; border-radius: 10px; border: 2px solid #2563eb; margin-bottom: 20px;">
                    <span style="font-size: 32px; font-weight: 800; color: #1e3a8a; letter-spacing: 5px;">${otp}</span>
                </div>
                
                <p style="color: #ef4444; font-size: 13px; font-weight: 600; margin-top: 10px;">(This code is valid for 5 minutes only)</p>
            </div>
            
            <div style="margin-top: 30px; border-top: 1px solid #f1f5f9; pt-20">
                <p style="font-size: 12px; color: #94a3b8; text-align: center; line-height: 1.6;">
                    If you did not request this verification, you can safely ignore this email.
                    <br>
                    © 2026 Smart Room Finder. All rights reserved.
                </p>
            </div>
        </div>
    `;

    return await sendEmail({
        toEmail: email,
        subject,
        htmlContent
    });
};

module.exports = {
    generateOTP,
    sendOTP
};
