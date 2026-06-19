const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  googleId: { type: String, required: false },
  name: { type: String },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: false }, // for local auth
  role: { type: String, enum: ['student', 'admin'], default: 'student' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);