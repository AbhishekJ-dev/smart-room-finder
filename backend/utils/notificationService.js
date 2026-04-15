const { sendEmail } = require('./emailService');
const db = require('../config/db');

/**
 * Generates a consistent HTML wrapper for all emails
 */
const generateEmailTemplate = (title, content) => {
    return `
    <div style="background-color: #f4f4f4; padding: 40px 10px; font-family: 'Segoe UI', Arial, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
            <!-- Header -->
            <div style="background-color: #4CAF50; padding: 30px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 700; letter-spacing: -0.5px;">Smart Room Finder</h1>
            </div>
            
            <!-- Content -->
            <div style="padding: 40px; color: #333333;">
                <h2 style="color: #1a1a1a; margin-top: 0; margin-bottom: 20px; font-size: 22px;">${title}</h2>
                <div style="line-height: 1.6; font-size: 16px; color: #555555;">
                    ${content}
                </div>
            </div>
            
            <!-- Footer -->
            <div style="padding: 30px; background-color: #fafafa; border-top: 1px solid #eeeeee; text-align: center;">
                <p style="margin: 0; font-size: 14px; color: #777777; font-weight: 600;">Thank you for using Smart Room Finder</p>
                <p style="margin: 10px 0 0 0; font-size: 13px; color: #999999;">
                    Need help? Contact our support at <a href="mailto:support@smartroomfinder.com" style="color: #4CAF50; text-decoration: none; font-weight: bold;">support@smartroomfinder.com</a>
                </p>
            </div>
        </div>
        <div style="text-align: center; margin-top: 20px; color: #999999; font-size: 12px;">
            &copy; 2026 Smart Room Finder. Modern Living, Simplified.
        </div>
    </div>
    `;
};

/**
 * Creates an in-app notification in the database
 */
const createInAppNotification = async (userId, message, type) => {
    try {
        await db.execute(
            'INSERT INTO notifications (user_id, message, type) VALUES (?, ?, ?)',
            [userId, message, type]
        );
    } catch (error) {
        console.error('Error creating in-app notification:', error);
    }
};

/**
 * High-level service for sending branded notifications (Email + In-App)
 */
