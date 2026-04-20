# Student App

A full-stack MERN (MongoDB, Express, React, Node.js) application for managing student records. Supports full CRUD — create, read, update, and delete — through a clean, interactive interface. The entire stack is deployed and live.

---

## Live Demo

| Layer | URL |
|---|---|
| **Frontend (React)** | https://student-app-delta-eosin.vercel.app/ |
| **Backend / API** | https://backend-timh.onrender.com

---

## Features

- **Add Student** — Submit student details through a form
- **View Students** — Browse all records in a structured table
- **Edit Student** — Update any existing record in place
- **Delete Student** — Remove a record permanently
- **Persistent Storage** — MongoDB Atlas stores all data in the cloud
- **Fully Hosted** — Frontend on Vercel, backend on Render

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React.js |
| **Backend** | Node.js + Express.js (`server.js`) |
| **Database** | MongoDB (Atlas) |
| **Frontend Hosting** | Vercel |
| **Backend Hosting** | Render |

---

## Project Structure

```
student-app/
├── backend/
│   ├── server.js
│   └── package.json
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── App.js
│   │   ├── App.css
│   │   ├── index.js
│   │   └── index.css
│   ├── package.json
├── .gitignore
└── README.md
```

---

## Getting Started (Local Development)

### Prerequisites

- [Node.js](https://nodejs.org/) (v14 or higher)
- [npm](https://www.npmjs.com/)
- A MongoDB connection string (local or [MongoDB Atlas](https://www.mongodb.com/atlas))

### 1. Clone the Repository

```bash
git clone https://github.com/jaswantsharma7/student-app.git
cd student-app
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the project root:

```env
MONGODB_URI=your_mongodb_connection_string
PORT=5000
```

### 4. Run the Backend Server

```bash
node server.js
```

The API will be available at `http://localhost:5000`.

### 5. Run the React Frontend

In a separate terminal:

```bash
npm start
```

The app will open at `http://localhost:3000`.

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/students` | Fetch all student records |
| `POST` | `/students` | Add a new student |
| `PUT` | `/students/:id` | Update an existing student by ID |
| `DELETE` | `/students/:id` | Delete a student by ID |

---

## Deployment

- The **React frontend** is deployed on [Vercel](https://vercel.com/) as a static site.
- The **Express backend** (`server.js`) is deployed on [Render](https://render.com/) as a web service.
- **MongoDB Atlas** is used as the cloud database.

To deploy your own fork:
1. Push the repository to GitHub.
2. Connect it to Vercel for the frontend.
3. Connect it to Render for the backend.
4. Add `MONGODB_URI` as an environment variable in both Render and Vercel project settings.

---

## Contributing

Contributions, issues, and feature requests are welcome. Feel free to open an [issue](https://github.com/jaswantsharma7/student-app/issues) or submit a pull request.

---

## License

This project is open source and available under the [MIT License](LICENSE).
