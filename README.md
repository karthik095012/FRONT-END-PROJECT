# InternHub v2 — Students & Recruiters Portal
## Enhanced with Reliability & Ollama 7b AI Integration

A modern, feature-rich internship portal with AI-powered job matching, cover letter generation, and resume analysis.

## 🎯 Features

### For Students
- Browse internship listings with advanced filtering
- AI-powered job matching based on skills (requires Ollama)
- AI cover letter generation
- Resume upload and AI analysis
- Track all applications in one place
- Dark/Light theme support

### For Recruiters
- Post and manage internship openings
- Review student applications and resumes
- Track application status
- Dashboard with analytics

### Reliability Improvements
- ✅ Comprehensive error handling & recovery
- ✅ Data validation (email, password, input sanitization)
- ✅ Automatic data backup & restore
- ✅ Session persistence
- ✅ Offline mode with fallback features
- ✅ Cross-browser compatibility

### AI Features (Optional - requires Ollama)
- Job matching algorithm with skill analysis
- Intelligent cover letter generation
- Resume parsing and improvement suggestions
- Interview preparation tips

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ (for backend server)
- Ollama 7b model (optional, for AI features)

### Setup

#### 1. Install Backend Dependencies
```bash
cd prj
npm install
```

#### 2. Start Ollama (Optional)
If you want AI features enabled:
```bash
# Install Ollama from https://ollama.ai
ollama pull neural-chat  # Lightweight 7b model optimized for chat
ollama serve             # Runs on localhost:11434
```

#### 3. Start Backend Server
```bash
npm start
# Server runs on http://localhost:3001
```

#### 4. Open Frontend
```bash
# Simply open index.html in a web browser
open index.html
```

The website will automatically detect if Ollama is available:
- **With Ollama**: Full AI features enabled ✓
- **Without Ollama**: Works in offline mode with basic skills-based job matching

## 🏗️ Architecture

```
prj/
├── index.html          # Main HTML structure
├── app.js              # Frontend app & routing (improved with error handling)
├── data.js             # LocalStorage database with validation
├── style.css           # Responsive styling (light/dark theme)
├── server.js           # Node.js backend with Ollama integration
├── package.json        # Dependencies
├── .env.example        # Environment config template
└── README.md          # This file
```

## 🔧 Configuration

Create `.env` file (optional):
```bash
cp .env.example .env
```

Edit `.env`:
```env
PORT=3001
OLLAMA_URL=http://localhost:11434/api
NODE_ENV=development
```

## 📊 API Endpoints

### Health Check
```
GET /api/health
```
Returns server and Ollama status.

### AI Features (requires backend)
```
POST /api/ai/generate           # Generate text
POST /api/ai/match-jobs         # Find job matches
POST /api/ai/generate-cover-letter # Create cover letter
POST /api/ai/analyze-resume     # Analyze resume
```

## 🔐 Security

- Email validation (RFC 5322 compliant)
- Password strength requirements (6+ characters)
- XSS protection via HTML escaping
- Input sanitization on all forms
- CORS enabled for development
- Rate limiting on AI endpoints (100 req/15min per IP)
- No passwords stored in localStorage (session storage only)

## 📱 Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Android)

## 🛠️ Error Handling

The platform includes:
- Graceful degradation when Ollama unavailable
- Automatic data backup every operation
- Data recovery from last backup
- Comprehensive error logging
- User-friendly error messages
- Input validation on all forms

## 📦 Storage

- **LocalStorage**: Persistent user data, jobs, applications (limited to ~10MB)
- **SessionStorage**: Temporary session/auth data
- **Auto-backup**: Latest backup stored for recovery

### Database Schema

```javascript
// Users
{ id, name, email, password, role, company, joinedAt }

// Jobs
{ id, recruiterId, title, company, location, stipend, skills[], 
  duration, deadline, description, postedAt, active }

// Applications
{ id, studentId, jobId, coverNote, status, appliedAt }

// Resumes
{ studentId, fileName, fileData(base64), uploadedAt, parsed{} }
```

## 🚨 Troubleshooting

### "Backend not available"
```bash
# Ensure server is running
npm start
# Server should start on http://localhost:3001
```

### "Ollama not connected"
```bash
# Install and start Ollama
ollama pull neural-chat
ollama serve

# Check if Ollama is running
curl http://localhost:11434/api/tags
```

### "Cannot apply for job"
- Check internet connection
- Verify backend server is running
- Check browser console for errors (F12)
- Try clearing browser cache

### "Resume upload failed"
- File size must be < 5MB
- Supported formats: PDF, DOCX, TXT
- Check disk space (localStorage limit ~10MB)

## 📈 Performance

- **First Load**: ~200ms (static assets)
- **UI Response**: <100ms (instant feedback)
- **AI Features**: 2-10s (depends on Ollama speed)
- **Job Matching**: < 5s with Ollama

## 🤝 Contributing

To improve the platform:
1. Test all forms thoroughly
2. Check browser console for errors
3. Verify localStorage isn't full (clear cache if needed)
4. Report issues with error messages

## 📝 Notes

- All data is stored locally in your browser (no server backup)
- Clearing browser data will delete all information
- Ollama models run locally - your data never leaves your machine
- Regular data exports recommended (use browser dev tools)

## 🔄 Current Limitations

- Local storage limited to ~10MB per domain
- Ollama requires local installation (not cloud-hosted)
- Resume parsing basic (AI models can improve this)
- No email notifications (add later via backend)
- No file storage (base64 encoded in storage)

## 🎓 Learning Resources

- [Ollama Documentation](https://ollama.ai)
- [Neural Chat Model](https://huggingface.co/Intel/neural-chat-7b)
- [REST API Examples](./API.md) (coming soon)

## 📄 License

MIT - Free to use and modify

---

**Questions?** Check browser console (F12) for detailed error messages and logs.

**Version**: 2.0 | **Last Updated**: March 2026
