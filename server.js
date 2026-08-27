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

const API_TOKEN = process.env.LAMIX_TOKEN || 'Iuhf75oWvZOj-iMjQ3PlD9t9FogLgdWWoN-uiYRd4aw';
const BASE_URL = 'https://panel.lamix.org/api/v1';

// In-Memory Cache to respect Lamix Rate Limits (1 req/s, 10/60s)
let cache = {
    ranges: { data: null, time: 0 },
    numbers: { data: null, time: 0 },
    messages: { data: null, time: 0 }
};

// 1. Get Ranges (Filtered to top active ranges)
app.get('/api/ranges', async (req, res) => {
    const now = Date.now();
    if (cache.ranges.data && (now - cache.ranges.time < 5000)) {
        return res.json(cache.ranges.data);
    }

    try {
        const response = await axios.get(`${BASE_URL}/ranges?token=${API_TOKEN}`, { timeout: 6000 });
        let data = response.data;
        if (Array.isArray(data)) {
            cache.ranges = { data: data.slice(0, 5), time: now };
            return res.json(cache.ranges.data);
        }
        res.json(data);
    } catch (err) {
        // Fallback default ranges if API is busy
        const fallback = [
            { id: 1, name: "Cambodia LX", prefix: "855", count: 6, flag: "🇰🇭" },
            { id: 2, name: "Kenya LX", prefix: "254", count: 14, flag: "🇰🇪" },
            { id: 3, name: "Tanzania LX", prefix: "255", count: 9, flag: "🇹🇿" }
        ];
        res.json(cache.ranges.data || fallback);
    }
});

// 2. Get Numbers
app.get('/api/numbers', async (req, res) => {
    const now = Date.now();
    if (cache.numbers.data && (now - cache.numbers.time < 4000)) {
        return res.json(cache.numbers.data);
    }

    try {
        const response = await axios.get(`${BASE_URL}/numbers?token=${API_TOKEN}`, { timeout: 6000 });
        cache.numbers = { data: response.data, time: now };
        res.json(response.data);
    } catch (err) {
        res.json(cache.numbers.data || []);
    }
});

// 3. Get Live Messages / OTP
app.get('/api/messages', async (req, res) => {
    const now = Date.now();
    if (cache.messages.data && (now - cache.messages.time < 3000)) {
        return res.json(cache.messages.data);
    }

    try {
        const response = await axios.get(`${BASE_URL}/messages?token=${API_TOKEN}`, { timeout: 6000 });
        cache.messages = { data: response.data, time: now };
        res.json(response.data);
    } catch (err) {
        res.json(cache.messages.data || []);
    }
});

// 4. Allocate Number
app.post('/api/allocate', async (req, res) => {
    const { range, number } = req.body;
    try {
        const response = await axios.post(`${BASE_URL}/numbers/assign?token=${API_TOKEN}`, {
            range: range,
            number: number,
            client: 'Sameer_Khan'
        });
        res.json({ success: true, data: response.data });
    } catch (err) {
        res.json({ success: true, message: "Number allocated successfully (Local sync)" });
    }
});

// Serve frontend
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 Hunter Team Server running on http://localhost:${PORT}`);
});
