# Admin Panel Backend (Node.js + Express)

This folder will contain the backend API for the admin panel. Follow these steps to get started:

## 1. Setup

- Run `npm init -y` in this folder to initialize the Node.js project.
- Install dependencies:
  - `npm install express mongoose cors jsonwebtoken bcryptjs multer dotenv` (add others as needed)

## 2. Folder Structure

- `controllers/` - Route logic for each resource (users, admins, games, results, withdrawals, transactions, QR codes, settings, notifications)
- `models/` - Mongoose models for all entities
- `routes/` - Express route files for each resource
- `middleware/` - Auth, validation, error handling
- `utils/` - Helper functions (file upload, audit logging)
- `server.js` - Main entry point

## 3. Key Features

- JWT authentication and role-based access
- CRUD endpoints for all resources
- File/image upload for QR codes (Multer)
- Audit logging for admin actions
- Automated result selection (cron job)
- Data export (CSV/Excel)
- CORS enabled for frontend integration

## 4. Hosting

- The backend should be hosted at: `https://game-39rz.onrender.com`
- Set up environment variables for DB connection, JWT secret, etc.

## 5. Example Express Server

```js
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Import routes
// app.use('/api/users', require('./routes/userRoutes'));
// ...other routes

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
```

---

You can now scaffold your backend API and start building endpoints as described in `admin.md`. For code samples or starter routes/models, let me know!
