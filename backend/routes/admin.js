const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../../public/uploads/facilities');
        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Generate unique filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: function (req, file, cb) {
        // Accept only image files
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
            return cb(new Error('Only image files are allowed'), false);
        }
        cb(null, true);
    }
});

// Get dashboard statistics
router.get('/stats', authenticateToken, requireAdmin, async (req, res) => {
    try {
        // Total users
        const [userCount] = await db.query('SELECT COUNT(*) as count FROM users');
        
        // Total facilities
        const [facilityCount] = await db.query('SELECT COUNT(*) as count FROM facilities WHERE status = "active"');
        
        // Today's bookings
        const [todayBookings] = await db.query(
            'SELECT COUNT(*) as count FROM bookings WHERE DATE(created_at) = CURDATE()'
        );
        
        // Upcoming bookings
        const [upcomingBookings] = await db.query(
            'SELECT COUNT(*) as count FROM bookings WHERE booking_date >= CURDATE() AND booking_status = "confirmed"'
        );
        
        // Total revenue
        const [revenue] = await db.query(
            'SELECT SUM(amount) as total FROM bookings WHERE booking_status = "confirmed" AND payment_status = "paid"'
        );
        
        // Most booked sport
        const [sportStats] = await db.query(
            `SELECT f.sport_type, COUNT(*) as count
             FROM bookings b
             JOIN facilities f ON b.facility_id = f.id
             GROUP BY f.sport_type
             ORDER BY count DESC
             LIMIT 1`
        );
        
        // Facility usage statistics
        const [facilityUsage] = await db.query(
            `SELECT f.name, COUNT(b.id) as booking_count
             FROM facilities f
             LEFT JOIN bookings b ON f.id = b.facility_id
             GROUP BY f.id
             ORDER BY booking_count DESC
             LIMIT 5`
        );

        res.json({
            stats: {
                total_users: userCount[0].count,
                total_facilities: facilityCount[0].count,
                today_bookings: todayBookings[0].count,
                upcoming_bookings: upcomingBookings[0].count,
                total_revenue: revenue[0].total || 0,
                most_booked_sport: sportStats.length > 0 ? sportStats[0].sport_type : 'N/A',
                facility_usage: facilityUsage
            }
        });
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ error: 'Failed to fetch statistics' });
    }
});

// Manage Facilities

// Add facility
router.post('/facilities', authenticateToken, requireAdmin, upload.single('image'), async (req, res) => {
    try {
        const { name, sport_type, location, description, price_per_hour } = req.body;
        let imagePath = null;

        // Handle uploaded image
        if (req.file) {
            imagePath = `/uploads/facilities/${req.file.filename}`;
        }

        if (!name || !sport_type || !location || !price_per_hour) {
            return res.status(400).json({ error: 'Name, sport type, location, and price are required' });
        }

        const [result] = await db.query(
            'INSERT INTO facilities (name, sport_type, location, description, price_per_hour, image, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [name, sport_type, location, description || null, price_per_hour, imagePath, 'active']
        );

        res.status(201).json({
            message: 'Facility added successfully',
            facility_id: result.insertId
        });
    } catch (error) {
        console.error('Add facility error:', error);
        res.status(500).json({ error: 'Failed to add facility' });
    }
});

// Update facility
router.put('/facilities/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, sport_type, location, description, price_per_hour, image, status } = req.body;

        const [result] = await db.query(
            'UPDATE facilities SET name = ?, sport_type = ?, location = ?, description = ?, price_per_hour = ?, image = ?, status = ? WHERE id = ?',
            [name, sport_type, location, description, price_per_hour, image, status, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Facility not found' });
        }

        res.json({ message: 'Facility updated successfully' });
    } catch (error) {
        console.error('Update facility error:', error);
        res.status(500).json({ error: 'Failed to update facility' });
    }
});

// Delete facility
router.delete('/facilities/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await db.query('DELETE FROM facilities WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Facility not found' });
        }

        res.json({ message: 'Facility deleted successfully' });
    } catch (error) {
        console.error('Delete facility error:', error);
        res.status(500).json({ error: 'Failed to delete facility' });
    }
});

// Manage Time Slots

// Add time slots for a facility
router.post('/slots', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { facility_id, date, start_time, end_time } = req.body;

        if (!facility_id || !date || !start_time || !end_time) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        const [result] = await db.query(
            'INSERT INTO time_slots (facility_id, date, start_time, end_time, status) VALUES (?, ?, ?, ?, ?)',
            [facility_id, date, start_time, end_time, 'available']
        );

        res.status(201).json({
            message: 'Time slot added successfully',
            slot_id: result.insertId
        });
    } catch (error) {
        console.error('Add slot error:', error);
        res.status(500).json({ error: 'Failed to add time slot' });
    }
});

