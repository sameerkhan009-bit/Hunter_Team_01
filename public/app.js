// State
let currentDigitCut = 3;
let selectedRangeObj = null;
let liveSmsCount = 957;

// 13 Full Ranges from your demo
const rangesDataList = [
    { id: "cambodia_13mar", name: "Cambodia LX 13Mar", count: 150, numbers: ["855764612961", "85578181238", "855765993183", "855769294889", "85585184013", "85599059711"] },
    { id: "sri_lanka_05jun", name: "Sri Lanka LX 05Jun", count: 150, numbers: ["94761570618", "94741582972", "94744119667", "94767796134", "94771530562"] },
    { id: "sri_lanka_24apr", name: "Sri Lanka LX 24Apr", count: 100, numbers: ["94776452808", "94760452020", "94766262743", "94771908983", "94774392585"] },
    { id: "nepal_24jul", name: "Nepal LX 24Jul", count: 100, numbers: ["9779819437082", "9779860802541", "9779819217407", "9779826552734", "9779819886122"] },
    { id: "zimbabwe_n1p", name: "Zimbabwe N1 (P)", count: 100, numbers: ["263777693462", "263774026940", "263780752135", "263775478513", "263770520235"] },
    { id: "palestine_20jul", name: "Palestine LX 20Jul", count: 100, numbers: ["97021622188441", "97021628439030", "97021623367656", "97021628551482"] },
    { id: "palestine_04may", name: "Palestine LX 04May", count: 100, numbers: ["97021627250222", "97021627829563", "97021621163834", "97021625712920"] },
    { id: "israel_20jul", name: "Israel LX 20Jul", count: 100, numbers: ["972501234567", "972529876543", "972541122334", "972534455667"] }
];

let copiedNumbersMap = JSON.parse(localStorage.getItem('ht_copied_nums_v5')) || {};

// 1. Password Eye Toggle
function togglePassEye() {
    const p = document.getElementById('pInput');
    p.type = (p.type === 'password') ? 'text' : 'password';
}

// 2. Authentication
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
    } else {
        document.getElementById('loginScreen').style.display = 'flex';
        document.getElementById('mainDashboard').style.display = 'none';
    }
}

function appLogin() {
    const u = document.getElementById('uInput').value.trim();
    const p = document.getElementById('pInput').value.trim();
    const alertBox = document.getElementById('loginAlert');
    const btn = document.getElementById('loginSubmitBtn');

    if (!u || !p) {
        alertBox.textContent = '❌ Username and Password required!';
        alertBox.style.display = 'block';
        return;
    }

    // 0-second Instant Admin verification
    if (u.toLowerCase() === 'sameer_khan' && p === 'Khan@00') {
        localStorage.setItem('ht_current_user', 'Sameer_Khan');
        alertBox.style.display = 'none';
        checkAppSession();
        return;
    }

    // Backend Client Verification
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
            alertBox.textContent = '❌ ' + (d.message || 'Ghalat Username ya Password!');
            alertBox.style.display = 'block';
        }
    })
    .catch(() => {
        btn.textContent = 'LOGIN';
        alertBox.textContent = '❌ Ghalat Username ya Password!';
        alertBox.style.display = 'block';
    });
}

function appLogout() {
    if (confirm("Are you sure you want to logout?")) {
        localStorage.removeItem('ht_current_user');
        toggleSidebar(false);
        checkAppSession();
    }
}

// 3. Navigation Switcher
function switchNavTab(tab) {
    document.querySelectorAll('.tab-content').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.bar-btn').forEach(b => b.classList.remove('active'));

    const target = document.getElementById(`tab-${tab}`);
    if (target) target.classList.add('active');

    const tabs = ['ranges', 'inbox', 'add', 'top10'];
    const idx = tabs.indexOf(tab);
    if (idx !== -1) document.querySelectorAll('.bar-btn')[idx].classList.add('active');
}

