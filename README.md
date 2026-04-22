# Student Registry App

Live App: https://student-app-mocha.vercel.app/

A full-stack MERN application for managing student records, with per-user authentication, email and SMS OTP verification, and isolated data per user.

---

## Features

### Authentication & Security
* **JWT-Based Sessions:** Secure, stateless user sessions using JSON Web Tokens.
* **Dual Two-Factor Authentication (2FA):**
    * Requires both **Email OTP** (via Nodemailer) and **SMS OTP** (via Twilio) during registration.
    * Requires an Email OTP step during the login process.
* **Timing-Attack Prevention:** Uses dummy password hashing checks during login if an email isn't found, preventing malicious actors from enumerating valid email addresses.
* **Rate Limiting:** Protects all authentication and OTP endpoints (`express-rate-limit`) against brute-force attacks and spam.
* **Atomic Database Operations:** Uses MongoDB's `upsert` and `$set` during registration to prevent race conditions and duplicate pending users.

### Data Integrity & Validation
* **E.164 Phone Normalization:** A custom backend algorithm that sanitizes international phone numbers, ensuring that variations like `+91 0845...` and `+91 845...` are collapsed into a single, canonical database entry.
* **Dual-Layer Validation:**
    * **Frontend:** Immediate feedback for valid emails, phone lengths, roll number formats, and age limits before submission.
    * **Backend:** Strict Mongoose schema validation to ensure no bad data reaches the database.

### Student Management (CRUD)
* **Isolated Workspaces:** Every student record is tied securely to the authenticated user's `userId`. Users can only see and modify their own enrolled students.
* **Comprehensive Records:** Captures detailed student information including Full Name, Age, Course, Roll Number, University, Email, Phone, and Address.
* **Full CRUD Capabilities:** Users can seamlessly Add, View, Edit, and Delete student records.

### Frontend & UI/UX Features
* **Smart Search & Filtering:** A robust search bar allows users to filter the student list globally (all fields) or target specific columns (e.g., searching only by "Roll No" or "Course").
* **Custom OTP Component:** A user-friendly 6-digit input box that supports auto-focusing on the next box, backspacing, and native clipboard pasting.
* **International Phone Input:** A custom dropdown component featuring flags, country names, and dial codes to easily select and format international phone numbers.
* **Responsive Tabbed Interface:** A clean, single-page application feel that switches smoothly between the "List Students" view and the "Add/Edit Student" forms.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React.js (Vercel) |
| Backend | Node.js + Express.js (Render) |
| Database | MongoDB Atlas |
| Auth | JWT + bcryptjs + express-rate-limiter + cors |
| Email OTP | Nodemailer + Gmail SMTP |
| SMS OTP | Twilio |
| Environment & Utilities | dotenv |

---

## Project Structure

```
/student-registry-app
├── /backend
│   ├── /config
│   │   ├── db.js
│   │   └── corsConfig.js
│   ├── /middlewares
│   │   ├── authMiddleware.js
│   │   └── rateLimiters.js
│   ├── /models
│   │   ├── OTP.js
│   │   ├── PendingUser.js
│   │   ├── Student.js
│   │   └── User.js
│   ├── /routes
│   │   ├── authRoutes.js
│   │   └── studentRoutes.js
│   ├── /services
│   │   ├── otpService.js
│   │   └── phoneNormalizer.js
│   ├── /utils
│   │   └── helpers.js
│   ├── .env
│   ├── package.json
│   └── server.js
├── /frontend
│   ├── /public
│   |   └── index.html
│   ├── /src
│   │   ├── /components
│   │   │   ├── AuthPage.js
│   │   │   ├── CountryCodeSelector.js
│   │   │   ├── OtpInput.js
│   │   │   ├── PhoneInput.js
│   │   │   └── SearchBar.js
│   │   ├── /utils
│   │   │   ├── api.js
│   │   │   ├── constants.js
│   │   │   └── validators.js
│   │   ├── App.css
│   │   ├── App.js
│   │   └── index.js
│   ├── .env
│   └── package.json
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
| POST | `/auth/login-verify` | `{ email, otp}` | Verify Login 2FA and return JWT |
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

## License
This project is licensed under the MIT License. Feel free to use, modify, and distribute it as per the terms of the license.
