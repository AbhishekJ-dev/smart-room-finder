const { sendEmail } = require('./emailService');
const pool = require('../config/db');

// ── Email Template Wrapper ────────────────────────────────────────────────────
const generateEmailTemplate = (title, content) => {
    return `
    <div style="background-color:#f4f4f4;padding:40px 10px;font-family:'Segoe UI',Arial,sans-serif;">
        <div style="max-width:600px;margin:0 auto;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 15px rgba(0,0,0,0.05);">
            <!-- Header -->
            <div style="background-color:#4CAF50;padding:30px;text-align:center;">
                <h1 style="color:#ffffff;margin:0;font-size:26px;font-weight:700;letter-spacing:-0.5px;">Smart Room Finder</h1>
            </div>
            <!-- Content -->
            <div style="padding:40px;color:#333333;">
                <h2 style="color:#1a1a1a;margin-top:0;margin-bottom:20px;font-size:22px;">${title}</h2>
                <div style="line-height:1.6;font-size:16px;color:#555555;">
                    ${content}
                </div>
            </div>
            <!-- Footer -->
            <div style="padding:30px;background-color:#fafafa;border-top:1px solid #eeeeee;text-align:center;">
                <p style="margin:0;font-size:14px;color:#777777;font-weight:600;">Thank you for using Smart Room Finder</p>
                <p style="margin:10px 0 0 0;font-size:13px;color:#999999;">
                    Need help? Contact us at <a href="mailto:support@smartroomfinder.com" style="color:#4CAF50;text-decoration:none;font-weight:bold;">support@smartroomfinder.com</a>
                </p>
            </div>
        </div>
        <div style="text-align:center;margin-top:20px;color:#999999;font-size:12px;">
            &copy; 2026 Smart Room Finder. Modern Living, Simplified.
        </div>
    </div>
    `;
};

// ── In-App Notification (DB) ──────────────────────────────────────────────────
const createInAppNotification = async (userId, title, message, type) => {
    try {
        await pool.query(
            'INSERT INTO notifications (user_id, title, message, type) VALUES ($1, $2, $3, $4)',
            [userId, title, message, type]
        );
    } catch (error) {
        console.error('[notif] createInAppNotification error:', error.message);
    }
};