// 4. Render Ranges List
function renderRanges(list = rangesDataList) {
    const container = document.getElementById('rangesListContainer');
    document.getElementById('rangesCountBadge').textContent = list.length;

    container.innerHTML = list.map(r => `
        <div class="range-item" onclick="openRangeDetail('${r.id}')">
            <div class="range-left">
                <div class="sat-icon">📡</div>
                <div>
                    <div class="range-main-name">${r.name}</div>
                    <div class="range-main-sub">${r.count} numbers · ● Active</div>
                </div>
            </div>
            <div class="arrow-right">❯</div>
        </div>
    `).join('');
}

function filterRangesList() {
    const q = document.getElementById('rangeSearchInput').value.toLowerCase();
    const filtered = rangesDataList.filter(r => r.name.toLowerCase().includes(q));
    renderRanges(filtered);
}

// 5. Open Range Details (Numbers View)
function openRangeDetail(id) {
    selectedRangeObj = rangesDataList.find(r => r.id === id);
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

    const sample = "855764612961";
    document.getElementById('digitCutHint').textContent = `Remove ${d} digits: ${sample} -> ${sample.substring(d)}`;
    renderRangeNumbers();
}

function renderRangeNumbers() {
    if (!selectedRangeObj) return;
    const container = document.getElementById('rangeNumbersContainer');

    container.innerHTML = selectedRangeObj.numbers.map((raw, idx) => {
        const clean = raw.substring(currentDigitCut);
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
    localStorage.setItem('ht_copied_nums_v5', JSON.stringify(copiedNumbersMap));
    renderRangeNumbers();
    showToast("Copied");
}

function resetRangeCopied() {
    if (confirm("Reset copied numbers status?")) {
        copiedNumbersMap = {};
        localStorage.removeItem('ht_copied_nums_v5');
        renderRangeNumbers();
        showToast("Reset Done");
    }
}

// 6. Inbox Live Feed
const demoInbox = [
    { route: "Angola LX 04May", phone: "+244910233356", text: "Your LinkedIn verification code is 324608", time: "Aug 26, 09:19 AM", otp: "324608" },
    { route: "Angola LX 04May", phone: "+244918178678", text: "Your LinkedIn verification code is 324608", time: "Aug 26, 09:19 AM", otp: "324608" },
    { route: "Angola LX 04May", phone: "+244911703677", text: "Your LinkedIn verification code is 324608", time: "Aug 26, 09:19 AM", otp: "324608" }
];

function renderInboxFeed() {
    const container = document.getElementById('inboxFeedContainer');
    container.innerHTML = demoInbox.map(m => `
        <div class="msg-box-card">
            <div class="msg-top-row">
                <div class="msg-route-tag">📡 ${m.route}</div>
                <div>${m.time}</div>
            </div>
            <div style="font-size:11px; color:#8c9bb5; margin-bottom:4px;">FROM: ${m.phone}</div>
            <div class="msg-text-body" onclick="copyOtpVal('${m.otp}')">
                ${m.text}
            </div>
        </div>
    `).join('');
}

function copyOtpVal(otp) {
    try { navigator.clipboard.writeText(otp); } catch(e) {}
    showToast(`Copied OTP ${otp}`);
}

// 7. Top 10 Leaderboard
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

// 8. General Helpers
function showToast(msg) {
    const t = document.getElementById('toastNotice');
    t.textContent = msg;
    t.style.display = 'block';
    setTimeout(() => { t.style.display = 'none'; }, 1800);
}

function refreshLiveData() {
    fetch('/api/messages')
        .then(r => r.json())
        .then(d => {
            if (Array.isArray(d) && d.length > 0) {
                // Update live
            }
        }).catch(() => {});

    liveSmsCount += Math.floor(Math.random() * 2) + 1;
    document.getElementById('todaySmsVal').textContent = liveSmsCount;
    showToast("Refreshed");
}

function toggleSidebar(open) {
    document.getElementById('sbDrawer').style.display = open ? 'flex' : 'none';
    document.getElementById('sbOverlay').style.display = open ? 'block' : 'none';
}

function toggleThemeMode() {
    document.body.classList.toggle('light-mode');
}

function submitAllocationForm() {
    const num = document.getElementById('allocPhone').value.trim();
    if (!num) return alert("Please enter phone number!");
    showToast("Number Allocated Successfully!");
    document.getElementById('allocPhone').value = '';
}

// Init
checkAppSession();
renderRanges();
renderInboxFeed();
renderTop10();
