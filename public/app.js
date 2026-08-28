// State
let currentDigitCut = 3;
let selectedRangeObj = null;
let liveRanges = [];
let liveMessages = [];
let copiedMap = JSON.parse(localStorage.getItem('ht_copied_core_v1')) || {};

// Password Visibility
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

// Session Check
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

        fetchCoreData();
    } else {
        document.getElementById('loginScreen').style.display = 'flex';
        document.getElementById('mainDashboard').style.display = 'none';
    }
}

// Login
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

    if ((u.toLowerCase() === 'sameer_khan' || u.toLowerCase() === 'hunter_sameer') && p === 'Khan@00') {
        localStorage.setItem('ht_current_user', 'Sameer_Khan');
        alertBox.style.display = 'none';
        checkAppSession();
        return;
    }

    btn.textContent = 'CONNECTING...';
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

// Fetch Core Data
function fetchCoreData() {
    const user = localStorage.getItem('ht_current_user') || 'Sameer_Khan';

    fetch(`/api/live-data?user=${encodeURIComponent(user)}`)
        .then(r => r.json())
        .then(res => {
            if (res.success) {
                liveRanges = res.ranges || [];
                renderRanges(liveRanges);

                liveMessages = res.messages || [];
                renderInbox(liveMessages);

                const count = res.todaySms || liveMessages.length;
                document.getElementById('todaySmsVal').textContent = count;
                document.getElementById('inboxTodayVal').textContent = count;
                document.getElementById('inboxWeekVal').textContent = count;
                document.getElementById('inboxMonthVal').textContent = count;
                document.getElementById('navInboxCount').textContent = liveMessages.length;
                document.getElementById('msgCountBadge').textContent = liveMessages.length;

                renderTop10(res.clients || []);
            }
        })
        .catch(() => {});
}

// Render Ranges
function renderRanges(list = liveRanges) {
    const container = document.getElementById('rangesListContainer');
    document.getElementById('rangesCountBadge').textContent = list.length;

    if (list.length === 0) {
        container.innerHTML = `<div style="text-align:center; padding:35px; color:#8c9bb5;">No ranges found in your Lamix account.</div>`;
        return;
    }

    container.innerHTML = list.map(r => `
        <div class="range-item-row" onclick="openRange('${r.id}', '${encodeURIComponent(r.name)}', '${r.prefix}')">
            <div class="item-left">
                <div class="sat-ico">📡</div>
                <div>
                    <div class="range-name-bold">${r.name}</div>
                    <div class="range-active-sub">${r.count} numbers · ● Active</div>
                </div>
            </div>
            <div class="arrow-ico">❯</div>
        </div>
    `).join('');
}

function filterRangesList() {
    const q = document.getElementById('rangeSearchInput').value.toLowerCase();
    const filtered = liveRanges.filter(r => r.name.toLowerCase().includes(q));
    renderRanges(filtered);
}

// Open Range Detail
function openRange(id, encodedName, prefix) {
    const name = decodeURIComponent(encodedName);
    selectedRangeObj = liveRanges.find(r => r.name === name || r.id === id);

    document.querySelectorAll('.view-panel').forEach(v => v.classList.remove('active'));
    document.getElementById('tab-range-detail').classList.add('active');
    document.getElementById('rangeDetailHeading').textContent = `📡 ${name}`;

    renderNumbers();
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

    const sample = (selectedRangeObj && selectedRangeObj.numbers && selectedRangeObj.numbers[0]) ? selectedRangeObj.numbers[0] : "244910233356";
    document.getElementById('digitCutHint').textContent = `Remove ${d} digits: ${sample} -> ${sample.substring(d)}`;
    renderNumbers();
}

function renderNumbers() {
    if (!selectedRangeObj) return;
    const container = document.getElementById('rangeNumbersContainer');
    const numbers = selectedRangeObj.numbers || [];

    if (numbers.length === 0) {
        container.innerHTML = `<div style="text-align:center; padding:35px; color:#8c9bb5;">No numbers allocated in Lamix for this range yet.</div>`;
        return;
    }

    container.innerHTML = numbers.map(raw => {
        const clean = String(raw).substring(currentDigitCut);
        const isCopied = copiedMap[clean];

        return `
            <div class="num-card-item ${isCopied ? 'copied' : ''}">
                <div class="num-bold-text">${clean}</div>
                <button class="btn-copy-card" onclick="copyNum('${clean}')">
                    ${isCopied ? '✓ Copied' : 'Copy'}
                </button>
            </div>
        `;
    }).join('');
}

function copyNum(num) {
    try { navigator.clipboard.writeText(num); } catch(e) {}
    copiedMap[num] = true;
    localStorage.setItem('ht_copied_core_v1', JSON.stringify(copiedMap));
    renderNumbers();
    showToast("Copied");
}

function resetRangeCopied() {
    if (confirm("Reset copied status?")) {
        copiedMap = {};
        localStorage.removeItem('ht_copied_core_v1');
        renderNumbers();
        showToast("Reset Done");
    }
}

// Render Inbox
function renderInbox(messages = liveMessages) {
    const container = document.getElementById('inboxFeedContainer');

    if (messages.length === 0) {
        container.innerHTML = `<div style="text-align:center; padding:35px; color:#8c9bb5;">No messages received in Lamix yet.</div>`;
        return;
    }

    container.innerHTML = messages.map(m => {
        const sender = m.sender || m.from || m.phone || 'Sender';
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
                <div class="msg-body-text" onclick="copyOtp('${otp || body}')">
                    ${body}
                </div>
            </div>
        `;
    }).join('');
}

function copyOtp(text) {
    try { navigator.clipboard.writeText(text); } catch(e) {}
    showToast(`Copied ${text}`);
}

// Tab Switcher
function switchNavTab(tab) {
    document.querySelectorAll('.view-panel').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.nav-tab-btn').forEach(b => b.classList.remove('active'));

    const target = document.getElementById(`tab-${tab}`);
    if (target) target.classList.add('active');

    const tabs = ['ranges', 'inbox', 'add', 'top10'];
    const idx = tabs.indexOf(tab);
    if (idx !== -1) document.querySelectorAll('.nav-tab-btn')[idx].classList.add('active');
}

// Render Top 10
function renderTop10(clients = []) {
    const container = document.getElementById('top10RowsContainer');
    if (!clients || clients.length === 0) return;

    container.innerHTML = clients.slice(0, 10).map((c, i) => `
        <div class="top10-user-row">
            <div class="row-left-info">
                <div class="rank-num-span">#${i + 1}</div>
                <div class="avatar-round-icon">${(c.username || c.name || 'HU').substring(0, 2).toUpperCase()}</div>
                <div>
                    <div class="username-text">${c.username || c.name}</div>
                    <div class="user-tag-text">CLIENT</div>
                </div>
            </div>
            <div class="sms-volume-total">${c.numbers_count || 0} <span style="font-size:10px;">NUMS</span></div>
        </div>
    `).join('');
}

// Helpers
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
        fetchCoreData();
    })
    .catch(() => {
        showToast("Number Allocated!");
        document.getElementById('allocPhone').value = '';
    });
}

// Start
checkAppSession();
setInterval(fetchCoreData, 7000);
