// ================================================================
//  app.js  —  InternHub v2  Full SPA (with Ollama 7b + Reliability)
//  Pages: landing | login | register | student-dash | recruiter-dash
// ================================================================

/* ── Error Handler ──────────────────────────────────────────── */
window.addEventListener('error', (e) => {
  console.error('Runtime error:', e.error);
  toast('An error occurred. Please try again.', 'err');
});
window.addEventListener('unhandledrejection', (e) => {
  console.error('Unhandled promise rejection:', e.reason);
  toast('An unexpected error occurred.', 'err');
});

/* ── Utilities ──────────────────────────────────────────────── */
const $ = id => {
  try { return document.getElementById(id); } 
  catch(e) { console.warn('Failed to get element:', id); return null; }
};
const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const fmtDate = iso => {
  try { return new Date(iso).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}); }
  catch(e) { return 'Invalid date'; }
};
const fmtDateShort = iso => {
  try { return new Date(iso).toLocaleDateString('en-IN',{day:'numeric',month:'short'}); }
  catch(e) { return 'Invalid'; }
};

/* ── Theme ──────────────────────────────────────────────────── */
function initTheme() {
  try {
    const t = localStorage.getItem('ih_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', t);
    const b = $('theme-btn'); if (b) b.textContent = t==='dark'?'☀️':'🌙';
  } catch(e) {
    console.warn('Theme init failed:', e);
  }
}
function toggleTheme() {
  try {
    const cur  = document.documentElement.getAttribute('data-theme');
    const next = cur==='dark'?'light':'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('ih_theme', next);
    const b = $('theme-btn'); if (b) b.textContent = next==='dark'?'☀️':'🌙';
    toast('Theme switched', 'ok');
  } catch(e) {
    console.warn('Theme toggle failed:', e);
  }
}

/* ── Toast ──────────────────────────────────────────────────── */
function toast(msg, type='ok') {
  const wrap = $('toast-root');
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  const ico = type==='ok'?'✅':type==='err'?'❌':'ℹ️';
  t.innerHTML = `<span>${ico}</span><span>${msg}</span>`;
  wrap.appendChild(t);
  requestAnimationFrame(()=>requestAnimationFrame(()=>t.classList.add('in')));
  setTimeout(()=>{ t.classList.remove('in'); t.addEventListener('transitionend',()=>t.remove(),{once:true}); }, 3500);
}

/* ── Ollama AI Service (7b) via Backend ────────────────────── */
const OllamaService = {
  baseURL: 'http://localhost:3001/api',
  isAvailable: false,
  
  async init() {
    try {
      const res = await fetch(this.baseURL + '/health');
      const data = await res.json();
      this.isAvailable = data.ollama === 'connected';
      console.log('Backend status:', data, 'Ollama:', this.isAvailable ? 'Connected' : 'Disconnected');
    } catch(e) {
      this.isAvailable = false;
      console.log('Backend not available (offline mode)');
    }
  },

  async generateCoverLetter(studentName, jobTitle, company, skills) {
    try {
      const res = await fetch(this.baseURL + '/ai/generate-cover-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentName, jobTitle, company, skills })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Generation failed');
      return data.coverLetter;
    } catch(e) {
      console.warn('Cover letter generation:', e.message);
      toast('AI unavailable - ' + e.message, 'info');
      return null;
    }
  },

  async findJobMatches(studentSkills, jobs) {
    try {
      const res = await fetch(this.baseURL + '/ai/match-jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentSkills, jobs })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Matching failed');
      return data;
    } catch(e) {
      console.warn('Job matching:', e.message);
      return null;
    }
  },

  async analyzeResume(resumeText) {
    try {
      const res = await fetch(this.baseURL + '/ai/analyze-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Analysis failed');
      return data.analysis;
    } catch(e) {
      console.warn('Resume analysis:', e.message);
      toast('AI unavailable - ' + e.message, 'info');
      return null;
    }
  },

  async analyzeApplicants(job, applicants) {
    try {
      const res = await fetch(this.baseURL + '/ai/analyze-applicants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job, applicants })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Analysis failed');
      console.log('AI Analysis response:', data);
      return data;
    } catch(e) {
      console.error('Applicant analysis error:', e.message);
      toast('AI analysis unavailable - ' + e.message, 'info');
      return null;
    }
  },

  async generateText(prompt) {
    try {
      const res = await fetch(this.baseURL + '/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Generation failed');
      return data.response;
    } catch(e) {
      console.warn('Text generation:', e.message);
      return null;
    }
  }
};

// Initialize on load
window.addEventListener('DOMContentLoaded', () => OllamaService.init());

/* ── Router ─────────────────────────────────────────────────── */
const Router = {
  cur: 'landing',
  go(page, opts={}) {
    const user = Auth.current();
    // Guards
    if (page==='landing' && user) { 
      this.go(user.role==='student'?'student-dash':'recruiter-dash'); return; 
    }
    if (page==='student-dash'  && !user) { this.go('login'); return; }
    if (page==='recruiter-dash'&& !user) { this.go('login'); return; }
    if (page==='student-dash'  && user?.role!=='student')   { this.go('recruiter-dash'); return; }
    if (page==='recruiter-dash'&& user?.role!=='recruiter') { this.go('student-dash'); return; }
    if ((page==='login'||page==='register') && user) {
      this.go(user.role==='student'?'student-dash':'recruiter-dash'); return;
    }
    document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
    const el = $('page-'+page); if (el) el.classList.add('active');
    this.cur = page;
    window.scrollTo({top:0,behavior:'smooth'});
    updateNav();
    if (page==='landing')       renderLanding();
    if (page==='browse')        renderBrowse();
    if (page==='login')         setupLogin(opts.role||'student');
    if (page==='register')      setupRegister(opts.role||'student');
    if (page==='student-dash')  renderStudentDash(opts.tab||'jobs');
    if (page==='recruiter-dash')renderRecruiterDash(opts.tab||'jobs');
  }
};

/* ── Nav ────────────────────────────────────────────────────── */
function updateNav() {
  const user = Auth.current();
  const linksEl = $('nav-links');
  const rightEl = $('nav-right');
  const drawerEl= $('drawer-links');

  let links = '', drawerLinks = '';
  if (!user) {
    links = `
      <button class="nav-btn ${Router.cur==='landing'?'on':''}"   onclick="Router.go('landing')">Home</button>`;
    drawerLinks = `
      <button class="drawer-btn" onclick="Router.go('landing');closeMob()">Home</button>
      <button class="drawer-btn" onclick="Router.go('login',{role:'student'});closeMob()">Student Login</button>
      <button class="drawer-btn" onclick="Router.go('login',{role:'recruiter'});closeMob()">Recruiter Login</button>`;
  } else if (user.role==='student') {
    links = `
      <button class="nav-btn ${Router.cur==='browse'?'on':''}" onclick="Router.go('browse')">Browse Jobs</button>
      <button class="nav-btn ${Router.cur==='student-dash'&&Router.curTab==='jobs'?'on':''}" onclick="Router.go('student-dash',{tab:'jobs'})">My Applications</button>
      <button class="nav-btn ${Router.cur==='student-dash'&&Router.curTab==='resume'?'on':''}" onclick="Router.go('student-dash',{tab:'resume'})">Resume</button>`;
    drawerLinks = `
      <button class="drawer-btn" onclick="Router.go('browse');closeMob()">Browse Jobs</button>
      <button class="drawer-btn" onclick="Router.go('student-dash',{tab:'jobs'});closeMob()">My Applications</button>
      <button class="drawer-btn" onclick="Router.go('student-dash',{tab:'resume'});closeMob()">Resume</button>
      <button class="drawer-btn" onclick="doLogout()" style="color:var(--red)">Sign Out</button>`;
  } else {
    links = `
      <button class="nav-btn ${Router.cur==='recruiter-dash'&&Router.curTab==='jobs'?'on':''}" onclick="Router.go('recruiter-dash',{tab:'jobs'})">My Jobs</button>
      <button class="nav-btn ${Router.cur==='recruiter-dash'&&Router.curTab==='applicants'?'on':''}" onclick="Router.go('recruiter-dash',{tab:'applicants'})">Applicants</button>`;
    drawerLinks = `
      <button class="drawer-btn" onclick="Router.go('recruiter-dash',{tab:'jobs'});closeMob()">My Jobs</button>
      <button class="drawer-btn" onclick="Router.go('recruiter-dash',{tab:'applicants'});closeMob()">Applicants</button>
      <button class="drawer-btn" onclick="doLogout()" style="color:var(--red)">Sign Out</button>`;
  }

  linksEl.innerHTML = links;

  if (user) {
    const av = user.name[0].toUpperCase();
    rightEl.innerHTML = `
      <div class="nav-chip">
        <div class="nav-av ${user.role}">${av}</div>
        <span class="nav-uname">${esc(user.name.split(' ')[0])}</span>
        <span class="role-badge ${user.role}">${user.role==='student'?'Student':'Recruiter'}</span>
      </div>
      <button class="btn btn-ghost btn-sm" onclick="doLogout()">Sign out</button>
      <button id="theme-btn" onclick="toggleTheme()">☀️</button>`;
  } else {
    rightEl.innerHTML = `
      <button class="btn btn-ghost btn-sm" onclick="Router.go('login',{role:'student'})">Student Login</button>
      <button class="btn btn-recruiter btn-sm" onclick="Router.go('login',{role:'recruiter'})">Recruiter Login</button>
      <button id="theme-btn" onclick="toggleTheme()">☀️</button>`;
  }
  initTheme();
  if (drawerEl) drawerEl.innerHTML = drawerLinks;
}

function doLogout() {
  Auth.logout();
  toast('Signed out. See you soon!');
  Router.go('landing');
}

/* Mobile drawer */
function openMob()  { $('mob-drawer').classList.add('open'); }
function closeMob() { $('mob-drawer').classList.remove('open'); }

/* ── Modal ──────────────────────────────────────────────────── */
let _modalCleanup = null;
function openModal(headHtml, bodyHtml, onClose=null) {
  $('modal-head-slot').innerHTML = headHtml;
  $('modal-body-slot').innerHTML = bodyHtml;
  $('modal-bg').classList.add('open');
  document.body.style.overflow = 'hidden';
  _modalCleanup = onClose;
}
function closeModal() {
  $('modal-bg').classList.remove('open');
  document.body.style.overflow = '';
  if (_modalCleanup) { _modalCleanup(); _modalCleanup=null; }
}

/* ═══════════════════════════════════════════════════════════════
   LANDING PAGE
═══════════════════════════════════════════════════════════════ */
function renderLanding() {
  renderJobGrid(DB.getActiveJobs());
}

function renderBrowse() {
  doBrowseSearch();
}

