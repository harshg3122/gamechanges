# Production-Ready Game 999 Backend

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Setup

Create a `.env` file in the backend directory with these variables:

```env
# REQUIRED - Server will warn if missing
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-2024
MONGODB_URI=mongodb://localhost:27017/game999

# OPTIONAL - Defaults provided
NODE_ENV=development
PORT=5000
JWT_EXPIRES_IN=8h
BCRYPT_ROUNDS=10
CORS_ORIGIN=http://localhost:3000
DB_RETRY_ATTEMPTS=5
DB_RETRY_DELAY=5000
```

### 3. Start Production Server

```bash
# Production mode
npm run production

# Development mode with auto-restart
npm run dev-production
```

### 4. Test APIs

```bash
npm test
```

## 📋 Features Implemented

### ✅ Authentication System

- **JWT-based authentication** with bcrypt password hashing
- **Role-based access control** (Admin, Agent, User)
- **Defensive middleware** that never crashes on invalid tokens
- **Multiple login endpoints** for different user types

### ✅ Result Declaration System

- **50% digit locking** in descending order (9,8,7,6,5 are locked)
- **Admin validation** - can only select unlocked triple digits
- **Popup validation** - shows error if resulting single digit is locked
- **Auto-declaration** - system declares result if admin doesn't
- **Database persistence** with proper error handling

### ✅ Database Resilience

- **Auto-reconnect** on database disconnection
- **File-based queue** for operations when DB is down
- **Background processor** to replay queued operations
- **Graceful degradation** - server continues running even if DB fails

### ✅ Security & Error Handling

- **Helmet.js** for security headers
- **CORS** properly configured
- **Request logging** with Morgan
- **Global error handler** that catches all unhandled errors
- **Input validation** and sanitization
- **Async wrapper** to prevent crashes

## 🔌 API Endpoints

### Authentication

```bash
POST /api/admin-panel/login     # Admin login
POST /api/agent/login          # Agent login
POST /api/auth/login           # User login
```

### Results & Game

```bash
POST /api/results/declare      # Declare result (admin/agent only)
GET  /api/results/view         # View current result
GET  /api/results/locked-digits # Get locked digits info
GET  /api/game/current-round   # Get current game round
GET  /api/results/tables       # Get result tables for UI
```

### Admin Management

```bash
GET  /api/admin-panel/agents   # List all agents
POST /api/admin-panel/agents   # Create new agent
GET  /api/admin-panel/users    # List all users
POST /api/admin-panel/users    # Create new user
```

### Agent Management

```bash
GET  /api/agent/dashboard      # Agent dashboard data
GET  /api/agent/users          # Agent's users only
POST /api/agent/add-user       # Agent adds new user
```

### System

```bash
GET  /health                   # Health check with DB status
GET  /api/rounds              # Recent game rounds
```

## 🧪 Testing

### Manual Testing with cURL

1. **Health Check:**

```bash
curl http://localhost:5000/health
```

2. **Admin Login:**

```bash
curl -X POST http://localhost:5000/api/admin-panel/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

3. **Protected Route Test:**

```bash
# Without token (should return 401)
curl http://localhost:5000/api/admin-panel/agents

# With token (should return 200)
curl http://localhost:5000/api/admin-panel/agents \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

4. **Result Declaration (Locked - should fail):**

```bash
curl -X POST http://localhost:5000/api/results/declare \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"winning":"987"}'
```

5. **Result Declaration (Allowed - should succeed):**

```bash
curl -X POST http://localhost:5000/api/results/declare \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"winning":"123"}'
```

### Automated Testing

```bash
npm test
```

This runs comprehensive tests covering all endpoints and edge cases.

## 🔒 Security Features

1. **JWT Authentication** - Secure token-based auth
2. **Password Hashing** - bcrypt with configurable rounds
3. **Helmet.js** - Security headers
4. **CORS Protection** - Configurable origins
5. **Input Validation** - Prevents injection attacks
6. **Error Masking** - Doesn't leak sensitive info in production

## 📊 Result Logic

### Digit Locking System

- **Single Digits**: 50% locked (digits 9,8,7,6,5)
- **Triple Digits**: 160 out of 200 locked (80%) by highest token amounts
- **Validation**: Admin can only select unlocked combinations

### Auto-Declaration

- Triggers in last 10 minutes if admin doesn't declare
- Selects lowest exposure unlocked triple digit
- Ensures resulting single digit is also unlocked

## 🗄️ Database Schema

### Collections Created

- `admins` - Admin users
- `agents` - Agent users
- `users` - End users
- `rounds` - Game rounds with time slots
- `results` - Declared results
- `singledigits` - Single digit snapshots
- `tripledigits` - Triple digit snapshots

## 🔧 Production Deployment

### Environment Variables for Production

```env
NODE_ENV=production
JWT_SECRET=use-a-strong-random-secret-here
MONGODB_URI=mongodb://your-production-db/game999
PORT=5000
CORS_ORIGIN=https://your-frontend-domain.com
```

### PM2 Deployment

```bash
npm install -g pm2
pm2 start server-production.js --name "game999-api"
pm2 startup
pm2 save
```

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "run", "production"]
```

## 📈 Monitoring & Logs

- **Health endpoint** at `/health` shows DB status and queue info
- **Request logging** with timestamps
- **Error logging** with stack traces in development
- **Queue monitoring** for failed operations

## 🚨 Error Handling

The server is designed to never crash:

- Database disconnections are handled gracefully
- Invalid tokens return proper 401/403 responses
- Validation errors return 400 with details
- All async operations are wrapped to catch exceptions
- Global error handler catches any unhandled errors

## 🔄 Queue System

When database is unavailable:

- Operations are queued to `pending_results.json`
- Background processor retries every minute
- Failed items are retried up to 5 times
- Queue status visible in health endpoint

## 📞 Support

Default login credentials:

- **Admin**: `admin` / `admin123`
- **Agents**: Use mobile number for both username and password

The server automatically sets up default data on first run.
