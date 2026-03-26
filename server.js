// ================================================================
// server.js - InternHub Backend with Ollama 7b Integration
// Handles AI features reliably with error recovery
// Start: node server.js
// ================================================================

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const rateLimit = require('express-rate-limit');
const app = express();

// ── Config ──────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
const OLLAMA_BASE = process.env.OLLAMA_URL || 'http://localhost:11434/api';
const OLLAMA_MODEL = 'neural-chat'; // lightweight 7b model

app.use(express.json({ limit: '10mb' }));
app.use(cors({ origin: '*' }));

// Rate limiting to prevent abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// ── Health Check ────────────────────────────────────────────
let ollamaHealthy = false;

async function checkOllamaHealth() {
  try {
    const res = await axios.get(`${OLLAMA_BASE}/tags`, { timeout: 3000 });
    ollamaHealthy = res.status === 200;
    console.log('Ollama status:', ollamaHealthy ? '✓ Running' : '✗ Down');
  } catch (e) {
    ollamaHealthy = false;
    console.log('Ollama check failed:', e.message);
  }
}

setInterval(checkOllamaHealth, 60000); // Check every 60 seconds
checkOllamaHealth(); // Initial check

app.get('/api/health', (req, res) => {
  res.json({ 
    server: 'ok',
    ollama: ollamaHealthy ? 'connected' : 'disconnected'
  });
});

// ── Ollama Integration ────────────────────────────────────
app.post('/api/ai/generate', async (req, res) => {
  try {
    if (!ollamaHealthy) {
      return res.status(503).json({ 
        error: 'Ollama service unavailable',
        fallback: 'Using default response. Please ensure Ollama is running on localhost:11434'
      });
    }

    const { prompt, maxTokens = 300 } = req.body;
    
    if (!prompt || prompt.trim().length === 0) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Call Ollama with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

    const response = await axios.post(
      `${OLLAMA_BASE}/generate`,
      {
        model: OLLAMA_MODEL,
        prompt: prompt.substring(0, 2000), // Limit prompt length
        stream: false,
        context: [],
        temperature: 0.7,
        top_p: 0.9,
      },
      {
        timeout: 30000,
        signal: controller.signal
      }
    );

    clearTimeout(timeoutId);

    if (!response.data?.response) {
      throw new Error('Empty response from Ollama');
    }

    res.json({
      ok: true,
      response: response.data.response.trim(),
      model: OLLAMA_MODEL
    });

  } catch (error) {
    console.error('AI generation error:', error.message);
    
    if (error.code === 'ECONNREFUSED' || error.message.includes('ECONNREFUSED')) {
      return res.status(503).json({
        error: 'Cannot connect to Ollama. Is it running?',
        hint: 'Start Ollama with: ollama serve'
      });
    }

    res.status(500).json({
      error: 'AI generation failed',
      message: error.message
    });
  }
});

// ── Job Matching (AI-enhanced) ──────────────────────────
app.post('/api/ai/match-jobs', async (req, res) => {
  try {
    const { studentSkills, jobs } = req.body;

    if (!Array.isArray(studentSkills) || !Array.isArray(jobs)) {
      return res.status(400).json({ error: 'Invalid input format' });
    }

    if (!ollamaHealthy) {
      // Fallback: simple skill matching without AI
      const matches = jobs
        .map(job => ({
          job,
          matchScore: studentSkills.filter(s => 
            job.skills.some(js => js.toLowerCase().includes(s.toLowerCase()))
          ).length / job.skills.length
        }))
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 3);

      return res.json({ 
        ok: true,
        matches,
        aiEnhanced: false,
        message: 'Using basic skill matching (Ollama unavailable)'
      });
    }

    const jobList = jobs
      .map(j => `${j.title} at ${j.company} (skills: ${j.skills.join(', ')})`)
      .join('\n');

    const prompt = `Student has skills: ${studentSkills.join(', ')}\n\nRank these jobs by match:\n${jobList}\n\nReturn top 3 matches with match percentage and brief explanation.`;

    const response = await axios.post(`${OLLAMA_BASE}/generate`, {
      model: OLLAMA_MODEL,
      prompt,
      stream: false
    }, { timeout: 30000 });

    res.json({
      ok: true,
      analysis: response.data.response.trim(),
      aiEnhanced: true
    });

  } catch (error) {
    console.error('Job matching error:', error.message);
    res.status(500).json({ error: 'Job matching failed' });
  }
});

// ── Cover Letter Generation ─────────────────────────────
app.post('/api/ai/generate-cover-letter', async (req, res) => {
  try {
    const { studentName, jobTitle, company, skills } = req.body;

    if (!studentName || !jobTitle || !company) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!ollamaHealthy) {
      return res.status(503).json({
        error: 'Ollama service required for cover letter generation'
      });
    }

    const prompt = `Write a professional cover letter for ${studentName} applying to ${jobTitle} position at ${company}. Key skills: ${Array.isArray(skills) ? skills.join(', ') : 'Not specified'}. Make it 150-200 words, professional yet personable.`;

    const response = await axios.post(`${OLLAMA_BASE}/generate`, {
      model: OLLAMA_MODEL,
      prompt,
      stream: false,
      temperature: 0.8
    }, { timeout: 30000 });

    res.json({
      ok: true,
      coverLetter: response.data.response.trim()
    });

  } catch (error) {
    console.error('Cover letter generation error:', error.message);
    res.status(500).json({ error: 'Failed to generate cover letter' });
  }
});

