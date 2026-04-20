const express = require('express');
const cors = require('cors');

require('dotenv').config();
const mongoose = require('mongoose');
const app = express();

// Middleware — must be before routes
app.use(cors());
app.use(express.json());

const dbURI = process.env.MONGODB_URI;

const { setServers } = require('node:dns/promises');
setServers(['8.8.8.8', '1.1.1.1']);

// MongoDB Connection
mongoose.connect(dbURI)
  .then(() => console.log('MongoDB Atlas Connected'))
  .catch(err => console.log('Connection Error:', err));

// Student Schema
const studentSchema = new mongoose.Schema({
  name: String,
  age: Number,
  course: String,
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

// PUT (update) student by ID
app.put('/students/:id', async (req, res) => {
  try {
    const id = req.params.id.trim();
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid student ID format' });
    }
    const updated = await Student.findByIdAndUpdate(
      id,
      { $set: { ...req.body, age: Number(req.body.age) } },
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ error: 'Student not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE student by ID
app.delete('/students/:id', async (req, res) => {
  try {
    const id = req.params.id.trim();
    console.log('DELETE request for id:', id);
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid student ID format' });
    }
    const deleted = await Student.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ error: 'Student not found', requestedId: id });
    res.json({ message: 'Student deleted', id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(5000, () => {
  console.log('Server running on port 5000');
});