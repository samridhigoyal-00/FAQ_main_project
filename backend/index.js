const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const passport = require('passport');
require('dotenv').config();
require('./config/passport');

const authRoutes = require('./routes/auth');
const faqRoutes = require('./routes/faq');
const FAQ = require('./models/FAQ');

const app = express();

const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:3000')
  .split(',')
  .map(s => s.trim());

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) callback(null, true);
    else callback(null, allowedOrigins[0]);
  },
  credentials: true
}));
app.use(express.json());
app.use(passport.initialize());

async function runMigrations() {
  await FAQ.updateMany(
    { status: { $exists: false }, isApproved: true },
    { $set: { status: 'approved' } }
  );
  await FAQ.updateMany(
    { status: { $exists: false }, isApproved: false },
    { $set: { status: 'pending' } }
  );
  await FAQ.updateMany(
    { isApproved: { $exists: false } },
    { $set: { isApproved: true, status: 'approved' } }
  );
  try {
    await FAQ.collection.createIndex({ question: 'text', answer: 'text' });
  } catch (e) {
    if (e.code !== 85 && e.code !== 86) console.warn('Text index:', e.message);
  }
}

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('MongoDB connected');
    await runMigrations();

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => {
    console.error('MongoDB connection failed:', err);
    process.exit(1);
  });

app.use('/auth', authRoutes);
app.use('/faq', faqRoutes);

app.get('/', (req, res) => res.send('FAQ Support Platform API'));
