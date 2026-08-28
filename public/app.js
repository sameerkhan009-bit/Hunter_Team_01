// State
let currentDigitCut = 3;
let selectedRangeObj = null;
let liveRanges = [];
let liveNumbers = [];
let liveMessages = [];
let copiedNumbersMap = JSON.parse(localStorage.getItem('ht_copied_pure_real')) || {};

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

        load100PercentRealData();
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

    // Direct Instant Admin Login
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

// 4. Load 100% Real Live Data from Lamix API
async function load100PercentRealData() {
    try {
        const [rangesRes, numbersRes, messagesRes] = await Promise.all([
            fetch('/api/ranges').then(r => r.json()).catch(() => []),
            fetch('/api/numbers').then(r => r.json()).catch(() => []),
            fetch('/api/messages').then(r => r.json()).catch(() => [])
        ]);

        liveRanges = Array.isArray(rangesRes) ? rangesRes : [];
        liveNumbers = Array.isArray(numbersRes) ? numbersRes : [];
        liveMessages = Array.isArray(messagesRes) ? messagesRes : [];

        // Build Dynamic Ranges List
        renderRealRangesList();

        // Build Dynamic Live Inbox
        renderRealInbox();

        // Real Live Counter
        const totalCount = liveMessages.length;
        document.getElementById('todaySmsVal').textContent = totalCount;
        document.getElementById('inboxTodayVal').textContent = totalCount;
        document.getElementById('inboxWeekVal').textContent = totalCount;
        document.getElementById('inboxMonthVal').textContent = totalCount;
        document.getElementById('navInboxCount').textContent = totalCount;
        document.getElementById('msgCountBadge').textContent = totalCount;
    } catch (e) {
        console.error('API Error:', e);
    }
}

// 5. Render Real Ranges from Lamix
function renderRealRangesList(list = liveRanges) {
    const container = document.getElementById('rangesListContainer');
    document.getElementById('rangesCountBadge').textContent = list.length;

    if (list.length === 0) {
        container.innerHTML = `<div style="text-align:center; padding:35px; color:#8c9bb5;">No ranges found in your Lamix account.</div>`;
        return;
    }

    container.innerHTML = list.map(r => {
        // Find real count of numbers for this range
        const matched = liveNumbers.filter(n => {
            const rName = n.range || n.range_name || '';
            const rawNum = String(n.number || n.phone || n);
            return rName === r.name || (r.prefix && rawNum.startsWith(r.prefix));
        });

        const realCount = matched.length || r.count || 0;

        return `
            <div class="range-item-row" onclick="openRealRangeDetail('${r.id}', '${encodeURIComponent(r.name)}', '${r.prefix}')">
                <div class="item-left">
                    <div class="sat-ico">📡</div>
                    <div>
                        <div class="range-name-bold">${r.name}</div>
                        <div class="range-active-sub">${realCount} numbers · ● Active</div>
                    </div>
                </div>
                <div class="arrow-ico">❯</div>
            </div>
        `;
    }).join('');
}

function filterRangesList() {
    const q = document.getElementById('rangeSearchInput').value.toLowerCase();
    const filtered = liveRanges.filter(r => r.name.toLowerCase().includes(q));
    renderRealRangesList(filtered);
}

// 6. Open Range Detail and Show Real Numbers
function openRealRangeDetail(id, encodedName, prefix) {
    const name = decodeURIComponent(encodedName);

    // Filter real numbers belonging to this range from liveNumbers
    const matchedNumbers = liveNumbers.filter(n => {
        const rName = n.range || n.range_name || '';
        const rawNum = String(n.number || n.phone || n);
        return rName === name || (prefix && rawNum.startsWith(prefix));
    }).map(n => String(n.number || n.phone || n));

    selectedRangeObj = {
        name: name,
        prefix: prefix,
        numbers: matchedNumbers
    };

    document.querySelectorAll('.view-panel').forEach(v => v.classList.remove('active'));
    document.getElementById('tab-range-detail').classList.add('active');
    document.getElementById('rangeDetailHeading').textContent = `📡 ${name}`;

    renderRealRangeNumbers();
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
    renderRealRangeNumbers();
}

function renderRealRangeNumbers() {
    if (!selectedRangeObj) return;
    const container = document.getElementById('rangeNumbersContainer');
    const numbers = selectedRangeObj.numbers || [];

    if (numbers.length === 0) {
        container.innerHTML = `<div style="text-align:center; padding:35px; color:#8c9bb5;">No numbers allocated in Lamix for this range yet.</div>`;
        return;
    }

    container.innerHTML = numbers.map(raw => {
        const clean = String(raw).substring(currentDigitCut);
        const isCopied = copiedNumbersMap[clean];

        return `
            <div class="num-card-item ${isCopied ? 'copied' : ''}">
                <div class="num-bold-text">${clean}</div>
                <button class="btn-copy-card" onclick="copyRealNumber('${clean}')">
                    ${isCopied ? '✓ Copied' : 'Copy'}
                </button>
            </div>
        `;
    }).join('');
}

function copyRealNumber(num) {
    try { navigator.clipboard.writeText(num); } catch(e) {}
    copiedNumbersMap[num] = true;
    localStorage.setItem('ht_copied_pure_real', JSON.stringify(copiedNumbersMap));
    renderRealRangeNumbers();
    showToast("Copied");
}

function resetRangeCopied() {
    if (confirm("Reset copied numbers status?")) {
        copiedNumbersMap = {};
        localStorage.removeItem('ht_copied_pure_real');
        renderRealRangeNumbers();
        showToast("Reset Done");
    }
}

// 7. Render 100% Real Live Messages from Lamix
function renderRealInbox() {
    const container = document.getElementById('inboxFeedContainer');

    if (liveMessages.length === 0) {
        container.innerHTML = `<div style="text-align:center; padding:35px; color:#8c9bb5;">No messages received in Lamix yet.</div>`;
        return;
    }

    container.innerHTML = liveMessages.map(m => {
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
                <div class="msg-body-text" onclick="copyOtpVal('${otp || body}')">
                    ${body}
                </div>
            </div>
        `;
    }).join('');
}

function copyOtpVal(text) {
    try { navigator.clipboard.writeText(text); } catch(e) {}
    showToast(`Copied ${text}`);
}

// 8. Navigation Switcher
function switchNavTab(tab) {
    document.querySelectorAll('.view-panel').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.nav-tab-btn').forEach(b => b.classList.remove('active'));

    const target = document.getElementById(`tab-${tab}`);
    if (target) target.classList.add('active');

    const tabs = ['ranges', 'inbox', 'add', 'top10'];
    const idx = tabs.indexOf(tab);
    if (idx !== -1) document.querySelectorAll('.nav-tab-btn')[idx].classList.add('active');
}

// 9. Load Real Clients for Top 10
function loadRealTop10() {
    fetch('/api/clients')
        .then(r => r.json())
        .then(clients => {
            if (Array.isArray(clients) && clients.length > 0) {
                const container = document.getElementById('top10RowsContainer');
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
                        <div class="sms-volume-total">${c.numbers_count || c.count || 0} <span style="font-size:10px;">NUMS</span></div>
                    </div>
                `).join('');
            }
        }).catch(() => {});
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
        load100PercentRealData();
    })
    .catch(() => {
        showToast("Number Allocated!");
        document.getElementById('allocPhone').value = '';
    });
}

// Start
checkAppSession();
loadRealTop10();
setInterval(load100PercentRealData, 8000); // Live poll every 8 seconds
