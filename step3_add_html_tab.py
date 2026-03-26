#!/usr/bin/env python3

with open('index.html', 'r') as f:
    content = f.read()

# Find the insertion point - right after the "Applicants" tab panel
insertion_point = content.find('''          </div>
        </page>''')

# The new HTML for Offers tab
new_html = '''          <!-- OFFERS TAB -->
          <button class="r-tab nav-btn" data-tab="offers" onclick="renderRecruiterDash('offers')" style="border-radius:0;padding:10px 18px">📧 Selected Candidates & Offers</button>
          
          <div class="r-tab-panel" data-tab="offers" style="display:none">
            <div class="rec-sec">
              <div class="rec-sec-hdr">
                <div class="sec-title">Selected Candidates & Offers</div>
                <div class="sec-sub">View selected candidates and send offer letters</div>
              </div>
              <div id="r-offers"></div>
            </div>
          </div>
        </page>'''

# Replace the closing tag with new HTML
new_content = content[:insertion_point] + new_html

with open('index.html', 'w') as f:
    f.write(new_content)

print("✓ Step 3: Added Offers tab to HTML")
