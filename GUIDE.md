# InternHub Quick Reference Guide

## 📋 Quick Commands

### Start Development
```bash
# Terminal 1: Start backend
npm start

# Terminal 2: Open frontend in browser
open index.html
```

### Start with Ollama AI
```bash
# Terminal 1: Start Ollama
ollama serve

# Terminal 2: Start backend
npm start

# Terminal 3: Open browser
open index.html
```

### Development Mode (with auto-reload)
```bash
npm run dev
# Requires nodemon to be installed
npm install --save-dev nodemon
```

---

## 🔧 Common Tasks

### Reset All Data
```javascript
// In browser console (F12)
localStorage.clear();
sessionStorage.clear();
location.reload();
```

### Restore from Backup
```javascript
// In browser console
DB.backup.restore();
```

### Check Backend Status
```bash
curl http://localhost:3001/api/health
```

### Check Ollama Status
```bash
curl http://localhost:11434/api/tags
```

### Change Ollama Model
Edit `server.js`:
```javascript
const OLLAMA_MODEL = 'mistral'; // or any other available model
```

### Change Backend Port
```bash
PORT=3002 npm start
```

---

## 🎨 UI Customization

### Change Theme Colors
Edit `style.css`:
```css
:root {
  --ac: #C8F04D;    /* Student color (green) */
  --rc: #7B6EF6;    /* Recruiter color (purple) */
  /* ... other colors ... */
}
```

### Change Fonts
Edit `index.html` and `style.css`:
```css
--ff: 'YourFont';   /* Headings */
--fb: 'YourFont';   /* Body */
```

### Change Logo
Edit `index.html`:
```html
<div class="nav-logo">Your<span class="s">Logo</span></div>
```

---

## 🚀 Deployment

### Deploy Frontend (Static)
```bash
# Copy files to:
# - GitHub Pages (free)
# - Vercel (free)
# - Netlify (free)
# - AWS S3 (paid)
# - Your own server
```

### Deploy Backend
```bash
# Option 1: Heroku
git push heroku main

# Option 2: Fly.io
flyctl deploy

# Option 3: Your VPS
scp -r prj/ user@server:/app/
ssh user@server
cd /app/prj && npm start
```

### Production Checklist
- [ ] Set `NODE_ENV=production` in `.env`
- [ ] Enable HTTPS
- [ ] Set `CORS_ORIGIN` to your domain
- [ ] Use environment variables for secrets
- [ ] Set up monitoring/logging
- [ ] Configure database backups
- [ ] Test all features thoroughly

---

## 📱 Mobile Responsive

The app is fully responsive. Test on:
```bash
# Chrome DevTools
F12 → Toggle device toolbar (Ctrl+Shift+M)

# Common breakpoints tested:
# - iPhone 12 (390px)
# - iPad (768px)
# - Desktop (1024px+)
```

---

## 🐛 Debugging

### Enable Debug Logs
Edit `app.js`:
```javascript
const DEBUG = true; // At top of file
if (DEBUG) console.log('Debug info...');
```

### Check LocalStorage
```javascript
// In browser console
localStorage
// Shows all stored data
```

### Monitor Network Requests
```bash
# In browser
F12 → Network → Refresh page
# Shows all API calls
```

### Backend Logs
```bash
# Terminal with npm start
# Shows all requests and errors
```

---

## 🔐 Security Best Practices

### Don't Share
- Your `.env` file
- Passwords from accounts
- API keys or secrets
- Database files

### Before Sharing Code
```bash
# Remove sensitive data
rm .env
rm -rf node_modules/

# Create .gitignore (if not exists)
echo "node_modules/" > .gitignore
echo ".env" >> .gitignore
```

### Password Guidelines
- At least 6 characters
- Mix of letters and numbers
- Don't reuse passwords
- Change regularly

---

## 📊 Database

### Check Stored Data
```javascript
// Browser console
DB.getUsers()         // List all users
DB.getJobs()          // List all jobs
DB.getApps()          // List all applications
DB.getResumes()       // List all resumes
```

### Manual Data Export
```javascript
// Browser console
const backup = {
  users: localStorage.getItem('ih_users'),
  jobs: localStorage.getItem('ih_jobs'),
  apps: localStorage.getItem('ih_apps'),
  resumes: localStorage.getItem('ih_resumes')
};
console.log(JSON.stringify(backup, null, 2));
// Copy output to a safe location
```

### Manual Data Import
```javascript
// Browser console
const backup = { /* paste backup data */ };
Object.entries(backup).forEach(([k, v]) => {
  localStorage.setItem(k, v);
});
```

---

## 🆘 Troubleshooting

### "Cannot POST /api/ai/generate"
- Check backend is running: `npm start`
- Check port: `http://localhost:3001/api/health`
- Check CORS: Headers should allow your origin

### "AI services unavailable"
- Check Ollama: `ollama serve`
- Check model: `ollama pull neural-chat`
- Check health: `curl http://localhost:3001/api/health`

### "Application data not saving"
- Check localStorage isn't full: `localStorage.length`
- Clear cache: Settings → Storage → Clear All
- Check console for errors: F12 → Console

### "Login not working"
- Check email format (must be valid)
- Password minimum 6 characters
- Clear session: `sessionStorage.clear()`
- Refresh page: `location.reload()`

---

## 📚 Learning Resources

### JavaScript
- [MDN Web Docs](https://developer.mozilla.org/)
- [JavaScript.info](https://javascript.info/)
- [Async/Await](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Asynchronous/Promises)

### Express.js
- [Express Documentation](https://expressjs.com/)
- [RESTful API Design](https://restfulapi.net/)

### Ollama
- [Ollama Official](https://ollama.ai/)
- [Available Models](https://ollama.ai/library/)
- [Neural Chat 7B](https://huggingface.co/Intel/neural-chat-7b)

### Web Development
- [HTML/CSS/JS Basics](https://developer.mozilla.org/en-US/docs/Learn)
- [Web Accessibility](https://www.w3.org/WAI/)

---

## 📝 Common Code Patterns

### Make an API Call
```javascript
const data = await fetch('/api/endpoint', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ key: 'value' })
});
const response = await data.json();
```

### Error Handling
```javascript
try {
  // Code here
} catch(error) {
  console.error('Error:', error.message);
  toast('Something went wrong', 'err');
}
```

### Show Toast Message
```javascript
toast('Success message', 'ok');     // Green
toast('Error message', 'err');      // Red
toast('Info message', 'info');      // Blue
```

### Redirect User
```javascript
Router.go('page-name', { tab: 'optional-tab' });
```

---

## 🎯 Performance Optimization

### Frontend
- Images: Use WebP format when possible
- Minify CSS/JS for production
- Enable gzip compression
- Cache static assets
- Lazy load images

### Backend
- Connection pooling for database
- Cache API responses
- Compress API responses (gzip)
- Use CDN for static files
- Monitor query performance

### AI (Ollama)
- Use smaller models for faster inference
- Batch similar requests
- Cache generated text
- Optimize prompts for clarity
- Run on GPU if available

---

**Last Updated**: March 2026
**Version**: 2.0
