#!/usr/bin/env python3

with open('app.js', 'r') as f:
    content = f.read()

# 1. Remove AI Review button from renderApplicantsTab
old_button = '''        <button class="btn btn-recruiter" style="font-size:.85rem;padding:6px 12px" onclick="openApplicantsAI('${group.job?.id}')">🤖 AI Review</button>'''
new_button = ""
content = content.replace(old_button, new_button)

# 2. Remove justify-content:space-between from the header
old_header = '''      <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;justify-content:space-between">'''
new_header = '''      <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px">'''
content = content.replace(old_header, new_header)

# 3. Remove the extra closing div and button wrapper
old_wrapper = '''        <div style="display:flex;align-items:center;gap:10px">
          <div style="width:34px;height:34px;border-radius:8px;background:${group.job?.color||'#444'};display:flex;align-items:center;justify-content:center;font-family:'ClashDisplay','Clash Display',sans-serif;font-weight:700;color:#fff;font-size:.95rem">${group.job?.logo||'?'}</div>
          <div>
            <div style="font-family:'ClashDisplay','Clash Display',sans-serif;font-weight:700;font-size:.95rem">${esc(group.job?.title||'Unknown Job')}</div>
            <div style="font-size:.78rem;color:var(--tx3)">${group.apps.length} applicant${group.apps.length!==1?'s':''} · ${group.job?.numberOfPositions||1} position${(group.job?.numberOfPositions||1)!==1?'s':''}</div>
          </div>
        </div>'''
new_wrapper = '''        <div style="width:34px;height:34px;border-radius:8px;background:${group.job?.color||'#444'};display:flex;align-items:center;justify-content:center;font-family:'ClashDisplay','Clash Display',sans-serif;font-weight:700;color:#fff;font-size:.95rem">${group.job?.logo||'?'}</div>
        <div>
          <div style="font-family:'ClashDisplay','Clash Display',sans-serif;font-weight:700;font-size:.95rem">${esc(group.job?.title||'Unknown Job')}</div>
          <div style="font-size:.78rem;color:var(--tx3)">${group.apps.length} applicant${group.apps.length!==1?'s':''} · ${group.job?.numberOfPositions||1} position${(group.job?.numberOfPositions||1)!==1?'s':''}</div>
        </div>'''
content = content.replace(old_wrapper, new_wrapper)

# 4. Add Select button to applicant cards (in ac-acts div)
old_acts = '''          </select>
        </div>
      </div>'''
new_acts = '''          </select>
          ${a.status==='Accepted'?`<button class="btn btn-sm" style="background:#4CAF50;color:#fff;border:none" onclick="selectCandidateForOffer('${a.id}','${esc(name)}','${esc(email)}','${a.jobId}')">✓ Select</button>`:`<button class="btn btn-sm" style="background:#999;color:#fff;border:none;opacity:.5" disabled>Select</button>`}
        </div>
      </div>'''
content = content.replace(old_acts, new_acts)

# 5. Add offers tab to renderRecruiterDash
old_dash = '''  if (tab==='jobs')       renderRecruiterJobsTab(user, myJobs);
  if (tab==='applicants') renderApplicantsTab(allApps);
}'''
new_dash = '''  if (tab==='jobs')       renderRecruiterJobsTab(user, myJobs);
  if (tab==='applicants') renderApplicantsTab(allApps);
  if (tab==='offers')     renderOffersTab(user, myJobs);
}'''
content = content.replace(old_dash, new_dash)

with open('app.js', 'w') as f:
    f.write(content)

print("✓ Step 1: Removed AI Review button and updated applicant cards")
