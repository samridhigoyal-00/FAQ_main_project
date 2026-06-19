const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const passport = require('passport');

const config = require('./config/env'); 
require('./config/passport');

const authRoutes = require('./routes/auth');
const faqRoutes = require('./routes/faq');

const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();

const allowedOrigins = config.clientUrl.split(',').map(s => s.trim());

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) callback(null, true);
    else callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

app.use(express.json()); 


app.use(helmet());

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  
  max: config.nodeEnv === 'development' ? 5000 : 100, 
  
  message: { message: 'Too many requests from this IP, please try again after 15 minutes.' },
  standardHeaders: true, 
  legacyHeaders: false,
});

app.use(globalLimiter);

const strictLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  
  max: config.nodeEnv === 'development' ? 500 : 10, 
  
  message: { message: 'Please slow down your requests.' }
});
app.use('/faq/chat', strictLimiter);
app.use('/faq/add', strictLimiter);

const viewLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: config.nodeEnv === 'development' ? 500 : 30,
  message: { message: 'Too many view requests. Please slow down.' }
});
app.use('/faq/:id/view', viewLimiter);

app.use(passport.initialize());


mongoose.connect(config.mongoUri)
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(config.port, () => console.log(`🚀 Server running on port ${config.port}`));
  })
  .catch(err => {
    console.error('❌ MongoDB connection failed:', err);
    process.exit(1);
  });

app.use('/auth', authRoutes);
app.use('/faq', faqRoutes);

app.get('/', (req, res) => res.send('FAQ Support Platform API'));

app.use((err, req, res, next) => {
  console.error(err.stack); // Logs the actual error in your terminal
  res.status(500).json({ 
    message: 'Something went wrong!', 
    error: config.nodeEnv === 'development' ? err.message : undefined // Hides details from users in production
  });
});