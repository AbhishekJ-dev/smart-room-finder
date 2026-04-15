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
        <div style="background-color: #f4f7f9; padding: 50px 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
            <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05); text-align: center;">
                <!-- Header -->
                <div style="background-color: #2196F3; padding: 30px;">
                    <h2 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">Verify Your Email 🔐</h2>
                </div>
                
                <!-- Body -->
                <div style="padding: 40px 30px;">
                    <p style="color: #546e7a; font-size: 16px; margin-bottom: 25px;">Hello,</p>
                    <p style="color: #546e7a; font-size: 16px; margin-bottom: 25px;">Your OTP for verification is:</p>
                    
                    <div style="background-color: #e3f2fd; padding: 25px; border-radius: 12px; margin: 20px 0; border: 2px solid #bbdefb;">
                        <span style="font-size: 38px; font-weight: 800; color: #1565c0; letter-spacing: 8px;">${otp}</span>
                    </div>
                    
                    <div style="margin-top: 30px; padding: 15px; background-color: #fff9c4; border-radius: 8px; border: 1px solid #fff176;">
                        <p style="color: #f57f17; font-size: 13px; font-weight: 600; margin: 0;">⚠️ Security Notice</p>
                        <p style="color: #f57f17; font-size: 13px; margin: 5px 0 0 0;">OTP valid for 5 minutes. Do not share this OTP with anyone.</p>
                    </div>
                </div>
                
                <!-- Footer -->
                <div style="padding: 25px; background-color: #fafafa; border-top: 1px solid #eeeeee;">
                    <p style="color: #90a4ae; font-size: 12px; line-height: 1.5; margin: 0;">
                        If you didn't request this, you can safely ignore this email.
                        <br>
                        © 2026 Smart Room Finder. Modern Living, Simplified.
                    </p>
                </div>
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
