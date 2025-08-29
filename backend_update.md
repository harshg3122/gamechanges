# Backend Update Instructions for Register Screen

## Bet Placement & Wallet Integration

### Bet Placement API
1. **Endpoint**: `/api/bet/place`
2. **Request Body**:
   - `userId`: User placing the bet
   - `selectedNumber`: Number chosen
   - `amount`: Token amount
   - `timeSlot`: Time slot string (e.g., "11:00 AM")
   - `classType`: Game class (if needed)
3. **Logic**:
   - Validate user wallet balance before placing bet
   - Deduct tokens from wallet
   - Store bet with all fields
4. **Model Changes**:
   - Add `userId`, `selectedNumber`, `amount`, `timeSlot`, `classType` to bet model
5. **Testing**:
   - Test with various users, numbers, amounts, and time slots

### Add Token (Deposit) API
1. **Endpoint**: `/api/wallet/add-token`
2. **Request Body**:
   - `userId`: User placing the request
   - `amount`: Amount to add
   - `paymentApp`: App name (e.g., Google Pay)
   - `upiId`: UPI ID
   - `qrImage`: QR image data or URL
3. **Logic**:
   - Validate payment and QR/UPI details
   - Add tokens to user wallet
   - Store transaction details with all fields
4. **Model Changes**:
   - Add fields for payment app, UPI ID, QR image, and userId to wallet transaction model
5. **Testing**:
   - Test with different payment apps, UPI IDs, and QR images

### Withdraw Token API
1. **Endpoint**: `/api/wallet/withdraw`
2. **Request Body**:
   - `userId`: User placing the request
   - `amount`: Amount to withdraw
   - `paymentApp`: App name
   - `mobileNumber`: User's mobile number
3. **Logic**:
   - Validate wallet balance
   - Process withdrawal and store all details
   - Store transaction details with all fields
4. **Model Changes**:
   - Add fields for payment app, mobile number, and userId to withdrawal transaction model
5. **Testing**:
   - Test with different payment apps and mobile numbers

---

### Required Changes

1. **Expose Results API**
   - Create or update an endpoint (e.g., `/api/results`) to return all game results for the day, grouped by time slot (hour).
   - Each result should include:
     - `winningNumber`
     - `resultDate` (date and hour for the slot)
     - Any other relevant fields
   - The frontend will display all results for each time slot, with no game class selection.

2. **Time Slot Logic**
   - Ensure each result entry is associated with a time slot (e.g., 11:00 AM, 12:00 PM, etc.)
   - The frontend matches results to time slots using the `resultDate` hour.
   - If multiple results exist for a slot, return all for that hour.

3. **Update Models if Needed**
   - Ensure models (e.g., `Result`) have necessary fields to support time slot logic.

4. **Testing**
   - Test the results API to ensure it returns all required fields and matches frontend expectations for time slots.

---

## History Screen Backend Integration

### Required Changes

1. **Expose User History API**
   - Create or update an endpoint (e.g., `/api/user/history` or `/api/user/selections`) to return user's number selection history.
   - Each history item should include:
     - `selectedNumber`
     - `resultNumber` (if available)
     - `status` (win/loss/pending)
     - `timeSlot` (computed from round start time, e.g., "11:00 AM")
     - Any other relevant fields

2. **Time Slot Logic**
   - For each history entry, compute a `timeSlot` string from the round's start time (e.g., every hour: "11:00 AM", "12:00 PM").
   - Example (Node.js):
     ```js
     function getTimeSlot(date) {
       const d = new Date(date);
       let hours = d.getHours();
       const minutes = d.getMinutes();
       const ampm = hours >= 12 ? 'PM' : 'AM';
       hours = hours % 12;
       hours = hours ? hours : 12;
       return `${hours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
     }
     // Add timeSlot to each history item
     item.timeSlot = getTimeSlot(round.startTime);
     ```

3. **Update Models if Needed**
   - Ensure models (e.g., `NumberSelection`, `Result`) have necessary fields to support history and time slot logic.

4. **Testing**
   - Test the history API to ensure it returns all required fields, including `timeSlot`, and matches frontend expectations.

---

## Profile & Edit Profile Screen Backend Integration

### Required Changes

1. **Expose Mobile Number and Referral in Profile API**
   - Update the `/api/user/profile` (or equivalent) endpoint to return `mobileNumber` and `referral` fields in the user object.
   - Example response:
     ```json
     {
       "id": "...",
       "username": "...",
       "email": "...",
       "mobileNumber": "...",
       "referral": "...",
       "walletBalance": ...
     }
     ```

2. **Accept Mobile Number and Referral in Edit Profile API**
   - Update the `/api/user/profile` (PUT/PATCH) endpoint to accept `mobileNumber` and `referral` fields in the request body.
   - Example:
     ```js
     const { username, email, mobileNumber, referral } = req.body;
     ```

3. **Update User Model**
   - Ensure the User schema/model includes `mobileNumber` and `referral` fields.
   - Example (Mongoose):
     ```js
     mobileNumber: { type: String },
     referral: { type: String },
     ```

4. **Edit Profile Logic**
   - When updating the profile, save changes to `mobileNumber` and `referral` if provided.
   - Example:
     ```js
     if (mobileNumber) user.mobileNumber = mobileNumber;
     if (referral) user.referral = referral;
     ```

5. **Testing**
   - Test profile fetch and update endpoints with all fields: username, email, mobileNumber, referral.
   - Ensure the backend responds correctly and updates/stores all data as expected.

---

## Required Changes

1. **Accept Referral Field in Registration API**
   - Update the `/api/auth/register` endpoint to accept and process the `referral` field from the request body.
   - Example:
     ```js
     const { username, mobileNumber, email, password, referral } = req.body;
     ```

2. **Store Referral Field (Optional)**
   - If you want to save the referral code, update the `User` model and registration logic to store it.
   - Example:
     ```js
     if (referral && referral.trim() !== '') {
       userData.referral = referral;
     }
     ```
   - Add `referral` to the User schema if not present.

3. **Referral Logic (Optional)**
   - Implement any business logic for referral codes (e.g., bonus, validation, linking users).

4. **Testing**
   - Test the registration endpoint with all fields: username, email, password, mobileNumber, referral.
   - Ensure the backend responds correctly and stores all data as expected.

---

**Note:**
- No breaking changes for existing users if referral is optional.
- Update API documentation if needed.

---

_Last updated: July 29, 2025_
