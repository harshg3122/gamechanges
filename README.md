# Game 999 - Number Game Backend & Frontend

A comprehensive number game application with betting functionality, wallet management, and real-time results.

## 🚀 Quick Start

### Backend Setup
```bash
cd backend
npm install
npm start
```

### Frontend Setup  
```bash
cd frontend_andriod
flutter pub get
flutter run
```

## 🧪 API Testing

We have a single comprehensive test script that tests all backend APIs:

```bash
cd backend
npm test
# or
npm run test-apis
```

### What the test covers:
- ✅ **User Authentication** - Registration, login, token verification
- ✅ **Game APIs** - Current round, place bets, get results
- ✅ **Wallet APIs** - Balance, add funds, withdraw, transactions
- ✅ **User Management** - Profile, update, password change
- ✅ **QR Code APIs** - Generate payment QR codes
- ✅ **Admin Authentication** - Admin login and management

### Prerequisites for testing:
1. **MongoDB** running locally or connection string in `.env`
2. **Backend server** running on port 5000: `npm start`
3. **Environment variables** configured (see `.env.example`)

## 📁 Project Structure

```
├── backend/               # Node.js Express API
│   ├── controllers/       # API controllers
│   ├── models/           # MongoDB schemas  
│   ├── routes/           # API routes
│   ├── middleware/       # Auth & validation
│   ├── scripts/          # Single test script
│   └── server.js         # Main server file
├── frontend_andriod/     # Flutter mobile app
│   ├── lib/
│   │   ├── services/     # API service classes
│   │   ├── providers/    # State management
│   │   ├── screens/      # App screens
│   │   └── widgets/      # Reusable widgets
└── admin-panel-cilent/   # React admin panel
```

## 🔧 Environment Variables

Create `.env` in backend directory:
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/numbergame
JWT_SECRET=your-jwt-secret
ADMIN_EMAIL=admin@game999.com
ADMIN_PASSWORD=admin123
```

## 📱 Features

### For Users:
- 📝 Registration and login
- 🎮 Number selection and betting
- � Wallet management (add/withdraw funds)
- 📊 Transaction and bet history
- 📱 QR code payments
- 🏆 Results and winnings

### For Admins:
- 👥 User management
- 🎯 Result declaration
- 💳 Wallet management
- 📈 Reports and analytics
- ⚙️ System settings

## 🧪 Testing All APIs

The `test-all-apis.js` script automatically:

1. **Creates test data** (users, admin, agent, active round)
2. **Tests all endpoints** with proper authentication
3. **Validates responses** and error handling
4. **Cleans up** test data after completion
5. **Reports results** with pass/fail summary

## 🔗 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/admin/login` - Admin login

### Game
- `GET /api/current-round` - Current game round
- `POST /api/bet` - Place a bet
- `GET /api/results` - Game results

### Wallet
- `GET /api/balance` - Wallet balance  
- `POST /api/wallet/add` - Add balance request
- `POST /api/wallet/withdraw` - Withdraw request

### User
- `GET /api/user/profile` - User profile
- `PUT /api/user/update` - Update profile
- `POST /api/user/change-password` - Change password

## 🚀 Deployment

The application is ready for deployment to platforms like:
- **Backend**: Railway, Render, Heroku
- **Frontend**: Google Play Store (Android)
- **Admin Panel**: Vercel, Netlify

## 📞 Support

For issues or questions:
- Check the comprehensive test script output
- Review API documentation at `/api/docs`
- Ensure all environment variables are set
- Verify MongoDB connection

---

**Game 999** - Built with Node.js, Flutter, and React
   build_script.bat
   
   # On macOS/Linux  
   ./build_script.sh
   ```

2. **Deploy to Vercel:**
   ```bash
   npm i -g vercel
   vercel --prod
   ```

> **Note:** This project uses npm as its package manager. Please use npm commands (not yarn) to ensure consistent dependency management.

### For Backend & Admin Panel
```bash
# Using the batch file (Windows)
start-admin.bat

# Or manually
npm run install:all
npm run start:all
```

## 🌐 Web Deployment Guide

### Deploying to Vercel (Recommended)

1. **Build the web app:**
   ```bash
   npm run build:web
   # Or use the build script: build_script.bat
   ```

2. **Deploy using Vercel CLI:**
   ```bash
   npm i -g vercel
   npm run deploy:vercel
   ```

3. **Or deploy via GitHub:**
   - Push code to GitHub using `setup_git.bat`
   - Connect repository to Vercel
   - Set build directory to `frontend_andriod/build/web`

### Manual Deployment Steps

1. **Install dependencies:**
   ```bash
   npm run install:all
   ```

2. **Build for web:**
   ```bash
   npm run build:web
   ```

3. **The built web app will be in:**
   ```
   frontend_andriod/build/web/
   ```

4. **Upload this folder to any static hosting service**

## � Platform Features

### Web Application
- 🖥️ **Desktop-optimized layout** with sidebar navigation
- 📊 **Dashboard with statistics cards** arranged in grid
- 🎮 **Large game class cards** for easy clicking
- 📱 **Responsive design** that adapts to screen size
- 🎨 **Modern web UI** with hover effects and animations

### Mobile Application  
- 📱 **Mobile-first design** with bottom navigation
- 👆 **Touch-optimized** game interactions
- 🔄 **Smooth animations** and transitions
- 📋 **Compact layouts** for small screens
- 🎯 **Gesture-friendly** interface

## 🛠️ Development Commands

```bash
# Install all dependencies
npm run install:all