// ── Notification Service ──────────────────────────────────────────────────────
const notificationService = {

    /**
     * Send Welcome Back email and in-app notification on login
     */
    sendLoginNotification: async (user) => {
        const subject = 'Successful Login — Smart Room Finder';
        const title   = 'Welcome Back 👋';
        const message = `Login successful! Welcome back, ${user.name}.`;
        const content = `
            <p>Hello <strong>${user.name}</strong>,</p>
            <p style="background-color:#e8f5e9;padding:15px;border-radius:8px;color:#2e7d32;font-weight:500;">
                You have successfully logged in. We're glad to see you again!
            </p>
            <p>If this login was not performed by you, please secure your account immediately.</p>
        `;
        const htmlContent = generateEmailTemplate(title, content);

        // Fire-and-forget — never block the login response
        sendEmail({ toEmail: user.email, subject, htmlContent })
            .catch(err => console.error('[notif] login email error:', err.message));

        if (user.id) {
            createInAppNotification(user.id, title, message, 'login');
        }
    },

    /**
     * Send subscription confirmation email and in-app notification
     */
    sendSubscriptionConfirmation: async (user, planName, expiryDate) => {
        const subject = 'Subscription Activated! — Smart Room Finder';
        const title   = 'Subscription Activated 💳';
        const formattedDate = new Date(expiryDate).toLocaleDateString('en-IN', {
            day: 'numeric', month: 'long', year: 'numeric'
        });
        const message = `Subscription activated! Your ${planName} plan is active until ${formattedDate}.`;
        const content = `
            <p>Hello <strong>${user.name}</strong>,</p>
            <p>Your premium features have been unlocked!</p>
            <div style="margin:25px 0;padding:20px;border:1px dashed #4CAF50;border-radius:10px;background-color:#f9fff9;">
                <p style="margin:0;font-size:15px;"><strong>Plan:</strong> ${planName}</p>
                <p style="margin:8px 0 0 0;font-size:15px;"><strong>Expiry Date:</strong> ${formattedDate}</p>
            </div>
            <p>You can now book unlimited rooms and view owner contact details directly.</p>
        `;
        const htmlContent = generateEmailTemplate(title, content);

        sendEmail({ toEmail: user.email, subject, htmlContent })
            .catch(err => console.error('[notif] subscription email error:', err.message));

        if (user.id) {
            createInAppNotification(user.id, title, message, 'subscription');
        }
    },

    /**
     * Send booking alert to owner
     */
    sendBookingAlertToOwner: async (ownerId, ownerEmail, tenantEmail, tenantName, roomDetails) => {
        const subject = 'New Booking Alert! — Smart Room Finder';
        const title   = 'New Booking Alert 🔔';
        const message = `New booking request from ${tenantName} for your property in ${roomDetails.area}.`;
        const content = `
            <p>Hello,</p>
            <p>You have a new booking request for your property.</p>
            <div style="margin:25px 0;border:1px solid #eeeeee;border-radius:10px;overflow:hidden;">
                <div style="background-color:#f8fafc;padding:12px 20px;border-bottom:1px solid #eeeeee;font-weight:bold;color:#333;">
                    Tenant Information
                </div>
                <div style="padding:15px 20px;">
                    <p style="margin:0;"><strong>Name:</strong> ${tenantName}</p>
                    <p style="margin:5px 0 0 0;"><strong>Email:</strong> ${tenantEmail}</p>
                </div>
                <div style="background-color:#f8fafc;padding:12px 20px;border-top:1px solid #eeeeee;border-bottom:1px solid #eeeeee;font-weight:bold;color:#333;">
                    Property Details
                </div>
                <div style="padding:15px 20px;">
                    <p style="margin:0;"><strong>Type:</strong> ${roomDetails.type}</p>
                    <p style="margin:5px 0 0 0;"><strong>Location:</strong> ${roomDetails.area}, ${roomDetails.city}</p>
                </div>
            </div>
            <p>Please log in to your dashboard to respond to this request.</p>
        `;
        const htmlContent = generateEmailTemplate(title, content);

        sendEmail({ toEmail: ownerEmail, subject, htmlContent })
            .catch(err => console.error('[notif] owner booking email error:', err.message));

        createInAppNotification(ownerId, title, message, 'booking_request');
    },

    /**
     * Send booking status update to tenant
     */
    sendBookingStatusUpdateToTenant: async (tenantId, tenantEmail, tenantName, roomDetails, status) => {
        const isConfirmed = status === 'confirmed';
        const subject     = isConfirmed ? 'Booking Confirmed 🏠 — Smart Room Finder' : 'Booking Update — Smart Room Finder';
        const title       = isConfirmed ? 'Booking Confirmed 🏠' : 'Booking Request Update';
        const message     = `Your booking in ${roomDetails.area} has been ${status}.`;
        const content = `
            <p>Hello <strong>${tenantName}</strong>,</p>
            <p>Your booking request has been <strong>${status}</strong> by the property owner.</p>
            <div style="margin:25px 0;padding:20px;border-left:4px solid ${isConfirmed ? '#4CAF50' : '#f44336'};background-color:#f9f9f9;border-radius:0 8px 8px 0;">
                <p style="margin:0;"><strong>Property City:</strong> ${roomDetails.city}</p>
                <p style="margin:8px 0 0 0;"><strong>Area:</strong> ${roomDetails.area}</p>
                <p style="margin:8px 0 0 0;"><strong>Booking Date:</strong> ${new Date().toLocaleDateString('en-IN')}</p>
            </div>
            ${isConfirmed
                ? '<p>Congratulations! You can now proceed with the move-in process.</p>'
                : '<p>Please feel free to browse other available rooms on our platform.</p>'
            }
        `;
        const htmlContent = generateEmailTemplate(title, content);

        sendEmail({ toEmail: tenantEmail, subject, htmlContent })
            .catch(err => console.error('[notif] tenant booking status email error:', err.message));

        createInAppNotification(
            tenantId,
            title,
            message,
            isConfirmed ? 'booking_confirmed' : 'booking_rejected'
        );
    },
};

module.exports = notificationService;
