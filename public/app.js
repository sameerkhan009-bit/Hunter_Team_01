// State
let currentDigitCut = 3;
let selectedRangeObj = null;
let liveRangesList = [];
let liveMessagesList = [];
let copiedNumbersMap = JSON.parse(localStorage.getItem('ht_copied_nums_v6')) || {};

// 1. Password Eye Toggle
function togglePassEye() {
    const p = document.getElementById('pInput');
    p.type = (p.type === 'password') ? 'text' : 'password';
}

// 2. Session Manager
function checkAppSession() {
    const user = localStorage.getItem('ht_current_user');
    if (user) {
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('mainDashboard').style.display = 'block';

        const initials = user.substring(0, 2).toUpperCase();
        document.getElementById('headerAvatar').textContent = initials;
        document.getElementById('sbAvatar').textContent = initials;
        document.getElementById('sbUsername').textContent = user;
        document.getElementById('myIdDisplay').value = `+ Hunter Team (${user})`;

        loadLiveLamixData();
    } else {
        document.getElementById('loginScreen').style.display = 'flex';
        document.getElementById('mainDashboard').style.display = 'none';
    }
}

// 3. User Login
function appLogin() {
    const u = document.getElementById('uInput').value.trim();
    const p = document.getElementById('pInput').value.trim();
    const alertBox = document.getElementById('loginAlert');
    const btn = document.getElementById('loginSubmitBtn');

    if (!u || !p) {
        alertBox.textContent = '❌ Please enter Username and Password!';
        alertBox.style.display = 'block';
        return;
    }

    // Instant Admin Login
    if ((u.toLowerCase() === 'sameer_khan' || u.toLowerCase() === 'hunter_sameer') && p === 'Khan@00') {
        localStorage.setItem('ht_current_user', 'Sameer_Khan');
        alertBox.style.display = 'none';
        checkAppSession();
        return;
    }

    // Client Verification via Lamix API
    btn.textContent = 'LOGGING IN...';
    fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: u, password: p })
    })
    .then(r => r.json())
    .then(d => {
        btn.textContent = 'LOGIN';
        if (d.success) {
            localStorage.setItem('ht_current_user', d.user || u);
            alertBox.style.display = 'none';
            checkAppSession();
        } else {
            alertBox.textContent = '❌ ' + (d.message || 'Invalid Username or Password!');
            alertBox.style.display = 'block';
        }
    })
    .catch(() => {
        btn.textContent = 'LOGIN';
        alertBox.textContent = '❌ Invalid Username or Password!';
        alertBox.style.display = 'block';
    });
}

function appLogout() {
    if (confirm("Logout confirmation?")) {
        localStorage.removeItem('ht_current_user');
        toggleSidebar(false);
        checkAppSession();
    }
}

// 4. Fetch Live Lamix Ranges & Messages
function loadLiveLamixData() {
    // 1. Fetch Live Ranges
    fetch('/api/ranges')
        .then(r => r.json())
        .then(data => {
            if (Array.isArray(data) && data.length > 0) {
                liveRangesList = data;
                renderRanges(liveRangesList);
            }
        }).catch(() => {});

    // 2. Fetch Live Messages (Inbox)
    fetch('/api/messages')
        .then(r => r.json())
        .then(data => {
            if (Array.isArray(data)) {
                liveMessagesList = data;
                renderInboxFeed(liveMessagesList);
            }
        }).catch(() => {});
}

// 5. Navigation Tab Switcher
function switchNavTab(tab) {
    document.querySelectorAll('.tab-content').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.bar-btn').forEach(b => b.classList.remove('active'));

    const target = document.getElementById(`tab-${tab}`);
    if (target) target.classList.add('active');

    const tabs = ['ranges', 'inbox', 'add', 'top10'];
    const idx = tabs.indexOf(tab);
    if (idx !== -1) document.querySelectorAll('.bar-btn')[idx].classList.add('active');
}

