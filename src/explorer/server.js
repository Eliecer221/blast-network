const express = require('express');
const { Blockchain } = require('../blockchain');
const path = require('path');

const app = express();
const PORT = process.env.EXPLORER_PORT || 3000;

const blockchain = new Blockchain();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    const latestBlock = blockchain.getLatestBlock();
    const stats = {
        height: blockchain.chain.length - 1,
        latestHash: latestBlock.hash,
        totalTransactions: blockchain.chain.reduce((acc, b) => acc + b.transactions.length, 0),
        difficulty: latestBlock.difficulty,
        miner: latestBlock.miner
    };
    
    res.render('index', { stats, blocks: blockchain.chain.slice(-10).reverse() });
});

app.get('/block/:number', (req, res) => {
    const blockNumber = parseInt(req.params.number);
    const block = blockchain.chain[blockNumber];
    
    if (!block) {
        return res.status(404).render('error', { message: 'Bloque no encontrado' });
    }
    
    res.render('block', { block });
});

app.get('/tx/:hash', (req, res) => {
    const txHash = req.params.hash;
    let transaction = null;
    let blockNumber = null;
    
    for (let i = 0; i < blockchain.chain.length; i++) {
        const tx = blockchain.chain[i].transactions.find(t => {
            const hash = require('crypto').createHash('sha256')
                .update(JSON.stringify(t))
                .digest('hex');
            return hash === txHash;
        });
        
        if (tx) {
            transaction = tx;
            blockNumber = i;
            break;
        }
    }
    
    if (!transaction) {
        return res.status(404).render('error', { message: 'Transacción no encontrada' });
    }
    
    res.render('transaction', { transaction, blockNumber });
});

app.get('/address/:address', (req, res) => {
    const address = req.params.address;
    const balance = blockchain.getBalance(address);
    const transactionCount = blockchain.getTransactionCount(address);
    
    const transactions = [];
    blockchain.chain.forEach((block, index) => {
        block.transactions.forEach(tx => {
            if (tx.from === address || tx.to === address) {
                transactions.push({ ...tx, blockNumber: index });
            }
        });
    });
    
    res.render('address', { address, balance, transactionCount, transactions: transactions.slice(-20) });
});

app.get('/api/stats', (req, res) => {
    const latestBlock = blockchain.getLatestBlock();
    res.json({
        height: blockchain.chain.length - 1,
        latestHash: latestBlockTransactions: blockchain.chain.hash,
        total.reduce((acc, b) => acc + b.transactions.length, 0),
        difficulty: latestBlock.difficulty,
        miner: latestBlock.miner,
        timestamp: latestBlock.timestamp
    });
});

app.get('/api/blocks', (req, res) => {
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;
    
    const blocks = blockchain.chain
        .slice(offset, offset + limit)
        .map(b => ({
            number: b.index,
            hash: b.hash,
            timestamp: b.timestamp,
            transactions: b.transactions.length,
            miner: b.miner,
            difficulty: b.difficulty
        }));
    
    res.json(blocks);
});

app.get('/api/block/:number', (req, res) => {
    const blockNumber = parseInt(req.params.number);
    const block = blockchain.chain[blockNumber];
    
    if (!block) {
        return res.status(404).json({ error: 'Bloque no encontrado' });
    }
    
    res.json(block);
});

const htmlTemplate = `
<!DOCTYPE html>
<html>
<head>
    <title>BLAST Network Explorer</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Courier New', monospace; background: #0a0a0a; color: #00ff00; }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        header { background: linear-gradient(180deg, #1a1a2e 0%, #0a0a0a 100%); padding: 30px 0; border-bottom: 2px solid #00ff00; }
        h1 { font-size: 2.5em; text-align: center; text-shadow: 0 0 10px #00ff00; }
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 30px 0; }
        .stat-box { background: #1a1a2e; padding: 20px; border: 1px solid #00ff00; border-radius: 5px; }
        .stat-box h3 { font-size: 0.9em; color: #888; margin-bottom: 10px; }
        .stat-box .value { font-size: 1.5em; color: #00ff00; }
        .blocks { background: #1a1a2e; padding: 20px; border: 1px solid #00ff00; border-radius: 5px; }
        .block { padding: 15px; border-bottom: 1px solid #333; }
        .block:last-child { border-bottom: none; }
        .block a { color: #00ff00; text-decoration: none; }
        .block a:hover { text-decoration: underline; }
        footer { text-align: center; padding: 20px; color: #666; margin-top: 30px; }
    </style>
</head>
<body>
    <header>
        <div class="container">
            <h1>⛓️ BLAST Network Explorer</h1>
        </div>
    </header>
    <div class="container">
        <div class="stats">
            <div class="stat-box">
                <h3>Altura del Bloque</h3>
                <div class="value"><%= stats.height %></div>
            </div>
            <div class="stat-box">
                <h3>Dificultad</h3>
                <div class="value"><%= stats.difficulty %></div>
            </div>
            <div class="stat-box">
                <h3>Transacciones</h3>
                <div class="value"><%= stats.totalTransactions %></div>
            </div>
            <div class="stat-box">
                <h3>Último Bloque</h3>
                <div class="value" style="font-size:1em;word-break:break-all;"><%= stats.latestHash.substring(0, 20) %>...</div>
            </div>
        </div>
        <div class="blocks">
            <h2>Últimos Bloques</h2>
            <% blocks.forEach(function(block) { %>
                <div class="block">
                    <a href="/block/<%= block.index %>">Bloque #<%= block.index %></a> | 
                    <%= new Date(block.timestamp).toLocaleString() %> | 
                    <%= block.transactions.length %> txns
                </div>
            <% }); %>
        </div>
    </div>
    <footer>
        <p>BLAST Network Explorer v1.0.0 | Chain ID: 8888</p>
    </footer>
</body>
</html>
`;

const fs = require('fs');
const viewsDir = path.join(__dirname, 'views');
const publicDir = path.join(__dirname, 'public');

if (!fs.existsSync(viewsDir)) fs.mkdirSync(viewsDir);
if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir);

fs.writeFileSync(path.join(viewsDir, 'index.ejs'), htmlTemplate);
fs.writeFileSync(path.join(viewsDir, 'block.ejs'), htmlTemplate.replace('Últimos Bloques', 'Detalles del Bloque'));
fs.writeFileSync(path.join(viewsDir, 'transaction.ejs'), htmlTemplate.replace('Últimos Bloques', 'Detalles de Transacción'));
fs.writeFileSync(path.join(viewsDir, 'address.ejs'), htmlTemplate.replace('Últimos Bloques', 'Detalles de Dirección'));
fs.writeFileSync(path.join(viewsDir, 'error.ejs'), '<!DOCTYPE html><html><head><title>Error</title></head><body><h1>Error: <%= message %></h1><a href="/">Volver</a></body></html>');

app.listen(PORT, () => {
    console.log('\n========================================');
    console.log('    BLAST NETWORK EXPLORER            ');
    console.log('========================================');
    console.log(`Explorador ejecutándose en:`);
    console.log(`  http://localhost:${PORT}`);
    console.log('========================================\n');
});

module.exports = app;
