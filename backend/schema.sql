-- ============================================================
-- Smart Room Finder — Complete PostgreSQL Schema for Neon
-- Run this once on your Neon database to create all tables.
-- ============================================================

-- ── 1. Users ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id            SERIAL PRIMARY KEY,
    name          VARCHAR(255) NOT NULL,
    email         VARCHAR(255) NOT NULL UNIQUE,
    password      VARCHAR(255) NOT NULL DEFAULT '',
    role          VARCHAR(20)  NOT NULL DEFAULT 'tenant'
                  CHECK (role IN ('tenant','owner','admin','super_admin')),
    is_verified   BOOLEAN      NOT NULL DEFAULT FALSE,
    google_id     VARCHAR(255) UNIQUE,
    otp_code      VARCHAR(10),   -- used for email verification & email-change OTP
    reset_otp     VARCHAR(10),   -- used for password-reset OTP
    otp_expiry    TIMESTAMP,
    is_deleted    BOOLEAN      NOT NULL DEFAULT FALSE,
    deleted_at    TIMESTAMP    NULL,
    created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP    NULL
);
CREATE INDEX IF NOT EXISTS idx_users_email      ON users (email);
CREATE INDEX IF NOT EXISTS idx_users_role       ON users (role);
CREATE INDEX IF NOT EXISTS idx_users_is_deleted ON users (is_deleted);

