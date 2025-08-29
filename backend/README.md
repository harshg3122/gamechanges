# Number Game Backend API

A comprehensive backend system for the Number Game application built with Node.js, express, and MongoDB. This system supports both user and admin functionalities with JWT authentication, wallet management, and real-time game mechanics.

## 🎯 Features

### User Features
- ✅ User registration and authentication
- ✅ JWT-based secure login system
- ✅ Wallet management with transaction history
- ✅ Number selection for three game classes (A, B, C)
- ✅ Real-time game rounds with 1-hour duration
- ✅ Win/Loss tracking and statistics
- ✅ Profile management

### Admin Features
- ✅ Admin dashboard with comprehensive statistics
- ✅ User management (view, activate/deactivate)
- ✅ Wallet management (add/deduct funds)
- ✅ Game result management
- ✅ Round winner tracking
- ✅ Detailed reporting system

### Security Features
- ✅ Password hashing with bcrypt
- ✅ JWT token authentication
- ✅ Rate limiting on API endpoints
- ✅ Input validation and sanitization
- ✅ CORS configuration
- ✅ Security headers with Helmet
- ✅ Admin account lockout after failed attempts

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Security**: bcryptjs, helmet, cors, express-rate-limit
- **Validation**: express-validator
- **Scheduling**: node-cron (for future automated tasks)

## 📁 Project Structure

```
backend/
├── controllers/           # Business logic controllers
│   ├── authController.js     # Authentication logic
│   ├── userController.js     # User operations
│   ├── adminController.js    # Admin operations
│   └── gameController.js     # Game mechanics
├── models/               # MongoDB schemas
│   ├── User.js              # User model
│   ├── Admin.js             # Admin model
│   ├── NumberSelection.js   # Game selections
│   ├── Result.js            # Game results
│   └── WalletTransaction.js # Transaction history
├── routes/               # API route definitions
│   ├── authRoutes.js        # Authentication routes
│   ├── userRoutes.js        # User routes
│   ├── adminRoutes.js       # Admin routes
│   └── gameRoutes.js        # Game routes
├── middleware/           # Custom middleware
│   ├── authMiddleware.js    # JWT verification
│   ├── adminMiddleware.js   # Admin role checks
│   └── validation.js        # Input validation & rate limiting
├── utils/                # Utility functions
│   ├── jwt.js              # JWT helper functions
│   ├── encrypt.js          # Encryption utilities
│   └── numberUtils.js      # Game number validation
├── .env                  # Environment variables
├── .gitignore           # Git ignore rules
├── package.json         # Dependencies
├── server.js            # Main server file
└── README.md           # This file
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or MongoDB Atlas)
- npm or yarn

### Installation

1. **Clone and navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Update the `.env` file with your configurations:
   ```env
   # Database
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/numbergame
   # OR for local MongoDB
   MONGODB_LOCAL=mongodb://localhost:27017/numbergame

   # JWT
   JWT_SECRET=your-super-secure-jwt-secret-key
   JWT_EXPIRES_IN=7d

   # Server
   PORT=5000
   NODE_ENV=development

   # Admin Credentials
   ADMIN_EMAIL=admin@numbergame.com
   ADMIN_PASSWORD=Admin@123

   # Security
   BCRYPT_ROUNDS=12
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```
   
   Or for production:
   ```bash
   npm start
   ```

5. **Verify installation**
   
   Visit `http://localhost:5000` - you should see the API welcome message.

## 📚 API Documentation

### Base URL
```
Development: http://localhost:5000/api
Production: https://your-domain.com/api
```

### Authentication Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| POST | `/auth/register` | User registration | Public |
| POST | `/auth/login` | User login | Public |
| POST | `/auth/admin/login` | Admin login | Public |
| POST | `/auth/refresh` | Refresh token | Public |
| POST | `/auth/logout` | Logout | Private |
| GET | `/auth/verify` | Verify token | Private |

### User Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/user/profile` | Get user profile | User |
| PUT | `/user/profile` | Update profile | User |
| GET | `/user/selections` | Selection history | User |
| GET | `/user/wallet/transactions` | Wallet transactions | User |
| GET | `/user/results` | Game results | User |
| GET | `/user/stats` | User statistics | User |
| POST | `/user/change-password` | Change password | User |