# Start backend and admin panel
npm run start:all

# Build web application
npm run build:web

# Build Android APK
npm run build:android

# Build everything
npm run build:all

# Clean Flutter cache
npm run clean

# Setup Git repository
npm run setup:git

# Deploy to Vercel
npm run deploy:vercel
```

## 🎯 How to Host on Vercel

### Quick Method (5 minutes)

1. **Run the build script:**
   ```cmd
   build_script.bat
   ```

2. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

3. **Deploy:**
   ```bash
   vercel login
   vercel --prod
   ```
   
   When prompted:
   - Directory: `./frontend_andriod/build/web`
   - Project name: `game-999`

4. **Your app is now live!** ✨

### GitHub Integration Method

1. **Setup Git and push:**
   ```cmd
   setup_git.bat
   ```

2. **Create GitHub repository** and push code

3. **Import to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Import GitHub repository
   - Build directory: `frontend_andriod/build/web`

### 🔧 Configuration Details

The project includes:
- ✅ `vercel.json` - Pre-configured for Flutter web
- ✅ Build scripts for automation
- ✅ Git setup scripts
- ✅ Responsive design for all screen sizes
- ✅ SEO-optimized meta tags

## 📁 Project Structure

```
Game999/
├── 📁 backend/              # Node.js REST API Server
├── 📁 admin/                # React.js Admin Panel  
├── 📁 frontend_andriod/     # Flutter Mobile & Web App
│   ├── � lib/
│   │   ├── 📁 screens/
│   │   │   ├── web_main_screen.dart      # Web-specific UI
│   │   │   ├── responsive_dashboard.dart # Responsive dashboard
│   │   │   └── ...
│   │   ├── 📁 widgets/
│   │   │   ├── responsive_layout.dart    # Responsive utilities
│   │   │   ├── web_navigation.dart       # Web navigation
│   │   │   └── ...
│   │   └── 📁 utils/
│   │       └── platform_utils.dart       # Platform detection
│   ├── 📁 web/              # Web assets
│   └── 📁 build/web/        # Built web application
├── 📄 build_script.bat      # Build automation
├── 📄 setup_git.bat         # Git setup script
├── 📄 vercel.json          # Vercel deployment config
└── 📄 DEPLOYMENT_README.md  # Detailed deployment guide
```

## 🖥️ Applications

### 1. 🗄️ Backend API (Node.js + Express + MongoDB)
- **Port**: http://localhost:5000
- **Features**: 
  - User authentication & management
  - Admin authentication & controls
  - Game logic & number selection
  - Wallet transactions
  - Real-time results
  - JWT security

### 2. 🎛️ Admin Panel (React.js + Bootstrap)
- **Port**: http://localhost:3000
- **Features**:
  - 📊 Dashboard with analytics
  - 👥 User management
  - 💰 Wallet top-up/deduction
  - 🎯 Set game results
  - 🏆 View winners & losers
  - 📈 Reports & charts

### 3. 📱 Flutter Mobile App
- **Path**: `frontend_andriod/`
- **Features**:
  - User registration & login
  - Number selection interface
  - Wallet management
  - Game history
  - Push notifications

## 🔑 Default Credentials

### Admin Login
- **Email**: `admin@numbergame.com`
- **Password**: `Admin@123`

## 🛠️ Technologies Used

### Backend
- **Node.js** + **Express.js**
- **MongoDB** with Mongoose
- **JWT** Authentication
- **bcryptjs** Password hashing
- **CORS**, **Helmet** Security
- **express-validator** Validation
- **node-cron** Scheduled tasks

### Admin Panel
- **React.js 18**
- **Bootstrap 5** + React Bootstrap
- **Formik** + **Yup** Forms
- **Axios** HTTP client
- **Recharts** Data visualization
- **React Router** Navigation

### Mobile App
- **Flutter** Framework
- **Dart** Programming language
- **HTTP** API integration
- **Provider** State management

## 🚦 Getting Started

### Prerequisites
- **Node.js** (v16 or higher)
- **MongoDB** (local or cloud)
- **Flutter SDK** (for mobile app)
- **Git**

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/prthamesh-pr/Game.git
   cd Game
   ```

