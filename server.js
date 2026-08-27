const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Your Master Lamix API Credentials
const API_TOKEN = process.env.LAMIX_TOKEN || 'luhf75oWvZOj-iMjQ3PID9t9FogLgdWWoN-uiYRd4aw';
const BASE_URL = 'https://panel.lamix.org/api/v1';

// Cache to prevent Lamix 429 Rate Limits (1 req/sec)
let cache = {
    ranges: { data: null, time: 0 },
    numbers: { data: null, time: 0 },
    messages: { data: null, time: 0 },
    clients: { data: null, time: 0 }
};

// Helper: Direct Lamix Fetch
async function getLamixEndpoint(endpoint) {
    const sep = endpoint.includes('?') ? '&' : '?';
    const url = `${BASE_URL}${endpoint}${sep}token=${API_TOKEN}`;
    const res = await fetch(url, {
        headers: {
            'Authorization': `Bearer ${API_TOKEN}`,
            'Accept': 'application/json'
        }
    });
    if (!res.ok) throw new Error(`Lamix API error: ${res.status}`);
    return await res.json();
}

// 1. Direct Login
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body || {};
    if (!username || !password) {
        return res.status(400).json({ success: false, message: 'Username and Password required' });
    }

    const u = username.trim().toLowerCase();
    const p = password.trim();

    // Admin Check
    if ((u === 'sameer_khan' || u === 'hunter_sameer') && p === 'Khan@00') {
        return res.json({ success: true, role: 'admin', user: 'Sameer_Khan' });
    }

    // Direct Client Check
    if (u.length >= 3) {
        return res.json({ success: true, role: 'client', user: username.trim() });
    }

    return res.status(401).json({ success: false, message: 'Invalid Username or Password!' });
});

// 2. Direct Ranges API from Lamix
app.get('/api/ranges', async (req, res) => {
    const now = Date.now();
    if (cache.ranges.data && (now - cache.ranges.time < 5000)) {
        return res.json(cache.ranges.data);
    }
    try {
        const data = await getLamixEndpoint('/ranges');
        const list = Array.isArray(data) ? data : (data.data || data.ranges || []);
        cache.ranges = { data: list, time: now };
        res.json(list);
    } catch (e) {
        res.json(cache.ranges.data || []);
    }
});

// 3. Direct Numbers API from Lamix
app.get('/api/numbers', async (req, res) => {
    const now = Date.now();
    if (cache.numbers.data && (now - cache.numbers.time < 5000)) {
        return res.json(cache.numbers.data);
    }
    try {
        const data = await getLamixEndpoint('/numbers');
        const list = Array.isArray(data) ? data : (data.data || data.numbers || []);
        cache.numbers = { data: list, time: now };
        res.json(list);
    } catch (e) {
        res.json(cache.numbers.data || []);
    }
});

// 4. Direct Messages API from Lamix
app.get('/api/messages', async (req, res) => {
    const now = Date.now();
    if (cache.messages.data && (now - cache.messages.time < 4000)) {
        return res.json(cache.messages.data);
    }
    try {
        const data = await getLamixEndpoint('/messages');
        const list = Array.isArray(data) ? data : (data.data || data.messages || []);
        cache.messages = { data: list, time: now };
        res.json(list);
    } catch (e) {
        res.json(cache.messages.data || []);
    }
});

// 5. Direct Allocate API
app.post('/api/allocate', async (req, res) => {
    try {
        const response = await fetch(`${BASE_URL}/numbers/assign?token=${API_TOKEN}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                range: req.body.range,
                number: req.body.number,
                client: req.body.client || 'Sameer_Khan'
            })
        });
        const data = await response.json();
        res.json({ success: true, data });
    } catch (e) {
        res.json({ success: true, message: "Request sent to Lamix" });
    }
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 Live Server running on port ${PORT}`);
});
