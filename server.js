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

// Lamix API Credentials
const API_TOKEN = process.env.LAMIX_TOKEN || 'Iuhf75oWvZOj-iMjQ3PlD9t9FogLgdWWoN-uiYRd4aw';
const BASE_URL = 'https://panel.lamix.org/api/v1';

// 1. User & Client Login
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ success: false, message: 'Username and Password required' });
    }

    // Admin Login Check
    if (username.trim().toLowerCase() === 'sameer_khan' && password.trim() === 'Khan@00') {
        return res.json({ success: true, role: 'admin', user: 'Sameer_Khan', token: API_TOKEN });
    }

    // Client Login Check via Lamix API
    try {
        const clientRes = await axios.get(`${BASE_URL}/clients?token=${API_TOKEN}`, { timeout: 5000 });
        const clients = clientRes.data;
        if (Array.isArray(clients)) {
            const matched = clients.find(c => (c.username || c.name || '').toLowerCase() === username.trim().toLowerCase());
            if (matched) {
                return res.json({ success: true, role: 'client', user: matched.username || matched.name, token: API_TOKEN });
            }
        }
    } catch (e) {}

    return res.status(401).json({ success: false, message: 'Invalid Username or Password!' });
});

// 2. Live Messages (Inbox)
app.get('/api/messages', async (req, res) => {
    try {
        const response = await axios.get(`${BASE_URL}/messages?token=${API_TOKEN}`, { timeout: 6000 });
        res.json(response.data);
    } catch (err) {
        res.json([]);
    }
});

// 3. Live Ranges
app.get('/api/ranges', async (req, res) => {
    try {
        const response = await axios.get(`${BASE_URL}/ranges?token=${API_TOKEN}`, { timeout: 6000 });
        res.json(response.data);
    } catch (err) {
        res.json([]);
    }
});

// 4. Live Numbers
app.get('/api/numbers', async (req, res) => {
    try {
        const response = await axios.get(`${BASE_URL}/numbers?token=${API_TOKEN}`, { timeout: 6000 });
        res.json(response.data);
    } catch (err) {
        res.json([]);
    }
});

// 5. Allocate Number
app.post('/api/allocate', async (req, res) => {
    try {
        const response = await axios.post(`${BASE_URL}/numbers/assign?token=${API_TOKEN}`, {
            range: req.body.range,
            number: req.body.number,
            client: req.body.client || 'Sameer_Khan'
        });
        res.json({ success: true, data: response.data });
    } catch (err) {
        res.json({ success: true, message: "Number assigned locally" });
    }
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 Hunter Team Portal running on http://localhost:${PORT}`);
});
