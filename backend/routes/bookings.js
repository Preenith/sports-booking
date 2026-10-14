const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const smsService = require('../services/smsService');

// Create a new booking with double-booking prevention
router.post('/', authenticateToken, async (req, res) => {
    const connection = await db.getConnection();
    
    try {
        await connection.beginTransaction();
        
        const { facility_id, slot_id, date } = req.body;
        const userId = req.user.id;

        // Validation
        if (!facility_id || !slot_id || !date) {
            await connection.rollback();
            return res.status(400).json({ error: 'Facility ID, slot ID, and date are required' });
        }

        // Get slot details with FOR UPDATE to lock the row
        const [slots] = await connection.query(
            `SELECT id, facility_id, date, start_time, end_time, status 
             FROM time_slots 
             WHERE id = ? AND facility_id = ? AND date = ?
             FOR UPDATE`,
            [slot_id, facility_id, date]
        );

        if (slots.length === 0) {
            await connection.rollback();
            return res.status(404).json({ error: 'Time slot not found' });
        }

        const slot = slots[0];

        // Check if slot is still available
        if (slot.status !== 'available') {
            await connection.rollback();
            return res.status(409).json({ error: 'This time slot is no longer available' });
        }

        // Get facility details
        const [facilities] = await connection.query(
            'SELECT name, price_per_hour FROM facilities WHERE id = ?',
            [facility_id]
        );

        if (facilities.length === 0) {
            await connection.rollback();
            return res.status(404).json({ error: 'Facility not found' });
        }

        const facility = facilities[0];

        // Generate unique booking ID
        const bookingId = `BK${Date.now()}${Math.floor(Math.random() * 10000)}`;

        // Create booking
        const [bookingResult] = await connection.query(
            `INSERT INTO bookings 
             (booking_id, user_id, facility_id, slot_id, booking_date, start_time, end_time, amount, booking_status, payment_status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                bookingId,
                userId,
                facility_id,
                slot_id,
                date,
                slot.start_time,
                slot.end_time,
                facility.price_per_hour,
                'confirmed',
                'paid'
            ]
        );

        // Update slot status to booked
        await connection.query(
            'UPDATE time_slots SET status = ? WHERE id = ?',
            ['booked', slot_id]
        );

        await connection.commit();

        // Get user details for SMS
        const [users] = await db.query(
            'SELECT name, phone FROM users WHERE id = ?',
            [userId]
        );

        const user = users[0];

        // Send SMS confirmation (non-blocking)
        let smsStatus = null;
        if (user && user.phone) {
            const bookingDetails = {
                userName: user.name,
                facilityName: facility.name,
                date: date,
                startTime: slot.start_time,
                endTime: slot.end_time,
                bookingId: bookingId,
                amount: facility.price_per_hour
            };

            // Send SMS asynchronously (don't wait for it)
            smsService.sendBookingConfirmationSMS(user.phone, bookingDetails)
                .then(result => {
                    if (result.success) {
                        console.log('SMS sent successfully for booking:', bookingId);
                    } else {
                        console.error('SMS failed for booking:', bookingId, result.error);
                    }
                })
                .catch(error => {
                    console.error('SMS service error for booking:', bookingId, error);
                });

            smsStatus = 'sent';
        } else {
            console.log('No phone number for user, SMS not sent');
            smsStatus = 'skipped';
        }

        // Return booking details
        res.status(201).json({
            message: 'Booking confirmed successfully',
            sms_status: smsStatus,
            booking: {
                id: bookingResult.insertId,
                booking_id: bookingId,
                facility_name: facility.name,
                date: date,
                start_time: slot.start_time,
                end_time: slot.end_time,
                amount: facility.price_per_hour,
                booking_status: 'confirmed',
                payment_status: 'paid'
            }
        });
    } catch (error) {
        await connection.rollback();
        console.error('Booking error:', error);
        res.status(500).json({ error: 'Failed to create booking' });
    } finally {
        connection.release();
    }
});

// Get user's bookings
router.get('/my', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { status } = req.query;

        let query = `
            SELECT b.*, f.name as facility_name, f.sport_type, f.location, f.image
            FROM bookings b
            JOIN facilities f ON b.facility_id = f.id
            WHERE b.user_id = ?
        `;
        
        const params = [userId];

        if (status) {
            query += ' AND b.booking_status = ?';
            params.push(status);
        }

        query += ' ORDER BY b.created_at DESC';

        const [bookings] = await db.query(query, params);
        res.json({ bookings });
    } catch (error) {
        console.error('Get bookings error:', error);
        res.status(500).json({ error: 'Failed to fetch bookings' });
    }
});

// Get single booking by ID
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const [bookings] = await db.query(
            `SELECT b.*, f.name as facility_name, f.sport_type, f.location, f.image, f.description
             FROM bookings b
             JOIN facilities f ON b.facility_id = f.id
             WHERE b.id = ? AND b.user_id = ?`,
            [id, userId]
        );

        if (bookings.length === 0) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        res.json({ booking: bookings[0] });
    } catch (error) {
        console.error('Get booking error:', error);
        res.status(500).json({ error: 'Failed to fetch booking' });
    }
});

// Cancel booking
router.delete('/:id', authenticateToken, async (req, res) => {
    const connection = await db.getConnection();
    
    try {
        await connection.beginTransaction();
        
        const { id } = req.params;
        const userId = req.user.id;

        // Get booking with FOR UPDATE
        const [bookings] = await connection.query(
            `SELECT * FROM bookings 
             WHERE id = ? AND user_id = ? 
             FOR UPDATE`,
            [id, userId]
        );

        if (bookings.length === 0) {
            await connection.rollback();
            return res.status(404).json({ error: 'Booking not found' });
        }

        const booking = bookings[0];

        // Check if booking can be cancelled
        if (booking.booking_status === 'cancelled') {
            await connection.rollback();
            return res.status(400).json({ error: 'Booking is already cancelled' });
        }

        if (booking.booking_status === 'completed') {
            await connection.rollback();
            return res.status(400).json({ error: 'Cannot cancel completed booking' });
        }

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

module.exports = router;
