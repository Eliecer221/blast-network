const express = require('express');
const path = require('path');
const { TrezorStyleWallet } = require('./trezorWallet');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const wallet = new TrezorStyleWallet();

// API Routes
app.get('/api/status', (req, res) => res.json({
    hasWallet: wallet.hasWallet(),
    isUnlocked: wallet.isUnlocked(),
    chains: wallet.getSupportedChains ? Object.keys(wallet.getSupportedChains()) : []
}));

app.post('/api/wallet/create', (req, res) => {
    try {
        const { pin } = req.body;
        if (!pin || pin.length < 4) return res.json({ success: false, error: 'PIN requerido' });
        const result = wallet.createNewWallet(pin);
        res.json({ success: true, ...result });
    } catch (e) { res.json({ success: false, error: e.message }); }
});

app.post('/api/wallet/unlock', (req, res) => {
    try {
        const { pin, passphrase } = req.body;
        const result = passphrase ? wallet.unlockWithPassphrase(pin, passphrase) : wallet.unlock(pin);
        res.json({ success: true, ...result });
    } catch (e) { res.json({ success: false, error: e.message }); }
});

app.post('/api/wallet/lock', (req, res) => { wallet.lock(); res.json({ success: true }); });

app.get('/api/wallet/info', (req, res) => res.json(wallet.hasWallet() ? wallet.getWalletInfo() : { error: 'No wallet' }));

app.get('/api/balance', (req, res) => res.json({
    BLAST: wallet.getBalance('BLAST'),
    USDT: wallet.getBalance('USDT'),
    ETH: wallet.getBalance('ETH')
}));

app.post('/api/wallet/add-funds', (req, res) => {
    try {
        const { token, amount } = req.body;
        const result = wallet.addFunds(token || 'BLAST', parseFloat(amount));
        res.json({ success: true, ...result });
    } catch (e) { res.json({ success: false, error: e.message }); }
});

app.post('/api/transfer', (req, res) => {
    try {
        const { to, amount, token } = req.body;
        const result = wallet.transfer(to, parseFloat(amount), token || 'BLAST');
        res.json({ success: true, ...result });
    } catch (e) { res.json({ success: false, error: e.message }); }
});

app.post('/api/transfer/confirm', (req, res) => {
    try {
        const { txId } = req.body;
        const result = wallet.confirmTransaction(txId);
        res.json({ success: true, ...result });
    } catch (e) { res.json({ success: false, error: e.message }); }
});

app.get('/api/transactions/pending', (req, res) => res.json(wallet.getPendingTransactions()));

app.get('/api/chains', (req, res) => res.json(wallet.getSupportedChains()));

app.get('/api/chain/:chain/address', (req, res) => {
    try { res.json(wallet.getAddressForChain(req.params.chain)); }
    catch (e) { res.json({ error: e.message }); }
});

app.get('/api/shamir/create', (req, res) => {
    try { res.json({ success: true, ...wallet.createShamirBackup(3, 5) }); }
    catch (e) { res.json({ success: false, error: e.message }); }
});

