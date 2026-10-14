const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// Get all facilities with optional filters
router.get('/', async (req, res) => {
    try {
        const { sport_type, location, search } = req.query;
        
        let query = `
            SELECT f.*, 
                   COALESCE(AVG(r.rating), 0) as avg_rating,
                   COUNT(r.id) as review_count
            FROM facilities f
            LEFT JOIN reviews r ON f.id = r.facility_id
            WHERE f.status = 'active'
        `;
        
        const params = [];

        if (sport_type) {
            query += ' AND f.sport_type = ?';
            params.push(sport_type);
        }

        if (location) {
            query += ' AND f.location LIKE ?';
            params.push(`%${location}%`);
        }

        if (search) {
            query += ' AND (f.name LIKE ? OR f.description LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }

        query += ' GROUP BY f.id ORDER BY f.created_at DESC';

        const [facilities] = await db.query(query, params);
        res.json({ facilities });
    } catch (error) {
        console.error('Get facilities error:', error);
        res.status(500).json({ error: 'Failed to fetch facilities' });
    }
});

// Get single facility by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const [facilities] = await db.query(
            `SELECT f.*, 
                    COALESCE(AVG(r.rating), 0) as avg_rating,
                    COUNT(r.id) as review_count
             FROM facilities f
             LEFT JOIN reviews r ON f.id = r.facility_id
             WHERE f.id = ? AND f.status = 'active'
             GROUP BY f.id`,
            [id]
        );

        if (facilities.length === 0) {
            return res.status(404).json({ error: 'Facility not found' });
        }

        // Get reviews for this facility
        const [reviews] = await db.query(
            `SELECT r.*, u.name as user_name
             FROM reviews r
             JOIN users u ON r.user_id = u.id
             WHERE r.facility_id = ?
             ORDER BY r.created_at DESC`,
            [id]
        );

        res.json({
            facility: facilities[0],
            reviews
        });
    } catch (error) {
        console.error('Get facility error:', error);
        res.status(500).json({ error: 'Failed to fetch facility' });
    }
});

// Get availability for a facility
router.get('/:id/availability', async (req, res) => {
    try {
        const { id } = req.params;
        const { date } = req.query;

        if (!date) {
            return res.status(400).json({ error: 'Date parameter is required' });
        }

        const [slots] = await db.query(
            `SELECT id, date, start_time, end_time, status
             FROM time_slots
             WHERE facility_id = ? AND date = ?
             ORDER BY start_time`,
            [id, date]
        );

        res.json({ slots });
    } catch (error) {
        console.error('Get availability error:', error);
        res.status(500).json({ error: 'Failed to fetch availability' });
    }
});

// Add review for a facility
router.post('/:id/reviews', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { rating, comment } = req.body;
        const userId = req.user.id;

        // Validate rating
        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ error: 'Rating must be between 1 and 5' });
        }

        // Check if facility exists
        const [facilities] = await db.query(
            'SELECT id FROM facilities WHERE id = ?',
            [id]
        );

        if (facilities.length === 0) {
            return res.status(404).json({ error: 'Facility not found' });
        }

        // Check if user already reviewed
        const [existingReviews] = await db.query(
            'SELECT id FROM reviews WHERE user_id = ? AND facility_id = ?',
            [userId, id]
        );

        if (existingReviews.length > 0) {
            return res.status(400).json({ error: 'You have already reviewed this facility' });
        }

        // Insert review
        await db.query(
            'INSERT INTO reviews (user_id, facility_id, rating, comment) VALUES (?, ?, ?, ?)',
            [userId, id, rating, comment || null]
        );

        res.status(201).json({ message: 'Review added successfully' });
    } catch (error) {
        console.error('Add review error:', error);
        res.status(500).json({ error: 'Failed to add review' });
    }
});

module.exports = router;
