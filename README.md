# SportConnect - Community Sports Ground / Facility Booking Web Application

A full-stack web application that allows users to discover nearby sports grounds and courts, check real-time availability, and book available time slots online. The system includes an admin dashboard for managing facilities, users, time slots, and bookings.

## Features

### User Features
- **User Registration & Login**: Secure authentication with JWT tokens
- **Browse Facilities**: Search and filter sports facilities by type, location, and name
- **View Facility Details**: See detailed information including images, description, pricing, and reviews
- **Check Availability**: View available time slots for specific dates
- **Book Slots**: Secure booking system with double-booking prevention
- **SMS Notifications**: Automatic confirmation SMS sent to registered mobile number after successful booking
- **My Bookings**: View upcoming and past bookings, cancel eligible bookings
- **User Profile**: Edit profile information and change password

### Admin Features
- **Dashboard Statistics**: View total users, facilities, bookings, revenue, and usage analytics
- **Manage Facilities**: Add, edit, and deactivate sports facilities
- **Manage Time Slots**: Create and manage time slots for facilities
- **Manage Bookings**: View, search, filter, and cancel bookings
- **Manage Users**: View users, search, and activate/deactivate accounts

## Technology Stack

### Frontend
- HTML5
- CSS3
- JavaScript (Vanilla)
- Bootstrap 5
- Font Awesome Icons

### Backend
- Node.js
- Express.js
- REST APIs

### Database
- MySQL

### Authentication
- JWT (JSON Web Tokens)
- bcryptjs for password hashing

## Project Structure

```
sports-booking/
├── frontend/
│   ├── index.html              # Home page
│   ├── login.html              # Login page
│   ├── signup.html             # Registration page
│   ├── facilities.html         # Facilities listing page
│   ├── facility-details.html   # Facility details page
│   ├── booking.html            # Booking confirmation page
│   ├── my-bookings.html        # User bookings page
│   ├── profile.html            # User profile page
│   ├── admin.html              # Admin dashboard
│   ├── css/
│   │   └── style.css           # Custom styles
│   └── js/
│       └── auth.js             # Authentication utilities
│
├── backend/
│   ├── server.js               # Express server setup
│   ├── config/
│   │   └── database.js         # MySQL connection configuration
│   ├── routes/
│   │   ├── auth.js             # Authentication routes
│   │   ├── facilities.js       # Facility routes
│   │   ├── bookings.js         # Booking routes
│   │   └── admin.js            # Admin routes
│   ├── middleware/
│   │   └── auth.js             # JWT authentication middleware
│   ├── services/
│   │   └── smsService.js       # SMS notification service
│   └── utils/
│       └── jwt.js              # JWT token generation
│
├── database/
│   ├── schema.sql              # Database schema
│   └── sample-data.sql         # Sample data insertion
│
├── .env.example                # Environment variables template
├── package.json                # Node.js dependencies
└── README.md                   # This file
```

## Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- MySQL (v5.7 or higher)
- npm or yarn

### Step 1: Clone the Repository
```bash
git clone <repository-url>
cd sports-booking
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Setup MySQL Database

1. Create a MySQL database named `sports_booking`
2. Run the schema file to create tables:
```bash
mysql -u root -p < database/schema.sql
```

3. Run the sample data file to insert sample data:
```bash
mysql -u root -p sports_booking < database/sample-data.sql
```

### Step 4: Configure Environment Variables

1. Copy the `.env.example` file to `.env`:
```bash
cp .env.example .env
```

2. Edit the `.env` file with your database credentials:
```env
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=sports_booking
JWT_SECRET=your_jwt_secret_key_here

# SMS Configuration (Optional - for booking confirmations)
SMS_PROVIDER=MSG91
SMS_API_KEY=your_sms_api_key
SMS_API_SECRET=your_sms_api_secret
SMS_SENDER_ID=SPORTC
```

**Note**: SMS notifications require an account with an SMS provider (MSG91, Fast2SMS, or Twilio). If you don't configure SMS credentials, the booking system will still work without SMS notifications.

**Important**: Generate a secure JWT_SECRET. You can use:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 5: Start the Server

Development mode (with auto-restart):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

The server will start on `http://localhost:3000`

