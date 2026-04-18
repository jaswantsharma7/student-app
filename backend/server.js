const express = require('express');
const cors = require('cors');


require('dotenv').config();
const mongoose = require('mongoose');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

const dbURI = process.env.MONGODB_URI;

const {setServers} = require('node:dns/promises');
setServers(['8.8.8.8','1.1.1.1']);

// MongoDB Connection
mongoose.connect(dbURI)
  .then(() => console.log('MongoDB Atlas Connected'))
  .catch(err => console.log('Connection Error:', err));

// Student Schema
const studentSchema = new mongoose.Schema({
  name: String,
  age: Number,
  course: String,
  branch: String,
  domain: String,
  rollno: String,
  university: String,
  email: String,
  phone: String,
  address: String
});
const Student = mongoose.model('Student', studentSchema);

// Routes
app.get('/', (req, res) => {
  res.send('API Working');
});

// GET all students
app.get('/students', async (req, res) => {
  try {
    const data = await Student.find();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST new student
app.post('/students', async (req, res) => {
  try {
    const newStudent = new Student(req.body);
    await newStudent.save();
    res.json(newStudent);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(5000, () => {
  console.log('Server running on port 5000');
});