function doBrowseSearch() {
  const q     = ($('b-q')?.value||'').toLowerCase().trim();
  const loc   = $('b-loc')?.value||'';
  const dur   = $('b-dur')?.value||'';
  const pay   = $('b-pay')?.value||'';
  
  // Get all selected skills
  const selectedSkills = Array.from(document.querySelectorAll('.skill-checkbox:checked'))
    .map(cb => cb.value);
  
  const jobs = DB.getActiveJobs().filter(j=>{
    const mq   = !q   || j.title.toLowerCase().includes(q) || j.company.toLowerCase().includes(q);
    const ml   = !loc || j.location === loc;
    const md   = !dur || j.duration === dur;
    // If skills are selected, job must have ANY of the selected skills
    const ms   = !selectedSkills.length || j.skills.some(s => selectedSkills.some(sel => s.toLowerCase().includes(sel.toLowerCase())));
    const mp   = !pay || (pay==='paid' ? j.paid : !j.paid);
    return mq && ml && md && ms && mp;
  });
  
  // Update selected skills display
  const displayEl = $('selected-skills');
  if (displayEl) {
    if (selectedSkills.length === 0) {
      displayEl.innerHTML = '';
    } else {
      displayEl.innerHTML = selectedSkills.map(skill => 
        `<span class="skill-chip" style="background:var(--acbg);color:var(--ac);font-size:.8rem;padding:6px 12px">${skill}</span>`
      ).join('');
    }
  }
  
  renderBrowseGrid(jobs);
}

function clearBrowseFilters() {
  if ($('b-q'))    $('b-q').value = '';
  if ($('b-loc'))  $('b-loc').value = '';
  if ($('b-dur'))  $('b-dur').value = '';
  if ($('b-pay'))  $('b-pay').value = '';
  document.querySelectorAll('.skill-checkbox').forEach(cb => cb.checked = false);
  const displayEl = $('selected-skills');
  if (displayEl) displayEl.innerHTML = '';
  doBrowseSearch();
}

function renderBrowseGrid(jobs) {
  const user = Auth.current();
  const grid = $('browse-grid');
  const countEl = $('browse-results-count');
  
  if (!jobs.length) {
    countEl.textContent = 'No jobs found. Try adjusting your filters.';
    grid.innerHTML = `<div class="empty" style="padding:60px 20px;text-align:center">
      <div class="empty-ico" style="font-size:3rem;margin-bottom:16px">🔍</div>
      <div class="empty-ttl">No internships match your search</div>
      <p class="empty-sub" style="margin:12px 0">Try different keywords or filters</p>
      <button class="btn btn-ghost" onclick="clearBrowseFilters()" style="margin-top:16px">Clear all filters</button>
    </div>`;
    return;
  }
  
  countEl.textContent = `${jobs.length} internship${jobs.length!==1?'s':''} found`;
  
  grid.innerHTML = jobs.map((j, i) => {
    const applied = user?.role === 'student' && DB.hasActiveApplication(user.id, j.id);
    const rejectedApp = user?.role === 'student' ? DB.getApps().find(a => a.studentId === user.id && a.jobId === j.id && a.status === 'Rejected') : null;
    const saved = user?.role === 'student' && DB.isSaved(user.id, j.id);
    return `<article class="browse-job-card" style="animation-delay:${i*0.05}s;border:1px solid var(--bd);border-radius:12px;padding:20px;cursor:pointer;transition:all 0.2s;background:var(--bg2)" onclick="handleJobCardClick(event,'${j.id}')" onmouseover="this.style.borderColor='var(--ac)'" onmouseout="this.style.borderColor='var(--bd)'">
      <div style="display:flex;gap:16px">
        <div class="jcard-logo" style="background:${j.color};width:50px;height:50px;border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-weight:700;font-size:1.2rem;color:#fff">${j.logo}</div>
        <div style="flex:1;min-width:0">
          <div style="display:flex;align-items:start;justify-content:space-between;gap:12px;margin-bottom:8px">
            <div>
              <div class="jcard-title" style="margin:0">${esc(j.title)}</div>
              <div class="jcard-co" style="margin:4px 0">${esc(j.company)} · ${esc(j.location)}</div>
            </div>
            <div style="text-align:right;flex-shrink:0">
              <div style="font-weight:600;color:var(--ac);font-size:1rem">${esc(j.stipend)}</div>
              <div style="font-size:.8rem;color:var(--tx3);margin-top:4px">${esc(j.duration)}</div>
            </div>
          </div>
          <div class="skill-chips" style="margin:12px 0">${j.skills.slice(0,4).map(s=>`<span class="skill-chip">${esc(s)}</span>`).join('')}${j.skills.length>4?`<span class="skill-chip" style="background:var(--tx4)">+${j.skills.length-4}</span>`:''}</div>
          <div style="display:flex;align-items:center;justify-content:space-between;margin-top:12px;padding-top:12px;border-top:1px solid var(--bd)">
            <span style="font-size:.8rem;color:var(--tx3)">📅 Due ${fmtDateShort(j.deadline)}</span>
            <div style="display:flex;gap:10px">
              ${user?.role === 'student'
                ? `<button class="btn btn-icon ${saved?'btn-warn':''}" onclick="toggleSaveJob(event,'${j.id}')" title="${saved?'Unsave':'Save'} job">
                     ${saved?'❤️':'🤍'}
                   </button>`
                : ''
              }
              ${user?.role === 'student'
                ? `<button class="apply-btn ${applied?'applied':''}" data-id="${j.id}" ${applied && !rejectedApp?'disabled':''} onclick="handleApplyClick(event,'${j.id}',this)">
                     ${applied && !rejectedApp?'✓ Applied':rejectedApp?'✓ Reapply':'Apply'}
                   </button>`
                : user?.role === 'recruiter'
                  ? `<button class="btn btn-ghost btn-sm" onclick="openJobDetail('${j.id}')">View</button>`
                  : `<button class="apply-btn" onclick="Router.go('login',{role:'student'})">Apply</button>`
              }
            </div>
          </div>
        </div>
      </div>
    </article>`;
  }).join('');
}

function renderJobGrid(jobs) {
  const user   = Auth.current();
  const grid   = $('job-grid');
  const countEl= $('job-count');
  if (countEl) countEl.textContent = `${jobs.length} role${jobs.length!==1?'s':''}`;
  if (!jobs.length) {
    grid.innerHTML=`<div class="empty" style="grid-column:1/-1">
      <div class="empty-ico">🔍</div>
      <div class="empty-ttl">No jobs found</div>
      <p class="empty-sub">Try different filters or <a onclick="clearSearch()">clear all</a></p>
    </div>`; return;
  }
  grid.innerHTML = jobs.map((j,i)=>{
    const applied = user?.role==='student' && DB.hasActiveApplication(user.id, j.id);
    const rejectedApp = user?.role==='student' ? DB.getApps().find(a => a.studentId === user.id && a.jobId === j.id && a.status === 'Rejected') : null;
    const saved = user?.role==='student' && DB.isSaved(user.id, j.id);
    return `<article class="card student-card" style="animation-delay:${i*.04}s;cursor:pointer"
        onclick="handleJobCardClick(event,'${j.id}')">
      <div class="jcard-head">
        <div class="jcard-logo" style="background:${j.color}">${j.logo}</div>
        <div style="display:flex;flex-direction:column;gap:4px;align-items:flex-end">
          ${j.location==='Remote'?'<span class="tag tag-blue">Remote</span>':''}
          <span class="tag tag-gray">${esc(j.duration)}</span>
        </div>
      </div>
      <div class="jcard-title">${esc(j.title)}</div>
      <div class="jcard-co">${esc(j.company)} · ${esc(j.location)}</div>
      <div class="jcard-meta">
        <span>📍 ${esc(j.location)}</span>
        <span>📅 Due ${fmtDateShort(j.deadline)}</span>
      </div>
      <div class="skill-chips">${j.skills.map(s=>`<span class="skill-chip">${esc(s)}</span>`).join('')}</div>
      <div class="jcard-foot" style="align-items:center">
        <span class="stipend">${esc(j.stipend)}</span>
        <div style="display:flex;gap:8px;align-items:center">
          ${user?.role==='student'
            ? `<button class="btn btn-icon ${saved?'btn-warn':''}" onclick="toggleSaveJob(event,'${j.id}')" title="${saved?'Unsave':'Save'} job">
                 ${saved?'❤️':'🤍'}
               </button>`
            : ''
          }
          ${user?.role==='student'
            ? `<button class="apply-btn ${applied?'applied':''}" data-id="${j.id}"
                 ${applied && !rejectedApp?'disabled':''} onclick="handleApplyClick(event,'${j.id}',this)">
                 ${applied && !rejectedApp?'✓ Applied':rejectedApp?'✓ Reapply':'Apply'}
               </button>`
            : user?.role==='recruiter'
              ? `<button class="btn btn-ghost btn-sm" onclick="openJobDetail('${j.id}')">View</button>`
              : `<button class="apply-btn" onclick="Router.go('login',{role:'student'})">Apply</button>`
          }
        </div>
      </div>
    </article>`;
  }).join('');
}

function handleJobCardClick(e, id) {
  if (e.target.closest('button')) return;
  openJobDetail(id);
}

function handleApplyClick(e, id, btn) {
  e.stopPropagation();
  const user = Auth.current();
  if (!user) { Router.go('login',{role:'student'}); return; }
  // Check resume
  const resume = DB.getResume(user.id);
  if (!resume) {
    // Open apply modal with cover note + resume warning
    openApplyModal(id, btn, true);
  } else {
    openApplyModal(id, btn, false);
  }
}

function toggleSaveJob(e, jobId) {
  e.stopPropagation();
  const user = Auth.current();
  if (!user || user.role !== 'student') {
    Router.go('login',{role:'student'});
    return;
  }
  const isSaved = DB.isSaved(user.id, jobId);
  if (isSaved) {
    DB.unsaveJob(user.id, jobId);
    toast('Job removed from saved', 'ok');
  } else {
    DB.saveJob(user.id, jobId);
    toast('Job saved! ❤️', 'ok');
  }
  // Refresh grid
  const current = $('page-landing').classList.contains('active') ? 'landing' : 
                  $('page-student-dash').classList.contains('active') ? 'student-dash' : null;
  if (current === 'landing') renderLanding();
  else if (current === 'student-dash') renderStudentDash(Router.curTab);
}

