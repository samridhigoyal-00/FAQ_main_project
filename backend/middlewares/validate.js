const validateMessageLength = (req, res, next) => {
  const { message } = req.body;
  if (message && message.trim().length > 500) {
    return res.status(400).json({ message: 'Message is too long. Maximum is 500 characters.' });
  }
  next();
};

module.exports = {
  validateMessageLength
};
