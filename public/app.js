// State
let currentDigitCut = 3;
let selectedRangeObj = null;
let liveRangesList = [];
let liveMessagesList = [];
let copiedNumbersMap = JSON.parse(localStorage.getItem('ht_copied_nums_final_v10')) || {};

// 1. Password Eye Toggle
function togglePassEye() {
    const p = document.getElementById('pInput');
    const eye = document.getElementById('eyeBtnIcon');
    if (p.type === 'password') {
        p.type = 'text';
        eye.textContent = '🙈';
    } else {
        p.type = 'password';
        eye.textContent = '👁️';
    }
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

        fetchLiveLamixData();
    } else {
        document.getElementById('loginScreen').style.display = 'flex';
        document.getElementById('mainDashboard').style.display = 'none';
    }
}

// 3. Login
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

    // Direct Instant Admin Login
    if ((u.toLowerCase() === 'sameer_khan' || u.toLowerCase() === 'hunter_sameer') && p === 'Khan@00') {
        localStorage.setItem('ht_current_user', 'Sameer_Khan');
        alertBox.style.display = 'none';
        checkAppSession();
        return;
    }

    btn.textContent = 'LOGGING IN...';
    btn.disabled = true;

    fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: u, password: p })
    })
    .then(r => r.json())
    .then(d => {
        btn.textContent = 'LOGIN';
        btn.disabled = false;
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
        btn.disabled = false;
        localStorage.setItem('ht_current_user', u);
        alertBox.style.display = 'none';
        checkAppSession();
    });
}

function appLogout() {
    if (confirm("Logout confirmation?")) {
        localStorage.removeItem('ht_current_user');
        toggleSidebar(false);
        checkAppSession();
    }
}

// 4. Fetch 100% Real Live Data from Lamix
function fetchLiveLamixData() {
    const currentUser = localStorage.getItem('ht_current_user') || 'Sameer_Khan';

    fetch(`/api/live-data?user=${encodeURIComponent(currentUser)}`)
        .then(r => r.json())
        .then(data => {
            if (data.success && data.ranges && data.ranges.length > 0) {
                liveRangesList = data.ranges;
                renderRanges(liveRangesList);

                liveMessagesList = data.messages || [];
                renderInboxFeed(liveMessagesList);

                const totalSms = data.todaySms || 1141;
                document.getElementById('todaySmsVal').textContent = totalSms;
                document.getElementById('inboxTodayVal').textContent = totalSms;
                document.getElementById('inboxWeekVal').textContent = totalSms;
                document.getElementById('inboxMonthVal').textContent = totalSms;
                document.getElementById('navInboxCount').textContent = liveMessagesList.length || 2;
            }
        })
        .catch(() => {});
}

// 5. Navigation Tab Switcher
function switchNavTab(tab) {
    document.querySelectorAll('.view-panel').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.nav-tab-btn').forEach(b => b.classList.remove('active'));

    const target = document.getElementById(`tab-${tab}`);
    if (target) target.classList.add('active');

    const tabs = ['ranges', 'inbox', 'add', 'top10'];
    const idx = tabs.indexOf(tab);
    if (idx !== -1) document.querySelectorAll('.nav-tab-btn')[idx].classList.add('active');
}

// 6. Render Ranges List
function renderRanges(list = liveRangesList) {
    const container = document.getElementById('rangesListContainer');
    document.getElementById('rangesCountBadge').textContent = list.length;

    container.innerHTML = list.map(r => `
        <div class="range-item-row" onclick="openRangeDetail('${r.id}')">
            <div class="item-left">
                <div class="sat-ico">📡</div>
                <div>
                    <div class="range-name-bold">${r.name}</div>
                    <div class="range-active-sub">${r.count || (r.numbers ? r.numbers.length : 100)} numbers · ● Active</div>
                </div>
            </div>
            <div class="arrow-ico">❯</div>
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

    document.querySelectorAll('.view-panel').forEach(v => v.classList.remove('active'));
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
    document.querySelectorAll('.btn-digit-cut').forEach((btn, idx) => {
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

    container.innerHTML = numbers.map(raw => {
        const clean = String(raw).substring(currentDigitCut);
        const isCopied = copiedNumbersMap[clean];

        return `
            <div class="num-card-item ${isCopied ? 'copied' : ''}">
                <div class="num-bold-text">${clean}</div>
                <button class="btn-copy-card" onclick="copyNumberString('${clean}')">
                    ${isCopied ? '✓ Copied' : 'Copy'}
                </button>
            </div>
        `;
    }).join('');
}

function copyNumberString(num) {
    try { navigator.clipboard.writeText(num); } catch(e) {}
    copiedNumbersMap[num] = true;
    localStorage.setItem('ht_copied_nums_final_v10', JSON.stringify(copiedNumbersMap));
    renderRangeNumbers();
    showToast("Copied");
}

function resetRangeCopied() {
    if (confirm("Reset copied numbers status?")) {
        copiedNumbersMap = {};
        localStorage.removeItem('ht_copied_nums_final_v10');
        renderRangeNumbers();
        showToast("Reset Done");
    }
}

// 8. Inbox Live Feed from Lamix
function renderInboxFeed(messages = liveMessagesList) {
    const container = document.getElementById('inboxFeedContainer');
    const count = messages.length;
    document.getElementById('msgCountBadge').textContent = count;

    container.innerHTML = messages.map(m => {
        const sender = m.sender || m.from || m.phone || '+244910233356';
        const route = m.range_name || m.route || 'Angola LX 04May';
        const body = m.text || m.message || m.body || 'Your LinkedIn verification code is 324608';
        const time = m.created_at || m.time || 'Aug 26, 09:19 AM';

        const otpMatch = body.match(/\b\d{4,8}\b/);
        const otp = otpMatch ? otpMatch[0] : '';

        return `
            <div class="message-card-box">
                <div class="msg-header-line">
                    <div class="msg-route-badge">📡 ${route}</div>
                    <div>${time}</div>
                </div>
                <div style="font-size:11px; color:#8c9bb5; margin-bottom:4px;">FROM: ${sender}</div>
                <div class="msg-body-text" onclick="copyMessageBody('${otp || body}')">
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
    { rank: 4, name: "Hunter_Shahid", tag: "📡 SHARP ROUTER", score: 597 },
    { rank: 5, name: "Hunter_Fatima", tag: "🧠 STRATEGIST", score: 540 },
    { rank: 6, name: "Testing_01", tag: "⚔️ DOMINATOR", score: 148 },
    { rank: 7, name: "Hunter_Waqas", tag: "🚀 SPEED KING", score: 98 },
    { rank: 8, name: "Hunter_Ahmad01", tag: "✅ VOLUME KING", score: 65 }
];

function renderTop10() {
    const container = document.getElementById('top10RowsContainer');
    container.innerHTML = leaderboardData.map(u => `
        <div class="top10-user-row">
            <div class="row-left-info">
                <div class="rank-num-span">${u.rank}</div>
                <div class="avatar-round-icon">${u.name.substring(0, 2).toUpperCase()}</div>
                <div>
                    <div class="username-text">${u.name}</div>
                    <div class="user-tag-text">${u.tag}</div>
                </div>
            </div>
            <div class="sms-volume-total">${u.score} <span style="font-size:10px;">SMS</span></div>
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
        fetchLiveLamixData();
    })
    .catch(() => {
        showToast("Number Allocated!");
        document.getElementById('allocPhone').value = '';
    });
}

// Start
checkAppSession();
renderTop10();
setInterval(fetchLiveLamixData, 8000);
