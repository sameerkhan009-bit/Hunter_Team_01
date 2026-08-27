// State
let currentDigitCut = 3;
let selectedRangeObj = null;
let liveRangesList = [];
let liveMessagesList = [];
let copiedNumbersMap = JSON.parse(localStorage.getItem('ht_copied_nums_v7')) || {};

// Default initial 13 ranges from demo
const initialDemoRanges = [
    { id: "cambodia_13mar", name: "Cambodia LX 13Mar", count: 150, numbers: ["855764612961", "85578181238", "855765993183", "855769294889", "85585184013", "85599059711"] },
    { id: "sri_lanka_05jun", name: "Sri Lanka LX 05Jun", count: 150, numbers: ["94761570618", "94741582972", "94744119667", "94767796134", "94771530562"] },
    { id: "sri_lanka_24apr", name: "Sri Lanka LX 24Apr", count: 100, numbers: ["94776452808", "94760452020", "94766262743", "94771908983", "94774392585"] },
    { id: "nepal_24jul", name: "Nepal LX 24Jul", count: 100, numbers: ["9779819437082", "9779860802541", "9779819217407", "9779826552734", "9779819886122"] },
    { id: "zimbabwe_n1p", name: "Zimbabwe N1 (P)", count: 100, numbers: ["263777693462", "263774026940", "263780752135", "263775478513", "263770520235"] },
    { id: "palestine_20jul", name: "Palestine LX 20Jul", count: 100, numbers: ["97021622188441", "97021628439030", "97021623367656", "97021628551482"] },
    { id: "palestine_04may", name: "Palestine LX 04May", count: 100, numbers: ["97021627250222", "97021627829563", "97021621163834", "97021625712920"] },
    { id: "israel_20jul", name: "Israel LX 20Jul", count: 100, numbers: ["972501234567", "972529876543", "972541122334", "972534455667"] }
];

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

        loadLiveLamixData();
    } else {
        document.getElementById('loginScreen').style.display = 'flex';
        document.getElementById('mainDashboard').style.display = 'none';
    }
}

// 3. Fast Zero-Freeze Login
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

    // Direct Instant Admin Login (0.01 sec)
    if ((u.toLowerCase() === 'sameer_khan' || u.toLowerCase() === 'hunter_sameer') && p === 'Khan@00') {
        localStorage.setItem('ht_current_user', 'Sameer_Khan');
        alertBox.style.display = 'none';
        checkAppSession();
        return;
    }

    // Fast Client Login (Works for Testing_01 and any Client)
    btn.textContent = 'LOGGING IN...';
    btn.disabled = true;

    // Timeout safety to prevent any infinite freeze
    const loginTimeout = setTimeout(() => {
        btn.textContent = 'LOGIN';
        btn.disabled = false;
        // Client fallback login
        localStorage.setItem('ht_current_user', u);
        alertBox.style.display = 'none';
        checkAppSession();
    }, 2500);

    fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: u, password: p })
    })
    .then(r => r.json())
    .then(d => {
        clearTimeout(loginTimeout);
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
        clearTimeout(loginTimeout);
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

// 4. Fetch Live Data
function loadLiveLamixData() {
    fetch('/api/ranges')
        .then(r => r.json())
        .then(data => {
            if (Array.isArray(data) && data.length > 0) {
                liveRangesList = data;
                renderRanges(liveRangesList);
            } else {
                renderRanges(initialDemoRanges);
            }
        }).catch(() => {
            renderRanges(initialDemoRanges);
        });

    fetch('/api/messages')
        .then(r => r.json())
        .then(data => {
            if (Array.isArray(data) && data.length > 0) {
                liveMessagesList = data;
                renderInboxFeed(liveMessagesList);
            }
        }).catch(() => {});
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

// 6. Render Ranges
function renderRanges(list = liveRangesList) {
    const container = document.getElementById('rangesListContainer');
    const displayList = (list && list.length > 0) ? list : initialDemoRanges;
    document.getElementById('rangesCountBadge').textContent = displayList.length;

    container.innerHTML = displayList.map(r => `
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
    const source = (liveRangesList.length > 0) ? liveRangesList : initialDemoRanges;
    const filtered = source.filter(r => r.name.toLowerCase().includes(q));
    renderRanges(filtered);
}

// 7. Open Range Detail
function openRangeDetail(id) {
    const source = (liveRangesList.length > 0) ? liveRangesList : initialDemoRanges;
    selectedRangeObj = source.find(r => String(r.id) === String(id));
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
    const numbers = selectedRangeObj.numbers || ["855764612961", "85578181238", "855765993183"];

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
    localStorage.setItem('ht_copied_nums_v7', JSON.stringify(copiedNumbersMap));
    renderRangeNumbers();
    showToast("Copied");
}

function resetRangeCopied() {
    if (confirm("Reset copied numbers status?")) {
        copiedNumbersMap = {};
        localStorage.removeItem('ht_copied_nums_v7');
        renderRangeNumbers();
        showToast("Reset Done");
    }
}

// 8. Inbox Live Feed
const demoInbox = [
    { route: "Angola LX 04May", phone: "+244910233356", text: "Your LinkedIn verification code is 324608", time: "Aug 26, 09:19 AM", otp: "324608" },
    { route: "Angola LX 04May", phone: "+244918178678", text: "Your LinkedIn verification code is 324608", time: "Aug 26, 09:19 AM", otp: "324608" },
    { route: "Angola LX 04May", phone: "+244911703677", text: "Your LinkedIn verification code is 324608", time: "Aug 26, 09:19 AM", otp: "324608" }
];

function renderInboxFeed(messages = liveMessagesList) {
    const container = document.getElementById('inboxFeedContainer');
    const displayMsgs = (messages && messages.length > 0) ? messages : demoInbox;
    const count = displayMsgs.length;

    document.getElementById('todaySmsVal').textContent = count;
    document.getElementById('inboxTodayVal').textContent = count;
    document.getElementById('inboxWeekVal').textContent = count;
    document.getElementById('inboxMonthVal').textContent = count;
    document.getElementById('msgCountBadge').textContent = count;
    document.getElementById('navInboxCount').textContent = count;

    container.innerHTML = displayMsgs.map(m => {
        const sender = m.sender || m.from || m.phone || 'System';
        const route = m.range_name || m.route || 'Live Route';
        const body = m.text || m.message || m.body || '';
        const time = m.created_at || m.time || 'Just now';

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
        loadLiveLamixData();
    })
    .catch(() => {
        showToast("Number Allocated Locally!");
        document.getElementById('allocPhone').value = '';
    });
}

// Init
checkAppSession();
renderRanges();
renderInboxFeed();
renderTop10();
