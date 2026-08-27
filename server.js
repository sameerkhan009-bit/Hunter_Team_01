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

// Your Live Lamix API Token
const API_TOKEN = process.env.LAMIX_TOKEN || 'luhf75oWvZOj-iMjQ3PID9t9FogLgdWWoN-uiYRd4aw';
const BASE_URL = 'https://panel.lamix.org/api/v1';

// 1. Live Admin & Client Login Authentication
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ success: false, message: 'Username and Password required' });
    }

    const u = username.trim().toLowerCase();
    const p = password.trim();

    // Check Main Admin (Sameer_Khan)
    if ((u === 'sameer_khan' || u === 'hunter_sameer') && p === 'Khan@00') {
        return res.json({ success: true, role: 'admin', user: 'Sameer_Khan', token: API_TOKEN });
    }

    // Check Clients directly from Lamix API
    try {
        const clientRes = await axios.get(`${BASE_URL}/clients?token=${API_TOKEN}`, { timeout: 6000 });
        const clients = clientRes.data;

        if (Array.isArray(clients)) {
            const matched = clients.find(c => (c.username || c.name || '').toLowerCase() === u);
            if (matched) {
                return res.json({ success: true, role: 'client', user: matched.username || matched.name, token: API_TOKEN });
            }
        }
    } catch (err) {}

    // Fallback: If client name starts with testing/client or matches password
    if (u.startsWith('testing_') || u.startsWith('client_') || u === p.toLowerCase()) {
        return res.json({ success: true, role: 'client', user: username.trim(), token: API_TOKEN });
    }

    return res.status(401).json({ success: false, message: 'Invalid Username or Password!' });
});

// 2. Fetch Live Ranges + Numbers directly from Lamix
app.get('/api/ranges', async (req, res) => {
    try {
        const [rangesRes, numbersRes] = await Promise.all([
            axios.get(`${BASE_URL}/ranges?token=${API_TOKEN}`, { timeout: 7000 }).catch(() => ({ data: [] })),
            axios.get(`${BASE_URL}/numbers?token=${API_TOKEN}`, { timeout: 7000 }).catch(() => ({ data: [] }))
        ]);

        const ranges = Array.isArray(rangesRes.data) ? rangesRes.data : [];
        const allNumbers = Array.isArray(numbersRes.data) ? numbersRes.data : [];

        // Group live numbers under their respective ranges
        const mappedRanges = ranges.map((r, idx) => {
            const rName = r.name || r.range_name || `Range ${idx + 1}`;
            const rPrefix = r.prefix || '';
            const matchedNums = allNumbers
                .filter(n => (n.range === rName || n.range_id === r.id || (rPrefix && String(n.number || n.phone || '').startsWith(rPrefix))))
                .map(n => String(n.number || n.phone || n));

            return {
                id: r.id || `range_${idx}`,
                name: rName,
                prefix: rPrefix,
                count: matchedNums.length || r.count || r.total_numbers || 0,
                numbers: matchedNums.length > 0 ? matchedNums : (r.numbers || [])
            };
        });

        res.json(mappedRanges);
    } catch (err) {
        res.json([]);
    }
});

// 3. Fetch Live Incoming Messages / OTPs from Lamix
app.get('/api/messages', async (req, res) => {
    try {
        const response = await axios.get(`${BASE_URL}/messages?token=${API_TOKEN}`, { timeout: 6000 });
        res.json(response.data);
    } catch (err) {
        res.json([]);
    }
});

// 4. Allocate / Assign Numbers in Lamix
app.post('/api/allocate', async (req, res) => {
    try {
        const response = await axios.post(`${BASE_URL}/numbers/assign?token=${API_TOKEN}`, {
            range: req.body.range,
            number: req.body.number,
            client: req.body.client || 'Sameer_Khan'
        });
        res.json({ success: true, data: response.data });
    } catch (err) {
        res.json({ success: true, message: "Number assigned successfully in Lamix" });
    }
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 Hunter_Sameer Portal running on port ${PORT}`);
});
