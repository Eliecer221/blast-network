const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Endpoint simple para simular datos de la red si el frontend los pide
app.get('/api/stats', (req, res) => {
    res.json({
        tps: Math.floor(Math.random() * 5000) + 10000,
        nodes: 1240 + Math.floor(Math.random() * 50),
        blockTime: '400ms'
    });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🚀 BLAST Website running at: http://localhost:${PORT}`);
    console.log(`   Network Access: http://127.0.0.1:${PORT}`);
});
