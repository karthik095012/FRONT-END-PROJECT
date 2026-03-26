#!/usr/bin/env python3

with open('app.js', 'r') as f:
    content = f.read()

# Find the insertprovisions point - before "Alert helpers"
insertion_point = content.find('/* ── Alert helpers')

# The new offer letter functions
new_functions = '''
// Store selected candidates for offer letters
let _selectedCandidates = JSON.parse(localStorage.getItem('internhub_selected_candidates')) || {};

function selectCandidateForOffer(appId, name, email, jobId) {
  if (!_selectedCandidates[jobId]) _selectedCandidates[jobId] = [];
  if (!_selectedCandidates[jobId].find(a => a.id === appId)) {
    _selectedCandidates[jobId].push({ id: appId, name, email, jobId });
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
  const offerText = `Dear ${candName},\\n\\nCongratulations! We are pleased to offer you the position of ${job.title} at ${user.company}.\\n\\nPosition Details:\\n• Role: ${job.title}\\n• Duration: ${job.duration}\\n• Stipend: ${job.stipend}\\n• Location: ${job.location}\\n\\nPlease confirm your acceptance by replying to this email.\\n\\nBest regards,\\n${user.name}\\n${user.company}`;

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

'''

# Insert before Alert helpers
new_content = content[:insertion_point] + new_functions + '\n' + content[insertion_point:]

# Also need to remove the old AI functions
new_content = new_content.replace("""
// Store AI recommendations temporarily for apply button
let _aiRecommendations = null;

async function openApplicantsAI(jobId) {
  const job = DB.getJobById(jobId);
  const allApps = DB.getAllApplications();
  const jobApps = allApps.filter(a => a.jobId === jobId);
  if (!jobApps.length) { toast('No applicants for this job', 'info'); return; }
  const btn = event?.target;
  if (btn) { btn.disabled = true; btn.textContent = '⏳ Analyzing...'; }
  try {
    const appData = jobApps.map(a => ({ id: a.id, studentName: a.student?.name || 'Unknown', studentEmail: a.student?.email || 'N/A', status: a.status, coverNote: a.coverNote || '', resume: a.resume ? 'Yes' : 'No' }));
    const data = await OllamaService.analyzeApplicants(job, appData);
    if (data && data.recommendations) {
      const recs = data.recommendations;
      _aiRecommendations = recs;
      const acceptRecs = recs.filter(r => r.decision === 'Accepted');
      const rejectRecs = recs.filter(r => r.decision === 'Rejected');
      const recHtml = recs.map((rec, i) => {
        const isAccepted = rec.decision === 'Accepted';
        return `<div style="padding:12px;background:var(--bg2);border-radius:8px;border-left:4px solid ${isAccepted ? '#4CAF50' : '#f44336'};margin-bottom:10px"><div style="font-weight:700;margin-bottom:4px;display:flex;gap:8px;align-items:center">${isAccepted ? '✅' : '❌'} ${esc(rec.name)}</div><div style="font-size:.85rem;color:var(--tx3);margin-bottom:6px">Score: <strong style="color:#4CAF50">${rec.score}%</strong></div><div style="font-size:.82rem;color:var(--tx2);margin-bottom:6px">${esc(rec.reason)}</div><div style="font-size:.78rem;color:#666;font-weight:600">${isAccepted ? '✓ ACCEPT' : '✗ REJECT'}</div></div>`;
      }).join('');
      openModal(`<div><div style="font-weight:700;font-size:1.1rem;margin-bottom:4px">🤖 AI Review Complete</div><div style="font-size:.85rem;color:var(--tx3)">${esc(job.title)} at ${esc(job.company)}</div><div style="font-size:.78rem;color:var(--tx4);margin-top:2px">Accepting: ${acceptRecs.length} | Rejecting: ${rejectRecs.length}</div></div>`, `<div style="margin-top:14px"><div style="font-size:.9rem;font-weight:600;margin-bottom:10px">AI Decisions:</div>${recHtml}<div style="margin-top:16px;padding:12px;background:#fff3cd;border-radius:8px;border-left:3px solid #ff9800">⚠️ Review these decisions. Click 'Apply Decisions' to auto-update statuses.</div><div style="display:flex;gap:10px;margin-top:12px"><button class="btn btn-ghost" style="flex:1" onclick="closeModal()">Cancel</button><button class="btn btn-recruiter" style="flex:1" onclick="applyAIDecisions('${jobId}')" title="Auto-accept/reject based on AI analysis">✓ Apply Decisions</button></div></div>`);
    } else { toast('Could not get AI analysis. Check server logs.', 'info'); }
  } catch(e) { console.error('Analysis error:', e); toast('Error: ' + e.message, 'err'); }
  finally { if (btn) { btn.disabled = false; btn.textContent = '🤖 AI Review'; } }
}

function applyAIDecisions(jobId) {
  if (!_aiRecommendations || !Array.isArray(_aiRecommendations)) {
    toast('No recommendations available', 'err');
    return;
  }
  try {
    let accepted = 0, rejected = 0;
    _aiRecommendations.forEach(rec => {
      if (rec.id) {
        const status = rec.decision === 'Accepted' ? 'Accepted' : 'Rejected';
        DB.updateAppStatus(rec.id, status);
        if (status === 'Accepted') accepted++; else rejected++;
      }
    });
    _aiRecommendations = null;
    closeModal();
    toast(`✓ Applied AI decisions: ${accepted} accepted, ${rejected} rejected`, 'ok');
    renderRecruiterDash('applicants');
  } catch(e) {
    console.error('Error applying decisions:', e);
    toast('Error applying decisions: ' + e.message, 'err');
  }
}

""", '')

with open('app.js', 'w') as f:
    f.write(new_content)

print("✓ Step 2: Added offer letter functions")
