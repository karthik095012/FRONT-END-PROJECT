# InternHub Deployment Guide

## 🌐 Deployment Options

### Option 1: GitHub Pages (Frontend Only - Free)
Easy hosting for the frontend. AI features won't work without backend.

**Steps:**
1. Create GitHub repository: `internhub`
2. Push files to main branch
3. Go to Settings → Pages
4. Select "main branch" as source
5. Your site: `https://yourusername.github.io/internhub`

**Limitation**: No backend API, so AI features disabled

---

### Option 2: Vercel (Recommended - Free)
Great for both frontend and serverless backend.

**Frontend:**
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy from prj folder
cd prj
vercel

# Follow prompts
# Your site: https://internhub-xxx.vercel.app
```

**Backend (Serverless):**
1. Create `api/ai.js` in root:
```javascript
import express from 'express';
import axios from 'axios';

const app = express();
app.use(express.json());

app.post('/api/ai/generate', async (req, res) => {
  try {
    const { prompt } = req.body;
    const response = await axios.post(
      'http://localhost:11434/api/generate',
      { model: 'neural-chat', prompt, stream: false }
    );
    res.json({ ok: true, response: response.data.response });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

export default app;
```

2. Deploy: `vercel deploy`

---

### Option 3: Netlify (Free)
Good for static frontend hosting.

**Steps:**
1. Create `netlify.toml` in root:
```toml
[build]
  command = "npm install"
  publish = "."

[[redirects]]
  from = "/api/*"
  to = "https://your-backend.com/api/:splat"
  status = 200
```

2. Connect GitHub repo to Netlify
3. Auto-deploys on push

---

### Option 4: Heroku (Paid - $7+/month)
Good for running Express backend 24/7.

**Setup:**
```bash
# Install Heroku CLI
brew tap heroku/brew && brew install heroku

# Login
heroku login

# Create app
heroku create internhub-server

# Add Procfile
echo "web: npm start" > Procfile

# Set environment variables
heroku config:set OLLAMA_URL=http://localhost:11434/api

# Deploy
git push heroku main
```

**Issues:**
- Ollama won't run on Heroku (needs local machine)
- Use fallback mode or host Ollama separately

---

### Option 5: DigitalOcean App Platform (Paid - $5+/month)
Simple deployment with auto-scaling.

**Steps:**
1. Connect GitHub account
2. Select repository
3. Specify: `npm start` as run command
4. Set PORT=3001
5. Deploy and get auto-assigned URL

---

### Option 6: Self-Hosted (VPS)
Full control with AWS, Linode, or DigitalOcean VPS.

**AWS EC2:**
```bash
# Create Ubuntu instance
# SSH into server
ssh -i key.pem ubuntu@your-instance-ip

# Install Node.js
curl -sL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone repo
git clone https://github.com/you/internhub.git
cd internhub/prj

# Install
npm install
npm start

# (Optional) Run with PM2 for persistence
npm install -g pm2
pm2 start server.js --name "internhub-api"
pm2 startup
pm2 save
```

**Configure SSL with Let's Encrypt:**
```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot certonly --standalone -d yourdomain.com
```

**Use Nginx as reverse proxy:**
```nginx
server {
    listen 443 ssl;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    location /api {
        proxy_pass http://localhost:3001;
    }

    location / {
        root /var/www/internhub;
        try_files $uri /index.html;
    }
}
```

---

### Option 7: Docker + Any Cloud
Containerize the app for easy deployment.

**Dockerfile:**
```dockerfile
FROM node:16-alpine

WORKDIR /app
COPY package*.json ./
RUN npm install --only=production

COPY . .
EXPOSE 3001
CMD ["npm", "start"]
```

**docker-compose.yml:**
```yaml
version: '3.8'
services:
  backend:
    build: .
    ports:
      - "3001:3001"
    environment:
      - OLLAMA_URL=http://ollama:11434/api
    depends_on:
      - ollama

  ollama:
    image: ollama/ollama:latest
    ports:
      - "11434:11434"
    volumes:
      - ollama_data:/root/.ollama

volumes:
  ollama_data:
```

**Deploy:**
```bash
docker-compose up
# App runs on localhost:3001
```

---

## 🌍 Production Checklist

Before deploying to production:

### Security
- [ ] Set `NODE_ENV=production`
- [ ] Enable HTTPS/SSL
- [ ] Set strong `CORS_ORIGIN`
- [ ] Use environment variables for secrets
- [ ] Disable debug logs in production
- [ ] Enable password hashing (bcrypt)
- [ ] Implement rate limiting
- [ ] Set security headers

### Performance
- [ ] Minify CSS/JS for production
- [ ] Enable gzip compression
- [ ] Use CDN for static assets
- [ ] Set cache headers
- [ ] Monitor response times
- [ ] Enable database indexes

### Data
- [ ] Set up automated backups
- [ ] Test disaster recovery
- [ ] Implement data encryption
- [ ] Set up data retention policy
- [ ] Create admin backup interface

### Monitoring
- [ ] Set up error logging (Sentry)
- [ ] Monitor uptime (UptimeRobot)
- [ ] Track performance metrics
- [ ] Set up alerts
- [ ] Review logs regularly

### Ollama
- [ ] Ensure Ollama is running 24/7
- [ ] Monitor GPU/CPU usage
- [ ] Set up Ollama auto-restart
- [ ] Cache frequently generated content
- [ ] Consider model optimization

---

## 📊 Recommendation Matrix

| Platform | Cost | Ease | Scalability | Backend Support |
|----------|------|------|-------------|-----------------|
| GitHub Pages | Free | ⭐⭐⭐⭐⭐ | Low | ❌ |
| Vercel | Free | ⭐⭐⭐⭐ | High | ✅ (serverless) |
| Netlify | Free | ⭐⭐⭐⭐ | Medium | ❌ |
| Heroku | $7-50 | ⭐⭐⭐⭐ | Medium | ✅ |
| DigitalOcean | $5+ | ⭐⭐⭐ | High | ✅ |
| AWS | $1-100+ | ⭐⭐ | Very High | ✅ |
| Self-Hosted | $0-50+ | ⭐⭐ | High | ✅ |
| Docker | Variable | ⭐⭐⭐ | Very High | ✅ |

### Recommendation
**For beginners**: Vercel (free tier perfect for learning)
**For production**: DigitalOcean or AWS (better control)
**For scale**: Kubernetes or Docker Swarm

---

## 🚀 Deployment Examples

### Deploy Frontend to Vercel
```bash
vercel --prod
```

### Deploy Backend to Heroku
```bash
git push heroku main
heroku logs --tail
```

### Deploy with Docker
```bash
docker build -t internhub .
docker run -p 3001:3001 internhub
```

### Deploy to AWS EC2
```bash
# SSH into server
ssh -i key.pem ubuntu@ip

# Setup
git clone repo.git
cd repo/prj
npm install

# Start with PM2
pm2 start server.js --name internhub
pm2 startup
```

---

## 📝 Environment Configuration

### Development (.env)
```env
NODE_ENV=development
PORT=3001
OLLAMA_URL=http://localhost:11434/api
CORS_ORIGIN=*
```

### Production (.env.production)
```env
NODE_ENV=production
PORT=3001
OLLAMA_URL=https://your-ollama-server.com/api
CORS_ORIGIN=https://yourdomain.com
RATE_LIMIT_MAX=50
```

---

## 🔄 CI/CD Setup

### GitHub Actions
Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '16'
      - run: npm install
      - run: npm test
      - run: npm run build
      - run: npm run deploy
```

---

## 🆘 Common Deployment Issues

### Port Already in Use
```bash
# Kill process on port 3001
lsof -i :3001
kill -9 <PID>

# Or use different port
PORT=3002 npm start
```

### Ollama Connection Failed
- Ensure Ollama is running: `ollama serve`
- Check URL: `curl http://localhost:11434/api/tags`
- Update OLLAMA_URL env variable

### CORS Errors
- Check CORS_ORIGIN matches your domain
- For development: `CORS_ORIGIN=*`
- For production: `CORS_ORIGIN=https://yourdomain.com`

### Memory Issues
- Monitor with: `node --max-old-space-size=512 server.js`
- Upgrade server resources
- Optimize Ollama model size

---

## 📞 Getting Help

### Check Logs
```bash
# Frontend
F12 → Console → Check for errors

# Backend
npm start → Look for error messages

# Ollama
tail -f ~/.ollama/logs/*.log
```

### debugging
```bash
# Test backend
curl http://localhost:3001/api/health

# Test Ollama
curl http://localhost:11434/api/tags

# Test AI feature
curl -X POST http://localhost:3001/api/ai/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt":"test"}'
```

---

**Version**: 1.0
**Last Updated**: March 2026