const notificationService = {
    /**
     * Send Welcome Back email on login
     */
    sendLoginNotification: async (user) => {
        const subject = 'Successful Login - Smart Room Finder';
        const title = 'Welcome Back 👋';
        const messageText = `Login successful! Welcome back, ${user.name}.`;
        const content = `
            <p>Hello <strong>${user.name}</strong>,</p>
            <p style="background-color: #e8f5e9; padding: 15px; border-radius: 8px; color: #2e7d32; font-weight: 500;">
                Login successful! We're glad to see you again.
            </p>
            <p>If this login was not performed by you, please secure your account immediately.</p>
        `;

        const htmlContent = generateEmailTemplate(title, content);

        try {
            // Send Email
            sendEmail({ toEmail: user.email, subject, htmlContent }).catch(err => console.error('Login email error:', err));
            
            // Create in-app notification
            if (user.id) {
                createInAppNotification(user.id, messageText, 'login');
            }
        } catch (error) {
            console.error('Error sending login notification:', error);
        }
    },

    /**
     * Send Subscription Confirmation
     */
    sendSubscriptionConfirmation: async (user, planName, expiryDate) => {
        const subject = 'Subscription Activated! - Smart Room Finder';
        const title = 'Subscription Activated 💳';
        const formattedDate = new Date(expiryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
        const messageText = `Subscription activated! Your ${planName} plan is active until ${formattedDate}.`;
        
        const content = `
            <p>Hello <strong>${user.name}</strong>,</p>
            <p>Your premium features have been unlocked! Your subscription is now active.</p>
            
            <div style="margin: 25px 0; padding: 20px; border: 1px dashed #4CAF50; border-radius: 10px; background-color: #f9fff9;">
                <p style="margin: 0; font-size: 15px;"><strong>Plan:</strong> ${planName}</p>
                <p style="margin: 8px 0 0 0; font-size: 15px;"><strong>Duration:</strong> Pro Tier Access</p>
                <p style="margin: 8px 0 0 0; font-size: 15px;"><strong>Expiry Date:</strong> ${formattedDate}</p>
            </div>
            
            <p>You can now book unlimited rooms and view owner contact details directly.</p>
        `;

        const htmlContent = generateEmailTemplate(title, content);

        try {
            sendEmail({ toEmail: user.email, subject, htmlContent }).catch(err => console.error('Subscription email error:', err));
            if (user.id) {
                createInAppNotification(user.id, messageText, 'subscription');
            }
        } catch (error) {
            console.error('Error sending subscription confirmation:', error);
        }
    },

    /**
     * Send Booking Alert to Owner
     */
    sendBookingAlertToOwner: async (ownerId, ownerEmail, tenantEmail, tenantName, roomDetails) => {
        const subject = 'New Booking Alert! - Smart Room Finder';
        const title = 'New Booking Alert 🔔';
        const messageText = `New booking request from ${tenantName} for your property in ${roomDetails.area}.`;
        const content = `
            <p>Hello,</p>
            <p>You have a new booking request for your property.</p>
            
            <div style="margin: 25px 0; border: 1px solid #eeeeee; border-radius: 10px; overflow: hidden;">
                <div style="background-color: #f8fafc; padding: 12px 20px; border-bottom: 1px solid #eeeeee; font-weight: bold; color: #333;">
                    Tenant Information
                </div>
                <div style="padding: 15px 20px;">
                    <p style="margin: 0;"><strong>Name:</strong> ${tenantName}</p>
                    <p style="margin: 5px 0 0 0;"><strong>Email:</strong> ${tenantEmail}</p>
                </div>
                
                <div style="background-color: #f8fafc; padding: 12px 20px; border-top: 1px solid #eeeeee; border-bottom: 1px solid #eeeeee; font-weight: bold; color: #333;">
                    Property Details
                </div>
                <div style="padding: 15px 20px;">
                    <p style="margin: 0;"><strong>Type:</strong> ${roomDetails.type}</p>
                    <p style="margin: 5px 0 0 0;"><strong>Location:</strong> ${roomDetails.area}, ${roomDetails.city}</p>
                </div>
            </div>
            
            <p>Please log in to your dashboard to respond to this request.</p>
        `;

        const htmlContent = generateEmailTemplate(title, content);

        try {
            sendEmail({ toEmail: ownerEmail, subject, htmlContent }).catch(err => console.error('Owner booking email error:', err));
            createInAppNotification(ownerId, messageText, 'booking_request');
        } catch (error) {
            console.error('Error sending booking alert to owner:', error);
        }
    },

    /**
     * Send Booking Status Update to Tenant
     */
    sendBookingStatusUpdateToTenant: async (tenantId, tenantEmail, tenantName, roomDetails, status) => {
        const isConfirmed = status === 'confirmed';
        const subject = isConfirmed ? 'Booking Confirmed 🏠' : 'Booking Update - Smart Room Finder';
        const title = isConfirmed ? 'Booking Confirmed 🏠' : 'Booking Request Update';
        const messageText = `Your booking in ${roomDetails.area} has been ${status}.`;
        
        const content = `
            <p>Hello <strong>${tenantName}</strong>,</p>
            <p>Your booking request has been <strong>${status}</strong> by the property owner.</p>
            
            <div style="margin: 25px 0; padding: 20px; border-left: 4px solid ${isConfirmed ? '#4CAF50' : '#f44336'}; background-color: #f9f9f9; border-radius: 0 8px 8px 0;">
                <p style="margin: 0;"><strong>Property City:</strong> ${roomDetails.city}</p>
                <p style="margin: 8px 0 0 0;"><strong>Main Area:</strong> ${roomDetails.area}</p>
                <p style="margin: 8px 0 0 0;"><strong>Booking Date:</strong> ${new Date().toLocaleDateString()}</p>
            </div>
            
            ${isConfirmed ? '<p>Congratulations! You can now proceed with the move-in process.</p>' : '<p>Please feel free to browse other available rooms on our platform.</p>'}
        `;

        const htmlContent = generateEmailTemplate(title, content);

        try {
            sendEmail({ toEmail: tenantEmail, subject, htmlContent }).catch(err => console.error('Tenant booking status email error:', err));
            createInAppNotification(tenantId, messageText, isConfirmed ? 'booking_confirmed' : 'booking_rejected');
        } catch (error) {
            console.error('Error sending booking status update to tenant:', error);
        }
    }
};

module.exports = notificationService;
