const db = require('../config/db');

(async () => {
    try {
        console.log("Creating notifications table...");
        
        const sql = `
            CREATE TABLE IF NOT EXISTS notifications (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                message TEXT NOT NULL,
                type VARCHAR(50),
                is_read BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );
        `;
        
        await db.execute(sql);
        console.log("Notifications table created successfully.");
    } catch (err) {
        console.error("Error creating notifications table:", err);
    } finally {
        process.exit(0);
    }
})();
