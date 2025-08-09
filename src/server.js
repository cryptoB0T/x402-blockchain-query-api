const express = require('express');
const cors = require('cors');
require('dotenv').config();

const queryRoutes = require('./routes/query');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com'] 
    : true,
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

app.use('/api', queryRoutes);

app.get('/', (req, res) => {
  res.json({
    name: 'Natural Language Blockchain Query API',
    version: '1.0.0',
    description: 'A pay-per-query API that converts natural language questions into SQL queries against Base blockchain data',
    endpoints: {
      query: 'POST /api/query',
      health: 'GET /api/health',
      examples: 'GET /api/examples'
    },
    documentation: 'https://github.com/your-repo/blockchain-query-api'
  });
});

app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    availableEndpoints: {
      query: 'POST /api/query',
      health: 'GET /api/health',
      examples: 'GET /api/examples',
      root: 'GET /'
    }
  });
});

app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({
      error: 'Invalid JSON in request body',
      type: 'json_parse_error'
    });
  }
  
  res.status(500).json({
    error: 'Internal server error',
    type: 'server_error',
    timestamp: new Date().toISOString()
  });
});

const server = app.listen(PORT, () => {
  console.log(`🚀 Blockchain Query API running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Network: ${process.env.NETWORK || 'base-mainnet'}`);
  console.log(`💰 Price per query: ${process.env.X402_PRICE_USDC || '0.01'} USDC`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📖 Examples: http://localhost:${PORT}/api/examples`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

module.exports = app;