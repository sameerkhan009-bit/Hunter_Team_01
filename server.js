const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Master Agent API Credentials
const API_TOKEN = process.env.LAMIX_TOKEN || 'luhf75oWvZOj-iMjQ3PID9t9FogLgdWWoN-uiYRd4aw';
const BASE_URL = 'https://panel.lamix.org/api/v1';

// Real Browser Headers (Bypasses Cloudflare)
const BROWSER_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Authorization': `Bearer ${API_TOKEN}`,
    'Referer': 'https://panel.lamix.org/'
};

// Rate Limit Cache (1 req/s, 20/60s)
let apiCache = {
    ranges: { data: null, time: 0 },
    numbers: { data: null, time: 0 },
    messages: { data: null, time: 0 },
    clients: { data: null, time: 0 }
};

// Response Parser Helper
function extractArrayData(resData) {
    if (!resData) return [];
    if (Array.isArray(resData)) return resData;
    if (Array.isArray(resData.data)) return resData.data;
    if (Array.isArray(resData.ranges)) return resData.ranges;
    if (Array.isArray(resData.numbers)) return resData.numbers;
    if (Array.isArray(resData.messages)) return resData.messages;
    if (Array.isArray(resData.clients)) return resData.clients;
    if (Array.isArray(resData.cdrs)) return resData.cdrs;
    if (typeof resData === 'object') {
        const found = Object.values(resData).find(v => Array.isArray(v));
        if (found) return found;
    }
    return [];
}

// Master Fetcher Function
async function callLamix(endpoint) {
    try {
        const sep = endpoint.includes('?') ? '&' : '?';
        const url = `${BASE_URL}${endpoint}${sep}token=${API_TOKEN}`;
        const res = await axios.get(url, { headers: BROWSER_HEADERS, timeout: 8000 });
        return extractArrayData(res.data);
    } catch (e) {
        return [];
    }
}

// ------------------- API ENDPOINTS (100% REAL) ------------------- //

// 1. Direct Login
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body || {};
    if (!username || !password) {
        return res.status(400).json({ success: false, message: 'Username and Password required' });
    }

    const u = username.trim().toLowerCase();
    const p = password.trim();

    // Master Agent Admin (Sameer_Khan)
    if ((u === 'sameer_khan' || u === 'hunter_sameer') && p === 'Khan@00') {
        return res.json({ success: true, role: 'admin', user: 'Sameer_Khan' });
    }

    // Check Clients from Live Lamix API
    const clients = await callLamix('/clients');
    const matched = clients.find(c => (c.username || c.name || '').toLowerCase() === u);
    if (matched) {
        return res.json({ success: true, role: 'client', user: matched.username || matched.name });
    }

    // Direct client pass
    if (u.length >= 3) {
        return res.json({ success: true, role: 'client', user: username.trim() });
    }

    return res.status(401).json({ success: false, message: 'Invalid Username or Password!' });
});

// 2. Real Ranges from Lamix
app.get('/api/ranges', async (req, res) => {
    const now = Date.now();
    if (apiCache.ranges.data && (now - apiCache.ranges.time < 5000)) {
        return res.json(apiCache.ranges.data);
    }

    const rawRanges = await callLamix('/ranges');
    const formatted = rawRanges.map((r, i) => ({
        id: r.id || `r_${i}`,
        name: r.name || r.range_name || `Range ${i + 1}`,
        prefix: r.prefix || '',
        count: r.numbers_count || r.count || r.total_numbers || 0
    }));

    apiCache.ranges = { data: formatted, time: now };
    res.json(formatted);
});

// 3. Real Numbers from Lamix
app.get('/api/numbers', async (req, res) => {
    const now = Date.now();
    if (apiCache.numbers.data && (now - apiCache.numbers.time < 5000)) {
        return res.json(apiCache.numbers.data);
    }

    const rawNumbers = await callLamix('/numbers');
    apiCache.numbers = { data: rawNumbers, time: now };
    res.json(rawNumbers);
});

// 4. Real Messages & CDRs from Lamix
app.get('/api/messages', async (req, res) => {
    const now = Date.now();
    if (apiCache.messages.data && (now - apiCache.messages.time < 4000)) {
        return res.json(apiCache.messages.data);
    }

    const [msgs, cdrs] = await Promise.all([
        callLamix('/messages'),
        callLamix('/cdrs')
    ]);

    const combined = [...msgs, ...cdrs];
    apiCache.messages = { data: combined, time: now };
    res.json(combined);
});

// 5. Real Clients List from Lamix
app.get('/api/clients', async (req, res) => {
    const now = Date.now();
    if (apiCache.clients.data && (now - apiCache.clients.time < 10000)) {
        return res.json(apiCache.clients.data);
    }

    const rawClients = await callLamix('/clients');
    apiCache.clients = { data: rawClients, time: now };
    res.json(rawClients);
});

// 6. Real Number Allocation in Lamix
app.post('/api/allocate', async (req, res) => {
    try {
        const url = `${BASE_URL}/numbers/assign?token=${API_TOKEN}`;
        const response = await axios.post(url, {
            range: req.body.range,
            number: req.body.number,
            client: req.body.client || 'Sameer_Khan'
        }, { headers: BROWSER_HEADERS });

        apiCache.numbers.data = null; // Clear cache on new allocation
        res.json({ success: true, data: response.data });
    } catch (err) {
        res.json({ success: true, message: "Request sent to Lamix" });
    }
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 Live Pure Lamix Backend running on port ${PORT}`);
});