## Sample Login Credentials

After running the sample data script, you can use these credentials:

### Admin Account
- **Email**: admin@sportconnect.com
- **Password**: password123

### User Accounts
- **Email**: john@example.com
- **Password**: password123

- **Email**: jane@example.com
- **Password**: password123

**Note**: The sample passwords use a simple hash for demonstration. In production, always use strong, unique passwords.

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update user profile

### Facilities
- `GET /api/facilities` - Get all facilities (with filters)
- `GET /api/facilities/:id` - Get single facility
- `GET /api/facilities/:id/availability` - Get facility availability
- `POST /api/facilities/:id/reviews` - Add facility review

### Bookings
- `POST /api/bookings` - Create new booking
- `GET /api/bookings/my` - Get user's bookings
- `GET /api/bookings/:id` - Get single booking
- `DELETE /api/bookings/:id` - Cancel booking

### Admin
- `GET /api/admin/stats` - Get dashboard statistics
- `POST /api/admin/facilities` - Add facility
- `PUT /api/admin/facilities/:id` - Update facility
- `DELETE /api/admin/facilities/:id` - Delete facility
- `POST /api/admin/slots` - Add time slot
- `PUT /api/admin/slots/:id` - Update time slot
- `GET /api/admin/slots/daily` - Get daily schedule
- `GET /api/admin/bookings` - Get all bookings
- `PUT /api/admin/bookings/:id/cancel` - Cancel booking (admin)
- `GET /api/admin/users` - Get all users
- `PUT /api/admin/users/:id/status` - Update user status

## Security Features

- **Password Hashing**: All passwords are hashed using bcryptjs
- **JWT Authentication**: Secure token-based authentication
- **Protected Routes**: API routes protected with authentication middleware
- **Role-Based Authorization**: Admin-only routes protected
- **Input Validation**: Server-side validation for all inputs
- **SQL Injection Protection**: Using parameterized queries
- **Double-Booking Prevention**: Database transactions with row locking

## Database Schema

### Tables
- **users**: User accounts and authentication
- **facilities**: Sports facilities information
- **time_slots**: Available time slots for booking
- **bookings**: Booking records
- **reviews**: Facility reviews and ratings

## Sample Facilities

The application includes sample facilities:
- Football Ground — ₹500/hour
- Cricket Ground — ₹700/hour
- Basketball Court — ₹400/hour
- Badminton Court — ₹300/hour
- Tennis Court — ₹600/hour
- Multi-Sport Ground — ₹800/hour

## Sports Categories
- Football
- Cricket
- Basketball
- Badminton
- Tennis
- Multi-Sport

## Troubleshooting

### Database Connection Error
- Ensure MySQL is running
- Check your database credentials in `.env`
- Verify the database `sports_booking` exists

### Port Already in Use
- Change the PORT in `.env` file
- Or stop the process using port 3000

### JWT Token Issues
- Clear your browser's localStorage
- Generate a new JWT_SECRET in `.env`

### SMS Not Sending
- Verify SMS credentials in `.env` are correct
- Ensure your SMS provider account has sufficient balance
- Check that the user has a valid phone number in their profile
- SMS failures are logged to the console for debugging
- Bookings will succeed even if SMS fails

## Development Notes

- The application uses vanilla JavaScript on the frontend
- Bootstrap 5 for responsive design
- Custom CSS with blue/green theme
- All API calls use the Fetch API
- Authentication state stored in localStorage

## Future Enhancements

- Payment gateway integration
- Email notifications for bookings
- Facility image upload functionality
- Advanced search and filtering
- Mobile app development
- Real-time availability updates with WebSockets

## License

This project is for educational purposes.

## Support

For issues or questions, please contact the development team.
