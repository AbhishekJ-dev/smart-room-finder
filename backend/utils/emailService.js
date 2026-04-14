const SibApiV3Sdk = require('sib-api-v3-sdk');

// Configure Brevo API
const defaultClient = SibApiV3Sdk.ApiClient.instance;
const apiKey = defaultClient.authentications['api-key'];
apiKey.apiKey = process.env.BREVO_API_KEY;

const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

/**
 * Sends a transactional email via Brevo
 * @param {Object} options - { toEmail, subject, htmlContent, senderName }
 */
const sendEmail = async ({ toEmail, subject, htmlContent, senderName = "Smart Room Finder" }) => {
    // Basic diagnostic for common key mistake
    if (process.env.BREVO_API_KEY && process.env.BREVO_API_KEY.startsWith('xsmtpsib')) {
        console.warn('⚠️ WARNING: You are using an SMTP Key (xsmtpsib...) instead of a v3 API Key (xkeysib...). This WILL cause "Key not found" errors.');
    }

    try {
        const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
        
        sendSmtpEmail.subject = subject;
        sendSmtpEmail.htmlContent = htmlContent;
        sendSmtpEmail.sender = { 
            name: senderName, 
            email: process.env.EMAIL_FROM 
        };
        sendSmtpEmail.to = [{ email: toEmail }];

        const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
        console.log('✉️ Brevo Email Sent successfully. MessageId:', data.messageId);
        return true;
    } catch (error) {
        console.error('❌ Brevo Email Error:', error.response ? error.response.body : error.message);
        return false;
    }
};

module.exports = { sendEmail };
