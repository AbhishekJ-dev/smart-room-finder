const express = require('express');
const db = require('../config/db');
const jwt = require('jsonwebtoken');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const notificationService = require('../utils/notificationService');
const router = express.Router();

// Initialize Razorpay
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder_key',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'placeholder_secret_key',
});

// Auth middleware (extracted for reuse)
const auth = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token || token === 'null') return res.status(401).json({ message: 'No token, access denied' });
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'smart_room_finder_secret');
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ message: 'Invalid token' });
    }
};

// ─── GET AVAILABLE PLANS ───
router.get('/plans', async (req, res) => {
    try {
        const [plans] = await db.execute('SELECT * FROM subscription_plans WHERE is_active = 1 ORDER BY price ASC');
        res.json(plans);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch plans' });
    }
});

// ─── STEP 1: CREATE RAZORPAY ORDER ───
router.post('/create-order', auth, async (req, res) => {
    try {
        const { planId } = req.body;
        if (!planId) return res.status(400).json({ message: 'Plan ID is required' });

        // 1. Fetch Plan Details
        const [plans] = await db.execute('SELECT * FROM subscription_plans WHERE id = ?', [planId]);
        if (plans.length === 0) return res.status(404).json({ message: 'Plan not found' });
        const plan = plans[0];

        // 2. Create Razorpay Order
        const options = {
            amount: Math.round(plan.price * 100), // Razorpay expects amount in paise (1 INR = 100 Paise)
            currency: 'INR',
            receipt: `receipt_plan_${planId}_user_${req.user.id}_${Date.now()}`,
        };

        const order = await razorpay.orders.create(options);

        // 3. Store pending subscription in DB
        await db.execute(
            `INSERT INTO subscriptions (user_id, plan_id, price, razorpay_order_id, payment_status, is_active) 
             VALUES (?, ?, ?, ?, 'PENDING', false)`,
            [req.user.id, planId, plan.price, order.id]
        );

        res.status(201).json({
            orderId: order.id,
            amount: options.amount,
            currency: options.currency,
            planName: plan.name
        });
    } catch (error) {
        console.error('Razorpay Order Error:', error);
        res.status(500).json({ message: 'Failed to initiate payment. Check API keys.' });
    }
});

// ─── STEP 2: VERIFY PAYMENT & ACTIVATE ───
router.post('/verify-payment', auth, async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        // 1. Verify Signature
        const sign = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSign = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || 'placeholder_secret_key')
            .update(sign.toString())
            .digest("hex");

        if (razorpay_signature !== expectedSign) {
            return res.status(400).json({ message: "Invalid payment signature" });
        }

        // 2. Fetch the pending subscription
        const [subs] = await db.execute(
            'SELECT * FROM subscriptions WHERE razorpay_order_id = ? AND user_id = ?',
            [razorpay_order_id, req.user.id]
        );

        if (subs.length === 0) return res.status(404).json({ message: 'Subscription record not found' });
        const sub = subs[0];

        // 3. Fetch plan to calculate duration
        const [plans] = await db.execute('SELECT duration_days FROM subscription_plans WHERE id = ?', [sub.plan_id]);
        const duration = plans[0].duration_days;

        // 4. Activate Subscription
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + duration);

        await db.execute(
            `UPDATE subscriptions 
             SET payment_status = 'SUCCESS', is_active = true, 
                 razorpay_payment_id = ?, start_date = ?, end_date = ? 
             WHERE razorpay_order_id = ?`,
            [razorpay_payment_id, startDate, endDate, razorpay_order_id]
        );

        // Fetch user and plan details for email notification
        const [[user]] = await db.execute('SELECT id, name, email FROM users WHERE id = ?', [req.user.id]);
        const [[plan]] = await db.execute('SELECT name FROM subscription_plans WHERE id = ?', [sub.plan_id]);

        if (user && plan) {
            notificationService.sendSubscriptionConfirmation(user, plan.name, endDate).catch(err => console.error('Subscription email error:', err));
        }

        res.json({ message: 'Subscription activated successfully!', endDate });
    } catch (error) {
        console.error('Payment Verification Error:', error);
        res.status(500).json({ message: 'Internal server error during verification' });
    }
});

// ─── STATUS CHECK ───
router.get('/status', auth, async (req, res) => {
    try {
        const [subs] = await db.execute(
            `SELECT s.*, p.name as plan_name 
             FROM subscriptions s 
             JOIN subscription_plans p ON s.plan_id = p.id
             WHERE s.user_id = ? AND s.is_active = true AND s.end_date >= NOW() 
             ORDER BY s.end_date DESC LIMIT 1`,
            [req.user.id]
        );

        if (subs.length === 0) {
            return res.json({ isSubscribed: false });
        }

        const sub = subs[0];
        const daysRemaining = Math.max(0, Math.ceil((new Date(sub.end_date) - new Date()) / (1000 * 60 * 60 * 24)));
        
        res.json({
            isSubscribed: true,
            daysRemaining,
            plan_name: sub.plan_name,
            end_date: sub.end_date
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
