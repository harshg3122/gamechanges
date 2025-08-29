# Backend Integration Requirements for Number Game App

This document lists all backend features, endpoints, and data requirements needed for your Flutter frontend to work seamlessly. Use this as a checklist for backend development and API coverage.

---

## 1. User Authentication & Profile

- **Registration & Login**
  - Endpoint: `POST /auth/register` (mobile, password, referral)
  - Endpoint: `POST /auth/login` (mobile/email, password)
  - JWT authentication for all user actions
  - Referral code logic: store, validate, and apply referral bonuses

- **Profile Management**
  - Endpoint: `GET /user/profile` (fetch user info)
  - Endpoint: `PUT /user/profile` (update info)
  - Fields: username, mobile, email, referral, wallet balance

---

## 2. Wallet & Transactions

- **Wallet Balance**
  - Endpoint: `GET /user/wallet/transactions` (fetch wallet history)
  - Field: wallet balance (double/int)

- **Add Tokens**
  - Endpoint: `POST /user/wallet/add` (amount, payment app, referral)
  - Admin/manual add tokens support
  - Store transaction with before/after balance

- **Withdraw Tokens**
  - Endpoint: `POST /user/wallet/withdraw` (amount, payment app, referral)
  - Store withdrawal request, status, and update wallet on approval

- **Transaction History**
  - Endpoint: `GET /user/wallet/transactions` (list all transactions)
  - Fields: type, amount, date, status, payment app

---

## 3. Game Logic & Play

- **Game Classes**
  - Endpoint: `GET /game/numbers/:classType` (return valid numbers for A/B/C/D)
  - Logic for grouping numbers by title (for UI display)

- **Place Bet**
  - Endpoint: `POST /game/select` (classType, number, amount)
  - Validate number, deduct wallet, store selection
  - Store: userId, classType, number, amount, roundId, status

- **Current Round Info**
  - Endpoint: `GET /game/round/current` (start/end time, roundId)

- **User Selections**
  - Endpoint: `GET /user/selections` (history of bets)
  - Endpoint: `GET /game/selections/current` (current round selections)

---

## 4. Results & History

- **Set Results (Admin)**
  - Endpoint: `POST /admin/results/set` (roundId, winning numbers for each class)

- **Fetch Results**
  - Endpoint: `GET /game/results/recent` (recent results for all classes)
  - Endpoint: `GET /user/results` (user's result history)
  - Data: time slot, selected number, result number, win/loss status

- **Result Display**
  - Provide results grouped by time slot (11AM-11PM)
  - For each slot: show result number, status (WIN/LOSE/Pending)

---

## 5. Withdrawals & Add Tokens

- **Withdraw Request**
  - Endpoint: `POST /user/wallet/withdraw` (amount, payment app, referral)
  - Store request, status, and update wallet on approval

- **Add Tokens Request**
  - Endpoint: `POST /user/wallet/add` (amount, payment app, referral)
  - Store request, status, and update wallet on approval

- **Admin Approval**
  - Endpoint: `POST /admin/wallet/manage` (approve/reject add/withdraw requests)

---

## 6. Admin Features

- **Dashboard**
  - Endpoint: `GET /admin/dashboard` (stats, user count, total bets, payouts)

- **User Management**
  - Endpoint: `GET /admin/users` (list all users)
  - Endpoint: `POST /admin/users/:id/toggle-status` (activate/deactivate)

- **Wallet Management**
  - Endpoint: `POST /admin/wallet/manage` (add/deduct funds)

- **Result Management**
  - Endpoint: `POST /admin/results/set` (set winning numbers)
  - Endpoint: `GET /admin/results` (all results)

---

## 7. Security & Validation

- Password hashing (bcrypt)
- JWT authentication
- Rate limiting
- Input validation & sanitization
- Admin lockout after failed attempts
- CORS and security headers

---

## 8. API Documentation & Monitoring

- Document all endpoints and request/response formats
- Provide `/api/docs` for API reference
- Implement `/health` endpoint for server status
- Log all requests and errors

---

## 9. Data Models (MongoDB)

- **User**: username, mobile, email, passwordHash, wallet, referral, gamesPlayed, timestamps
- **NumberSelection**: userId, classType, number, amount, roundId, status, winningAmount, timestamps
- **Result**: roundId, winning numbers, participant stats, winners, timestamps
- **WalletTransaction**: userId, type, amount, source, description, balance before/after, timestamps
- **WithdrawalRequest**: userId, amount, payment app, referral, status, timestamps

---

## 10. Testing & Deployment

- Test all endpoints with Postman/cURL
- Set up environment variables for production
- Deploy on Render/Railway/Heroku
- Set up MongoDB Atlas and whitelist server IP

---

**Review this checklist with your backend team. Every item here is required for the frontend to work as designed.**

