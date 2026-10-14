-- Sample Data for Sports Booking Application

USE sports_booking;

-- Insert sample users
INSERT INTO users (name, email, phone, password, role, status) VALUES
('Admin User', 'admin@sportconnect.com', '9876543210', '$2a$10$edGZSrkIcrBdCx.WWLpAA.XMY7xcsEt1i6.ck0ZOdNueaEwfDhjd6', 'admin', 'active'),
('John Doe', 'john@example.com', '9876543211', '$2a$10$edGZSrkIcrBdCx.WWLpAA.XMY7xcsEt1i6.ck0ZOdNueaEwfDhjd6', 'user', 'active'),
('Jane Smith', 'jane@example.com', '9876543212', '$2a$10$edGZSrkIcrBdCx.WWLpAA.XMY7xcsEt1i6.ck0ZOdNueaEwfDhjd6', 'user', 'active');

-- Note: The password hash above is for 'password123'
-- You should generate proper bcrypt hashes for production

-- Insert sample facilities
INSERT INTO facilities (name, sport_type, location, description, price_per_hour, image, status) VALUES
('City Football Ground', 'football', 'Downtown Sports Complex', 'Premium football ground with professional turf, floodlights, and changing rooms. Perfect for 5-a-side and 7-a-side matches.', 500.00, 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800', 'active'),
('National Cricket Stadium', 'cricket', 'Sports City, Sector 5', 'Full-size cricket pitch with professional wickets, practice nets, and spectator seating. Ideal for tournaments.', 700.00, 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=800', 'active'),
('Metro Basketball Arena', 'basketball', 'Central Sports Hub', 'Indoor basketball court with wooden flooring, proper hoops, and scoreboards. Great for practice and matches.', 400.00, 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800', 'active'),
('Badminton Excellence Center', 'badminton', 'Greenfield Sports Club', 'Multiple synthetic badminton courts with proper lighting and non-slip flooring. Rackets available on rent.', 300.00, 'https://images.unsplash.com/photo-1626358157354-7a0f0b5d1e1e?w=800', 'active'),
('Royal Tennis Club', 'tennis', 'Elite Sports Zone', 'Clay tennis courts with professional nets and ball machines. Coaching available on request.', 600.00, 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=800', 'active'),
('Multi-Sport Arena', 'multi-sport', 'Universal Sports Complex', 'Versatile ground suitable for football, cricket, and other sports. Includes equipment storage and restrooms.', 800.00, 'https://images.unsplash.com/photo-1461896836934- voices-1?w=800', 'active');

-- Insert sample time slots for next 7 days
-- Generate slots for each facility from 6 AM to 10 PM (1-hour slots)
DELIMITER //
CREATE PROCEDURE GenerateTimeSlots()
BEGIN
    DECLARE v_facility_id INT;
    DECLARE v_date DATE;
    DECLARE v_hour INT;
    DECLARE v_end_hour INT;
    
    -- Loop through facilities
    DECLARE facility_cursor CURSOR FOR SELECT id FROM facilities WHERE status = 'active';
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_facility_id = NULL;
    
    OPEN facility_cursor;
    facility_loop: LOOP
        FETCH facility_cursor INTO v_facility_id;
        IF v_facility_id IS NULL THEN
            LEAVE facility_loop;
        END IF;
        
        -- Loop through next 7 days
        SET v_date = CURDATE();
        WHILE v_date <= DATE_ADD(CURDATE(), INTERVAL 7 DAY) DO
            -- Create slots from 6 AM to 10 PM
            SET v_hour = 6;
            WHILE v_hour < 22 DO
                SET v_end_hour = v_hour + 1;
                
                INSERT INTO time_slots (facility_id, date, start_time, end_time, status)
                VALUES (
                    v_facility_id,
                    v_date,
                    CONCAT(LPAD(v_hour, 2, '0'), ':00:00'),
                    CONCAT(LPAD(v_end_hour, 2, '0'), ':00:00'),
                    'available'
                );
                
                SET v_hour = v_hour + 1;
            END WHILE;
            
            SET v_date = DATE_ADD(v_date, INTERVAL 1 DAY);
        END WHILE;
        
    END LOOP facility_loop;
    CLOSE facility_cursor;
END //
DELIMITER ;

-- Call the procedure to generate time slots
CALL GenerateTimeSlots();

-- Drop the procedure after use
DROP PROCEDURE IF EXISTS GenerateTimeSlots;

-- Insert sample reviews
INSERT INTO reviews (user_id, facility_id, rating, comment) VALUES
(2, 1, 5, 'Excellent football ground! The turf is well-maintained and the floodlights are perfect for evening games.'),
(2, 2, 4, 'Great cricket pitch. The practice nets are very helpful for training sessions.'),
(3, 3, 5, 'Best basketball court in the city. Wooden flooring is top-notch!'),
(3, 4, 4, 'Good badminton courts. Lighting could be better but overall great experience.'),
(2, 5, 5, 'Professional tennis courts. The clay surface is well-maintained.'),
(3, 6, 4, 'Versatile multi-sport ground. Perfect for our weekend matches.');

-- Insert sample bookings
INSERT INTO bookings (booking_id, user_id, facility_id, slot_id, booking_date, start_time, end_time, amount, booking_status, payment_status)
SELECT 
    CONCAT('BK', DATE_FORMAT(NOW(), '%Y%m%d'), LPAD(id, 6, '0')),
    2,
    1,
    id,
    CURDATE() + INTERVAL 1 DAY,
    start_time,
    end_time,
    500.00,
    'confirmed',
    'paid'
FROM time_slots 
WHERE facility_id = 1 
    AND date = CURDATE() + INTERVAL 1 DAY 
    AND start_time = '18:00:00'
LIMIT 1;

-- Mark the booked slot as booked
UPDATE time_slots 
SET status = 'booked' 
WHERE id IN (SELECT slot_id FROM bookings WHERE booking_status = 'confirmed');
