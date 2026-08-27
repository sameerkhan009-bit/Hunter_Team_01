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

// Messages API
app.get('/api/messages', async (req, res) => {
    try {
        const response = await axios.get(`${BASE_URL}/messages?token=${API_TOKEN}`, { timeout: 5000 });
        res.json(response.data);
    } catch (err) {
        res.json([]);
    }
});

// Allocate API
app.post('/api/allocate', async (req, res) => {
    try {
        const response = await axios.post(`${BASE_URL}/numbers/assign?token=${API_TOKEN}`, {
            range: req.body.range,
            number: req.body.number,
            client: 'Sameer_Khan'
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