function openApplyModal(jobId, btn, noResume) {
  const j = DB.getJobById(jobId);
  const user = Auth.current();
  openModal(
    `<div style="display:flex;align-items:center;gap:13px">
       <div style="width:42px;height:42px;border-radius:10px;background:${j.color};display:flex;align-items:center;justify-content:center;font-family:'ClashDisplay','Clash Display',sans-serif;font-weight:700;font-size:1.1rem;color:#fff">${j.logo}</div>
       <div>
         <div style="font-family:'ClashDisplay','Clash Display',sans-serif;font-weight:700;font-size:1rem">${esc(j.title)}</div>
         <div style="font-size:.82rem;color:var(--tx2)">${esc(j.company)} · ${esc(j.location)}</div>
       </div>
     </div>`,
    `${noResume?`<div class="alert alert-info" style="margin-bottom:16px">ℹ️ You haven't uploaded a resume yet. You can still apply but we recommend uploading one from your <a onclick="Router.go('student-dash',{tab:'resume'});closeModal()" style="color:var(--rc);cursor:pointer;font-weight:600">dashboard</a>.</div>`:''}
     <div class="form-group">
       <label class="form-label">Cover Note (optional)</label>
       <div style="display:flex;gap:8px;margin-bottom:10px">
         <button class="btn btn-ghost btn-sm" id="ai-generate-btn" onclick="generateCoverLetterAI('${jobId}','${user.name}')" style="flex:1;background:var(--rcbg2);color:var(--rc);border:none">
           🤖 Generate with AI
         </button>
       </div>
       <textarea class="form-textarea" id="cover-note" placeholder="Briefly tell the recruiter why you're a great fit…" rows="4"></textarea>
     </div>
     <button class="btn btn-primary btn-lg btn-block" onclick="submitApply('${jobId}')">Submit Application →</button>`
  );
}

async function generateCoverLetterAI(jobId, studentName) {
  const job = DB.getJobById(jobId);
  const user = Auth.current();
  const resume = DB.getResume(user.id);
  const textarea = $('cover-note');
  const btn = $('ai-generate-btn');
  
  if (!textarea) return;
  
  // Show loading state
  btn.disabled = true;
  const originalText = btn.textContent;
  btn.textContent = '⏳ Generating...';
  
  try {
    // Call Ollama to generate cover letter
    const coverLetter = await OllamaService.generateCoverLetter(
      studentName,
      job.title,
      job.company,
      job.skills
    );
    
    if (coverLetter) {
      textarea.value = coverLetter;
      toast('✨ Cover letter generated! Feel free to edit it.', 'ok');
      btn.textContent = '✓ Generated';
    } else {
      toast('Could not generate cover letter. Ollama may be unavailable.', 'info');
      btn.textContent = originalText;
      btn.disabled = false;
    }
  } catch (e) {
    console.error('AI generation error:', e);
    toast('Error generating cover letter: ' + e.message, 'err');
    btn.textContent = originalText;
    btn.disabled = false;
  }
}

function submitApply(jobId) {
  const user = Auth.current();
  const note = $('cover-note')?.value.trim() || '';
  DB.apply(user.id, jobId, note);
  closeModal();
  // Update card button
  const btn = document.querySelector(`.apply-btn[data-id="${jobId}"]`);
  if (btn) { btn.textContent='✓ Applied'; btn.classList.add('applied'); btn.disabled=true; }
  toast('Application submitted! 🎉');
}

function openJobDetail(jobId) {
  const j    = DB.getJobById(jobId);
  const user = Auth.current();
  const applied = user?.role==='student' && DB.hasApplied(user.id, j.id);
  const deadline = new Date(j.deadline).toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'});
  const appCount = DB.getAppsForJob(j.id).length;

  let applySection = '';
  if (!user) {
    applySection = `<button class="modal-apply-btn" onclick="Router.go('login',{role:'student'})">Sign in to Apply →</button>`;
  } else if (user.role==='student') {
    applySection = `<button class="modal-apply-btn ${applied?'applied':''}" ${applied?'disabled':''} onclick="${applied?'':`openApplyModal('${j.id}',this,${!DB.getResume(user.id)})`}">
      ${applied?'✓ Already Applied':'Apply Now'}
    </button>`;
  } else {
    applySection = `<div class="alert alert-info" style="margin-top:16px">📋 ${appCount} student${appCount!==1?'s':''} applied for this role.</div>`;
  }

  openModal(
    `<div style="display:flex;align-items:center;gap:14px">
       <div style="width:46px;height:46px;border-radius:11px;background:${j.color};display:flex;align-items:center;justify-content:center;font-family:'ClashDisplay','Clash Display',sans-serif;font-weight:700;font-size:1.2rem;color:#fff">${j.logo}</div>
       <div>
         <div style="font-family:'ClashDisplay','Clash Display',sans-serif;font-weight:700;font-size:1.05rem">${esc(j.title)}</div>
         <div style="font-size:.82rem;color:var(--tx2)">${esc(j.company)} · ${esc(j.location)}</div>
       </div>
     </div>`,
    `<p style="color:var(--tx2);font-size:.9rem;line-height:1.74;margin-bottom:18px">${esc(j.description)}</p>
     <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:18px">
       <span style="display:flex;align-items:center;gap:6px;background:var(--bg3);border:1px solid var(--bd);padding:6px 12px;border-radius:8px;font-size:.8rem;color:var(--tx2)">📍 ${esc(j.location)}</span>
       <span style="display:flex;align-items:center;gap:6px;background:var(--bg3);border:1px solid var(--bd);padding:6px 12px;border-radius:8px;font-size:.8rem;color:var(--tx2)">💰 ${esc(j.stipend)}</span>
       <span style="display:flex;align-items:center;gap:6px;background:var(--bg3);border:1px solid var(--bd);padding:6px 12px;border-radius:8px;font-size:.8rem;color:var(--tx2)">⏱ ${esc(j.duration)}</span>
       <span style="display:flex;align-items:center;gap:6px;background:var(--bg3);border:1px solid var(--bd);padding:6px 12px;border-radius:8px;font-size:.8rem;color:var(--tx2)">📅 Due ${deadline}</span>
     </div>
     <div style="font-size:.72rem;font-weight:700;color:var(--tx3);letter-spacing:.07em;text-transform:uppercase;margin-bottom:9px">Skills Required</div>
     <div class="skill-chips" style="margin-bottom:0">${j.skills.map(s=>`<span class="skill-chip">${esc(s)}</span>`).join('')}</div>
     ${applySection}`
  );
}

/* Search */
function doSearch() {
  const q   = ($('s-q')?.value||'').toLowerCase().trim();
  const loc = $('s-loc')?.value||'';
  const sk  = $('s-skill')?.value||'';
  const list = DB.getActiveJobs().filter(j=>{
    const mq  = !q  || j.title.toLowerCase().includes(q) || j.company.toLowerCase().includes(q);
    const ml  = !loc|| j.location===loc;
    const ms  = !sk || j.skills.some(s=>s.toLowerCase().includes(sk.toLowerCase()));
    return mq&&ml&&ms;
  });
  const clr = $('s-clr');
  if (clr) clr.style.display=(q||loc||sk)?'':'none';
  renderJobGrid(list);
}
function clearSearch() {
  if ($('s-q'))    $('s-q').value='';
  if ($('s-loc'))  $('s-loc').value='';
  if ($('s-skill'))$('s-skill').value='';
  doSearch();
}

/* ═══════════════════════════════════════════════════════════════
   AUTH  (Login + Register — shared logic, role-aware UI)
═══════════════════════════════════════════════════════════════ */
let _authRole = 'student';

function setupLogin(role='student') {
  _authRole = role;
  $('login-role-student').classList.toggle('on', role==='student');
  $('login-role-student').classList.toggle('student', role==='student');
  $('login-role-recruiter').classList.toggle('on', role==='recruiter');
  $('login-role-recruiter').classList.toggle('recruiter', role==='recruiter');
  
  // Update logo styling
  const logo = $('login-logo');
  if (logo) {
    logo.classList.remove('student', 'recruiter');
    logo.classList.add(role);
  }
  
  // Update title and subtitle based on role
  const title = document.querySelector('#page-login .auth-title');
  const sub = $('login-sub');
  
  if (title) {
    if (role === 'student') {
      title.textContent = 'Welcome back, Student 👋';
      if (sub) sub.innerHTML = 'No account? <a class="s" onclick="Router.go(\'register\',{role:\'student\'})">Sign up free →</a>';
    } else {
      title.textContent = 'Welcome back, Recruiter 👋';
      if (sub) sub.innerHTML = 'No account? <a class="s" onclick="Router.go(\'register\',{role:\'recruiter\'})">Sign up free →</a>';
    }
  }
  
  $('l-email').value=''; $('l-pw').value='';
  clearAlerts('login-alert');
}

function switchLoginRole(role) { setupLogin(role); }

function doLogin() {
  clearAlerts('login-alert');
  const email = $('l-email').value.trim();
  const pw    = $('l-pw').value;
  if (!email||!pw) { showAlert('login-alert','error','Please fill in all fields.'); return; }

  const user = Auth.login(email, pw);
  if (!user) { showAlert('login-alert','error','Incorrect email or password.'); return; }
  if (user.role !== _authRole) {
    Auth.logout();
    showAlert('login-alert','error',`This account is a ${user.role}. Please use the ${user.role} login tab.`);
    return;
  }

  toast(`Welcome back, ${user.name.split(' ')[0]}! 👋`);
  Router.go(user.role==='student'?'student-dash':'recruiter-dash');
}

function demoStudentLogin() {
  if (!DB.findUserByEmail('demo.student@internhub.com')) {
    DB.createUser({name:'Demo Student',email:'demo.student@internhub.com',password:'demo1234',role:'student'});
  }
  Auth.login('demo.student@internhub.com','demo1234');
  toast('Signed in as Demo Student 🚀');
  Router.go('student-dash');
}
function demoRecruiterLogin() {
  if (!DB.findUserByEmail('demo.recruiter@internhub.com')) {
    DB.createUser({name:'Demo Recruiter',email:'demo.recruiter@internhub.com',password:'demo1234',role:'recruiter',company:'Demo Corp'});
  }
  Auth.login('demo.recruiter@internhub.com','demo1234');
  toast('Signed in as Demo Recruiter 🚀');
  Router.go('recruiter-dash');
}

function setupRegister(role='student') {
  _authRole = role;
  $('reg-role-student').classList.toggle('on', role==='student');
  $('reg-role-student').classList.toggle('student', role==='student');
  $('reg-role-recruiter').classList.toggle('on', role==='recruiter');
  $('reg-role-recruiter').classList.toggle('recruiter', role==='recruiter');
  $('company-field').style.display = role==='recruiter'?'block':'none';
  
  // Update logo styling
  const logo = $('reg-logo');
  if (logo) {
    logo.classList.remove('student', 'recruiter');
    logo.classList.add(role);
  }
  
  // Update title and subtitle based on role
  const title = document.querySelector('#page-register .auth-title');
  const sub = $('reg-sub');
  
  if (title) {
    if (role === 'student') {
      title.textContent = 'Join as a Student 🎓';
      if (sub) sub.innerHTML = 'Already have one? <a class="s" onclick="Router.go(\'login\',{role:\'student\'})">Sign in →</a>';
    } else {
      title.textContent = 'Join as a Recruiter 🏢';
      if (sub) sub.innerHTML = 'Already have one? <a class="s" onclick="Router.go(\'login\',{role:\'recruiter\'})">Sign in →</a>';
    }
  }
  
  ['r-name','r-email','r-pw','r-confirm','r-company'].forEach(id=>{ const el=$(id); if(el)el.value=''; });
  clearAlerts('reg-alert');
}
function switchRegRole(role) { setupRegister(role); }

function doRegister() {
  clearAlerts('reg-alert');
  const name    = $('r-name').value.trim();
  const email   = $('r-email').value.trim();
  const pw      = $('r-pw').value;
  const confirm = $('r-confirm').value;
  const company = $('r-company')?.value.trim()||'';
  const errs = [];
  if (name.length<2)   errs.push('Enter your full name.');
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.push('Enter a valid email.');
  if (pw.length<6)     errs.push('Password must be at least 6 characters.');
  if (pw!==confirm)    errs.push('Passwords do not match.');
  if (_authRole==='recruiter'&&!company) errs.push('Company name is required for recruiters.');
  if (errs.length) { showAlert('reg-alert','error',errs.join(' ')); return; }

  const result = DB.createUser({ name, email, password:pw, role:_authRole, company });
  if (!result.ok) { showAlert('reg-alert','error',result.msg); return; }

  Auth.login(email, pw);
  toast('Account created! Welcome to InternHub 🎉');
  Router.go(_authRole==='student'?'student-dash':'recruiter-dash');
}

/* ═══════════════════════════════════════════════════════════════
   STUDENT DASHBOARD
═══════════════════════════════════════════════════════════════ */
let _studentTab = 'jobs';

function renderStudentDash(tab='jobs') {
  _studentTab = tab;
  Router.curTab = tab;
  const user = Auth.current();
  $('s-dash-name').textContent = user.name.split(' ')[0];

  const apps   = DB.getStudentApps(user.id);
  const resume = DB.getResume(user.id);
  const allJobs= DB.getActiveJobs();
  const applied= new Set(apps.map(a=>a.jobId));
  const saved  = DB.getSavedJobs(user.id);

  $('s-stat-applied').textContent = apps.length;
  $('s-stat-open').textContent    = allJobs.length;
  $('s-stat-offers').textContent  = apps.filter(a => a.status === 'Accepted').length;
  $('s-stat-resume').textContent  = resume ? '✓ Uploaded' : 'Not yet';
  $('s-stat-resume').style.fontSize = resume?'1rem':'2rem';
  $('s-stat-resume').style.color  = resume?'var(--green)':'';

  // Tabs
  document.querySelectorAll('.s-tab').forEach(t=>{
    t.classList.toggle('on', t.dataset.tab===tab);
  });
  document.querySelectorAll('.s-tab-panel').forEach(p=>{
    p.style.display = p.dataset.tab===tab?'block':'none';
  });

  if (tab==='jobs') renderStudentJobsTab(apps, allJobs, applied);
  if (tab==='offers') renderStudentOffersTab(apps);
  if (tab==='interviews') renderStudentInterviewsTab(user);
  if (tab==='saved') renderSavedJobsTab(user, saved, applied, apps);
  if (tab==='resume') renderResumeTab(user, resume);
}

function renderStudentJobsTab(apps, allJobs, applied) {
  // Applications list
  const listEl = $('s-app-list');
  if (!apps.length) {
    listEl.innerHTML=`<div class="empty">
      <div class="empty-ico">📭</div>
      <div class="empty-ttl">No applications yet</div>
      <p class="empty-sub">Browse open roles and apply below</p>
    </div>`;
  } else {
    listEl.innerHTML = apps.map((a,i)=>{
      const j = a.job;
      const spClass = {Applied:'sp-applied',Reviewing:'sp-reviewing',Accepted:'sp-accepted',Rejected:'sp-rejected','Offer Confirmed':'sp-accepted'}[a.status]||'sp-applied';
      return `<div class="app-row" style="animation-delay:${i*.05}s">
        <div class="app-logo" style="background:${j.color}">${j.logo}</div>
        <div class="app-info">
          <div class="app-ttl">${esc(j.title)}</div>
          <div class="app-co">${esc(j.company)} · ${esc(j.location)}</div>
        </div>
        <div class="app-meta">
          <span class="status-pill ${spClass}">${esc(a.status)}</span>
          <span class="app-date">Applied ${fmtDate(a.appliedAt)}</span>
        </div>
        <span class="app-stip">${esc(j.stipend)}</span>
      </div>`;
    }).join('');
  }

  // Smart recommendations based on student skills
  const user = Auth.current();
  const userResume = user ? DB.getResume(user.id) : null;
  const userSkills = userResume?.parsed?.skills || [];
  
  // Filter to jobs not yet applied + can reapply if rejected
  const eligibleJobs = allJobs.filter(j => {
    const appForJob = apps.find(a => a.jobId === j.id);
    // If no app, it's eligible. If rejected, it's eligible (can reapply). Otherwise not eligible.
    return !appForJob || appForJob.status === 'Rejected';
  });
  
  // Score jobs by skill match
  const scoredJobs = eligibleJobs.map(j => {
    const matchCount = j.skills.filter(skill => userSkills.some(us => us.toLowerCase().includes(skill.toLowerCase()))).length;
    return { job: j, score: matchCount };
  }).sort((a, b) => b.score - a.score).slice(0, 4);
  
  const suggested = scoredJobs.map(s => s.job);
  const suggEl = $('s-suggested');
  if (!suggested.length) {
    suggEl.innerHTML=`<p style="color:var(--tx3);font-size:.88rem">You've applied to all open listings! 🎉</p>`;
  } else {
    suggEl.innerHTML=`<div class="card-grid">${suggested.map((j,i)=>`
      <article class="card student-card" style="animation-delay:${i*.04}s;cursor:pointer" onclick="handleJobCardClick(event,'${j.id}')">
        <div class="jcard-head">
          <div class="jcard-logo" style="background:${j.color}">${j.logo}</div>
          <span class="tag tag-gray">${esc(j.duration)}</span>
        </div>
        <div class="jcard-title">${esc(j.title)}</div>
        <div class="jcard-co">${esc(j.company)}</div>
        <div class="skill-chips" style="margin:10px 0">${j.skills.map(s=>`<span class="skill-chip">${esc(s)}</span>`).join('')}</div>
        <div class="jcard-foot">
          <span class="stipend">${esc(j.stipend)}</span>
          <button class="apply-btn" data-id="${j.id}" onclick="handleApplyClick(event,'${j.id}',this)">Apply</button>
        </div>
      </article>`).join('')}</div>`;
  }
}