### Game Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| POST | `/game/select` | Select number | User |
| GET | `/game/round/current` | Current round info | Public |
| GET | `/game/numbers/:classType` | Valid numbers | Public |
| GET | `/game/info` | Game rules | Public |
| GET | `/game/results/recent` | Recent results | Public |
| DELETE | `/game/selections/:id` | Cancel selection | User |
| GET | `/game/selections/current` | Current selections | User |

### Admin Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/admin/dashboard` | Dashboard stats | Admin |
| GET | `/admin/users` | All users | Admin |
| GET | `/admin/users/:id` | User details | Admin |
| POST | `/admin/users/:id/toggle-status` | Toggle user status | Admin |
| POST | `/admin/wallet/manage` | Manage wallet | Admin |
| POST | `/admin/results/set` | Set game results | Admin |
| GET | `/admin/results` | All results | Admin |
| GET | `/admin/results/:roundId/winners` | Round winners | Admin |

## 🎮 Game Logic

### Number Classes

- **Class A**: All same digits (111, 222, 333, etc.) - 9 total numbers - 100x multiplier
- **Class B**: Exactly 2 same digits (112, 223, 334, etc.) - 252 total numbers - 10x multiplier  
- **Class C**: All different digits (123, 456, 789, etc.) - 720 total numbers - 5x multiplier

### Game Flow

1. User selects a class (A, B, or C)
2. User chooses a valid 3-digit number for that class
3. User places a bet amount
4. System validates the selection and deducts from wallet
5. Game round ends after 1 hour
6. Admin sets winning numbers for each class
7. System calculates winners and updates wallets
8. Users can view results and updated balances

## 🧪 API Testing

### Using cURL

**Register User:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "mobileNumber": "9876543210",
    "password": "Test@123"
  }'
```

**User Login:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "9876543210",
    "password": "Test@123"
  }'
```

**Select Number (with token):**
```bash
curl -X POST http://localhost:5000/api/game/select \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "classType": "A",
    "number": "111",
    "amount": 100
  }'
```

### Default Admin Credentials

- **Email**: admin@numbergame.com
- **Password**: Admin@123

## 📊 Database Schema

### Users Collection
- username, mobileNumber, passwordHash
- wallet, selectedNumbers, totalWinnings, totalLosses
- gamesPlayed, isActive, timestamps

### NumberSelection Collection
- userId, classType, number, amount
- roundId, status, winningAmount, timestamps

### Results Collection
- roundId, winning numbers for each class
- participant statistics, revenue/payout data
- winners array, timestamps

### WalletTransactions Collection
- userId, type, amount, source, description
- balance before/after, metadata, timestamps

## 🛡️ Security Features

- **Password Hashing**: All passwords hashed with bcrypt (12 rounds)
- **JWT Authentication**: Secure token-based authentication
- **Rate Limiting**: API endpoints protected against spam
- **Input Validation**: All inputs validated and sanitized
- **Admin Lockout**: Account lockout after 5 failed login attempts
- **CORS Protection**: Configured for specific origins
- **Security Headers**: Helmet.js for security headers

## 🚢 Deployment

### Environment Setup

1. **Production Environment Variables**:
   ```env
   NODE_ENV=production
   MONGODB_URI=mongodb+srv://...
   JWT_SECRET=super-secure-production-secret
   ```

2. **Deploy on Render/Railway/Heroku**:
   - Connect your GitHub repository
   - Set environment variables
   - Deploy the backend

3. **MongoDB Atlas Setup**:
   - Create MongoDB Atlas cluster
   - Whitelist deployment server IP
   - Update connection string

## 🔍 Monitoring & Logging

- Request logging for all API calls
- Error logging with stack traces in development
- Health check endpoint: `/health`
- API documentation: `/api/docs`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the ISC License.

## 📞 Support

For support and questions:
- Email: support@numbergame.com
- Documentation: `/api/docs`
- Health Check: `/health`

---

**🎯 Your Number Game Backend is ready to go!** 

Start the server and begin testing the APIs. The system is designed to be scalable, secure, and easy to integrate with your Flutter app and React admin panel.
