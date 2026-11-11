require('dotenv').config();
const bcrypt = require('bcryptjs');
const { db } = require('../backend/config/firebase');

const seedDatabase = async () => {
  try {
    console.log('Starting database seed...');

    const salt = await bcrypt.genSalt(10);
    const adminPassword = await bcrypt.hash('admin123', salt);
    const userPassword = await bcrypt.hash('user123', salt);

    const adminRef = await db.collection('users').add({
      name: 'Admin User',
      email: 'admin@sportconnect.com',
      phone: '9876543210',
      password: adminPassword,
      role: 'admin',
      status: 'active',
      created_at: new Date().toISOString()
    });
    console.log('Admin user created with ID:', adminRef.id);

    const userRef = await db.collection('users').add({
      name: 'John Doe',
      email: 'john@example.com',
      phone: '9876543211',
      password: userPassword,
      role: 'user',
      status: 'active',
      created_at: new Date().toISOString()
    });
    console.log('Test user created with ID:', userRef.id);

    const facilities = [
      {
        name: 'City Football Ground',
        sport_type: 'Football',
        location: 'Downtown Sports Complex',
        description: 'Premium football ground with professional turf and floodlights. Perfect for evening matches.',
        price_per_hour: 500,
        image: '',
        facilities_available: 'Floodlights, Changing rooms, Parking, Water supply',
        rules: 'No spikes allowed, Maximum 22 players, Booking required',
        rating: 4.5,
        review_count: 45,
        status: 'active'
      },
      {
        name: 'Cricket Stadium',
        sport_type: 'Cricket',
        location: 'Main Cricket Arena',
        description: 'International standard cricket pitch with practice nets and professional equipment.',
        price_per_hour: 700,
        image: '',
        facilities_available: 'Practice nets, Equipment rental, Scoreboard, Commentary box',
        rules: 'White clothing required, No drinks on pitch, Prior booking mandatory',
        rating: 4.7,
        review_count: 62,
        status: 'active'
      },
      {
        name: 'Basketball Court',
        sport_type: 'Basketball',
        location: 'City Sports Center',
        description: 'Indoor basketball court with wooden flooring and professional hoops.',
        price_per_hour: 400,
        image: '',
        facilities_available: 'Wooden flooring, Scoreboard, Locker rooms, First aid',
        rules: 'Non-marking shoes required, Maximum 10 players',
        rating: 4.3,
        review_count: 38,
        status: 'active'
      },
      {
        name: 'Badminton Court',
        sport_type: 'Badminton',
        location: 'Indoor Sports Complex',
        description: 'Professional badminton courts with synthetic mats and proper lighting.',
        price_per_hour: 300,
        image: '',
        facilities_available: 'Synthetic mats, LED lighting, Racket rental, Shuttlecock supply',
        rules: 'Non-marking shoes required, Singles/Doubles only',
        rating: 4.6,
        review_count: 55,
        status: 'active'
      },
      {
        name: 'Tennis Court',
        sport_type: 'Tennis',
        location: 'Tennis Academy',
        description: 'Clay tennis courts with professional surface and ball machine.',
        price_per_hour: 600,
        image: '',
        facilities_available: 'Clay surface, Ball machine, Racket rental, Coaching available',
        rules: 'Proper tennis shoes required, No food on court',
        rating: 4.4,
        review_count: 41,
        status: 'active'
      },
      {
        name: 'Multi-Sport Arena',
        sport_type: 'Multi-Sport',
        location: 'Central Sports Hub',
        description: 'Versatile arena suitable for multiple sports including volleyball, handball, and futsal.',
        price_per_hour: 800,
        image: '',
        facilities_available: 'Adjustable nets, Multi-surface flooring, Audio system, Seating',
        rules: 'Equipment check required, Maximum 20 players',
        rating: 4.8,
        review_count: 73,
        status: 'active'
      }
    ];

    const facilityIds = [];
    for (const facility of facilities) {
      const facilityRef = await db.collection('facilities').add({
        ...facility,
        created_at: new Date().toISOString()
      });
      facilityIds.push(facilityRef.id);
      console.log(`Facility "${facility.name}" created with ID:`, facilityRef.id);
    }

    const timeSlots = [];
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dates = [
      today.toISOString().split('T')[0],
      tomorrow.toISOString().split('T')[0]
    ];

    const slotTimes = [
      { start: '06:00', end: '07:00' },
      { start: '07:00', end: '08:00' },
      { start: '08:00', end: '09:00' },
      { start: '09:00', end: '10:00' },
      { start: '10:00', end: '11:00' },
      { start: '11:00', end: '12:00' },
      { start: '12:00', end: '13:00' },
      { start: '13:00', end: '14:00' },
      { start: '14:00', end: '15:00' },
      { start: '15:00', end: '16:00' },
      { start: '16:00', end: '17:00' },
      { start: '17:00', end: '18:00' },
      { start: '18:00', end: '19:00' },
      { start: '19:00', end: '20:00' },
      { start: '20:00', end: '21:00' },
      { start: '21:00', end: '22:00' }
    ];

    for (const facilityId of facilityIds) {
      for (const date of dates) {
        for (const slot of slotTimes) {
          const status = Math.random() > 0.7 ? 'booked' : 'available';
          await db.collection('time_slots').add({
            facility_id: facilityId,
            date: date,
            start_time: slot.start,
            end_time: slot.end,
            status: status,
            created_at: new Date().toISOString()
          });
        }
      }
    }
    console.log('Time slots created for facilities');

    console.log('Database seeding completed successfully!');
    console.log('\nSample Login Credentials:');
    console.log('=========================');
    console.log('Admin Email: admin@sportconnect.com');
    console.log('Admin Password: admin123');
    console.log('\nUser Email: john@example.com');
    console.log('User Password: user123');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
};

seedDatabase();