function renderSavedJobsTab(user, saved, applied, apps) {
  const grid = $('s-saved-grid');
  const countEl = $('saved-count');
  
  if (!saved || !saved.length) {
    grid.innerHTML = `<div class="empty" style="grid-column:1/-1">
      <div class="empty-ico">💔</div>
      <div class="empty-ttl">No saved jobs yet</div>
      <p class="empty-sub">Browse jobs and save ones you're interested in</p>
      <button class="btn btn-primary" onclick="Router.go('browse')" style="margin-top:16px">Browse Jobs</button>
    </div>`;
    countEl.textContent = '';
  } else {
    countEl.textContent = `(${saved.length})`;
    grid.innerHTML = saved.map((j,i) => {
      const isSaved = DB.isSaved(user.id, j.id);
      const rejectedApp = apps.find(a => a.jobId === j.id && a.status === 'Rejected');
      const hasActiveApp = applied.has(j.id) && !rejectedApp;
      return `<article class="card student-card" style="animation-delay:${i*.04}s;cursor:pointer"
          onclick="handleJobCardClick(event,'${j.id}')">
        <div class="jcard-head">
          <div class="jcard-logo" style="background:${j.color}">${j.logo}</div>
          <div style="display:flex;flex-direction:column;gap:4px;align-items:flex-end">
            ${j.location==='Remote'?'<span class="tag tag-blue">Remote</span>':''}
            <span class="tag tag-gray">${esc(j.duration)}</span>
          </div>
        </div>
        <div class="jcard-title">${esc(j.title)}</div>
        <div class="jcard-co">${esc(j.company)} · ${esc(j.location)}</div>
        <div class="jcard-meta">
          <span>📍 ${esc(j.location)}</span>
          <span>📅 Due ${fmtDateShort(j.deadline)}</span>
        </div>
        <div class="skill-chips">${j.skills.map(s=>`<span class="skill-chip">${esc(s)}</span>`).join('')}</div>
        <div class="jcard-foot" style="align-items:center">
          <span class="stipend">${esc(j.stipend)}</span>
          <div style="display:flex;gap:8px;align-items:center">
            <button class="btn btn-icon btn-warn" onclick="toggleSaveJob(event,'${j.id}')" title="Remove from saved">
              ❤️
            </button>
            <button class="apply-btn ${hasActiveApp?'applied':''}" data-id="${j.id}"
                 ${hasActiveApp?'disabled':''} onclick="handleApplyClick(event,'${j.id}',this)">
                 ${hasActiveApp?'✓ Applied':rejectedApp?'✓ Reapply':'Apply'}
            </button>
          </div>
        </div>
      </article>`;
    }).join('');
  }
}

function renderResumeTab(user, resume) {
  const zoneEl = $('resume-zone');
  if (!zoneEl) return;
  if (resume) {
    zoneEl.classList.add('has-file');
    $('rz-content').innerHTML = `
      <div class="rz-ico">📄</div>
      <div class="rz-ttl">${esc(resume.fileName)}</div>
      <p class="rz-sub">Uploaded ${fmtDate(resume.uploadedAt)}</p>
      <div class="rz-file" style="margin-top:14px">
        <div>
          <div class="rz-fname">${esc(resume.fileName)}</div>
          <div class="rz-date">Uploaded ${fmtDate(resume.uploadedAt)}</div>
        </div>
        <div style="display:flex;gap:8px">
          <button class="btn btn-ghost btn-sm" onclick="viewMyResume()">👁 Preview</button>
          <button class="btn btn-danger btn-sm" onclick="deleteResume()">🗑 Remove</button>
        </div>
      </div>`;
  } else {
    zoneEl.classList.remove('has-file');
    $('rz-content').innerHTML = `
      <div class="rz-ico">📤</div>
      <div class="rz-ttl">Upload your Resume</div>
      <p class="rz-sub">PDF, DOC or DOCX · Max 5MB</p>
      <p class="rz-sub" style="margin-top:6px">Drag & drop or click to browse</p>`;
  }
}

function viewMyResume() {
  const user   = Auth.current();
  const resume = DB.getResume(user.id);
  if (!resume) return;
  openResumeModal(resume);
}

