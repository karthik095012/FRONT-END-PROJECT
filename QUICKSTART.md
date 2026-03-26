# ⚡ Quick Start (5 Minutes)

## 1️⃣ Install Dependencies
```bash
cd /Users/karthikrnair/Documents/CODING/prj
npm install
```

## 2️⃣ Start the Backend
```bash
npm start
```
You should see: `✓ InternHub Server running on http://localhost:3001`

## 3️⃣ Open in Browser
```bash
open index.html
```
Or visit: `http://file:///Users/karthikrnair/Documents/CODING/prj/index.html`

## ✅ You're Done!
The website is now running with full reliability features.

---

## 🤖 Add AI Features (Optional - 2 more minutes)

### Step 1: Install Ollama
Download from https://ollama.ai

### Step 2: Start Ollama
```bash
ollama pull neural-chat
ollama serve
```

### Step 3: Refresh Browser
The app will automatically detect Ollama and enable AI features.

---

## 📞 Quick Fixes

### Backend not starting?
```bash
# Check if port 3001 is in use
lsof -i :3001
# If yes, kill it:
kill -9 <PID>
# Then try again
npm start
```

### Page shows error?
- Open DevTools (F12)
- Check Console tab for red errors
- Refresh the page (Cmd+R)

### AI features not working?
- Check Ollama is running: `ollama serve`
- Verify: `curl http://localhost:11434/api/tags`
- Refresh browser

---

## 📚 Need Help?
- **Setup issues?** → Read README.md
- **How to use?** → See IMPROVEMENTS.md
- **API details?** → Check API.md
- **Deploy to cloud?** → See DEPLOYMENT.md
- **Troubleshoot?** → Read GUIDE.md

---

## 🎯 What to Try First

1. **Register** as a student with any email
2. **Login** with those credentials
3. **Browse jobs** - should see 6 sample jobs
4. **Apply for a job** - click any job, click "Apply"
5. **Upload resume** - if you want
6. **(Optional) Generate cover letter** - if Ollama is running

---

**That's it! Everything else is documented in the README.md and other guide files.**

Happy internship hunting! 🚀
