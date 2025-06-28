# 🚀 SMS Bank Reader API - Deployment Guide

## Free Cloud Deployment Options

### 1. **Render (Recommended - Easiest)**

**Pros:**
- ✅ Free tier with 750 hours/month
- ✅ Automatic deployments from GitHub
- ✅ Easy setup
- ✅ Custom domains
- ✅ SSL certificates included

**Steps:**

1. **Prepare Your Code:**
   ```bash
   # Make sure you have these files:
   # - server.js (API server)
   # - package.json (with express and cors dependencies)
   # - render.yaml (deployment config)
   ```

2. **Create GitHub Repository:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/yourusername/sms-bank-reader.git
   git push -u origin main
   ```

3. **Deploy on Render:**
   - Go to [render.com](https://render.com)
   - Sign up with GitHub
   - Click "New Web Service"
   - Connect your GitHub repository
   - Select the repository
   - Render will auto-detect Node.js
   - Click "Create Web Service"

4. **Your API URL:**
   ```
   https://your-app-name.onrender.com
   ```

### 2. **Railway (Alternative)**

**Pros:**
- ✅ Free tier with $5 credit
- ✅ Fast deployments
- ✅ Good performance
- ✅ Easy GitHub integration

**Steps:**
1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Click "New Project"
4. Select "Deploy from GitHub repo"
5. Choose your repository
6. Railway will auto-deploy

### 3. **Heroku (Classic)**

**Pros:**
- ✅ Well-established platform
- ✅ Good documentation
- ✅ Free tier available

**Steps:**
1. Install Heroku CLI
2. Run commands:
   ```bash
   heroku login
   heroku create your-app-name
   git push heroku main
   ```

## 📱 Update Mobile App

After deployment, update your mobile app's server URL:

```typescript
// In App.tsx, change this line:
const [serverUrl, setServerUrl] = useState('https://your-app-name.onrender.com/api');
```

## 🔧 Configuration Files

### render.yaml (for Render)
```yaml
services:
  - type: web
    name: sms-bank-reader-api
    env: node
    buildCommand: npm install
    startCommand: node server.js
    envVars:
      - key: NODE_ENV
        value: production
    plan: free
```

### railway.json (for Railway)
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "node server.js",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 100,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### Procfile (for Heroku)
```
web: node server.js
```

## 🧪 Testing Your Deployed API

After deployment, test your API:

```bash
# Health check
curl https://your-app-name.onrender.com/health

# Get transactions (with API key)
curl -H "X-API-Key: demo-key-123" https://your-app-name.onrender.com/transactions

# API documentation
curl https://your-app-name.onrender.com/docs
```

## 🔒 Security Considerations

1. **Environment Variables:** Store sensitive data in environment variables
2. **Rate Limiting:** Consider adding rate limiting for production
3. **HTTPS:** All platforms provide SSL certificates
4. **API Keys:** Keep API keys secure and rotate them regularly

## 📊 Monitoring

Most platforms provide:
- Request logs
- Error monitoring
- Performance metrics
- Uptime monitoring

## 🆘 Troubleshooting

### Common Issues:

1. **Build Fails:**
   - Check package.json has all dependencies
   - Verify Node.js version compatibility

2. **API Not Responding:**
   - Check health endpoint: `/health`
   - Verify server is running
   - Check logs in platform dashboard

3. **CORS Issues:**
   - Ensure CORS is properly configured
   - Check if mobile app URL is allowed

## 🎯 Next Steps After Deployment

1. **Set up Custom Domain** (optional)
2. **Add Database** for persistent storage
3. **Implement Rate Limiting**
4. **Add Monitoring and Logging**
5. **Set up CI/CD** for automatic deployments

## 📞 Support

- **Render:** [docs.render.com](https://docs.render.com)
- **Railway:** [docs.railway.app](https://docs.railway.app)
- **Heroku:** [devcenter.heroku.com](https://devcenter.heroku.com)

Your API will be live and accessible from anywhere in the world! 🌍 