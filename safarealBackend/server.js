const http = require('http');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = require('./app');
const socketUtil = require('./utils/socket');

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/safarmeal';

// Create HTTP Server
const server = http.createServer(app);

// Initialize Socket.IO
socketUtil.init(server);

// Database Connection & Server Boot
mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('MongoDB Database connected successfully!');
    server.listen(PORT, () => {
      console.log(`SAFARMEAL Server running on port ${PORT}`);
      console.log(`Socket.IO Server bound successfully.`);
    });
  })
  .catch((err) => {
    console.error('MongoDB Database connection error:', err.message);
    process.exit(1);
  });

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.error(`Unhandled Promise Rejection: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});
