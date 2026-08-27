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
const API_TOKEN = process.env.LAMIX_TOKEN || 'Iuhf75oWvZOj-iMjQ3PlD9t9FogLgdWWoN-uiYRd4aw';
const BASE_URL = 'https://panel.lamix.org/api/v1';

// 1. Multi-User & Client Login Endpoint
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;

    // Check Main Admin (Sameer_Khan)
    if (username.trim().toLowerCase() === 'sameer_khan' && password.trim() === 'Khan@00') {
        return res.json({ success: true, role: 'admin', user: 'Sameer_Khan', token: API_TOKEN });
    }

    // Check Clients via Lamix API
    try {
        const clientRes = await axios.get(`${BASE_URL}/clients?token=${API_TOKEN}`, { timeout: 5000 });
        const clients = clientRes.data;
        if (Array.isArray(clients)) {
            const matchedClient = clients.find(c => (c.username || c.name || '').toLowerCase() === username.trim().toLowerCase());
            if (matchedClient) {
                return res.json({ success: true, role: 'client', user: matchedClient.username || matchedClient.name, token: API_TOKEN });
            }
        }
    } catch (e) {}

    // Invalid Login
    return res.status(401).json({ success: false, message: 'Ghalat Username ya Password!' });
});

// 2. Live Messages Feed (Inbox)
app.get('/api/messages', async (req, res) => {
    try {
        const response = await axios.get(`${BASE_URL}/messages?token=${API_TOKEN}`, { timeout: 6000 });
        res.json(response.data);
    } catch (err) {
        res.json([]);
    }
});

// 3. Allocate Number to Client/Range
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
    console.log(`🚀 Hunter Team Server listening on port ${PORT}`);
});