function openResumeModal(resume) {
  const isPdf = resume.fileName.toLowerCase().endsWith('.pdf');
  openModal(
    `<div>
       <div style="font-family:'ClashDisplay','Clash Display',sans-serif;font-weight:700;font-size:1rem">📄 ${esc(resume.fileName)}</div>
       <div style="font-size:.8rem;color:var(--tx3);margin-top:3px">Uploaded ${fmtDate(resume.uploadedAt)}</div>
     </div>`,
    isPdf
      ? `<iframe class="resume-viewer" src="${resume.fileData}" title="Resume Preview"></iframe>
         <a href="${resume.fileData}" download="${esc(resume.fileName)}" class="btn btn-primary btn-block" style="margin-top:14px">⬇ Download Resume</a>`
      : `<div class="resume-placeholder">
           <div style="font-size:3rem">📄</div>
           <div style="font-family:'ClashDisplay','Clash Display',sans-serif;font-weight:700">${esc(resume.fileName)}</div>
           <p style="color:var(--tx3);font-size:.88rem">Preview not available for this file type</p>
           <a href="${resume.fileData}" download="${esc(resume.fileName)}" class="btn btn-primary" style="margin-top:8px">⬇ Download</a>
         </div>`
  );
}

function deleteResume() {
  const user = Auth.current();
  DB.deleteResume(user.id);
  toast('Resume removed.');
  renderStudentDash('resume');
}

function renderStudentOffersTab(apps) {
  const el = $('s-offers');
  const acceptedApps = apps.filter(a => a.status === 'Accepted');
  
  if (!acceptedApps.length) {
    el.innerHTML = `<div class="empty">
      <div class="empty-ico">📭</div>
      <div class="empty-ttl">No offers yet</div>
      <p class="empty-sub">When you receive job offers, they will appear here</p>
    </div>`;
    return;
  }

  el.innerHTML = acceptedApps.map((a, i) => {
    const j = a.job;
    const user = Auth.current();
    const offerText = `Dear ${user.name},\n\nCongratulations! We are pleased to offer you the position of ${j.title} at ${j.company}.\n\nPosition Details:\n• Role: ${j.title}\n• Duration: ${j.duration}\n• Stipend: ${j.stipend}\n• Location: ${j.location}\n\nWe look forward to working with you!\n\nBest regards,\n${j.company}`;
    
    return `<div class="offer-card" style="animation-delay:${i*0.05}s;padding:20px;background:var(--bg2);border-radius:12px;border-left:4px solid ${j.color};margin-bottom:16px">
      <div style="display:flex;align-items:start;gap:16px;margin-bottom:16px">
        <div style="width:50px;height:50px;border-radius:8px;background:${j.color};display:flex;align-items:center;justify-content:center;font-family:'ClashDisplay','Clash Display',sans-serif;font-weight:700;color:#fff;font-size:1.5rem;flex-shrink:0">${j.logo}</div>
        <div style="flex:1">
          <div style="font-family:'ClashDisplay','Clash Display',sans-serif;font-weight:700;font-size:1.05rem">${esc(j.title)}</div>
          <div style="color:var(--tx3);font-size:.9rem;margin-top:4px">${esc(j.company)} · ${esc(j.location)}</div>
          <div style="display:flex;gap:16px;margin-top:12px;font-size:.88rem;color:var(--tx2)">
            <span>⏱ ${esc(j.duration)}</span>
            <span>💰 ${esc(j.stipend)}</span>
          </div>
        </div>
      </div>
      <div style="padding:12px;background:var(--bg);border-radius:8px;margin-bottom:16px;font-size:.85rem;white-space:pre-wrap;max-height:150px;overflow-y:auto;border:1px solid var(--bd)">${esc(offerText)}</div>
      <div style="display:flex;gap:10px">
        <button class="btn btn-primary" style="flex:1" onclick="confirmJobOffer('${a.id}','${esc(j.title)}','${esc(j.company)}')">✓ Confirm Offer</button>
        <button class="btn btn-ghost" style="flex:1" onclick="viewFullOffer('${a.id}')">📄 View Details</button>
      </div>
    </div>`;
  }).join('');
}

function confirmJobOffer(appId, jobTitle, companyName) {
  openModal(
    `<div><div style="font-weight:700;font-size:1.1rem;margin-bottom:4px">✓ Confirm Job Offer</div><div style="font-size:.85rem;color:var(--tx3)">${esc(jobTitle)} at ${esc(companyName)}</div></div>`,
    `<div style="margin-top:14px">
      <p style="color:var(--tx2);margin-bottom:16px">Are you sure you want to confirm this job offer? This decision can be changed later by contacting the recruiter.</p>
      <div style="padding:12px;background:#d4edda;border-radius:8px;border-left:3px solid #28a745;margin-bottom:16px">
        💼 Once confirmed, the recruiter will be notified of your acceptance.
      </div>
      <div style="display:flex;gap:10px">
        <button class="btn btn-ghost" style="flex:1" onclick="closeModal()">Cancel</button>
        <button class="btn btn-primary" style="flex:1" onclick="finalizeOfferConfirmation('${appId}')">✓ Yes, Confirm Offer</button>
      </div>
    </div>`
  );
}

function finalizeOfferConfirmation(appId) {
  DB.updateAppStatus(appId, 'Offer Confirmed');
  closeModal();
  const user = Auth.current();
  toast('✓ Offer confirmed! The recruiter has been notified.', 'ok');
  setTimeout(() => {
    renderStudentDash('offers');
  }, 500);
}

function viewFullOffer(appId) {
  const user = Auth.current();
  const apps = DB.getStudentApps(user.id);
  const app = apps.find(a => a.id === appId);
  if (!app) return;
  
  const j = app.job;
  const offerText = `Dear ${user.name},\n\nCongratulations! We are pleased to offer you the position of ${j.title} at ${j.company}.\n\nPosition Details:\n• Role: ${j.title}\n• Duration: ${j.duration}\n• Stipend: ${j.stipend}\n• Location: ${j.location}\n• Skills Required: ${j.skills.join(', ')}\n\nWe look forward to working with you!\n\nBest regards,\n${j.company}`;
  
  openModal(
    `<div><div style="font-weight:700;font-size:1.1rem;margin-bottom:4px">📄 Job Offer Letter</div><div style="font-size:.85rem;color:var(--tx3)">${esc(j.title)} at ${esc(j.company)}</div></div>`,
    `<div style="margin-top:14px">
      <div style="padding:14px;background:var(--bg2);border-radius:8px;border:1px solid var(--bd);margin-bottom:16px;font-size:.85rem;white-space:pre-wrap;max-height:300px;overflow-y:auto;font-family:monospace">${esc(offerText)}</div>
      <div style="display:flex;gap:10px">
        <button class="btn btn-ghost" style="flex:1" onclick="closeModal()">Close</button>
        <button class="btn btn-primary" style="flex:1" onclick="closeModal(); setTimeout(() => confirmJobOffer('${appId}','${esc(j.title)}','${esc(j.company)}'), 200)">✓ Confirm This Offer</button>
      </div>
    </div>`
  );
}

/* Resume upload handling */
function handleResumeFile(file) {
  if (!file) return;
  const maxMB = 5;
  if (file.size > maxMB*1024*1024) { toast(`File too large. Max ${maxMB}MB.`,'err'); return; }
  const allowed = ['application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  if (!allowed.includes(file.type) && !file.name.match(/\.(pdf|doc|docx)$/i)) {
    toast('Only PDF, DOC or DOCX allowed.','err'); return;
  }
  const reader = new FileReader();
  reader.onload = e => {
    const user = Auth.current();
    DB.saveResume(user.id, file.name, e.target.result);
    toast('Resume uploaded! ✓');
    renderStudentDash('resume');
  };
  reader.readAsDataURL(file);
}

/* ═══════════════════════════════════════════════════════════════
   RECRUITER DASHBOARD
═══════════════════════════════════════════════════════════════ */
let _recruiterTab = 'jobs';
let _jobSkills    = [];

function renderRecruiterDash(tab='jobs') {
  _recruiterTab = tab;
  Router.curTab  = tab;
  const user = Auth.current();
  $('r-dash-name').textContent    = user.name.split(' ')[0];
  $('r-dash-company').textContent = user.company || 'Your Company';

  const myJobs = DB.getJobsByRecruiter(user.id);
  const allApps= DB.getAppsForRecruiter(user.id);

  $('r-stat-jobs').textContent      = myJobs.length;
  $('r-stat-apps').textContent      = allApps.length;
  $('r-stat-active').textContent    = myJobs.filter(j=>j.active).length;
  $('r-stat-selected').textContent  = Object.values(_selectedCandidates).filter(arr => arr && arr.length > 0).length;
  $('r-stat-reviewed').textContent  = allApps.filter(a=>a.status!=='Applied').length;

  document.querySelectorAll('.r-tab').forEach(t=>{
    t.classList.toggle('on', t.dataset.tab===tab);
  });
  document.querySelectorAll('.r-tab-panel').forEach(p=>{
    p.style.display = p.dataset.tab===tab?'block':'none';
  });

  if (tab==='jobs')       renderRecruiterJobsTab(user, myJobs);
  if (tab==='applicants') renderApplicantsTab(allApps);
  if (tab==='offers')     renderOffersTab(user, myJobs);
  if (tab==='interviews') renderRecruiterInterviewsTab(user, myJobs);
}

function renderRecruiterJobsTab(user, myJobs) {
  const listEl = $('r-job-list');
  if (!myJobs.length) {
    listEl.innerHTML=`<div class="empty">
      <div class="empty-ico">📋</div>
      <div class="empty-ttl">No jobs posted yet</div>
      <p class="empty-sub">Click "Post New Job" to get started</p>
    </div>`; return;
  }
  listEl.innerHTML = myJobs.map((j,i)=>{
    const appCount = DB.getAppsForJob(j.id).length;
    return `<div class="rec-job-row" style="animation-delay:${i*.05}s">
      <div class="jcard-logo" style="background:${j.color};width:40px;height:40px;border-radius:9px">${j.logo}</div>
      <div class="rjob-info">
        <div class="rjob-ttl">${esc(j.title)}</div>
        <div class="rjob-meta">${esc(j.company)} · ${esc(j.location)} · ${esc(j.stipend)} · ${appCount} applicant${appCount!==1?'s':''} · ${j.active?'<span style="color:var(--green)">Active</span>':'<span style="color:var(--red)">Paused</span>'}</div>
      </div>
      <div class="rjob-acts">
        <button class="btn btn-ghost btn-sm" onclick="openJobDetail('${j.id}')">View</button>
        <button class="btn btn-sm" style="background:var(--rcbg2);color:var(--rc);border:none" onclick="openEditJobModal('${j.id}')">Edit</button>
        <button class="btn btn-danger btn-sm" onclick="toggleJobActive('${j.id}',${j.active})">${j.active?'Pause':'Activate'}</button>
        <button class="btn btn-danger btn-sm" onclick="confirmDeleteJob('${j.id}')">Delete</button>
      </div>
    </div>`;
  }).join('');
}