// ── Resume Analysis ─────────────────────────────────────
app.post('/api/ai/analyze-resume', async (req, res) => {
  try {
    const { resumeText } = req.body;

    if (!resumeText || resumeText.trim().length === 0) {
      return res.status(400).json({ error: 'Resume text is required' });
    }

    if (!ollamaHealthy) {
      return res.status(503).json({
        error: 'Ollama service required for resume analysis'
      });
    }

    const prompt = `Analyze this resume and provide: 1) Extracted skills 2) Experience level 3) 2-3 suggestions for improvement\n\nResume:\n${resumeText.substring(0, 1500)}\n\nBe concise and actionable.`;

    const response = await axios.post(`${OLLAMA_BASE}/generate`, {
      model: OLLAMA_MODEL,
      prompt,
      stream: false
    }, { timeout: 30000 });

    res.json({
      ok: true,
      analysis: response.data.response.trim()
    });

  } catch (error) {
    console.error('Resume analysis error:', error.message);
    res.status(500).json({ error: 'Failed to analyze resume' });
  }
});

// ── Applicant Analysis ─────────────────────────────────────
app.post('/api/ai/analyze-applicants', async (req, res) => {
  try {
    const { job, applicants } = req.body;

    if (!job || !Array.isArray(applicants) || applicants.length === 0) {
      return res.status(400).json({ error: 'Invalid input: job and applicants array required' });
    }

    if (!ollamaHealthy) {
      // Fallback: simple ranking with auto decisions
      const posCount = job.numberOfPositions || 1;
      const ranked = applicants.slice(0, 3).map((app, i) => ({
        id: app.id,
        name: app.studentName,
        score: Math.round(70 - (i * 10)),
        reason: 'Basic ranking: Applied ' + (i+1 === 1 ? 'first' : 'recently'),
        decision: i < posCount ? 'Accepted' : 'Rejected'
      }));
      return res.json({ ok: true, recommendations: ranked, positionsAvailable: posCount, aiEnhanced: false });
    }

    const appSummaries = applicants
      .map((a, i) => `${i+1}. ${a.studentName} (${a.status}) - ${a.coverNote ? 'Submitted cover note' : 'No cover note'}${a.resume ? ', Resume attached' : ''}`)
      .join('\n');

    const prompt = `You are a hiring manager. Rank these ${applicants.length} applicants for the "${job.title}" role at ${job.company} (${job.numberOfPositions || 1} position${(job.numberOfPositions || 1) > 1 ? 's' : ''}):\n\n${appSummaries}\n\nFor each, provide: Name, match score (0-100), and brief reason. Format: NAME | SCORE | REASON`;

    const response = await axios.post(`${OLLAMA_BASE}/generate`, {
      model: OLLAMA_MODEL,
      prompt,
      stream: false,
      temperature: 0.6
    }, { timeout: 30000 });

    // Parse AI response
    const lines = response.data.response.trim().split('\n').filter(l => l.includes('|'));
    const recommendations = lines.slice(0, Math.min(5, applicants.length)).map((line, idx) => {
      const parts = line.split('|').map(p => p.trim());
      const appIdx = applicants.findIndex(a => a.studentName.toLowerCase() === parts[0].toLowerCase());
      const appId = appIdx >= 0 ? applicants[appIdx].id : null;
      return {
        id: appId,
        name: parts[0] || 'Unknown',
        score: Math.min(100, Math.max(0, parseInt(parts[1]) || 65)),
        reason: parts[2] || 'Strong fit for role',
        decision: idx < (job.numberOfPositions || 1) ? 'Accepted' : 'Rejected'
      };
    });

    const defaultRecs = recommendations.length > 0 ? recommendations : [
      { id: applicants[0]?.id, name: applicants[0]?.studentName || 'Unknown', score: 85, reason: 'Top candidate', decision: 'Accepted' },
      { id: applicants[1]?.id, name: applicants[1]?.studentName || 'Second', score: 75, reason: 'Good match', decision: (job.numberOfPositions || 1) > 1 ? 'Accepted' : 'Rejected' }
    ];

    res.json({
      ok: true,
      recommendations: defaultRecs,
      positionsAvailable: job.numberOfPositions || 1,
      aiEnhanced: true
    });

  } catch (error) {
    console.error('Applicant analysis error:', error.message);
    
    // Fallback ranking
    res.json({
      ok: true,
      recommendations: (req.body.applicants || []).slice(0, 3).map((app, i) => ({
        name: app.studentName,
        score: Math.round(80 - (i * 5)),
        reason: i === 0 ? 'Applied first' : 'Strong candidate'
      })),
      aiEnhanced: false,
      error: 'Using fallback ranking: ' + error.message
    });
  }
});


// ── Error handling middleware ────────────────────────────
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'An error occurred'
  });
});

// ── Start server ────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n✓ InternHub Server running on http://localhost:${PORT}`);
  console.log(`✓ Ollama API: ${OLLAMA_BASE}`);
  console.log(`✓ CORS enabled for all origins\n`);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
