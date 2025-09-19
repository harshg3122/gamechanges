# Production Setup Guide

## Overview

This guide explains how to set up the Number Game betting system for production deployment with the comprehensive result declaration system.

## Prerequisites

- Node.js 16+ installed
- MongoDB 4.4+ running
- Environment variables configured

## Environment Variables

Create a `.env` file in the backend directory:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/numbergame
# or for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/numbergame

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-here

# Admin Credentials
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_USERNAME=admin
ADMIN_PASSWORD=YourSecurePassword123

# Server
PORT=5000
NODE_ENV=production
```

## Quick Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Run Production Setup

This command will set up everything needed for production:

```bash
npm run setup-production
```

This script will:

- Create admin user with credentials from .env
- Set up daily rounds (14 time slots)
- Generate 200 triple digit numbers (160 locked, 40 unlocked)
- Generate 10 single digit numbers with random locking
- Display setup summary and next steps

### 3. Start the Server

```bash
npm start
```

The server will start with:

- Auto-result job running every minute
- All APIs available
- Admin panel ready

## Manual Setup (Alternative)

If you prefer to set up components individually:

### 1. Seed Game Numbers Only

```bash
npm run seed-numbers
```

### 2. Create Admin User Manually

```javascript
// Run in MongoDB shell or create a script
db.admins.insertOne({
  email: "admin@yourdomain.com",
  username: "admin",
  passwordHash: "$2b$12$hashed_password_here",
  fullName: "System Administrator",
  role: "super-admin",
  isActive: true,
  permissions: {
    canManageUsers: true,
    canManageWallets: true,
    canSetResults: true,
    canViewReports: true,
    canManageAdmins: true,
  },
});
```

## Database Schema

### Collections Created

1. **admins** - Admin users with permissions
2. **rounds** - Game rounds with time slots
3. **tripledigits** - 200 triple digit numbers per round
4. **singledigits** - 10 single digit numbers per round
5. **results** - Declared results with audit trail
6. **numberselections** - User bets
7. **users** - Game users
8. **transactions** - Financial transactions

### Key Indexes

- `tripledigits`: `{roundId: 1, number: 1}` (unique)
- `singledigits`: `{roundId: 1, number: 1}` (unique)
- `results`: `{roundId: 1}` (unique)
- `rounds`: `{status: 1, createdAt: -1}`

## API Endpoints

### Admin Authentication

```
POST /api/admin-panel/login
Body: { username: "admin", password: "password" }
```

### Result Declaration

```
GET /api/admin-panel/results/current-round
- Returns current round with numbers and timing info

GET /api/admin-panel/results/tables?roundId=<id>
- Returns 200 triple digits and 10 single digits

POST /api/admin-panel/results/declare
Body: { roundId: "...", tripleDigitNumber: "123" }
- Declares result with comprehensive validation

GET /api/admin-panel/results/profit-analysis?roundId=<id>
- Returns profit analysis for admin decision making
```

### Error Responses

The system returns specific error codes for proper UI handling:

```json
{
  "success": false,
  "error": "TRIPLE_LOCKED",
  "message": "Triple digit 123 is locked. Please choose another number.",
  "tripleDigit": "123"
}

{
  "success": false,
  "error": "SINGLE_LOCKED",
  "message": "The sum 15 results in digit 6 which is locked. Please choose another triple digit number.",
  "calculation": {
    "tripleDigit": "456",
    "sum": 15,
    "singleDigit": 6
  }
}
```

## Result Declaration Logic

### Admin Period (First 9 minutes of last 10 minutes)

1. Admin can select any unlocked triple digit
2. System calculates sum of digits (e.g., 123 → 1+2+3 = 6)
3. Last digit of sum becomes single digit result (6 % 10 = 6)
4. If single digit is locked → show popup, reject selection
5. If valid → store result and process all bets

### System Period (Last 1 minute)

1. System finds unlocked triple digit that results in unlocked single digit
2. If none found → unlock a single digit (fallback policy)
3. Auto-declare result and process bets
4. Update round status to completed

## Monitoring & Logs

### Auto Result Job

The system logs all auto-result operations:

```
🎯 Processing auto result declaration...
✅ Auto-declared result for round 64f7b8c9e1234567890abcde: 456 -> 6
🎯 Auto result declaration processing completed
```

### Result Declaration Logs

```
Admin declared result for round 64f7b8c9e1234567890abcde: 123 -> 6
System auto-declared result for round 64f7b8c9e1234567890abcde: 789 -> 4
```

### Error Monitoring

Monitor these error patterns:

- `No valid unlocked triple digit found` - May need manual intervention
- `Round not found` - Check round creation process
- `Result already declared` - Duplicate declaration attempts

## Performance Considerations

### Database Optimization

1. **Indexes**: All critical queries are indexed
2. **Connection Pooling**: MongoDB connection pooling enabled
3. **Query Optimization**: Lean queries used where possible

### Auto Result Job

- Runs every 1 minute (configurable)
- Processes only active rounds
- Includes job running flag to prevent overlaps
- Logs all operations for debugging

### Caching Strategy

- Round numbers cached in memory during processing
- Results cached after declaration
- Admin sessions cached with JWT

## Security Features

### Admin Authentication

- JWT-based authentication
- Password hashing with bcrypt (12 rounds)
- Session timeout handling
- Role-based permissions

### API Security

- Request validation with express-validator
- Rate limiting on sensitive endpoints
- CORS configuration for production
- Helmet.js security headers

### Data Integrity

- Atomic transactions for result declaration
- Unique constraints on critical fields
- Input validation and sanitization
- Audit trails for all operations

## Backup & Recovery

### Database Backup

```bash
# Create backup
mongodump --uri="mongodb://localhost:27017/numbergame" --out=./backup

# Restore backup
mongorestore --uri="mongodb://localhost:27017/numbergame" ./backup/numbergame
```

### Critical Data

Ensure regular backups of:

- `results` collection (audit trail)
- `admins` collection (access control)
- `transactions` collection (financial records)
- `users` collection (user data)

## Troubleshooting

### Common Issues

1. **"No triple digit bets placed yet"**

   - Run `npm run seed-numbers` to populate numbers
   - Check if round has initialized numbers

2. **Auto-result not working**

   - Check server logs for auto-result job
   - Verify round timing calculations
   - Ensure MongoDB connection is stable

3. **Admin can't declare result**
   - Check timing (must be last 10 minutes, not last 1)
   - Verify selected triple digit is unlocked
   - Check if resulting single digit is unlocked

### Debug Commands

```bash
# Check round status
curl http://localhost:5000/api/admin-panel/results/current-round

# Check server health
curl http://localhost:5000/health

# View logs
tail -f logs/app.log  # if using file logging
```

## Deployment Checklist

- [ ] Environment variables configured
- [ ] MongoDB connection tested
- [ ] Admin user created
- [ ] Game numbers seeded
- [ ] Auto-result job started
- [ ] API endpoints tested
- [ ] Security headers configured
- [ ] Backup strategy implemented
- [ ] Monitoring setup
- [ ] Error logging configured

## Production URLs

After deployment, the system will be available at:

- **Admin Panel**: `https://yourdomain.com/api/admin-panel/`
- **Health Check**: `https://yourdomain.com/health`
- **API Documentation**: `https://yourdomain.com/api/docs`

## Support

For production support:

1. Check server logs first
2. Verify database connectivity
3. Check auto-result job status
4. Review API response codes
5. Monitor system resources

The system is designed to be self-healing with comprehensive error handling and fallback mechanisms.
