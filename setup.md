# Quick Setup Guide - SMS Bank Reader API

## 🚀 Getting Started

### Prerequisites
- Node.js (version 14 or higher)
- React Native development environment
- Android/iOS device or emulator

### Step 1: Install Server Dependencies
```bash
# Install server dependencies
npm install express cors
npm install -g nodemon  # Optional: for development
```

### Step 2: Start the API Server
```bash
# Start the server
node server.js
```

You should see:
```
🚀 SMS Bank Reader API server running on port 3000
📖 API Documentation: http://localhost:3000/docs
💚 Health Check: http://localhost:3000/health
🔑 Sample API Key: demo-key-123
📊 Sample Request: curl -H "X-API-Key: demo-key-123" http://localhost:3000/transactions
```

### Step 3: Test the API
```bash
# Test with the sample API key
curl -H "X-API-Key: demo-key-123" http://localhost:3000/transactions
```

### Step 4: Run the Mobile App
```bash
# Install mobile app dependencies
npm install

# Run on Android
npm run android

# Run on iOS
npm run ios
```

## 📱 Using the Mobile App

1. **Grant SMS Permissions**: Allow the app to read SMS messages
2. **Generate API Key**: 
   - Tap "Generate API Key" button
   - Enter a name for your key
   - Tap "Generate Key"
3. **View API Details**: 
   - Tap the eye icon to view key details
   - Use "Share Details" to copy the information
4. **Access Your Data**: Use the API key and URL to access your transactions

## 🔧 API Endpoints

### Get All Transactions
```bash
GET /transactions
Headers: X-API-Key: your-api-key
```

### Get Transaction by ID
```bash
GET /transactions/:id
Headers: X-API-Key: your-api-key
```

### Health Check
```bash
GET /health
```

### API Documentation
```bash
GET /docs
```

## 📊 Sample Response
```json
{
  "user": {
    "balance": "25000.00",
    "totalTransactions": 2,
    "lastUpdated": "2024-01-15T14:30:00.000Z"
  },
  "transactions": [
    {
      "id": 1,
      "amount": 1500.00,
      "currency": "INR",
      "date": "2024-01-15 14:30:00",
      "vpa": "user@upi",
      "reference": "UPI123456789",
      "type": "debit",
      "category": "bank_transfer",
      "status": "completed"
    }
  ],
  "metadata": {
    "source": "SMS_BANK_READER",
    "version": "1.0.0",
    "generatedAt": "2024-01-15T14:30:00.000Z"
  }
}
```

## 🧪 Testing

Run the test script to verify everything works:
```bash
node test-api.js
```

## 🔒 Security Notes

- API keys are 32-character alphanumeric strings
- Each key is unique and tied to specific user data
- Keys can be revoked by deleting them in the app
- All API requests require valid authentication

## 🆘 Troubleshooting

### Server won't start
- Check if port 3000 is available
- Ensure Node.js is installed
- Verify all dependencies are installed

### API requests fail
- Check if the server is running
- Verify the API key is correct
- Ensure the X-API-Key header is included

### Mobile app issues
- Check React Native setup
- Verify SMS permissions are granted
- Restart the Metro bundler if needed

## 📞 Support

For issues or questions:
1. Check the API documentation at `/docs`
2. Review the test script for examples
3. Verify your setup matches the prerequisites 