// HTML Page - BlastPad Style
app.get('/', (req, res) => {
    res.send(`<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BLAST Wallet - The Future of Crypto</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        :root {
            --bg: #0a0a0a;
            --bg-card: #111111;
            --bg-hover: #1a1a1a;
            --gold: #f0b90b;
            --gold-hover: #d4a009;
            --gold-glow: rgba(240, 185, 11, 0.3);
            --text: #ffffff;
            --text-secondary: #888888;
            --text-muted: #555555;
            --border: #2a2a2a;
            --green: #0ecb81;
            --red: #f6465d;
        }
        
        * { font-family: 'Inter', sans-serif; }
        
        body {
            background: var(--bg);
            color: var(--text);
            min-height: 100vh;
            overflow-x: hidden;
        }
        
        .bg-gradient {
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            background: 
                radial-gradient(ellipse at top, rgba(240, 185, 11, 0.15) 0%, transparent 50%),
                radial-gradient(ellipse at bottom right, rgba(240, 185, 11, 0.1) 0%, transparent 40%);
            pointer-events: none;
            z-index: 0;
        }
        
        .floating-coins {
            position: fixed;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 1;
            overflow: hidden;
        }
        
        .coin {
            position: absolute;
            width: 50px;
            height: 50px;
            background: linear-gradient(145deg, #1a1a1a 0%, #0a0a0a 100%);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 20px;
            color: #f0b90b;
            border: 2px solid #f0b90b;
            box-shadow: 0 0 20px rgba(240, 185, 11, 0.4);
            animation: float 6s ease-in-out infinite;
        }
        
        .coin:nth-child(1) { top: 10%; left: 10%; animation-delay: 0s; }
        .coin:nth-child(2) { top: 20%; right: 15%; animation-delay: 1s; }
        .coin:nth-child(3) { top: 60%; left: 5%; animation-delay: 2s; }
        .coin:nth-child(4) { bottom: 20%; right: 10%; animation-delay: 3s; }
        .coin:nth-child(5) { top: 40%; right: 25%; animation-delay: 4s; }
        
        @keyframes float {
            0%, 100% { transform: translateY(0) rotate(0deg); }
            50% { transform: translateY(-20px) rotate(10deg); }
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 24px;
            position: relative;
            z-index: 2;
        }
        
        /* Header */
        header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 24px 0;
        }
        
        .logo {
            display: flex;
            align-items: center;
            gap: 12px;
            font-size: 24px;
            font-weight: 700;
        }
        
        .logo-text {
            background: linear-gradient(180deg, #ffd700 0%, #f0b90b 50%, #d4a009 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        
        .logo-icon {
            width: 44px;
            height: 44px;
            background: linear-gradient(135deg, #f0b90b 0%, #d4a009 100%);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 22px;
            box-shadow: 0 0 30px var(--gold-glow);
            position: relative;
            overflow: hidden;
        }
        
        .logo-icon::before {
            content: 'B';
            font-weight: 800;
            font-size: 24px;
            color: #000;
        }
        
        nav {
            display: flex;
            gap: 32px;
        }
        
        nav a {
            color: var(--text-secondary);
            text-decoration: none;
            font-size: 15px;
            font-weight: 500;
            transition: color 0.3s;
        }
        
        nav a:hover { color: var(--gold); }
        
        .header-actions {
            display: flex;
            gap: 16px;
            align-items: center;
        }
        
        .btn {
            padding: 12px 24px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 14px;
            cursor: pointer;
            transition: all 0.3s ease;
            border: none;
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            gap: 8px;
        }
        
        .btn-gold {
            background: linear-gradient(135deg, #f0b90b 0%, #d4a009 100%);
            color: #000;
            box-shadow: 0 4px 20px var(--gold-glow);
        }
        
        .btn-gold:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 30px var(--gold-glow);
        }
        
        .btn-outline {
            background: transparent;
            color: var(--text);
            border: 1px solid var(--border);
        }
        
        .btn-outline:hover {
            border-color: var(--gold);
            color: var(--gold);
        }
        
        /* Hero Section */
        .hero {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 60px;
            padding: 80px 0;
            align-items: center;
        }
        
        .hero-content h1 {
            font-size: 64px;
            font-weight: 800;
            line-height: 1.1;
            margin-bottom: 24px;
        }
        
        .hero-content h1 span {
            background: linear-gradient(135deg, #f0b90b 0%, #ffd700 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        
        .hero-subtitle {
            font-size: 20px;
            color: var(--text-secondary);
            margin-bottom: 40px;
        }
        
        .hero-form {
            display: flex;
            flex-direction: column;
            gap: 16px;
            max-width: 400px;
        }
        
        .hero-form input {
            padding: 16px 20px;
            background: var(--bg-card);
            border: 1px solid var(--border);
            border-radius: 12px;
            color: var(--text);
            font-size: 16px;
            transition: all 0.3s;
        }
        
        .hero-form input:focus {
            outline: none;
            border-color: var(--gold);
            box-shadow: 0 0 20px var(--gold-glow);
        }
        
        .hero-actions {
            display: flex;
            gap: 12px;
            margin-top: 8px;
        }
        
        .social-login {
            display: flex;
            gap: 12px;
            margin-top: 24px;
        }
        
        .social-btn {
            width: auto;
            padding: 0 20px;
            height: 48px;
            background: var(--bg-card);
            border: 1px solid var(--border);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.3s;
            font-weight: 600;
            font-size: 13px;
        }
        
        .social-btn:hover {
            border-color: var(--gold);
            background: var(--bg-hover);
        }
        
        .wallet-partners {
            display: flex;
            gap: 24px;
            margin-top: 40px;
            align-items: center;
        }
        
        .wallet-partners span {
            font-size: 13px;
            color: var(--text-muted);
        }
        
        .partner-icons {
            display: flex;
            gap: 16px;
        }
        
        .partner-icon {
            width: auto;
            padding: 0 12px;
            height: 40px;
            background: var(--bg-card);
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 11px;
            border: 1px solid var(--border);
            font-weight: 600;
        }
        
        /* Hero Visual */
        .hero-visual {
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .wallet-3d {
            width: 350px;
            height: 350px;
            background: linear-gradient(145deg, #1a1a1a 0%, #0a0a0a 100%);
            border-radius: 30px;
            border: 3px solid #f0b90b;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            box-shadow: 
                0 0 80px rgba(240, 185, 11, 0.4),
                0 20px 60px rgba(0, 0, 0, 0.5),
                inset 0 0 60px rgba(240, 185, 11, 0.05);
            animation: pulse-glow 3s ease-in-out infinite;
            position: relative;
        }
        
        .wallet-3d::before {
            content: 'B';
            font-size: 140px;
            font-weight: 900;
            background: linear-gradient(180deg, #ffd700 0%, #f0b90b 50%, #d4a009 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            text-shadow: 0 0 60px rgba(240, 185, 11, 0.5);
        }
        
        .wallet-3d::after {
            content: 'BLAST';
            font-size: 18px;
            font-weight: 700;
            color: #f0b90b;
            letter-spacing: 8px;
            margin-top: 10px;
        }
        
        @keyframes pulse-glow {
            0%, 100% { box-shadow: 0 0 60px var(--gold-glow), inset 0 0 60px rgba(240, 185, 11, 0.1); }
            50% { box-shadow: 0 0 100px var(--gold-glow), inset 0 0 80px rgba(240, 185, 11, 0.2); }
        }
        
        /* Markets Section */
        .markets {
            padding: 80px 0;
        }
        
        .section-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 32px;
        }
        
        .section-header h2 {
            font-size: 32px;
            font-weight: 700;
        }
        
        .market-grid {
            display: grid;
            grid-template-columns: 2fr 1fr;
            gap: 32px;
        }
        
        .market-table {
            background: var(--bg-card);
            border: 1px solid var(--border);
            border-radius: 16px;
            overflow: hidden;
        }
        
        .market-header {
            display: grid;
            grid-template-columns: 2fr 1fr 1fr 1fr;
            padding: 16px 24px;
            background: var(--bg-hover);
            font-size: 13px;
            color: var(--text-secondary);
            font-weight: 500;
        }
        
        .market-row {
            display: grid;
            grid-template-columns: 2fr 1fr 1fr 1fr;
            padding: 20px 24px;
            border-bottom: 1px solid var(--border);
            align-items: center;
            transition: background 0.3s;
        }
        
        .market-row:hover {
            background: var(--bg-hover);
        }
        
        .market-row:last-child { border-bottom: none; }
        
        .token-info {
            display: flex;
            align-items: center;
            gap: 12px;
        }
        
        .token-icon {
            width: 40px;
            height: 40px;
            background: linear-gradient(135deg, #f0b90b 0%, #d4a009 100%);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            color: #000;
        }
        
        .token-name {
            font-weight: 600;
        }
        
        .token-symbol {
            font-size: 13px;
            color: var(--text-secondary);
        }
        
        .price { font-weight: 600; }
        .change { font-weight: 600; }
        .change.positive { color: var(--green); }
        .change.negative { color: var(--red); }
        .volume { color: var(--text-secondary); }
        
        /* Features Cards */
        .features-sidebar {
            display: flex;
            flex-direction: column;
            gap: 16px;
        }
        
        .feature-card {
            background: var(--bg-card);
            border: 1px solid var(--border);
            border-radius: 16px;
            padding: 24px;
            transition: all 0.3s;
        }
        
        .feature-card:hover {
            border-color: var(--gold);
            transform: translateX(8px);
        }
        
        .feature-icon {
            width: 48px;
            height: 48px;
            background: linear-gradient(135deg, rgba(240, 185, 11, 0.2) 0%, rgba(212, 160, 9, 0.1) 100%);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            margin-bottom: 16px;
            border: 1px solid var(--gold);
        }
        
        .feature-card h3 {
            font-size: 18px;
            margin-bottom: 8px;
        }
        
        .feature-card p {
            font-size: 14px;
            color: var(--text-secondary);
            margin: 0;
        }
        
        /* Footer */
        footer {
            padding: 40px 0;
            border-top: 1px solid var(--border);
            text-align: center;
            color: var(--text-muted);
            font-size: 14px;
        }
        
        /* Responsive */
        @media (max-width: 1024px) {
            .hero { grid-template-columns: 1fr; text-align: center; }
            .hero-content h1 { font-size: 48px; }
            .hero-form { margin: 0 auto; }
            .wallet-3d { width: 300px; height: 300px; }
            .market-grid { grid-template-columns: 1fr; }
            nav { display: none; }
        }
        
        @media (max-width: 640px) {
            .hero-content h1 { font-size: 36px; }
            .market-header, .market-row { 
                grid-template-columns: 1fr 1fr; 
                font-size: 14px;
            }
            .market-header > :nth-child(3),
            .market-header > :nth-child(4),
            .market-row > :nth-child(3),
            .market-row > :nth-child(4) { display: none; }
        }
    </style>
</head>
<body>
    <div class="bg-gradient"></div>
    <div class="floating-coins">
        <div class="coin" style="top: 15%; left: 8%;">B</div>
        <div class="coin" style="top: 25%; right: 12%;">E</div>
        <div class="coin" style="top: 55%; left: 5%;">$</div>
        <div class="coin" style="bottom: 25%; right: 15%;">Ξ</div>
        <div class="coin" style="top: 45%; right: 25%;">◈</div>
    </div>
    
    <div class="container">
        <header>
            <div class="logo">
                <div class="logo-icon"></div>
                <span class="logo-text">BLAST</span> Wallet
            </div>
            
            <nav>
                <a href="#markets">Markets</a>
                <a href="#features">Features</a>
                <a href="#wallet">Wallet</a>
                <a href="#more">More ↓</a>
            </nav>
            
            <div class="header-actions">
                <a href="#" class="btn btn-outline">LOG IN</a>
                <a href="#wallet" class="btn btn-gold">SIGN UP</a>
            </div>
        </header>
        
        <section class="hero">
            <div class="hero-content">
                <h1>WELCOME TO<br><span>BLAST WALLET</span></h1>
                <p class="hero-subtitle">The most secure hardware wallet experience. Style Trezor Safe 3 with PIN, passphrase & Shamir backup.</p>
                
                <div class="hero-form">
                    <input type="text" placeholder="Enter PIN to unlock" id="unlockInput" maxlength="8">
                    <div class="hero-actions">
                        <button class="btn btn-gold" onclick="unlockWallet()" style="flex: 1;">UNLOCK</button>
                        <button class="btn btn-outline" onclick="createWallet()">CREATE</button>
                    </div>
                </div>
                
                <div class="social-login">
                    <div class="social-btn" style="color: #f0b90b;">Apple</div>
                    <div class="social-btn" style="color: #f0b90b;">Google</div>
                    <div class="social-btn" style="color: #f0b90b;">Meta</div>
                </div>
                
                <div class="wallet-partners">
                    <span>Compatible with:</span>
                    <div class="partner-icons">
                        <div class="partner-icon" style="color: #f0b90b;">MetaMask</div>
                        <div class="partner-icon" style="color: #f0b90b;">Trust</div>
                        <div class="partner-icon" style="color: #f0b90b;">Coinbase</div>
                        <div class="partner-icon" style="color: #f0b90b;">Ledger</div>
                    </div>
                </div>
            </div>
            
                <div class="hero-visual">
                    <div class="wallet-3d"></div>
                </div>
        </section>
        
        <section class="markets" id="markets">
            <div class="section-header">
                <h2>Markets</h2>
                <a href="#" class="btn btn-outline" style="padding: 8px 16px; font-size: 13px;">View All →</a>
            </div>
            
            <div class="market-grid">
                <div class="market-table">
                    <div class="market-header">
                        <div>Token</div>
                        <div>Price</div>
                        <div>Change</div>
                        <div>Volume</div>
                    </div>
                    
                    <div class="market-row">
                        <div class="token-info">
                            <div class="token-icon" style="background: linear-gradient(145deg, #f0b90b, #d4a009); color: #000;">B</div>
                            <div>
                                <div class="token-name">BLAST</div>
                                <div class="token-symbol">BLAST Network</div>
                            </div>
                        </div>
                        <div class="price">$0.0052</div>
                        <div class="change positive">+6.48%</div>
                        <div class="volume">1.92%</div>
                    </div>
                    
                    <div class="market-row">
                        <div class="token-info">
                            <div class="token-icon" style="background: linear-gradient(145deg, #627eea, #4565a0); color: #fff;">E</div>
                            <div>
                                <div class="token-name">Ethereum</div>
                                <div class="token-symbol">ETH</div>
                            </div>
                        </div>
                        <div class="price">$2,928.46</div>
                        <div class="change negative">-1.92%</div>
                        <div class="volume">965.2M</div>
                    </div>
                    
                    <div class="market-row">
                        <div class="token-info">
                            <div class="token-icon" style="background: linear-gradient(145deg, #f7931a, #c7780d); color: #fff;">₿</div>
                            <div>
                                <div class="token-name">Bitcoin</div>
                                <div class="token-symbol">BTC</div>
                            </div>
                        </div>
                        <div class="price">$61,843.25</div>
                        <div class="change negative">-0.36%</div>
                        <div class="volume">1.34B</div>
                    </div>
                </div>
                
                <div class="features-sidebar">
                    <div class="feature-card">
                        <div class="feature-icon" style="color: #f0b90b; border-color: #f0b90b;">📊</div>
                        <h3>Portfolio Analysis</h3>
                        <p>Track and manage your assets across multiple chains</p>
                    </div>
                    
                    <div class="feature-card">
                        <div class="feature-icon" style="color: #f0b90b; border-color: #f0b90b;">📈</div>
                        <h3>Market Insights</h3>
                        <p>Discover new investment opportunities in real-time</p>
                    </div>
                    
                    <div class="feature-card">
                        <div class="feature-icon" style="color: #f0b90b; border-color: #f0b90b;">🔔</div>
                        <h3>Real-Time Alerts</h3>
                        <p>Get notified about price movements and transactions</p>
                    </div>
                </div>
            </div>
        </section>
        
        <footer>
            <p>2026 BLAST NETWORK - CREATED BY YOZY MATMO CHIGKITO</p>
            <p style="margin-top: 8px; font-size: 12px;">THE MOST SECURE WALLET IN THE MARKET</p>
        </footer>
    </div>
    
    <script>
        // Simple wallet functions
        async function api(path, method = 'GET', body = {}) {
            const res = await fetch('/api' + path, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: method !== 'GET' ? JSON.stringify(body) : undefined
            });
            return res.json();
        }
        
        async function unlockWallet() {
            const pin = document.getElementById('unlockInput').value;
            if (!pin || pin.length < 4) {
                alert('Please enter a valid PIN (4-8 digits)');
                return;
            }
            
            const result = await api('/wallet/unlock', 'POST', { pin });
            if (result.success) {
                alert('✅ Wallet unlocked successfully!');
                window.location.reload();
            } else {
                alert('❌ ' + result.error);
            }
        }
        
        async function createWallet() {
            const pin = prompt('Enter PIN for new wallet (4-8 digits):');
            if (!pin || pin.length < 4) {
                alert('PIN must be 4-8 digits');
                return;
            }
            
            const result = await api('/wallet/create', 'POST', { pin });
            if (result.success) {
                alert('✅ Wallet created!\\n\\nYour 12 words:\\n' + result.mnemonic + '\\n\\n⚠️ SAVE THESE WORDS SECURELY!');
            } else {
                alert('❌ ' + result.error);
            }
        }
        
        // Check wallet status on load
        async function checkStatus() {
            const status = await api('/status');
            if (status.isUnlocked) {
                document.getElementById('unlockInput').placeholder = '✅ Wallet is unlocked';
                document.getElementById('unlockInput').style.borderColor = '#0ecb81';
            }
        }
        
        checkStatus();
    </script>
</body>
</html>`);
});

app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════════════════════════╗
║                                                                   ║
║          💎 BLAST WALLET - BLASTPAD STYLE                        ║
║                                                                   ║
║   🌐 http://localhost:${PORT}                                    ║
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝
    `);
});

module.exports = app;