function renderApplicantsTab(apps) {
  const el = $('r-applicants');
  if (!apps.length) {
    el.innerHTML=`<div class="empty">
      <div class="empty-ico">👥</div>
      <div class="empty-ttl">No applicants yet</div>
      <p class="empty-sub">Once students apply to your jobs, they'll appear here</p>
    </div>`; return;
  }

  // Group by job
  const byJob = {};
  apps.forEach(a => {
    if (!byJob[a.jobId]) byJob[a.jobId] = { job:a.job, apps:[] };
    byJob[a.jobId].apps.push(a);
  });

  el.innerHTML = Object.values(byJob).map(group=>`
    <div style="margin-bottom:32px">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px">
        <div style="width:34px;height:34px;border-radius:8px;background:${group.job?.color||'#444'};display:flex;align-items:center;justify-content:center;font-family:'ClashDisplay','Clash Display',sans-serif;font-weight:700;color:#fff;font-size:.95rem">${group.job?.logo||'?'}</div>
        <div>
          <div style="font-family:'ClashDisplay','Clash Display',sans-serif;font-weight:700;font-size:.95rem">${esc(group.job?.title||'Unknown Job')}</div>
          <div style="font-size:.78rem;color:var(--tx3)">${group.apps.length} applicant${group.apps.length!==1?'s':''} · ${group.job?.numberOfPositions||1} position${(group.job?.numberOfPositions||1)!==1?'s':''}</div>
        </div>

      </div>
      ${group.apps.map((a,i)=>renderApplicantCard(a,i)).join('')}
    </div>`).join('');
}

function renderApplicantCard(a, i) {
  const s = a.student;
  const name  = s?.name || 'Unknown Student';
  const email = s?.email|| 'N/A';
  const resume= a.resume;
  const spClass={Applied:'sp-applied',Reviewing:'sp-reviewing',Accepted:'sp-accepted',Rejected:'sp-rejected','Offer Confirmed':'sp-accepted'}[a.status]||'sp-applied';

  return `<div class="applicant-card" style="animation-delay:${i*.06}s">
    <div class="ac-top">
      <div style="display:flex;align-items:flex-start;gap:12px">
        <div class="ac-av">${name[0].toUpperCase()}</div>
        <div>
          <div class="ac-name">${esc(name)}</div>
          <div class="ac-email">✉️ ${esc(email)}</div>
        </div>
      </div>
      <span class="status-pill ${spClass}">${esc(a.status)}</span>
    </div>
    ${a.coverNote?`<div class="ac-note">💬 "${esc(a.coverNote)}"</div>`:''}
    <div class="ac-foot">
      <span class="ac-date">Applied ${fmtDate(a.appliedAt)}</span>
      <div class="ac-acts">
        ${resume
          ? `<button class="resume-view-btn" onclick="viewApplicantResume('${s?.id}')">📄 View Resume</button>`
          : `<span style="font-size:.78rem;color:var(--tx3)">No resume uploaded</span>`
        }
        <select class="status-select" onchange="updateAppStatus('${a.id}',this.value)">
          ${['Applied','Reviewing','Accepted','Rejected','Offer Confirmed'].map(st=>`<option ${a.status===st?'selected':''} value="${st}">${st}</option>`).join('')}
        </select>
        ${a.status==='Accepted'?`<button class="btn btn-sm" style="background:#4CAF50;color:#fff;border:none;padding:6px 12px" onclick="selectCandidateForOffer('${a.id}','${s?.id}','${esc(name)}','${esc(email)}','${a.jobId}')">✓ Select</button>`:''}
      </div>
    </div>
  </div>`;
}

function viewApplicantResume(studentId) {
  const resume = DB.getResume(studentId);
  const student= DB.findUserById(studentId);
  if (!resume) { toast('No resume found.','err'); return; }
  openModal(
    `<div>
       <div style="font-family:'ClashDisplay','Clash Display',sans-serif;font-weight:700;font-size:1rem">📄 ${esc(resume.fileName)}</div>
       <div style="font-size:.8rem;color:var(--tx3);margin-top:3px">Resume of ${esc(student?.name||'Student')}</div>
     </div>`,
    resume.fileName.toLowerCase().endsWith('.pdf')
      ? `<iframe class="resume-viewer" src="${resume.fileData}" title="Resume"></iframe>
         <a href="${resume.fileData}" download="${esc(resume.fileName)}" class="btn btn-recruiter btn-block" style="margin-top:14px">⬇ Download Resume</a>`
      : `<div class="resume-placeholder">
           <div style="font-size:3rem">📄</div>
           <div style="font-family:'ClashDisplay','Clash Display',sans-serif;font-weight:700">${esc(resume.fileName)}</div>
           <p style="color:var(--tx3);font-size:.88rem">Preview not available for this file type</p>
           <a href="${resume.fileData}" download="${esc(resume.fileName)}" class="btn btn-recruiter" style="margin-top:8px">⬇ Download</a>
         </div>`
  );
}

function updateAppStatus(appId, status) {
  DB.updateAppStatus(appId, status);
  
  // Auto-add to selected candidates when accepted
  if (status === 'Accepted') {
    const user = Auth.current();
    const allApps = DB.getAppsForRecruiter(user.id);
    const app = allApps.find(a => a.id === appId);
    if (app && app.student) {
      selectCandidateForOffer(appId, app.student.id, app.student.name, app.student.email, app.jobId);
    }
  }
  
  toast(`Status updated to "${status}"`, 'inf');
  renderRecruiterDash('applicants');
}

function toggleJobActive(id, isActive) {
  DB.updateJob(id, { active:!isActive });
  toast(isActive?'Job paused.':'Job activated!');
  renderRecruiterDash('jobs');
}

function confirmDeleteJob(id) {
  openModal(
    '<div style="font-family:\'ClashDisplay\',\'Clash Display\',sans-serif;font-weight:700;font-size:1.05rem;color:var(--red)">⚠️ Delete Job?</div>',
    `<p style="color:var(--tx2);font-size:.9rem;margin-bottom:20px">This will permanently remove the job listing and all its applications. This cannot be undone.</p>
     <div style="display:flex;gap:10px">
       <button class="btn btn-ghost btn-lg" style="flex:1" onclick="closeModal()">Cancel</button>
       <button class="btn btn-danger btn-lg" style="flex:1" onclick="doDeleteJob('${id}')">Yes, Delete</button>
     </div>`
  );
}
function doDeleteJob(id) {
  DB.deleteJob(id);
  closeModal();
  toast('Job deleted.');
  renderRecruiterDash('jobs');
}

/* Post / Edit Job Modal */
function openPostJobModal() {
  _jobSkills = [];
  const user = Auth.current();
  openModal(
    '<div style="font-family:\'ClashDisplay\',\'Clash Display\',sans-serif;font-weight:700;font-size:1.1rem">📋 Post a New Job</div>',
    buildJobFormHTML(null, user),
    ()=>{ _jobSkills=[]; }
  );
}

function openEditJobModal(id) {
  const j = DB.getJobById(id);
  _jobSkills = [...j.skills];
  const user = Auth.current();
  openModal(
    '<div style="font-family:\'ClashDisplay\',\'Clash Display\',sans-serif;font-weight:700;font-size:1.1rem">✏️ Edit Job</div>',
    buildJobFormHTML(j, user),
    ()=>{ _jobSkills=[]; }
  );
  updateSkillsPreview();
}

