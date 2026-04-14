require('dotenv').config();
const { sendOTP } = require('./utils/otpService');

async function test() {
    console.log('Testing Brevo with:');
    console.log('API KEY:', process.env.BREVO_API_KEY ? 'EXISTS' : 'MISSING');
    console.log('SENDER:', process.env.EMAIL_FROM);
    
    const res = await sendOTP('abhishekj.mca@gmail.com', '123456', 'verification');
    console.log('Result:', res);
}

test();
