const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const taskRoutes = require('./routes/tasks');
const authRoutes = require('./routes/auth');
const noteRoutes = require('./routes/notes');
const workflowRoutes = require('./routes/workflows');
const { startScheduler } = require('./services/reminderScheduler');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    // Start reminder scheduler after DB connection
    startScheduler();
  })
  .catch(err => console.error('MongoDB connection error:', err));

app.use('/api/tasks', taskRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/workflows', workflowRoutes);

console.log('Routes registered:');
console.log('- /api/tasks');
console.log('- /api/auth');
console.log('- /api/notes');
console.log('- /api/workflows');

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));