-- ADVANCED PRODUCTION-LEVEL MYSQL QUERIES FOR SMART ROOM FINDER

-- ==========================================
-- 1. Insert User & Owner Using Transactions
-- ==========================================
-- (This should be run within a transaction block in Node.js, e.g., connection.beginTransaction())
START TRANSACTION;
INSERT INTO users (name, email, password, role) 
VALUES ('John Owner', 'owner@example.com', '$2y$10$hashedpassword...', 'owner');
-- Get LAST_INSERT_ID() in the backend, then:
SET @user_id = LAST_INSERT_ID();
INSERT INTO owners (user_id, contact_number) VALUES (@user_id, '1234567890');
COMMIT;

-- ==========================================
-- 2. Login Query
-- ==========================================
-- Fetch user and fetch joined data if they are an owner
SELECT u.id, u.name, u.email, u.password, u.role, o.kyc_status, o.contact_number 
FROM users u
LEFT JOIN owners o ON u.id = o.user_id
WHERE u.email = 'owner@example.com';

-- ==========================================
-- 3. Add Room & Insert Images (Transactions)
-- ==========================================
START TRANSACTION;
INSERT INTO rooms (owner_id, type, price_monthly, area, location, contact, description)
VALUES (2, '1BHK', 15000.00, '500 sqft', 'Mumbai, Andheri East', '9876543210', 'Lovely 1BHK near station');

SET @room_id = LAST_INSERT_ID();
-- Batch insert images
INSERT INTO room_images (room_id, image_url, is_primary) VALUES
(@room_id, '/uploads/img1.jpg', 1),
(@room_id, '/uploads/img2.jpg', 0),
(@room_id, '/uploads/img3.jpg', 0),
(@room_id, '/uploads/img4.jpg', 0),
(@room_id, '/uploads/img5.jpg', 0);
COMMIT;

-- ==========================================
-- 4. Filter Rooms Dynamically
-- ==========================================
-- Example filtering by Location, Type, and Price with Pagination
SELECT r.id, r.type, r.price_monthly, r.location, r.is_booked, 
       (SELECT image_url FROM room_images ri WHERE ri.room_id = r.id AND ri.is_primary = 1 LIMIT 1) as primary_image,
       u.name as owner_name
FROM rooms r
JOIN users u ON r.owner_id = u.id
WHERE r.is_booked = 0
  AND r.location LIKE '%Mumbai%' 
  AND r.type = '1BHK'
  AND r.price_monthly <= 20000
ORDER BY r.created_at DESC
LIMIT 10 OFFSET 0;

-- ==========================================
-- 5. Get Room Details (JOIN)
-- ==========================================
SELECT r.*, u.name as owner_name, u.email as owner_email,
       JSON_ARRAYAGG(ri.image_url) as photos
FROM rooms r
JOIN users u ON r.owner_id = u.id
LEFT JOIN room_images ri ON r.id = ri.room_id
WHERE r.id = 1
GROUP BY r.id;

-- ==========================================
-- 6. Booking Creation (PENDING)
-- ==========================================
START TRANSACTION;
INSERT INTO bookings (user_id, room_id, duration, status, total_price)
VALUES (10, 1, '3 Months', 'pending', 45000.00);

-- Update room status to booked to prevent double booking
UPDATE rooms SET is_booked = 1 WHERE id = 1;
COMMIT;

-- ==========================================
-- 7. Update Booking Status / Commission Lifecycle
-- ==========================================
-- When Admin confirms the booking, a commission is generated for the owner
START TRANSACTION;
UPDATE bookings SET status = 'confirmed' WHERE id = 15;

-- Calculate 5% commission based on the booking total_price
INSERT INTO commissions (booking_id, owner_id, amount, status, due_date)
SELECT b.id, r.owner_id, (b.total_price * 0.05), 'pending', DATE_ADD(CURRENT_DATE, INTERVAL 7 DAY)
FROM bookings b
JOIN rooms r ON b.room_id = r.id
WHERE b.id = 15;
COMMIT;

-- ==========================================
-- 8. Admin Dashboard Aggregation
-- ==========================================
SELECT 
  (SELECT COUNT(*) FROM users WHERE role = 'user') as total_tenants,
  (SELECT COUNT(*) FROM users WHERE role = 'owner') as total_owners,
  (SELECT COUNT(*) FROM rooms) as total_rooms,
  (SELECT COUNT(*) FROM bookings WHERE status = 'confirmed') as successful_bookings,
  (SELECT SUM(amount) FROM payments WHERE status = 'success') as total_revenue,
  (SELECT SUM(amount) FROM commissions WHERE status = 'paid') as collected_commissions;
