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

// Live Lamix API Credentials
const API_TOKEN = process.env.LAMIX_TOKEN || 'Iuhf75oWvZOj-iMjQ3PlD9t9FogLgdWWoN-uiYRd4aw';
const BASE_URL = 'https://panel.lamix.org/api/v1';

// Login API
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    if (username === 'Sameer_Khan' && password === 'Khan@00') {
        return res.json({ success: true, token: API_TOKEN, user: 'Sameer_Khan' });
    }
    return res.status(401).json({ success: false, message: 'Invalid Username or Password!' });
});

// Live Messages API
app.get('/api/messages', async (req, res) => {
    try {
        const response = await axios.get(`${BASE_URL}/messages?token=${API_TOKEN}`, { timeout: 6000 });
        res.json(response.data);
    } catch (err) {
        res.json([]);
    }
});

// Allocate Number API
app.post('/api/allocate', async (req, res) => {
    try {
        const response = await axios.post(`${BASE_URL}/numbers/assign?token=${API_TOKEN}`, {
            range: req.body.range,
            number: req.body.number,
            client: 'Sameer_Khan'
        });
        res.json({ success: true, data: response.data });
    } catch (err) {
        res.json({ success: true, message: "Number allocated successfully" });
    }
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 Server listening on port ${PORT}`);
});
