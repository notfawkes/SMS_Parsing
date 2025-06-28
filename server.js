const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Dynamic storage for API keys and their associated transaction data
const apiKeys = new Map();
const transactions = new Map();

// Generate a unique API key
const generateApiKey = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

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
    timestamp: new Date().toISOString(),
    totalApiKeys: apiKeys.size,
    totalTransactions: Array.from(transactions.values()).reduce((sum, txs) => sum + txs.length, 0)
  });
});

// Generate new API key endpoint
app.post('/generate-key', (req, res) => {
  try {
    const apiKey = generateApiKey();
    const keyInfo = {
      name: req.body.name || 'Generated Key',
      isActive: true,
      createdAt: new Date().toISOString(),
      lastUsed: null
    };
    
    apiKeys.set(apiKey, keyInfo);
    transactions.set(apiKey, []); // Initialize empty transaction array
    
    res.json({
      success: true,
      apiKey: apiKey,
      message: 'API key generated successfully',
      keyInfo: keyInfo
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to generate API key',
      message: error.message
    });
  }
});

// Store transactions endpoint (called by mobile app)
app.post('/store-transactions', validateApiKey, (req, res) => {
  try {
    const { transactions: newTransactions } = req.body;
    
    if (!Array.isArray(newTransactions)) {
      return res.status(400).json({
        error: 'Invalid data format',
        message: 'Transactions must be an array'
      });
    }
    
    // Store the transactions for this API key
    transactions.set(req.apiKey, newTransactions);
    
    // Update last used timestamp
    const keyInfo = apiKeys.get(req.apiKey);
    keyInfo.lastUsed = new Date().toISOString();
    apiKeys.set(req.apiKey, keyInfo);
    
    res.json({
      success: true,
      message: 'Transactions stored successfully',
      storedCount: newTransactions.length,
      apiKey: req.apiKey
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to store transactions',
      message: error.message
    });
  }
});

// Get transactions endpoint
app.get('/transactions', validateApiKey, (req, res) => {
  try {
    const userTransactions = transactions.get(req.apiKey) || [];
    
    // Update last used timestamp
    const keyInfo = apiKeys.get(req.apiKey);
    keyInfo.lastUsed = new Date().toISOString();
    apiKeys.set(req.apiKey, keyInfo);
    
    const response = {
      user: {
        apiKey: req.apiKey,
        totalTransactions: userTransactions.length,
        lastUpdated: keyInfo.lastUsed,
        keyCreated: keyInfo.createdAt
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

// List all API keys (for admin purposes)
app.get('/admin/keys', (req, res) => {
  try {
    const keysList = Array.from(apiKeys.entries()).map(([key, info]) => ({
      apiKey: key,
      ...info,
      transactionCount: (transactions.get(key) || []).length
    }));
    
    res.json({
      totalKeys: keysList.length,
      keys: keysList
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch API keys',
      message: error.message
    });
  }
});

// Delete API key endpoint
app.delete('/admin/keys/:apiKey', (req, res) => {
  try {
    const { apiKey } = req.params;
    
    if (!apiKeys.has(apiKey)) {
      return res.status(404).json({
        error: 'API key not found'
      });
    }
    
    apiKeys.delete(apiKey);
    transactions.delete(apiKey);
    
    res.json({
      success: true,
      message: 'API key deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to delete API key',
      message: error.message
    });
  }
});

// API documentation endpoint
app.get('/docs', (req, res) => {
  res.json({
    title: 'SMS Bank Reader API Documentation',
    version: '1.0.0',
    description: 'Dynamic API for storing and retrieving bank transaction data from SMS messages',
    endpoints: {
      'GET /health': {
        description: 'Health check endpoint',
        authentication: 'None required'
      },
      'POST /generate-key': {
        description: 'Generate a new unique API key',
        authentication: 'None required',
        body: {
          name: 'string (optional) - Name for the API key'
        }
      },
      'POST /store-transactions': {
        description: 'Store transaction data for an API key',
        authentication: 'X-API-Key header required',
        body: {
          transactions: 'array - Array of transaction objects'
        }
      },
      'GET /transactions': {
        description: 'Get all transactions for the authenticated API key',
        authentication: 'X-API-Key header required'
      },
      'GET /admin/keys': {
        description: 'List all API keys (admin endpoint)',
        authentication: 'None required'
      },
      'DELETE /admin/keys/:apiKey': {
        description: 'Delete an API key (admin endpoint)',
        authentication: 'None required'
      }
    },
    sampleRequest: {
      method: 'POST',
      url: '/generate-key',
      body: {
        name: 'My Bank Account'
      }
    }
  });
});

app.listen(PORT, () => {
  console.log(`🚀 SMS Bank Reader API server running on port ${PORT}`);
  console.log(`📖 API Documentation: http://localhost:${PORT}/docs`);
  console.log(`💚 Health Check: http://localhost:${PORT}/health`);
  console.log(`🔑 Generate Key: POST http://localhost:${PORT}/generate-key`);
  console.log(`📊 Store Transactions: POST http://localhost:${PORT}/store-transactions`);
});
