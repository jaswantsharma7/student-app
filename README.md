#  Student App

A full-stack MERN (MongoDB, Express, React, Node.js) application that allows users to **submit and view student details** through a clean, interactive interface. The entire stack — frontend, backend server, and API — is fully deployed and live.

---

##  Live Demo

| Layer | URL |
|---|---|
| **Frontend (React)** | https://student-app-delta-eosin.vercel.app/ |
| **Backend / API** | https://student-app-peach.vercel.app/ |

---

##  Features

- **Add Student Details** — Submit student information through a React form
- **Display Students** — View all submitted student records in a structured list
- **REST API** — Express-based API handles all data operations
- **Persistent Storage** — MongoDB stores student records in the cloud
- **Fully Hosted** — Frontend, backend, and database are all deployed and publicly accessible

---

##  Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React.js |
| **Backend** | Node.js + Express.js (`server.js`) |
| **Database** | MongoDB (Atlas) |
| **Hosting** | Vercel (Frontend & Backend) |

---

## 📁 Project Structure

```
student-app/
├── public/               # Static assets
├── src/                  # React frontend source
│   ├── components/       # React components (form, student list, etc.)
│   ├── App.js            # Root component
│   └── index.js          # React entry point
├── server.js             # Express backend server & API routes
├── package.json          # Dependencies and scripts
└── .gitignore
```

---

##  Getting Started (Local Development)

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

Create a `.env` file in the project root and add your MongoDB connection URI:

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

##  API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/students` | Fetch all student records |
| `POST` | `/api/students` | Add a new student |

---

##  Deployment

This project is deployed on **Vercel**:

- The **React frontend** is deployed as a standard Vercel static site.
- The **Express backend** (`server.js`) is deployed as a Vercel serverless function.
- **MongoDB Atlas** is used as the cloud database.

To deploy your own fork, connect the repository to [Vercel](https://vercel.com/) and add your `MONGODB_URI` as an environment variable in the Vercel project settings.

---

##  Contributing

Contributions, issues, and feature requests are welcome! Feel free to open an [issue](https://github.com/jaswantsharma7/student-app/issues) or submit a pull request.

---

##  License

This project is open source and available under the [MIT License](LICENSE).
