const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const app = express();
const PORT = process.env.PORT || 3001;

// Security headers (allow cross-origin resource sharing for static files)
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Rate limiting to prevent abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // limit each IP to 200 requests per windowMs
  message: { error: "Too many requests from this IP, please try again later." }
});
app.use('/api/', limiter);

// Serve uploads folder statically
app.use('/uploads', express.static(uploadsDir));

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
app.use('/api/assets', require('./api/routes/assets'));
app.use('/api/intake', require('./api/routes/intake'));
app.use('/api/integrations', require('./api/routes/integrations'));
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
