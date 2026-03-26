# InternHub API Documentation

Base URL: `http://localhost:3001/api`

## Health Check

### GET /api/health
Check if backend and Ollama services are available.

**Response:**
```json
{
  "server": "ok",
  "ollama": "connected" | "disconnected"
}
```

**Example:**
```bash
curl http://localhost:3001/api/health
```

---

## AI Endpoints

### POST /api/ai/generate
Generate text using Ollama 7b model.

**Request Body:**
```json
{
  "prompt": "Write a short greeting",
  "maxTokens": 300
}
```

**Response:**
```json
{
  "ok": true,
  "response": "Generated text here...",
  "model": "neural-chat"
}
```

**Example:**
```bash
curl -X POST http://localhost:3001/api/ai/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt": "What is machine learning?"}'
```

---

### POST /api/ai/match-jobs
Find the best job matches for a student based on their skills.

**Request Body:**
```json
{
  "studentSkills": ["React", "JavaScript", "CSS", "Node.js"],
  "jobs": [
    {
      "id": "j1",
      "title": "Frontend Developer",
      "company": "Tech Corp",
      "skills": ["React", "JavaScript", "CSS"]
    },
    {
      "id": "j2",
      "title": "Full Stack Developer",
      "company": "StartUp Inc",
      "skills": ["Node.js", "React", "MongoDB"]
    }
  ]
}
```

**Response (with Ollama):**
```json
{
  "ok": true,
  "analysis": "Based on your skills...",
  "aiEnhanced": true
}
```

**Response (without Ollama - fallback):**
```json
{
  "ok": true,
  "matches": [
    {
      "job": { "id": "j1", ... },
      "matchScore": 1.0
    },
    {
      "job": { "id": "j2", ... },
      "matchScore": 0.67
    }
  ],
  "aiEnhanced": false,
  "message": "Using basic skill matching (Ollama unavailable)"
}
```

**Example:**
```bash
curl -X POST http://localhost:3001/api/ai/match-jobs \
  -H "Content-Type: application/json" \
  -d '{
    "studentSkills": ["Python", "Machine Learning"],
    "jobs": [...]
  }'
```

---

### POST /api/ai/generate-cover-letter
Generate a professional cover letter.

**Request Body:**
```json
{
  "studentName": "John Doe",
  "jobTitle": "Frontend Developer Intern",
  "company": "TechCorp",
  "skills": ["React", "JavaScript", "CSS", "REST APIs"]
}
```

**Response:**
```json
{
  "ok": true,
  "coverLetter": "Dear Hiring Manager,\n\nI am writing to express my strong interest...",
  "model": "neural-chat"
}
```

**Error Response:**
```json
{
  "error": "Ollama service required for cover letter generation"
}
```

**Example:**
```bash
curl -X POST http://localhost:3001/api/ai/generate-cover-letter \
  -H "Content-Type: application/json" \
  -d '{
    "studentName": "Jane Smith",
    "jobTitle": "Data Scientist",
    "company": "DataCorp",
    "skills": ["Python", "ML", "SQL"]
  }'
```

---

### POST /api/ai/analyze-resume
Analyze a resume and provide improvement suggestions.

**Request Body:**
```json
{
  "resumeText": "JANE SMITH\njane@email.com\n\nEXPERIENCE:\nFrontend Developer at TechCorp (2022-2023)\n- Built React components\n- Improved UI performance by 40%\n\nSKILLS:\nReact, JavaScript, CSS, HTML"
}
```

**Response:**
```json
{
  "ok": true,
  "analysis": "Extracted Skills: React, JavaScript, CSS, HTML\n\nExperience Level: Junior\n\nSuggestions:\n1. Add quantifiable achievements\n2. Include metrics for impact\n3. Mention specific technologies used"
}
```

**Error Response:**
```json
{
  "error": "Ollama service required for resume analysis"
}
```

**Example:**
```bash
curl -X POST http://localhost:3001/api/ai/analyze-resume \
  -H "Content-Type: application/json" \
  -d '{"resumeText": "..."}'
```

---

## Error Handling

### Common Error Responses

**503 Service Unavailable** (Ollama offline)
```json
{
  "error": "Cannot connect to Ollama. Is it running?",
  "hint": "Start Ollama with: ollama serve"
}
```

**400 Bad Request** (Missing required fields)
```json
{
  "error": "Prompt is required"
}
```

**500 Internal Server Error** (Unexpected error)
```json
{
  "error": "AI generation failed",
  "message": "Error details here..."
}
```

---

## Rate Limiting

All `/api/` endpoints are rate limited to:
- **100 requests per IP address**
- **Per 15-minute window**

Rate limit headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1648200000
```

---

## Using from Frontend JavaScript

```javascript
// Check if AI service is available
const res = await fetch('http://localhost:3001/api/health');
const health = await res.json();
console.log(health.ollama); // "connected" or "disconnected"

// Generate text
const response = await fetch('http://localhost:3001/api/ai/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    prompt: 'Write a technical summary',
    maxTokens: 300
  })
});
const data = await response.json();
console.log(data.response);

// Match jobs
const jobRes = await fetch('http://localhost:3001/api/ai/match-jobs', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    studentSkills: ['React', 'Node.js'],
    jobs: [...]
  })
});
const jobData = await jobRes.json();
console.log(jobData.analysis || jobData.matches);
```

---

## Troubleshooting

### Ollama Connection Issues
```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# Restart Ollama
ollama serve

# Check logs
tail -f ~/.ollama/logs/*.log
```

### Server Won't Start
```bash
# Check if port 3001 is in use
lsof -i :3001

# Start on different port
PORT=3002 npm start
```

### Slow Responses
- First request: 2-10 seconds (model loading)
- Subsequent requests: 1-3 seconds
- Large prompts: May take longer
- Optimize with shorter prompts for faster responses

---

## Performance Tips

1. **Shorter Prompts**: Faster responses (< 3 seconds)
2. **Specific Requests**: Better quality output
3. **Batch Operations**: Combine multiple requests into one
4. **Cache Results**: Store generated text to avoid re-generation

---

## Testing Endpoints

### Using cURL
```bash
# Test health
curl http://localhost:3001/api/health

# Test generation
curl -X POST http://localhost:3001/api/ai/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Hello"}'
```

### Using Postman
1. Create new POST request
2. URL: `http://localhost:3001/api/ai/generate`
3. Body: `{"prompt": "Your prompt here"}`
4. Headers: `Content-Type: application/json`
5. Click Send

### Using JavaScript Fetch
See "Using from Frontend JavaScript" section above.

---

## API Versioning

Current version: **v1** (no version prefix in URLs)

Future versions will use: `/api/v2/...`

---

**Version**: 1.0 | **Last Updated**: March 2026