// 6. Render Ranges
function renderRanges(list = liveRangesList) {
    const container = document.getElementById('rangesListContainer');
    document.getElementById('rangesCountBadge').textContent = list.length;

    if (list.length === 0) {
        container.innerHTML = `<div style="text-align:center; padding:30px; color:#8c9bb5;">No ranges found in your Lamix account.</div>`;
        return;
    }

    container.innerHTML = list.map(r => `
        <div class="range-item" onclick="openRangeDetail('${r.id}')">
            <div class="range-left">
                <div class="sat-icon">📡</div>
                <div>
                    <div class="range-main-name">${r.name}</div>
                    <div class="range-main-sub">${r.count || (r.numbers ? r.numbers.length : 0)} numbers · ● Active</div>
                </div>
            </div>
            <div class="arrow-right">❯</div>
        </div>
    `).join('');
}

function filterRangesList() {
    const q = document.getElementById('rangeSearchInput').value.toLowerCase();
    const filtered = liveRangesList.filter(r => r.name.toLowerCase().includes(q));
    renderRanges(filtered);
}

// 7. Open Range Numbers
function openRangeDetail(id) {
    selectedRangeObj = liveRangesList.find(r => String(r.id) === String(id));
    if (!selectedRangeObj) return;

    document.querySelectorAll('.tab-content').forEach(v => v.classList.remove('active'));
    document.getElementById('tab-range-detail').classList.add('active');
    document.getElementById('rangeDetailHeading').textContent = `📡 ${selectedRangeObj.name}`;

    renderRangeNumbers();
}

function closeRangeDetail() {
    document.getElementById('tab-range-detail').classList.remove('active');
    document.getElementById('tab-ranges').classList.add('active');
}

function changeDigitCut(d) {
    currentDigitCut = d;
    document.querySelectorAll('.btn-digit').forEach((btn, idx) => {
        btn.classList.toggle('active', idx === d);
    });

    const sample = (selectedRangeObj && selectedRangeObj.numbers && selectedRangeObj.numbers[0]) ? selectedRangeObj.numbers[0] : "855764612961";
    document.getElementById('digitCutHint').textContent = `Remove ${d} digits: ${sample} -> ${sample.substring(d)}`;
    renderRangeNumbers();
}

function renderRangeNumbers() {
    if (!selectedRangeObj) return;
    const container = document.getElementById('rangeNumbersContainer');
    const numbers = selectedRangeObj.numbers || [];

    if (numbers.length === 0) {
        container.innerHTML = `<div style="text-align:center; padding:30px; color:#8c9bb5;">No numbers allocated to this range yet.</div>`;
        return;
    }

    container.innerHTML = numbers.map(raw => {
        const clean = String(raw).substring(currentDigitCut);
        const isCopied = copiedNumbersMap[clean];

        return `
            <div class="num-row-card ${isCopied ? 'copied' : ''}">
                <div class="num-digits">${clean}</div>
                <button class="btn-copy-num" onclick="copyNumberString('${clean}')">
                    ${isCopied ? '✓ Copied' : 'Copy'}
                </button>
            </div>
        `;
    }).join('');
}

function copyNumberString(num) {
    try { navigator.clipboard.writeText(num); } catch(e) {}
    copiedNumbersMap[num] = true;
    localStorage.setItem('ht_copied_nums_v6', JSON.stringify(copiedNumbersMap));
    renderRangeNumbers();
    showToast("Copied");
}

function resetRangeCopied() {
    if (confirm("Reset copied status?")) {
        copiedNumbersMap = {};
        localStorage.removeItem('ht_copied_nums_v6');
        renderRangeNumbers();
        showToast("Reset Done");
    }
}

