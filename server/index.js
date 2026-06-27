const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// API Routes Boilerplate
app.use('/api/auth', require('./api/routes/auth'));
app.use('/api/profile', require('./api/routes/profile'));
app.use('/api/content', require('./api/routes/content'));
app.use('/api/trends', require('./api/routes/trends'));
app.use('/api/schedule', require('./api/routes/schedule'));
app.use('/api/publish', require('./api/routes/publish'));
app.use('/api/analytics', require('./api/routes/analytics'));
app.use('/api/leads', require('./api/routes/leads'));
app.use('/webhooks/meta', require('./api/routes/webhooks'));

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error',
      status: err.status || 500
    }
  });
});

app.listen(PORT, () => {
  console.log(`🚀 SocialSell AI Server running on port ${PORT}`);
});