// Update time slot status
router.put('/slots/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['available', 'booked', 'unavailable'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const [result] = await db.query(
            'UPDATE time_slots SET status = ? WHERE id = ?',
            [status, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Time slot not found' });
        }

        res.json({ message: 'Time slot updated successfully' });
    } catch (error) {
        console.error('Update slot error:', error);
        res.status(500).json({ error: 'Failed to update time slot' });
    }
});

// Get daily schedule
router.get('/slots/daily', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { date, facility_id } = req.query;

        let query = `
            SELECT ts.*, f.name as facility_name
            FROM time_slots ts
            JOIN facilities f ON ts.facility_id = f.id
            WHERE 1=1
        `;
        
        const params = [];

        if (date) {
            query += ' AND ts.date = ?';
            params.push(date);
        }

        if (facility_id) {
            query += ' AND ts.facility_id = ?';
            params.push(facility_id);
        }

        query += ' ORDER BY ts.date, ts.start_time';

        const [slots] = await db.query(query, params);
        res.json({ slots });
    } catch (error) {
        console.error('Get daily schedule error:', error);
        res.status(500).json({ error: 'Failed to fetch schedule' });
    }
});

// Manage Bookings

// Get all bookings
router.get('/bookings', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { date, facility_id, status, search } = req.query;

        let query = `
            SELECT b.*, u.name as user_name, u.email as user_email, f.name as facility_name
            FROM bookings b
            JOIN users u ON b.user_id = u.id
            JOIN facilities f ON b.facility_id = f.id
            WHERE 1=1
        `;
        
        const params = [];

        if (date) {
            query += ' AND b.booking_date = ?';
            params.push(date);
        }

        if (facility_id) {
            query += ' AND b.facility_id = ?';
            params.push(facility_id);
        }

        if (status) {
            query += ' AND b.booking_status = ?';
            params.push(status);
        }

        if (search) {
            query += ' AND (b.booking_id LIKE ? OR u.name LIKE ? OR u.email LIKE ?)';
            params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }

        query += ' ORDER BY b.created_at DESC';

        const [bookings] = await db.query(query, params);
        res.json({ bookings });
    } catch (error) {
        console.error('Get bookings error:', error);
        res.status(500).json({ error: 'Failed to fetch bookings' });
    }
});

// Cancel booking (admin)
router.put('/bookings/:id/cancel', authenticateToken, requireAdmin, async (req, res) => {
    const connection = await db.getConnection();
    
    try {
        await connection.beginTransaction();
        
        const { id } = req.params;

        // Get booking
        const [bookings] = await connection.query(
            'SELECT * FROM bookings WHERE id = ? FOR UPDATE',
            [id]
        );

        if (bookings.length === 0) {
            await connection.rollback();
            return res.status(404).json({ error: 'Booking not found' });
        }

        const booking = bookings[0];

        // Update booking status
        await connection.query(
            'UPDATE bookings SET booking_status = ?, payment_status = ? WHERE id = ?',
            ['cancelled', 'refunded', id]
        );

        // Make slot available again
        await connection.query(
            'UPDATE time_slots SET status = ? WHERE id = ?',
            ['available', booking.slot_id]
        );

        await connection.commit();

        res.json({ message: 'Booking cancelled successfully' });
    } catch (error) {
        await connection.rollback();
        console.error('Cancel booking error:', error);
        res.status(500).json({ error: 'Failed to cancel booking' });
    } finally {
        connection.release();
    }
});

// Manage Users

// Get all users
router.get('/users', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { search, status } = req.query;

        let query = 'SELECT id, name, email, phone, role, status, created_at FROM users WHERE 1=1';
        const params = [];

        if (search) {
            query += ' AND (name LIKE ? OR email LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }

        if (status) {
            query += ' AND status = ?';
            params.push(status);
        }

        query += ' ORDER BY created_at DESC';

        const [users] = await db.query(query, params);
        res.json({ users });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// Activate/deactivate user
router.put('/users/:id/status', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['active', 'inactive'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const [result] = await db.query(
            'UPDATE users SET status = ? WHERE id = ?',
            [status, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ message: 'User status updated successfully' });
    } catch (error) {
        console.error('Update user status error:', error);
        res.status(500).json({ error: 'Failed to update user status' });
    }
});

module.exports = router;