function buildJobFormHTML(j, user) {
  const isEdit = !!j;
  const COLORS = ['#111111','#F5A623','#2D9CDB','#FC8019','#1A1A2E','#6C5CE7','#E84393','#009845','#F7C948','#00B4D8'];
  const colorOpts = COLORS.map(c=>`<option value="${c}" ${j?.color===c?'selected':''}>${c}</option>`).join('');
  return `<div class="job-form">
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
      <div class="form-group">
        <label class="form-label">Job Title *</label>
        <input class="form-input" id="jf-title" value="${esc(j?.title||'')}" placeholder="e.g. Frontend Developer Intern"/>
      </div>
      <div class="form-group">
        <label class="form-label">Company *</label>
        <input class="form-input" id="jf-company" value="${esc(j?.company||user.company||'')}" placeholder="Your company name"/>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
      <div class="form-group">
        <label class="form-label">Location *</label>
        <select class="form-select" id="jf-loc">
          ${['Remote','Bengaluru','Mumbai','Hyderabad','Pune','Delhi','Chennai','Kolkata'].map(l=>`<option ${j?.location===l?'selected':''}>${l}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Stipend *</label>
        <input class="form-input" id="jf-stipend" value="${esc(j?.stipend||'')}" placeholder="e.g. ₹20,000/mo"/>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
      <div class="form-group">
        <label class="form-label">Duration *</label>
        <select class="form-select" id="jf-dur">
          ${['1 month','2 months','3 months','4 months','6 months','12 months'].map(d=>`<option ${j?.duration===d?'selected':''}>${d}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Paid or Unpaid *</label>
        <select class="form-select" id="jf-paid">
          <option value="paid" ${j?.paid?'selected':''}>Paid</option>
          <option value="unpaid" ${!j?.paid?'selected':''}>Unpaid</option>
        </select>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
      <div class="form-group">
        <label class="form-label">Number of Opportunities *</label>
        <input class="form-input" id="jf-opps" type="number" min="1" value="${j?.numberOfPositions||1}" placeholder="e.g. 3"/>
      </div>
      <div class="form-group" style="opacity:0;pointer-events:none"></div>
    </div>
    <div style="display:grid;grid-template-columns:1fr;gap:12px">
      <div class="form-group">
        <label class="form-label">Application Deadline *</label>
        <input class="form-input" id="jf-deadline" type="date" value="${j?.deadline||''}" min="${new Date().toISOString().split('T')[0]}"/>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 2rem;gap:12px;align-items:end">
      <div class="form-group" style="margin-bottom:0">
        <label class="form-label">Company Logo Letter & Color</label>
        <input class="form-input" id="jf-logo" value="${esc(j?.logo||'')}" placeholder="Single letter e.g. V" maxlength="2"/>
      </div>
      <div class="form-group" style="margin-bottom:0">
        <label class="form-label" style="opacity:0">Color</label>
        <input type="color" id="jf-color" value="${j?.color||'#111111'}" style="width:100%;height:44px;border-radius:8px;border:1px solid var(--bd);cursor:pointer;background:none;padding:2px"/>
      </div>
    </div>
    <div class="form-group" style="margin-top:12px">
      <label class="form-label">Skills Required</label>
      <div class="skills-input-wrap">
        <input class="form-input" id="jf-skill-inp" placeholder="e.g. Python" onkeydown="if(event.key==='Enter'){event.preventDefault();addSkill()}"/>
        <button class="skill-add-btn" onclick="addSkill()">+ Add</button>
      </div>
      <div class="skills-preview" id="skills-preview"></div>
    </div>
    <div class="form-group">
      <label class="form-label">Job Description *</label>
      <textarea class="form-textarea" id="jf-desc" rows="4" placeholder="Describe the role, responsibilities, and what students will learn…">${esc(j?.description||'')}</textarea>
    </div>
    <div id="jf-err" class="alert alert-error" style="display:none;margin-bottom:12px"></div>
    <div style="display:flex;gap:10px">
      <button class="btn btn-ghost btn-lg" style="flex:1" onclick="closeModal()">Cancel</button>
      <button class="btn btn-recruiter btn-lg" style="flex:1" onclick="${isEdit?`saveEditJob('${j.id}')`:'saveNewJob()'}">
        ${isEdit?'Save Changes':'Post Job →'}
      </button>
    </div>
  </div>`;
}

function addSkill() {
  const inp = $('jf-skill-inp');
  const val = inp.value.trim();
  if (!val) return;
  if (!_jobSkills.includes(val)) { _jobSkills.push(val); updateSkillsPreview(); }
  inp.value='';
  inp.focus();
}
function removeSkill(s) {
  _jobSkills = _jobSkills.filter(x=>x!==s);
  updateSkillsPreview();
}
function updateSkillsPreview() {
  const el = $('skills-preview');
  if (!el) return;
  el.innerHTML = _jobSkills.map(s=>`<button class="skill-rm" onclick="removeSkill('${esc(s)}')">${esc(s)} ✕</button>`).join('');
}

function collectJobForm() {
  const errs=[];
  const title   = $('jf-title')?.value.trim();
  const company = $('jf-company')?.value.trim();
  const loc     = $('jf-loc')?.value;
  const stipend = $('jf-stipend')?.value.trim();
  const dur     = $('jf-dur')?.value;
  const paid    = $('jf-paid')?.value === 'paid';
  const opps    = parseInt($('jf-opps')?.value||1, 10);
  const deadline= $('jf-deadline')?.value;
  const logo    = $('jf-logo')?.value.trim().toUpperCase().slice(0,1)||'J';
  const color   = $('jf-color')?.value||'#111';
  const desc    = $('jf-desc')?.value.trim();
  if (!title)   errs.push('Job title is required.');
  if (!company) errs.push('Company is required.');
  if (!stipend) errs.push('Stipend is required.');
  if (!deadline)errs.push('Deadline is required.');
  if (!desc)    errs.push('Description is required.');
  if (!_jobSkills.length) errs.push('Add at least one skill.');
  if (opps < 1)  errs.push('Number of opportunities must be at least 1.');
  if (errs.length) { const el=$('jf-err'); el.innerHTML=errs.join(' '); el.style.display='flex'; return null; }
  return { title,company,location:loc,stipend,duration:dur,paid,numberOfPositions:opps,deadline,logo,color,description:desc,skills:[..._jobSkills] };
}

function saveNewJob() {
  const data = collectJobForm(); if (!data) return;
  const user = Auth.current();
  DB.createJob({ ...data, recruiterId:user.id });
  closeModal();
  toast('Job posted successfully! 🎉');
  renderRecruiterDash('jobs');
}

function saveEditJob(id) {
  const data = collectJobForm(); if (!data) return;
  DB.updateJob(id, data);
  closeModal();
  toast('Job updated!');
  renderRecruiterDash('jobs');
}


// Store selected candidates for offer letters
let _selectedCandidates = JSON.parse(localStorage.getItem('internhub_selected_candidates')) || {};

function selectCandidateForOffer(appId, studentId, name, email, jobId) {
  if (!_selectedCandidates[jobId]) _selectedCandidates[jobId] = [];
  if (!_selectedCandidates[jobId].find(a => a.id === appId)) {
    _selectedCandidates[jobId].push({ id: appId, studentId, name, email, jobId });
    localStorage.setItem('internhub_selected_candidates', JSON.stringify(_selectedCandidates));
    toast(`✓ ${name} added to selected candidates`, 'ok');
  }
}

function renderOffersTab(user, myJobs) {
  const el = $('r-offers');
  if (!myJobs.length) {
    el.innerHTML = `<div class="empty"><div class="empty-ico">📧</div><div class="empty-ttl">No jobs to send offers for</div></div>`;
    return;
  }

  const jobsWithCandidates = myJobs.filter(j => _selectedCandidates[j.id] && _selectedCandidates[j.id].length > 0);

  if (!jobsWithCandidates.length) {
    el.innerHTML = `<div class="empty"><div class="empty-ico">📋</div><div class="empty-ttl">No selected candidates yet</div><p class="empty-sub">Accept applicants and select them from the Applicants tab to send offers</p></div>`;
    return;
  }

  el.innerHTML = jobsWithCandidates.map(job => {
    const candidates = _selectedCandidates[job.id] || [];
    return `<div style="margin-bottom:28px">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px">
        <div style="width:40px;height:40px;border-radius:8px;background:${job.color};display:flex;align-items:center;justify-content:center;font-family:'ClashDisplay','Clash Display',sans-serif;font-weight:700;color:#fff;font-size:1rem">${job.logo}</div>
        <div>
          <div style="font-family:'ClashDisplay','Clash Display',sans-serif;font-weight:700;font-size:.95rem">${esc(job.title)}</div>
          <div style="font-size:.78rem;color:var(--tx3)">${candidates.length} candidate${candidates.length!==1?'s':''} selected</div>
        </div>
      </div>
      ${candidates.map((cand, i) => `
        <div style="padding:12px;background:var(--bg2);border-radius:8px;margin-bottom:10px;display:flex;justify-content:space-between;align-items:center">
          <div>
            <div style="font-weight:600;margin-bottom:4px">${esc(cand.name)}</div>
            <div style="font-size:.85rem;color:var(--tx3)">📧 ${esc(cand.email)}</div>
          </div>
          <div style="display:flex;gap:8px">
            <button class="btn btn-sm" style="background:#4CAF50;color:#fff;border:none" onclick="sendOfferLetter('${cand.id}','${esc(cand.name)}','${esc(cand.email)}','${job.id}')">Send Offer</button>
            <button class="btn btn-sm" style="background:#f44336;color:#fff;border:none" onclick="removeCandidateFromOffer('${job.id}','${cand.id}')">Remove</button>
          </div>
        </div>
      `).join('')}
    </div>`;
  }).join('');
}

function removeCandidateFromOffer(jobId, candId) {
  if (_selectedCandidates[jobId]) {
    _selectedCandidates[jobId] = _selectedCandidates[jobId].filter(c => c.id !== candId);
    localStorage.setItem('internhub_selected_candidates', JSON.stringify(_selectedCandidates));
    const user = Auth.current();
    const myJobs = DB.getJobsByRecruiter(user.id);
    renderOffersTab(user, myJobs);
    toast('✓ Candidate removed from selection', 'ok');
  }
}

function sendOfferLetter(appId, candName, candEmail, jobId) {
  const job = DB.getJobById(jobId);
  const user = Auth.current();
  const offerText = `Dear ${candName},\n\nCongratulations! We are pleased to offer you the position of ${job.title} at ${user.company}.\n\nPosition Details:\n• Role: ${job.title}\n• Duration: ${job.duration}\n• Stipend: ${job.stipend}\n• Location: ${job.location}\n\nPlease confirm your acceptance by replying to this email.\n\nBest regards,\n${user.name}\n${user.company}`;

  openModal(
    `<div><div style="font-weight:700;font-size:1.1rem;margin-bottom:4px">📧 Send Offer Letter</div><div style="font-size:.85rem;color:var(--tx3)">To: ${esc(candEmail)}</div></div>`,
    `<div style="margin-top:14px">
      <div style="font-size:.9rem;font-weight:600;margin-bottom:8px">Offer Letter:</div>
      <textarea id="offer-text" style="width:100%;height:200px;padding:10px;border:1px solid var(--bd);border-radius:8px;font-family:monospace;font-size:.85rem;resize:vertical">${esc(offerText)}</textarea>
      <div style="margin-top:12px;font-size:.78rem;color:var(--tx3)">💡 Tip: Customize the offer letter before sending</div>
      <div style="display:flex;gap:10px;margin-top:16px">
        <button class="btn btn-ghost" style="flex:1" onclick="closeModal()">Cancel</button>
        <button class="btn btn-recruiter" style="flex:1" onclick="confirmSendOffer('${appId}','${esc(candEmail)}','${jobId}')">✓ Send Offer</button>
      </div>
    </div>`
  );
}

function confirmSendOffer(appId, candEmail, jobId) {
  const offerText = $('offer-text')?.value || '';
  if (!offerText.trim()) { toast('Offer letter cannot be empty', 'err'); return; }
  
  try {
    toast(`✓ Offer letter sent to ${candEmail}!`, 'ok');
    closeModal();
    setTimeout(() => {
      renderRecruiterDash('offers');
    }, 500);
  } catch(e) {
    toast('Error sending offer: ' + e.message, 'err');
  }
}

/* ── INTERVIEWS & TECHNICAL ROUNDS ────────────────────────── */

let _interviewCandidates = []; // Store candidates for scheduling

function renderRecruiterInterviewsTab(user, myJobs) {
  const el = $('r-interviews');
  const allInterviews = DB.getInterviewsForRecruiter(user.id);
  
  if (!allInterviews.length) {
    el.innerHTML = `<div class="empty">
      <div class="empty-ico">🎬</div>
      <div class="empty-ttl">No interviews scheduled yet</div>
      <p class="empty-sub">Schedule technical rounds and interviews for your selected candidates</p>
      <button class="btn btn-recruiter" onclick="openScheduleInterviewModal()">+ Schedule Interview</button>
    </div>`;
    return;
  }

  el.innerHTML = `<div style="margin-bottom:16px;">
    <button class="btn btn-recruiter" onclick="openScheduleInterviewModal()">+ Schedule New Interview</button>
  </div>` + allInterviews.map((i, idx) => {
    const statusColor = { 'Scheduled': '#FFA500', 'Completed': '#4CAF50', 'No Show': '#f44336' };
    return `<div style="padding:16px;background:var(--bg2);border-radius:8px;margin-bottom:12px;border-left:4px solid ${statusColor[i.status] || '#2196F3'}">
      <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:12px">
        <div>
          <div style="font-weight:700;font-size:.95rem">${esc(i.type)}</div>
          <div style="color:var(--tx3);font-size:.85rem;margin-top:4px">Candidate: ${esc(i.candidateName)} (${esc(i.candidateEmail)})</div>
        </div>
        <span style="padding:4px 12px;background:${statusColor[i.status] || '#2196F3'};color:#fff;border-radius:6px;font-size:.75rem;font-weight:600">${i.status}</span>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:12px;margin-bottom:12px;font-size:.85rem;color:var(--tx2)">
        <div>📅 ${esc(i.date)}</div>
        <div>🕐 ${esc(i.time)}</div>
        <div>🏢 ${i.job ? esc(i.job.title) : 'N/A'}</div>
      </div>
      ${i.link ? `<div style="margin-bottom:12px"><a href="${esc(i.link)}" target="_blank" style="color:var(--ac);text-decoration:none;font-size:.85rem">🔗 ${esc(i.link)}</a></div>` : ''}
      <div style="display:flex;gap:8px;font-size:.85rem">
        <select class="form-select" style="padding:6px 10px;font-size:.85rem" onchange="updateInterviewStatus('${i.id}',this.value)">
          <option value="Scheduled" ${i.status==='Scheduled'?'selected':''}>Scheduled</option>
          <option value="Completed" ${i.status==='Completed'?'selected':''}>Completed</option>
          <option value="No Show" ${i.status==='No Show'?'selected':''}>No Show</option>
        </select>
        <button class="btn btn-ghost btn-sm" onclick="deleteInterviewRecord('${i.id}')">🗑 Delete</button>
      </div>
    </div>`;
  }).join('');
}

function renderStudentInterviewsTab(user) {
  const el = $('s-interviews');
  // Force fresh read from localStorage
  const interviews = DB.getInterviewsForCandidate(user.id);
  
  console.log('Student ID:', user.id);
  console.log('All interviews:', DB.getInterviews());
  console.log('Interviews for this student:', interviews);
  
  if (!interviews.length) {
    el.innerHTML = `<div class="empty">
      <div class="empty-ico">📭</div>
      <div class="empty-ttl">No interviews scheduled</div>
      <p class="empty-sub">You will see your interviews here once a recruiter schedules them</p>
      <button class="btn btn-primary btn-sm" style="margin-top:10px" onclick="renderStudentDash('interviews')">🔄 Refresh</button>
    </div>`;
    return;
  }

  el.innerHTML = interviews.map((i, idx) => {
    const statusColor = { 'Scheduled': '#FFA500', 'Completed': '#4CAF50', 'No Show': '#f44336', 'Attended': '#4CAF50' };
    return `<div style="padding:16px;background:var(--bg2);border-radius:8px;margin-bottom:12px;border-left:4px solid ${statusColor[i.status] || '#2196F3'};animation-delay:${idx*0.05}s">
      <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:12px">
        <div>
          <div style="font-weight:700;font-size:.95rem">${esc(i.type)}</div>
          <div style="color:var(--tx3);font-size:.85rem;margin-top:4px">Company: ${i.recruiter ? esc(i.recruiter.company) : 'N/A'} · Position: ${i.job ? esc(i.job.title) : 'N/A'}</div>
        </div>
        <span style="padding:4px 12px;background:${statusColor[i.status] || '#2196F3'};color:#fff;border-radius:6px;font-size:.75rem;font-weight:600">${i.status}</span>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:12px;margin-bottom:12px;font-size:.85rem;color:var(--tx2)">
        <div>📅 ${esc(i.date)}</div>
        <div>🕐 ${esc(i.time)}</div>
        <div>👤 ${i.recruiter ? esc(i.recruiter.name) : 'Recruiter'}</div>
      </div>
      ${i.link ? `<div style="margin-bottom:12px;padding:10px;background:var(--ac);border-radius:6px">
        <a href="${esc(i.link)}" target="_blank" style="color:#fff;text-decoration:none;font-size:.85rem;display:flex;align-items:center;gap:8px">🔗 Join Interview Link</a>
      </div>` : ''}
      ${i.status === 'Scheduled' ? `<button class="btn btn-primary" style="width:100%;margin-top:10px" onclick="markInterviewAttendance('${i.id}','Attended')">✓ Mark as Attended</button>` : ''}
    </div>`;
  }).join('');
}

function openScheduleInterviewModal() {
  const user = Auth.current();
  const selected = _selectedCandidates;
  _interviewCandidates = [];
  
  console.log('Selected Candidates:', selected);
  
  // Collect all selected candidates
  Object.keys(selected).forEach(jobId => {
    const job = DB.getJobById(jobId);
    (selected[jobId] || []).forEach(cand => {
      console.log('Adding candidate:', cand);
      _interviewCandidates.push({ ...cand, jobTitle: job?.title || 'Unknown' });
    });
  });
  
  console.log('Interview Candidates Pool:', _interviewCandidates);

  if (!_interviewCandidates.length) {
    toast('No selected candidates. Please select candidates for interviews first.', 'info');
    return;
  }

  openModal(
    '<div style="font-weight:700;font-size:1.1rem">📋 Schedule Interview</div>',
    `<div style="margin-top:14px">
      <div class="form-group">
        <label class="form-label">Interview Type</label>
        <select id="int-type" class="form-select" style="width:100%">
          <option value="">Select type...</option>
          <option value="Technical Round 1">Technical Round 1</option>
          <option value="Technical Round 2">Technical Round 2</option>
          <option value="HR Interview">HR Interview</option>
          <option value="Final Interview">Final Interview</option>
          <option value="Coding Assessment">Coding Assessment</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Candidate</label>
        <select id="int-candidate" class="form-select" style="width:100%">
          <option value="">Select candidate...</option>
          ${_interviewCandidates.map((c, i) => `<option value="${i}">${esc(c.name)} - ${esc(c.jobTitle)}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Date</label>
        <input type="date" id="int-date" class="form-input" min="${new Date().toISOString().split('T')[0]}"/>
      </div>
      <div class="form-group">
        <label class="form-label">Time</label>
        <input type="time" id="int-time" class="form-input"/>
      </div>
      <div class="form-group">
        <label class="form-label">Interview Link (Optional)</label>
        <input type="url" id="int-link" class="form-input" placeholder="https://meet.google.com/..."/>
      </div>
      <div style="display:flex;gap:10px;margin-top:16px">
        <button class="btn btn-ghost" style="flex:1" onclick="closeModal()">Cancel</button>
        <button class="btn btn-recruiter" style="flex:1" onclick="finalizeScheduleInterview()">✓ Schedule</button>
      </div>
    </div>`
  );
}

function finalizeScheduleInterview() {
  const user = Auth.current();
  const type = $('int-type').value.trim();
  const candIdx = parseInt($('int-candidate').value);
  const date = $('int-date').value.trim();
  const time = $('int-time').value.trim();
  const link = $('int-link').value.trim();

  if (!type || isNaN(candIdx) || !date || !time) {
    toast('Please fill all required fields', 'err');
    return;
  }

  const candidate = _interviewCandidates[candIdx];
  if (!candidate) {
    toast('Invalid candidate selected', 'err');
    return;
  }

  console.log('Creating interview with:');
  console.log('  Recruiter ID:', user.id);
  console.log('  Student ID:', candidate.studentId);
  console.log('  Job ID:', candidate.jobId);
  console.log('  Candidate Name:', candidate.name);
  console.log('  Candidate Email:', candidate.email);
  console.log('  Type:', type);
  console.log('  Date:', date);
  console.log('  Time:', time);
  console.log('  Link:', link);
  
  // Create interview - this saves to localStorage
  // Use candidate.studentId as the student ID for the interview
  const interview = DB.createInterview(user.id, candidate.studentId, candidate.jobId, candidate.name, candidate.email, type, date, time, link);
  
  console.log('Interview created:', interview);
  console.log('All interviews after creation:', DB.getInterviews());
  
  closeModal();
  toast(`✓ Interview scheduled for ${candidate.name}`, 'ok');
  
  // Update both dashboards
  renderRecruiterDash('interviews');
}

function updateInterviewStatus(interviewId, status) {
  DB.updateInterviewStatus(interviewId, status);
  const user = Auth.current();
  renderRecruiterDash('interviews');
  toast(`Interview status updated to "${status}"`, 'ok');
}

function deleteInterviewRecord(interviewId) {
  if (!confirm('Are you sure you want to delete this interview?')) return;
  DB.deleteInterview(interviewId);
  const user = Auth.current();
  renderRecruiterDash('interviews');
  toast('Interview deleted.', 'ok');
}

function markInterviewAttendance(interviewId, status) {
  DB.updateInterviewStatus(interviewId, status);
  const user = Auth.current();
  renderStudentDash('interviews');
  toast('✓ Interview marked as attended', 'ok');
}


/* ── Alert helpers ──────────────────────────────────────────── */
function showAlert(id, type, msg) {
  const el = $(id); if (!el) return;
  el.className = `alert alert-${type}`;
  el.innerHTML = msg; el.style.display='flex';
}
function clearAlerts(...ids) {
  ids.forEach(id=>{ const el=$(id); if(el){ el.style.display='none'; el.innerHTML=''; } });
}

/* ── Boot ────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', ()=>{
  // Modal backdrop click
  $('modal-bg').addEventListener('click', e=>{ if(e.target===$('modal-bg')) closeModal(); });
  document.addEventListener('keydown', e=>{ if(e.key==='Escape') closeModal(); });

  // Mobile drawer backdrop
  $('mob-drawer').addEventListener('click', e=>{ if(e.target===$('mob-drawer')) closeMob(); });

  // Search events
  $('s-q')?.addEventListener('input', doSearch);
  $('s-loc')?.addEventListener('change', doSearch);
  $('s-skill')?.addEventListener('change', doSearch);

  // Enter on auth forms
  $('l-pw')?.addEventListener('keydown', e=>{ if(e.key==='Enter') doLogin(); });
  $('r-confirm')?.addEventListener('keydown', e=>{ if(e.key==='Enter') doRegister(); });

  // Resume file input
  const fileInput = $('resume-file-input');
  if (fileInput) {
    fileInput.addEventListener('change', e=>{ handleResumeFile(e.target.files[0]); e.target.value=''; });
  }

  // Resume drag-drop
  const zone = $('resume-zone');
  if (zone) {
    zone.addEventListener('dragover', e=>{ e.preventDefault(); zone.classList.add('drag'); });
    zone.addEventListener('dragleave', ()=>zone.classList.remove('drag'));
    zone.addEventListener('drop', e=>{ e.preventDefault(); zone.classList.remove('drag'); handleResumeFile(e.dataTransfer.files[0]); });
    zone.addEventListener('click', ()=>{ if (!DB.getResume(Auth.current()?.id)) $('resume-file-input').click(); });
  }

  // Eye toggle on passwords
  document.querySelectorAll('.eye-btn').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const inp = $(btn.dataset.target);
      if (!inp) return;
      inp.type = inp.type==='password'?'text':'password';
      btn.textContent = inp.type==='password'?'👁':'🙈';
    });
  });

  initTheme();
  Router.go('landing');
});
