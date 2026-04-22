require('dotenv').config();
const express = require('express');
const { setServers } = require('node:dns/promises');
const connectDB = require('./config/db');
const corsConfig = require('./config/corsConfig');
const authRoutes = require('./routes/authRoutes');
const studentRoutes = require('./routes/studentRoutes');

setServers(['8.8.8.8', '1.1.1.1']);

const app = express();

app.use(corsConfig);
app.use(express.json({ limit: '10kb' }));

connectDB();

app.get('/', (req, res) => res.json({ status: 'API running' }));

app.use('/auth', authRoutes);
app.use('/students', studentRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));