-- ── 2. Owners Profile ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS owners (
    id             SERIAL PRIMARY KEY,
    user_id        INT NOT NULL UNIQUE,
    kyc_status     VARCHAR(20)  DEFAULT 'pending',
    bank_account   VARCHAR(255),
    ifsc_code      VARCHAR(50),
    contact_number VARCHAR(20),
    created_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_owners_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ── 3. Admins Profile ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admins (
    id          SERIAL PRIMARY KEY,
    user_id     INT NOT NULL UNIQUE,
    permissions TEXT,
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_admins_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ── 4. Rooms ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rooms (
    id               SERIAL PRIMARY KEY,
    owner_id         INT          NOT NULL,
    type             VARCHAR(50)  NOT NULL,
    price_daily      DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    price_weekly     DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    price_monthly    DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    price_quarterly  DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    price_yearly     DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    annual_rent      DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    area             VARCHAR(255) NOT NULL,
    city             VARCHAR(100) NOT NULL DEFAULT '',
    location         VARCHAR(255) NOT NULL,
    contact          VARCHAR(20)  NOT NULL,
    description      TEXT,
    tenant_type      VARCHAR(50)  NOT NULL DEFAULT 'Anyone',
    is_booked        BOOLEAN      NOT NULL DEFAULT FALSE,
    is_deleted       BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP    NULL,
    CONSTRAINT fk_rooms_owner FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_rooms_owner_id  ON rooms (owner_id);
CREATE INDEX IF NOT EXISTS idx_rooms_city      ON rooms (city);
CREATE INDEX IF NOT EXISTS idx_rooms_type      ON rooms (type);
CREATE INDEX IF NOT EXISTS idx_rooms_is_deleted ON rooms (is_deleted);

-- ── 5. Room Images ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS room_images (
    id         SERIAL PRIMARY KEY,
    room_id    INT          NOT NULL,
    image_url  VARCHAR(500) NOT NULL,
    is_primary BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_room_images_room FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_room_images_room_id ON room_images (room_id);

-- ── 6. Subscription Plans ────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscription_plans (
    id            SERIAL PRIMARY KEY,
    name          VARCHAR(255)  NOT NULL,
    price         DECIMAL(10,2) NOT NULL,
    duration_days INT           NOT NULL,
    description   TEXT,
    features      TEXT,
    is_active     BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Default Plans (idempotent)
INSERT INTO subscription_plans (id, name, price, duration_days, description, features, is_active)
VALUES
    (1, '7 Days Trial',     0.00,   7,  '7-day free trial',      'View contact details, Basic search', TRUE),
    (2, '30 Days Premium',  199.00, 30, '30-day premium access',  'Unlimited bookings, Owner contact, Priority support', TRUE)
ON CONFLICT (id) DO NOTHING;

-- Reset sequence so new plans start after 2
SELECT setval('subscription_plans_id_seq', GREATEST((SELECT MAX(id) FROM subscription_plans), 2));

-- ── 7. Subscriptions ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscriptions (
    id                  SERIAL PRIMARY KEY,
    user_id             INT           NOT NULL,
    plan_id             INT           NOT NULL,
    price               DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    start_date          TIMESTAMP     NULL,
    end_date            TIMESTAMP     NULL,
    payment_status      VARCHAR(20)   NOT NULL DEFAULT 'PENDING'
                        CHECK (payment_status IN ('PENDING','SUCCESS','FAILED','REFUNDED')),
    razorpay_order_id   VARCHAR(255)  UNIQUE,
    razorpay_payment_id VARCHAR(255),
    is_active           BOOLEAN       NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_subs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_subs_plan FOREIGN KEY (plan_id) REFERENCES subscription_plans(id)
);
CREATE INDEX IF NOT EXISTS idx_subs_user_id   ON subscriptions (user_id);
CREATE INDEX IF NOT EXISTS idx_subs_is_active ON subscriptions (is_active);

-- ── 8. Bookings ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bookings (
    id             SERIAL PRIMARY KEY,
    user_id        INT           NOT NULL,
    room_id        INT           NOT NULL,
    duration       VARCHAR(50)   NOT NULL,
    start_date     DATE          NULL,
    end_date       DATE          NULL,
    total_price    DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    booking_date   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status         VARCHAR(20)   NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending','confirmed','rejected','completed','cancelled')),
    rating         INT           NULL CHECK (rating >= 1 AND rating <= 5),
    review_comment TEXT,
    CONSTRAINT fk_bookings_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_bookings_room FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings (user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_room_id ON bookings (room_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status  ON bookings (status);

-- ── 9. Commissions ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS commissions (
    id         SERIAL PRIMARY KEY,
    booking_id INT           NOT NULL,
    owner_id   INT           NOT NULL,
    amount     DECIMAL(10,2) NOT NULL,
    status     VARCHAR(20)   NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending','paid','waived')),
    due_date   DATE          NULL,
    paid_at    TIMESTAMP     NULL,
    created_at TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_commission_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    CONSTRAINT fk_commission_owner   FOREIGN KEY (owner_id)   REFERENCES users(id)    ON DELETE CASCADE
);

-- ── 10. Payments ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payments (
    id              SERIAL PRIMARY KEY,
    user_id         INT           NOT NULL,
    booking_id      INT           NULL,
    subscription_id INT           NULL,
    amount          DECIMAL(10,2) NOT NULL,
    currency        VARCHAR(10)   NOT NULL DEFAULT 'INR',
    payment_method  VARCHAR(50),
    transaction_id  VARCHAR(255)  UNIQUE,
    status          VARCHAR(20)   NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','success','failed','refunded')),
    created_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_payments_user         FOREIGN KEY (user_id)         REFERENCES users(id)          ON DELETE CASCADE,
    CONSTRAINT fk_payments_booking      FOREIGN KEY (booking_id)      REFERENCES bookings(id)       ON DELETE SET NULL,
    CONSTRAINT fk_payments_subscription FOREIGN KEY (subscription_id) REFERENCES subscriptions(id)  ON DELETE SET NULL
);

-- ── 11. Notifications ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
    id         SERIAL PRIMARY KEY,
    user_id    INT          NOT NULL,
    title      VARCHAR(255) NOT NULL DEFAULT 'Notification',
    message    TEXT         NOT NULL,
    type       VARCHAR(50)  NOT NULL DEFAULT 'info',
    is_read    BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications (user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications (is_read);