2. **Install dependencies**:
   ```bash
   # Backend
   cd backend
   npm install
   
   # Admin Panel
   cd ../admin
   npm install
   
   # Flutter App
   cd ../frontend_andriod
   flutter pub get
   ```

3. **Environment Setup**:
   ```bash
   # Backend (.env)
   cp backend/.env.example backend/.env
   
   # Admin Panel (.env)
   cp admin/.env.example admin/.env
   ```

4. **Start Services**:
   ```bash
   # Option 1: Use batch file (Windows)
   start-admin.bat
   
   # Option 2: Manual start
   # Terminal 1 - Backend
   cd backend && npm run dev
   
   # Terminal 2 - Admin Panel
   cd admin && npm start
   
   # Terminal 3 - Flutter App
   cd frontend_andriod && flutter run
   ```

## 📊 Features Overview

### 🎮 Game Flow
1. **User Registration** → Mobile number + OTP
2. **Token Top-up** → Add tokens to play
3. **Number Selection** → Choose 3-digit number (000-999)
4. **Game Classes** → A, B, C with different timing
5. **Result Declaration** → Admin sets winning numbers
6. **Auto Calculation** → Win/Loss determined automatically
7. **Payout** → Winners receive tokens in wallet

### 🔐 Security Features
- **JWT Authentication** for all APIs
- **Role-based Access Control** (User/Admin)
- **Password Hashing** with bcrypt
- **Input Validation** & sanitization
- **Rate Limiting** to prevent abuse
- **CORS Protection**
- **Security Headers** with Helmet

### 📱 Admin Capabilities
- ✅ **Dashboard** - Real-time statistics
- ✅ **User Management** - View, activate/deactivate users
- ✅ **Wallet Control** - Add/deduct tokens
- ✅ **Result Setting** - Set winning numbers
- ✅ **Winner Tracking** - View all winners/losers
- ✅ **Reports** - Analytics with charts
- ✅ **Transaction History** - Complete audit trail

## 🔧 Configuration

### Backend Environment Variables
```env
# Database
MONGODB_URI=mongodb://localhost:27017/numbergame
MONGODB_LOCAL=mongodb://localhost:27017/numbergame

# Server
PORT=5000
NODE_ENV=development

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=24h

# Admin Account
ADMIN_EMAIL=admin@numbergame.com
ADMIN_PASSWORD=Admin@123
```

### Admin Panel Environment Variables
```env
REACT_APP_API_URL=http://localhost:5000/api
```

## 📈 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/admin/login` - Admin login

### User Management
- `GET /api/admin/users` - Get all users
- `POST /api/admin/wallet/manage` - Manage user wallet
- `POST /api/admin/users/:id/toggle-status` - Activate/deactivate user

### Game Management
- `POST /api/game/select-number` - User number selection
- `POST /api/admin/results/set` - Admin set results
- `GET /api/admin/results` - Get results history

### Reports
- `GET /api/admin/dashboard` - Dashboard statistics
- `GET /api/admin/reports` - Generate reports

## 🎯 Game Rules

### Number Selection
- **Range**: 000 to 999 (3-digit numbers)
- **Classes**: A, B, C (different timing/odds)
- **Minimum Bet**: 10 Tokens
- **Maximum Bet**: 10,000 Tokens

### Winning Logic
- **Exact Match**: User number = Admin result → WIN
- **No Match**: User number ≠ Admin result → LOSS
- **Payout**: 90x bet amount for winners

### Game Timing
- **Class A**: Every 1 hour
- **Class B**: Every 2 hours  
- **Class C**: Every 4 hours

## 🔍 Troubleshooting

### Common Issues

1. **Port 5000 already in use**:
   ```bash
   netstat -ano | findstr :5000
   taskkill /PID [PID_NUMBER] /F
   ```

2. **MongoDB connection failed**:
   - Ensure MongoDB is running
   - Check connection string in `.env`

3. **Admin panel not loading**:
   - Check if backend is running on port 5000
   - Verify REACT_APP_API_URL in admin/.env

4. **Flutter build issues**:
   ```bash
   flutter clean
   flutter pub get
   flutter run
   ```

## 📞 Support

- **GitHub**: https://github.com/prthamesh-pr/Game
- **Issues**: https://github.com/prthamesh-pr/Game/issues

## 📄 License

This project is licensed under the ISC License.

---

## 🚀 Deployment

### Backend (Node.js)
- **Heroku**, **Railway**, **DigitalOcean**
- Configure environment variables
- Set up MongoDB Atlas for production

### Admin Panel (React)
- **Netlify**, **Vercel**, **GitHub Pages**
- Build with `npm run build`
- Configure API URL for production

### Mobile App (Flutter)
- **Google Play Store** (Android)
- **Apple App Store** (iOS)
- Configure API endpoints for production

---

**🎮 Happy Gaming! 🎮**