// 8. Render Inbox Messages
function renderInboxFeed(messages = liveMessagesList) {
    const container = document.getElementById('inboxFeedContainer');
    const count = messages.length;

    document.getElementById('todaySmsVal').textContent = count;
    document.getElementById('inboxTodayVal').textContent = count;
    document.getElementById('inboxWeekVal').textContent = count;
    document.getElementById('inboxMonthVal').textContent = count;
    document.getElementById('msgCountBadge').textContent = count;
    document.getElementById('navInboxCount').textContent = count;

    if (count === 0) {
        container.innerHTML = `<div style="text-align:center; padding:30px; color:#8c9bb5;">No messages received yet.</div>`;
        return;
    }

    container.innerHTML = messages.map(m => {
        const sender = m.sender || m.from || 'System';
        const route = m.range_name || m.route || 'Live Route';
        const body = m.text || m.message || m.body || '';
        const time = m.created_at || m.time || 'Just now';

        // Extract OTP digits if present
        const otpMatch = body.match(/\b\d{4,8}\b/);
        const otp = otpMatch ? otpMatch[0] : '';

        return `
            <div class="msg-box-card">
                <div class="msg-top-row">
                    <div class="msg-route-tag">📡 ${route}</div>
                    <div>${time}</div>
                </div>
                <div style="font-size:11px; color:#8c9bb5; margin-bottom:4px;">FROM: ${sender}</div>
                <div class="msg-text-body" onclick="copyMessageBody('${otp || body}')">
                    ${body}
                </div>
            </div>
        `;
    }).join('');
}

function copyMessageBody(text) {
    try { navigator.clipboard.writeText(text); } catch(e) {}
    showToast(`Copied ${text}`);
}

// 9. Top 10 Leaderboard
const leaderboardData = [
    { rank: 4, name: "Hunter_Waqas", tag: "📡 SHARP ROUTER", score: 597 },
    { rank: 5, name: "Hunter_Mohsin", tag: "🧠 STRATEGIST", score: 540 },
    { rank: 6, name: "KH_Dominator", tag: "⚔️ DOMINATOR", score: 148 },
    { rank: 7, name: "Hunter_Speed", tag: "🚀 SPEED KING", score: 98 },
    { rank: 8, name: "Hunter_Hassan", tag: "✅ VOLUME KING", score: 65 },
    { rank: 9, name: "Hunter_Hamza", tag: "🎯 PRECISION", score: 31 },
    { rank: 10, name: "Hunter_Shahzad", tag: "🎖️ VETERAN", score: 29 }
];

function renderTop10() {
    const container = document.getElementById('top10RowsContainer');
    container.innerHTML = leaderboardData.map(u => `
        <div class="top10-row">
            <div class="t10-left">
                <div class="t10-rank">${u.rank}</div>
                <div class="t10-avatar">${u.name.substring(0, 2).toUpperCase()}</div>
                <div>
                    <div class="t10-name">${u.name}</div>
                    <div class="t10-tag">${u.tag}</div>
                </div>
            </div>
            <div class="t10-vol">${u.score} <span style="font-size:10px;">SMS</span></div>
        </div>
    `).join('');
}

// 10. General Helpers
function showToast(msg) {
    const t = document.getElementById('toastNotice');
    t.textContent = msg;
    t.style.display = 'block';
    setTimeout(() => { t.style.display = 'none'; }, 1800);
}

function toggleSidebar(open) {
    document.getElementById('sbDrawer').style.display = open ? 'flex' : 'none';
    document.getElementById('sbOverlay').style.display = open ? 'block' : 'none';
}

function toggleThemeMode() {
    document.body.classList.toggle('light-mode');
}

function submitAllocationForm() {
    const range = document.getElementById('allocRangeName').value.trim();
    const phone = document.getElementById('allocPhone').value.trim();
    const user = localStorage.getItem('ht_current_user') || 'Sameer_Khan';

    if (!phone) return alert("Please enter phone number!");

    fetch('/api/allocate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ range, number: phone, client: user })
    })
    .then(r => r.json())
    .then(() => {
        showToast("Number Allocated in Lamix!");
        document.getElementById('allocPhone').value = '';
        loadLiveLamixData();
    })
    .catch(() => {
        showToast("Number Allocated Locally!");
        document.getElementById('allocPhone').value = '';
    });
}

// Start
checkAppSession();
renderTop10();
setInterval(loadLiveLamixData, 10000); // Live poll Lamix API every 10 seconds
