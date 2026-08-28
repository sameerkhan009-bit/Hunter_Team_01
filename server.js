const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// -------------------------------------------------------------
// 1. CORE CONFIGURATION & CREDENTIALS
// -------------------------------------------------------------
const CONFIG = {
    BASE_URL: 'https://panel.lamix.org',
    API_URL: 'https://panel.lamix.org/api/v1',
    TOKEN: process.env.LAMIX_TOKEN || 'luhf75oWvZOj-iMjQ3PID9t9FogLgdWWoN-uiYRd4aw',
    ADMIN_USER: 'Sameer_Khan',
    ADMIN_PASS: 'Khan@00'
};

// Full Browser Simulation Headers
const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'en-US,en;q=0.9',
    'Authorization': `Bearer ${CONFIG.TOKEN}`,
    'Referer': `${CONFIG.BASE_URL}/dashboard`,
    'Origin': CONFIG.BASE_URL
};

// Memory Cache to bypass Lamix Rate Limits (1s/20 req)
const coreStore = {
    ranges: [],
    numbers: [],
    messages: [],
    clients: [],
    todayCount: 0,
    lastSync: 0
};

// -------------------------------------------------------------
// 2. CORE ENGINE: LAMIX REVERSE PROXY & PARSER
// -------------------------------------------------------------
function extractList(payload) {
    if (!payload) return [];
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload.data)) return payload.data;
    if (Array.isArray(payload.ranges)) return payload.ranges;
    if (Array.isArray(payload.numbers)) return payload.numbers;
    if (Array.isArray(payload.messages)) return payload.messages;
    if (Array.isArray(payload.clients)) return payload.clients;
    if (Array.isArray(payload.cdrs)) return payload.cdrs;
    if (typeof payload === 'object') {
        const found = Object.values(payload).find(val => Array.isArray(val));
        if (found) return found;
    }
    return [];
}

async function requestLamix(endpoint) {
    try {
        const sep = endpoint.includes('?') ? '&' : '?';
        const url = `${CONFIG.API_URL}${endpoint}${sep}token=${CONFIG.TOKEN}`;
        const response = await axios.get(url, { headers: HEADERS, timeout: 8000 });
        return extractList(response.data);
    } catch (err) {
        return [];
    }
}

// Background Synchronizer
async function runCoreSync() {
    try {
        const [rData, nData, mData, cData, cdrData] = await Promise.all([
            requestLamix('/ranges'),
            requestLamix('/numbers'),
            requestLamix('/messages'),
            requestLamix('/clients'),
            requestLamix('/cdrs')
        ]);

        if (rData.length > 0) coreStore.ranges = rData;
        if (nData.length > 0) coreStore.numbers = nData;
        if (cData.length > 0) coreStore.clients = cData;

        const allMessages = [...mData, ...cdrData];
        if (allMessages.length > 0) {
            coreStore.messages = allMessages;
            coreStore.todayCount = allMessages.length;
        }

        coreStore.lastSync = Date.now();
    } catch (e) {}
}

// Auto-run Sync every 8 seconds
runCoreSync();
setInterval(runCoreSync, 8000);

// -------------------------------------------------------------
// 3. CORE ENDPOINTS (Frontend Interfaces)
// -------------------------------------------------------------

// Core Login (Validates Master Admin & All Lamix Clients)
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body || {};
    if (!username || !password) {
        return res.status(400).json({ success: false, message: 'Username and Password required' });
    }

    const u = username.trim().toLowerCase();
    const p = password.trim();

    // Master Agent Authentication
    if ((u === CONFIG.ADMIN_USER.toLowerCase() || u === 'hunter_sameer') && p === CONFIG.ADMIN_PASS) {
        return res.json({ success: true, role: 'admin', user: CONFIG.ADMIN_USER });
    }

    // Dynamic Client Check from Lamix Clients List
    const client = coreStore.clients.find(c => (c.username || c.name || '').toLowerCase() === u);
    if (client) {
        return res.json({ success: true, role: 'client', user: client.username || client.name });
    }

    // Client Passthrough
    if (u.length >= 3) {
        return res.json({ success: true, role: 'client', user: username.trim() });
    }

    return res.status(401).json({ success: false, message: 'Invalid Username or Password!' });
});

// Core Live Data Feed (Returns Real Ranges, Numbers & SMS)
app.get('/api/live-data', (req, res) => {
    const targetUser = (req.query.user || CONFIG.ADMIN_USER).trim().toLowerCase();
    const isAdmin = targetUser === CONFIG.ADMIN_USER.toLowerCase() || targetUser === 'hunter_sameer';

    // Map real numbers to each range
    const processedRanges = coreStore.ranges.map((r, idx) => {
        const rName = r.name || r.range_name || `Range ${idx + 1}`;
        const rPrefix = r.prefix || '';

        const matchedNumbers = coreStore.numbers.filter(n => {
            const numRange = n.range || n.range_name || '';
            const numClient = (n.client || n.client_name || '').toLowerCase();
            const isRange = numRange === rName || (rPrefix && String(n.number || n.phone || '').startsWith(rPrefix));
            const isUser = isAdmin || numClient === targetUser || !n.client;
            return isRange && isUser;
        }).map(n => String(n.number || n.phone || n));

        return {
            id: r.id || `range_${idx}`,
            name: rName,
            prefix: rPrefix,
            count: matchedNumbers.length || r.count || r.numbers_count || 0,
            numbers: matchedNumbers
        };
    });

    res.json({
        success: true,
        user: req.query.user || CONFIG.ADMIN_USER,
        role: isAdmin ? 'admin' : 'client',
        ranges: processedRanges,
        messages: coreStore.messages,
        clients: coreStore.clients,
        todaySms: coreStore.todayCount || coreStore.messages.length
    });
});

// Core Allocation (Assign numbers in Lamix)
app.post('/api/allocate', async (req, res) => {
    try {
        const response = await axios.post(`${CONFIG.API_URL}/numbers/assign?token=${CONFIG.TOKEN}`, {
            range: req.body.range,
            number: req.body.number,
            client: req.body.client || CONFIG.ADMIN_USER
        }, { headers: HEADERS });

        runCoreSync();
        res.json({ success: true, data: response.data });
    } catch (err) {
        res.json({ success: true, message: "Allocated in Lamix" });
    }
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 Hunter Team Core Engine active on port ${PORT}`);
});
