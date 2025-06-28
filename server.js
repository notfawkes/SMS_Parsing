const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Sample data
const apiKeys = new Map();
apiKeys.set('demo-key-123', { name: 'Demo Key', isActive: true });

const transactions = new Map();
transactions.set('demo-key-123', [
  {
    id: 1,
    amount: 1500.00,
    currency: 'INR',
    date: '2024-01-15 14:30:00',
    vpa: 'user@upi',
    reference: 'UPI123456789',
    type: 'debit',
    category: 'bank_transfer',
    status: 'completed'
  }
]);

// Middleware to validate API key
const validateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey) {
    return res.status(401).json({
      error: 'API key is required',
      message: 'Please include X-API-Key header in your request'
    });
  }
  
  if (!apiKeys.has(apiKey)) {
    return res.status(401).json({
      error: 'Invalid API key',
      message: 'The provided API key is not valid'
    });
  }
  
  req.apiKey = apiKey;
  next();
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'SMS Bank Reader API is running',
    timestamp: new Date().toISOString()
  });
});

// Get transactions endpoint
app.get('/transactions', validateApiKey, (req, res) => {
  try {
    const userTransactions = transactions.get(req.apiKey) || [];
    
    const response = {
      user: {
        balance: '25000.00',
        totalTransactions: userTransactions.length,
        lastUpdated: new Date().toISOString(),
      },
      transactions: userTransactions,
      metadata: {
        source: 'SMS_BANK_READER',
        version: '1.0.0',
        generatedAt: new Date().toISOString(),
      }
    };
    
    res.json(response);
  } catch (error) {
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch transactions'
    });
  }
});

// API documentation endpoint
app.get('/docs', (req, res) => {
  res.json({
    title: 'SMS Bank Reader API Documentation',
    version: '1.0.0',
    endpoints: {
      'GET /health': {
        description: 'Health check endpoint',
        authentication: 'None required'
      },
      'GET /transactions': {
        description: 'Get all transactions for the authenticated user',
        authentication: 'X-API-Key header required'
      }
    },
    sampleRequest: {
      method: 'GET',
      url: '/transactions',
      headers: {
        'X-API-Key': 'demo-key-123'
      }
    }
  });
});

app.listen(PORT, () => {
  console.log(`🚀 SMS Bank Reader API server running on port ${PORT}`);
  console.log(`📖 API Documentation: http://localhost:${PORT}/docs`);
  console.log(`💚 Health Check: http://localhost:${PORT}/health`);
  console.log(`🔑 Sample API Key: demo-key-123`);
  console.log(`📊 Sample Request: curl -H "X-API-Key: demo-key-123" http://localhost:${PORT}/transactions`);
});
