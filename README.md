# Student Registry App

Live App: https://student-app-mocha.vercel.app/

A full-stack MERN application for managing student records, with per-user authentication, email and SMS OTP verification, and isolated data per user.

---

## Features

- Register with email + phone + password
- Email OTP sent via Gmail, SMS OTP sent via Twilio — both must be verified to create an account
- 6-digit OTP boxes with paste support, per-attempt lockout (5 attempts), and 10-minute expiry
- 60-second resend cooldown with individual resend buttons for email and SMS
- JWT authentication — sessions survive page reloads, expire after 7 days
- Passwords hashed with bcrypt (12 rounds), OTPs hashed with bcrypt (8 rounds)
- Each user has their own isolated student list
- Full CRUD: add, view, edit, delete students with format validation

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React.js (Vercel) |
| Backend | Node.js + Express.js (Render) |
| Database | MongoDB Atlas |
| Auth | JWT + bcryptjs |
| Email OTP | Nodemailer + Gmail SMTP |
| SMS OTP | Twilio |

---

## Project Structure

```
student-app/
├── backend/
│   ├── server.js
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── App.js
│   │   ├── App.css
│   │   ├── index.js
│   │   └── index.css
│   ├── package.json
│   └── .env.example
├── .gitignore
└── README.md
```

---

## Third-Party Service Setup

Before deploying, you need credentials from two free services.

### Gmail App Password (for email OTP)

Gmail App Passwords let your app send email without exposing your account password.

1. Sign into your Google account at https://myaccount.google.com
2. Go to **Security** and enable **2-Step Verification** if not already on
3. Go to **Security → App passwords**: https://myaccount.google.com/apppasswords
4. Click **Create**, give it a name (e.g. "Student Registry"), and click **Create**
5. Copy the 16-character password shown (no spaces). This is your `GMAIL_APP_PASSWORD`
6. Your Gmail address is your `GMAIL_USER`

Notes:
- Use a dedicated Gmail account for sending, not your personal one
- If you do not see "App passwords", 2-Step Verification is not enabled

### Twilio (for SMS OTP)

Twilio has a free trial with enough credits to test thoroughly.

1. Sign up at https://www.twilio.com/try-twilio
2. After signing up, go to your **Console Dashboard**: https://console.twilio.com
3. Copy your **Account SID** and **Auth Token** from the dashboard
4. Click **Get a phone number** (free trial gives you one number automatically)
   - The number will look like `+12025551234` — this is your `TWILIO_PHONE_NUMBER`
5. Free trial note: on trial accounts, you can only send SMS to **verified numbers**
   - Go to **Phone Numbers → Verified Caller IDs** in the Twilio Console
   - Add and verify any phone numbers you want to test with
   - To send to any number without restrictions, upgrade to a paid account

---

## Local Development

### Prerequisites

- Node.js v18+
- A MongoDB Atlas cluster (free tier works)
- Gmail App Password (see above)
- Twilio account (see above)

### 1. Clone the repo

```bash
git clone https://github.com/your-username/student-app.git
cd student-app
```

### 2. Backend setup

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env` with your real values:

```env
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/studentapp?retryWrites=true&w=majority
JWT_SECRET=<run: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))">
PORT=5000
ALLOWED_ORIGINS=http://localhost:3000

GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your16charapppassword

TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1xxxxxxxxxx
```

```bash
npm start
```

### 3. Frontend setup

```bash
cd ../frontend
npm install
cp .env.example .env.local
```

Edit `.env.local`:

```env
REACT_APP_API_URL=http://localhost:5000
```

```bash
npm start
```

---

## How the OTP Flow Works

```
User fills register form
        ↓
POST /auth/register
  → Validate inputs
  → Check email + phone not already registered
  → Hash password, save as PendingUser (expires 15 min)
  → Generate 6-digit email OTP + 6-digit phone OTP
  → Hash and store both OTPs (expire 10 min)
  → Send email via Gmail SMTP
  → Send SMS via Twilio
        ↓
OTP verification screen shown
        ↓
User enters both 6-digit codes
        ↓
POST /auth/verify-otp
  → Verify email OTP (max 5 attempts)
  → Verify phone OTP (max 5 attempts)
  → Create real User document (emailVerified: true, phoneVerified: true)
  → Delete PendingUser
  → Return JWT token
        ↓
User is signed in
```

---

## API Endpoints

### Auth

| Method | Endpoint | Body | Description |
|---|---|---|---|
| POST | `/auth/register` | `{ email, phone, password }` | Send OTPs; save pending registration |
| POST | `/auth/verify-otp` | `{ email, emailOtp, phoneOtp }` | Verify both OTPs; create account; return JWT |
| POST | `/auth/resend-otp` | `{ email, type }` | Resend one OTP (`type`: `"email"` or `"phone"`) |
| POST | `/auth/login` | `{ email, password }` | Sign in; return JWT |
| GET | `/auth/me` | — (Bearer token) | Verify token; return user info |

### Students (all require `Authorization: Bearer <token>`)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/students` | List signed-in user's students |
| POST | `/students` | Add a student |
| PUT | `/students/:id` | Update a student |
| DELETE | `/students/:id` | Delete a student |

---

## Security Notes

- OTPs are hashed with bcrypt before storage — the plain OTP is never persisted
- OTP documents have a MongoDB TTL index — they auto-delete after 10 minutes
- After 5 failed OTP attempts, the OTP is deleted and a new one must be requested
- PendingUser documents expire after 15 minutes
- Passwords use bcrypt with 12 salt rounds
- JWTs are signed with a secret that never leaves the server
- All student routes verify ownership — users cannot access each other's data
- CORS is restricted to the `ALLOWED_ORIGINS` list
- `userId` is never exposed in API responses
- Input is passed through an allowlist on the backend to prevent mass assignment
- Never commit `.env` to version control

