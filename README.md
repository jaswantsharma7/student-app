# Student Registry App

A full-stack MERN application for managing student records, with per-user authentication and isolated data.

---

## Features

- Register and log in with email, phone, and password
- JWT-based authentication — tokens expire after 7 days
- Passwords hashed with bcrypt (12 rounds)
- Each user has their own isolated list of students
- Full CRUD: add, view, edit, delete students
- Hosted on Vercel (frontend) and Render (backend)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React.js |
| Backend | Node.js + Express.js |
| Database | MongoDB Atlas |
| Auth | JWT + bcryptjs |
| Frontend Hosting | Vercel |
| Backend Hosting | Render |

---

## Project Structure

```
student-app/
├── backend/
│   ├── server.js
│   ├── package.json
│   └── .env
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── App.js
│   │   ├── App.css
│   │   ├── index.js
│   │   └── index.css
│   ├── package.json
│   └── .env
└── README.md
```

---

## Local Development

### Prerequisites

- Node.js v18+
- A MongoDB Atlas cluster (free tier works)

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

Edit `.env`:

```env
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/studentapp?retryWrites=true&w=majority
JWT_SECRET=<generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))">
PORT=5000
ALLOWED_ORIGINS=http://localhost:3000
```

```bash
npm start
```

### 3. Frontend setup

```bash
cd frontend
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

## Deployment

### Render (Backend)

1. Create a new **Web Service** on Render, connected to your GitHub repo.
2. Set the **Root Directory** to `backend`.
3. Set **Build Command**: `npm install`
4. Set **Start Command**: `node server.js`
5. Add these **Environment Variables** in Render's dashboard:

| Variable | Value |
|---|---|
| `MONGODB_URI` | Your MongoDB Atlas connection string |
| `JWT_SECRET` | A long random secret (64+ hex chars) |
| `ALLOWED_ORIGINS` | Your Vercel frontend URL, e.g. `https://your-app.vercel.app` |
| `NODE_ENV` | `production` |

### Vercel (Frontend)

1. Import your GitHub repo on Vercel.
2. Set the **Root Directory** to `frontend`.
3. Add this **Environment Variable** in Vercel's dashboard:

| Variable | Value |
|---|---|
| `REACT_APP_API_URL` | Your Render backend URL, e.g. `https://your-backend.onrender.com` |

4. Deploy. Vercel auto-builds on every push to `main`.

### MongoDB Atlas

- Create a free cluster.
- Add a database user with read/write access.
- Whitelist `0.0.0.0/0` (or restrict to Render's IPs) under Network Access.
- Use the connection string in your Render environment variables.

---

## API Endpoints

### Auth

| Method | Endpoint | Body | Description |
|---|---|---|---|
| POST | `/auth/register` | `{ email, phone, password }` | Create account, returns JWT |
| POST | `/auth/login` | `{ email, password }` | Sign in, returns JWT |
| GET | `/auth/me` | — (Bearer token) | Verify token, return user |

### Students (all require `Authorization: Bearer <token>`)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/students` | List user's students |
| POST | `/students` | Add a student |
| PUT | `/students/:id` | Update a student |
| DELETE | `/students/:id` | Delete a student |

---

## Security Notes

- Passwords are never stored in plain text — bcrypt with 12 salt rounds.
- JWTs are signed with a secret that never leaves the server.
- All student routes require a valid JWT; users can only access their own data.
- CORS is restricted to the listed allowed origins.
- The `userId` field is stripped from all student API responses.
- Input is validated and field access is limited via an allowlist on the backend.
- Never commit `.env` to version control — use `.env.example` as a template.
