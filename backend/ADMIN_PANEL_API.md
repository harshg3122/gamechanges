# Admin Panel API Documentation

## Overview
The comprehensive admin panel provides full control over the gaming platform with sophisticated user management, intelligent round system, and automated result generation.

## Base URL
```
http://localhost:5000/api/admin-panel
```

## Authentication
All admin panel endpoints require Bearer token authentication:
```
Authorization: Bearer <your_jwt_token>
```

## Endpoints

### Authentication
- **POST** `/login` - Admin login
- **POST** `/logout` - Admin logout
- **GET** `/dashboard` - Get dashboard statistics

### User Management
- **GET** `/users` - Get all users with pagination
- **POST** `/users` - Create new user
- **PUT** `/users/:userId` - Update user details
- **PATCH** `/users/:userId/toggle-status` - Toggle user status
- **DELETE** `/users/:userId` - Delete user

### Round Management (13 Daily Rounds System)
- **GET** `/rounds` - Get all rounds
- **GET** `/rounds/current` - Get current active round
- **POST** `/rounds` - Create new round
- **GET** `/rounds/:roundId` - Get round details with betting stats
- **POST** `/rounds/:roundId/result` - Declare result for round
- **GET** `/rounds/:roundId/least-bet-numbers` - Get 4 least bet numbers for smart result selection
- **POST** `/rounds/initialize-daily` - Initialize 13 daily rounds (11 AM - 11:50 PM)

### Agent Management (Referral System)
- **GET** `/agents` - Get all agents
- **POST** `/agents` - Create new agent with referral code
- **PUT** `/agents/:agentId` - Update agent details
- **GET** `/agents/:agentId` - Get agent details with referral statistics
- **PATCH** `/agents/:agentId/toggle-status` - Toggle agent status
- **DELETE** `/agents/:agentId` - Delete agent
- **GET** `/agents/generate-referral-code` - Generate unique referral code

### QR Code Management
- **GET** `/qr-codes` - Get all QR codes
- **POST** `/qr-codes` - Create QR code with image upload
- **PUT** `/qr-codes/:qrCodeId` - Update QR code
- **PATCH** `/qr-codes/:qrCodeId/toggle-status` - Toggle QR code status
- **PATCH** `/qr-codes/:qrCodeId/set-primary` - Set as primary QR code
- **DELETE** `/qr-codes/:qrCodeId` - Delete QR code
- **GET** `/qr-codes/statistics` - Get QR code statistics
- **GET** `/qr-codes/active` - Get active QR codes (public endpoint)

### Wallet Request Management
- **GET** `/wallet-requests` - Get all wallet requests
- **PATCH** `/wallet-requests/:requestId` - Process wallet request (approve/reject)

### Settings
- **GET** `/settings` - Get app settings
- **PUT** `/settings` - Update app settings

## Key Features Implemented

### 1. Advanced Authentication System
- Secure admin login with login attempts tracking
- JWT token-based authentication with proper validation
- Account lockout after failed attempts
- Session management with logout functionality

### 2. Comprehensive User Management
- CRUD operations for user accounts
- Advanced search and pagination
- User status management (active/inactive)
- Balance management integration
- User activity tracking

### 3. Intelligent Round System
- **17 Daily Rounds**: 10:00 AM to 3:00 AM (50-minute betting + 10-minute gap)
- **Smart Result Selection**: Algorithm provides 4 least-bet numbers for maximum profitability
- **Automated Round Creation**: Daily initialization with proper timing
- **Real-time Statistics**: Live betting data and round analytics
- **Future Round Betting**: Users can bet on upcoming rounds

### 4. Agent Management with Referrals
- Complete agent lifecycle management
- Referral code generation and validation
- Commission tracking and statistics
- Agent performance analytics
- Referral user tracking

### 5. QR Code Payment System
- Multi-payment method support (UPI, PhonePe, PayTM, GPay)
- Image upload with validation
- Primary QR code management
- Active/inactive status control
- Payment method conflict prevention

### 6. Wallet Request Approval Workflow
- Token request management
- Admin approval/rejection system
- Request history and tracking
- Administrative notes functionality
- Balance update automation

### 7. Dashboard Analytics
- Real-time user statistics
- Revenue tracking
- Round performance metrics
- Agent referral statistics
- System health monitoring

## Smart Features

### Intelligent Result Declaration
The admin panel provides 4 least-bet numbers for each round, allowing administrators to:
- Maximize platform profitability
- Make data-driven result decisions
- View complete betting statistics
- Analyze user betting patterns

### Automated Daily Operations
- **10:00 AM**: First round starts automatically
- **Every 55 minutes**: New round begins (50min betting + 5min results)
- **3:00 AM**: Final round of the day
- **Automatic initialization**: Creates all 17 rounds for any day

### Security & Validation
- Input validation on all endpoints
- File upload security for QR codes
- Database transaction safety
- Error handling and logging
- Rate limiting protection

## Usage Examples

### Admin Login
```bash
POST /api/admin-panel/login
{
  "email": "admin@game.com",
  "password": "admin123"
}
```

### Get Dashboard Stats
```bash
GET /api/admin-panel/dashboard
Authorization: Bearer <token>
```

### Create Agent
```bash
POST /api/admin-panel/agents
{
  "name": "John Doe",
  "email": "john@example.com",
  "phoneNumber": "1234567890",
  "referralCode": "JOHN2024",
  "commissionRate": 5
}
```

### Initialize Daily Rounds
```bash
POST /api/admin-panel/rounds/initialize-daily
{
  "date": "2024-01-15"
}
```

### Get Least Bet Numbers
```bash
GET /api/admin-panel/rounds/:roundId/least-bet-numbers
```
Returns:
```json
{
  "leastBetNumbers": [
    { "number": 7, "totalBets": 2, "totalAmount": 100 },
    { "number": 3, "totalBets": 5, "totalAmount": 250 },
    { "number": 9, "totalBets": 8, "totalAmount": 400 },
    { "number": 1, "totalBets": 12, "totalAmount": 600 }
  ]
}
```

This comprehensive admin panel provides complete control over the gaming platform with intelligent automation, smart analytics, and user-friendly management interfaces.
