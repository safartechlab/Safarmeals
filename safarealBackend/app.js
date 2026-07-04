const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const { errorHandler } = require('./middleware/errorMiddleware');

// Import routes
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const shopRoutes = require('./routes/shopRoutes');
const userRoutes = require('./routes/userRoutes');
const orderRoutes = require('./routes/orderRoutes');

const app = express();

// Security Headers
app.use(helmet({
  crossOriginResourcePolicy: false // Allows loading local uploaded photos
}));

// CORS Configuration
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Max 1000 requests per IP in development/testing
  message: 'Too many requests from this IP, please try again later'
});
app.use('/api', limiter);

// Request Parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve local static uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Root Route
app.get('/', (req, res) => {
  res.status(200).json({ success: true, message: 'SAFARMEAL API Service is fully operational' });
});

// API Routes Mounting
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/shop', shopRoutes);
app.use('/api/user', userRoutes);
app.use('/api/orders', orderRoutes);

// 404 Route Catch-All
app.use((req, res, next) => {
  res.status(404).json({ success: false, message: `Route '${req.originalUrl}' not found` });
});

// Global Error Handler
app.use(errorHandler);

module.exports = app;
