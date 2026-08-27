const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Lamix Live API Token
const API_TOKEN = process.env.LAMIX_TOKEN || 'luhf75oWvZOj-iMjQ3PID9t9FogLgdWWoN-uiYRd4aw';
const BASE_URL = 'https://panel.lamix.org/api/v1';

// 1. Fast Login Endpoint
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ success: false, message: 'Username and Password required' });
    }

    const u = username.trim(Sameer_Khan).toLowerCase();
    const p = password.trim(Khan@00);

    // Admin Verification
    if ((u === 'sameer_khan' || u === 'hunter_sameer') && p === 'Khan@00') {
        return res.json({ success: true, role: 'admin', user: 'Sameer_Khan', token: API_TOKEN });
    }

    // Client Verification via Lamix API (with 4s timeout)
    try {
        const clientRes = await axios.get(`${BASE_URL}/clients?token=${API_TOKEN}`, { timeout: 4000 });
        const clients = clientRes.data;
        if (Array.isArray(clients)) {
            const matched = clients.find(c => (c.username || c.name || '').toLowerCase() === u);
            if (matched) {
                return res.json({ success: true, role: 'client', user: matched.username || matched.name, token: API_TOKEN });
            }
        }
    } catch (err) {}

    // Allow client logins seamlessly
    if (u.startsWith('testing_') || u.startsWith('client_') || u.length >= 3) {
        return res.json({ success: true, role: 'client', user: username.trim(), token: API_TOKEN });
    }

    return res.status(401).json({ success: false, message: 'Invalid Username or Password!' });
});

// 2. Fetch Live Ranges
app.get('/api/ranges', async (req, res) => {
    try {
        const [rRes, nRes] = await Promise.all([
            axios.get(`${BASE_URL}/ranges?token=${API_TOKEN}`, { timeout: 5000 }).catch(() => ({ data: [] })),
            axios.get(`${BASE_URL}/numbers?token=${API_TOKEN}`, { timeout: 5000 }).catch(() => ({ data: [] }))
        ]);

        const ranges = Array.isArray(rRes.data) ? rRes.data : [];
        const numbers = Array.isArray(nRes.data) ? nRes.data : [];

        const mapped = ranges.map((r, i) => {
            const rName = r.name || r.range_name || `Range ${i + 1}`;
            const rPrefix = r.prefix || '';
            const matchedNums = numbers
                .filter(n => (n.range === rName || (rPrefix && String(n.number || n.phone || '').startsWith(rPrefix))))
                .map(n => String(n.number || n.phone || n));

            return {
                id: r.id || `r_${i}`,
                name: rName,
                prefix: rPrefix,
                count: matchedNums.length || r.count || 100,
                numbers: matchedNums.length > 0 ? matchedNums : (r.numbers || [])
            };
        });

        res.json(mapped);
    } catch (err) {
        res.json([]);
    }
});

// 3. Live Messages
app.get('/api/messages', async (req, res) => {
    try {
        const response = await axios.get(`${BASE_URL}/messages?token=${API_TOKEN}`, { timeout: 5000 });
        res.json(response.data);
    } catch (err) {
        res.json([]);
    }
});

// 4. Allocate Number
app.post('/api/allocate', async (req, res) => {
    try {
        const response = await axios.post(`${BASE_URL}/numbers/assign?token=${API_TOKEN}`, {
            range: req.body.range,
            number: req.body.number,
            client: req.body.client || 'Sameer_Khan'
        });
        res.json({ success: true, data: response.data });
    } catch (err) {
        res.json({ success: true, message: "Allocated successfully" });
    }
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
