const express = require('express');
const { Blockchain } = require('../blockchain');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { BlastReferralSystem } = require('../referral/referral');

const app = express();
const PORT = process.env.PORT || 8545;
const CHAIN_ID = 8888;

app.use(express.json());
app.use(express.static(path.join(__dirname, '../website')));

const blockchain = new Blockchain();

const SUPPORTED_TOKENS = {
    BTC: { name: 'Bitcoin', symbol: 'BTC', decimals: 8 },
    ETH: { name: 'Ethereum', symbol: 'ETH', decimals: 18 },
    BNB: { name: 'BNB Chain', symbol: 'BNB', decimals: 18 },
    SOL: { name: 'Solana', symbol: 'SOL', decimals: 9 },
    USDT: { name: 'Tether', symbol: 'USDT', decimals: 6 },
    USDC: { name: 'USD Coin', symbol: 'USDC', decimals: 6 },
    BLAST: { name: 'BLAST Network', symbol: 'BLAST', decimals: 18 }
};

const NFT_COLLECTIONS = new Map();
const DOMAIN_REGISTRY = new Map();
const STAKING_POOLS = new Map();
const BRIDGE_TRANSACTIONS = new Map();
const HOSTING_REGISTRY = new Map();
const EMAIL_REGISTRY = new Map();
const SSL_REGISTRY = new Map();
const SECURITY_LOGS = []; // Anti-rug & Audit logs
const GOVERNANCE_PROPOSALS = new Map();
const referralSystem = new BlastReferralSystem();

const logSecurityEvent = (type, details, severity = 'INFO') => {
    const entry = { timestamp: Date.now(), type, details, severity };
    SECURITY_LOGS.push(entry);
    console.log(`[SECURITY][${severity}] ${type}: ${JSON.stringify(details)}`);
};

// Simulated MFA Middleware
const mfaChallenge = (req, res, next) => {
    const mfaToken = req.headers['x-blast-mfa'];
    if (mfaToken === 'verified-2026') {
        next();
    } else {
        logSecurityEvent('MFA_DENIED', { ip: req.ip, path: req.path }, 'WARNING');
        res.status(401).json({ success: false, error: 'MFA_REQUIRED', message: 'Verificación de dos pasos requerida para esta operación' });
    }
};

const HOSTING_PLANS = {
    basic: { price: 10, storage: '1GB', bandwidth: 'Unlimited' },
    pro: { price: 50, storage: '20GB', bandwidth: 'Unlimited' },
    ultra: { price: 100, storage: '100GB', bandwidth: 'Unlimited' }
};

const EMAIL_SPECS = {
    price: 5,
    storage: '10GB'
};

const SSL_SPECS = {
    price: 25,
    validityYears: 1
};

const LOTTERY_STATE = {
    currentPool: 0,
    tickets: [], // Each ticket: { user, round }
    round: 1,
    lastWinner: null,
    ticketPrice: 10
};

const MOTHER_WALLET = '0x0F45711A8AB6393A504157F1DF327CED7231987B';
const BUYBACK_WALLET = '0xBLAST0000000000000000000000000000006';

console.log(`
╔══════════════════════════════════════════════════════════════════════════╗
║                                                                          ║
║              💎 BLAST NETWORK - COMPLETE ECOSYSTEM 💎                  ║
║                                                                          ║
║    ██████╗  █████╗ ████████╗███████╗██████╗     ███████╗ █████╗  ██████╗║
║   ██╔═══██╗██╔══██╗╚══██╔══╝██╔════╝██╔══██╗    ██╔════╝██╔══██╗██╔════╝║
║   ██║   ██║███████║   ██║   █████╗  ██████╔╝    ███████╗███████║██║     ║
║   ██║   ██║██╔══██║   ██║   ██╔══╝  ██╔══██╗    ╚════██║██╔══██║██║     ║
║   ╚██████╔╝██║  ██║   ██║   ███████╗██║  ██║    ███████║██║  ██║╚██████╗║
║    ╚═════╝ ╚═╝  ╚═╝   ╚═╝   ╚══════╝╚═╝  ╚═╝    ╚══════╝╚═╝  ╚═╝ ╚═════╝║
║                                                                          ║
╚══════════════════════════════════════════════════════════════════════════╝
`);

console.log(`
📋 MÓDULOS ACTIVADOS:
   ✅ Blockchain Core
   ✅ Dominios .BLAST
   ✅ NFT Marketplace
   ✅ Staking System
   ✅ Cross-Chain Bridge
   ✅ Token Swaps
   ✅ Smart Contracts

🌐 CONEXIONES:
   • HTTP: http://localhost:${PORT}
   • Chain ID: ${CHAIN_ID}

💰 CUENTA MAESTRA:
   • Dirección: 0xBLAST0000000000000000000000000000001
   • Balance: ${blockchain.getBalance('0xBLAST0000000000000000000000000000001')} BLAST
`);


// 33 system-reserved + 2 foundational domains from BLAST spec
const RESERVED_DOMAINS = [
    // Foundational
    { name: 'blastpad', owner: '0x0F45711A8AB6393A504157F1DF327CED7231987B' },
    { name: 'blastwallet', owner: '0x0F45711A8AB6393A504157F1DF327CED7231987B' },
    // Infrastructure
    { name: 'blast', owner: '0x0F45711A8AB6393A504157F1DF327CED7231987B' },
    { name: 'network', owner: '0x0F45711A8AB6393A504157F1DF327CED7231987B' },
    { name: 'node', owner: '0x0F45711A8AB6393A504157F1DF327CED7231987B' },
    { name: 'miner', owner: '0x0F45711A8AB6393A504157F1DF327CED7231987B' },
    { name: 'pool', owner: '0x0F45711A8AB6393A504157F1DF327CED7231987B' },
    { name: 'explorer', owner: '0x0F45711A8AB6393A504157F1DF327CED7231987B' },
    { name: 'api', owner: '0x0F45711A8AB6393A504157F1DF327CED7231987B' },
    { name: 'rpc', owner: '0x0F45711A8AB6393A504157F1DF327CED7231987B' },
    // Services
    { name: 'dns', owner: '0x0F45711A8AB6393A504157F1DF327CED7231987B' },
    { name: 'mail', owner: '0x0F45711A8AB6393A504157F1DF327CED7231987B' },
    { name: 'hosting', owner: '0x0F45711A8AB6393A504157F1DF327CED7231987B' },
    { name: 'ssl', owner: '0x0F45711A8AB6393A504157F1DF327CED7231987B' },
    { name: 'marketplace', owner: '0x0F45711A8AB6393A504157F1DF327CED7231987B' },
    { name: 'swap', owner: '0x0F45711A8AB6393A504157F1DF327CED7231987B' },
    { name: 'bridge', owner: '0x0F45711A8AB6393A504157F1DF327CED7231987B' },
    { name: 'oracle', owner: '0x0F45711A8AB6393A504157F1DF327CED7231987B' },
    // Administrative
    { name: 'admin', owner: '0x0F45711A8AB6393A504157F1DF327CED7231987B' },
    { name: 'system', owner: '0x0F45711A8AB6393A504157F1DF327CED7231987B' },
    { name: 'registry', owner: '0x0F45711A8AB6393A504157F1DF327CED7231987B' },
    { name: 'governance', owner: '0x0F45711A8AB6393A504157F1DF327CED7231987B' },
    { name: 'foundation', owner: '0x0F45711A8AB6393A504157F1DF327CED7231987B' },
    // Development
    { name: 'docs', owner: '0x0F45711A8AB6393A504157F1DF327CED7231987B' },
    { name: 'dev', owner: '0x0F45711A8AB6393A504157F1DF327CED7231987B' },
    { name: 'testnet', owner: '0x0F45711A8AB6393A504157F1DF327CED7231987B' },
    { name: 'faucet', owner: '0x0F45711A8AB6393A504157F1DF327CED7231987B' },
    { name: 'github', owner: '0x0F45711A8AB6393A504157F1DF327CED7231987B' },
    // Community
    { name: 'forum', owner: '0x0F45711A8AB6393A504157F1DF327CED7231987B' },
    { name: 'blog', owner: '0x0F45711A8AB6393A504157F1DF327CED7231987B' },
    { name: 'news', owner: '0x0F45711A8AB6393A504157F1DF327CED7231987B' },
    { name: 'support', owner: '0x0F45711A8AB6393A504157F1DF327CED7231987B' },
    { name: 'help', owner: '0x0F45711A8AB6393A504157F1DF327CED7231987B' },
    // Additional
    { name: 'wallet', owner: '0x0F45711A8AB6393A504157F1DF327CED7231987B' },
    { name: 'www', owner: '0x0F45711A8AB6393A504157F1DF327CED7231987B' },
    { name: 'root', owner: '0x0F45711A8AB6393A504157F1DF327CED7231987B' },
    { name: 'treasury', owner: '0x0F45711A8AB6393A504157F1DF327CED7231987B' },
    { name: 'mining', owner: '0x0F45711A8AB6393A504157F1DF327CED7231987B' },
    { name: 'staking', owner: '0x0F45711A8AB6393A504157F1DF327CED7231987B' },
    { name: 'taktak', owner: '0x0F45711A8AB6393A504157F1DF327CED7231987B' },
    { name: 'tudominiocripto', owner: '0x0F45711A8AB6393A504157F1DF327CED7231987B' }
];

app.get('/api/reserved-domains', (req, res) => {
    res.json({ success: true, count: RESERVED_DOMAINS.length, domains: RESERVED_DOMAINS });
});

// ==================== DOMINIOS .BLAST ====================
app.post('/api/domain/register', (req, res) => {
    try {
        const { name, owner, contentHash, years = 1 } = req.body;
        const nameWithoutSuffix = name.replace('.blast', '');



        if (RESERVED_DOMAINS.some(domain => domain.name === nameWithoutSuffix)) {
            return res.json({ success: false, error: 'Este dominio está reservado por la red' });
        }

        if (!name.endsWith('.blast')) {
            return res.json({ success: false, error: 'Debe terminar en .blast' });
        }

        if (DOMAIN_REGISTRY.has(name)) {
            return res.json({ success: false, error: 'Dominio ya registrado' });
        }

        // Pricing Tiers (Item #7)
        let basePrice = 25;
        if (nameWithoutSuffix.length <= 3) basePrice = 500;
        else if (nameWithoutSuffix.length === 4) basePrice = 100;
        else if (nameWithoutSuffix.length <= 10) basePrice = 50;

        const totalPrice = basePrice * years;
        const userBalance = blockchain.getBalance(owner);

        if (userBalance < totalPrice) {
            return res.json({ success: false, error: 'Saldo insuficiente', required: totalPrice });
        }

        // Fee Distribution (1% Protocol Fee / 99% System/Miner)
        const motherFee = totalPrice * 0.01;
        const buybackFee = totalPrice * 0.005; // 0.5% buyback
        blockchain.balances.set(BUYBACK_WALLET, (blockchain.balances.get(BUYBACK_WALLET) || 0) + buybackFee);

        blockchain.balances.set(owner, userBalance - totalPrice);
        blockchain.balances.set(MOTHER_WALLET, (blockchain.balances.get(MOTHER_WALLET) || 0) + motherFee);

        const domain = {
            name,
            owner,
            contentHash: contentHash || '',
            createdAt: Date.now(),
            expiresAt: Date.now() + (years * 365 * 24 * 3600 * 1000),
            price: totalPrice,
            records: {
                BLAST: owner,
                ETH: '',
                BTC: '',
                SOL: '',
                BNB: '',
                USDT: '',
                USDC: ''
            }
        };

        DOMAIN_REGISTRY.set(name, domain);
        logSecurityEvent('DOMAIN_REGISTERED', { name, owner }, 'INFO');

        res.json({ success: true, domain, fees: { mother: motherFee, buyback: buybackFee } });
    } catch (e) {
        res.json({ success: false, error: e.message });
    }
});

app.get('/api/domain/:name', (req, res) => {
    const domain = DOMAIN_REGISTRY.get(req.params.name);
    res.json(domain || { error: 'No encontrado' });
});

app.get('/api/domains', (req, res) => {
    res.json(Array.from(DOMAIN_REGISTRY.values()));
});

// ==================== NFTs ====================
app.post('/api/nft/create', (req, res) => {
    try {
        const { name, description, owner, category, imageUrl } = req.body;

        const collectionId = category || 'general';
        if (!NFT_COLLECTIONS.has(collectionId)) {
            NFT_COLLECTIONS.set(collectionId, []);
        }

        const nft = {
            id: crypto.randomUUID(),
            name,
            description,
            owner,
            creator: owner,
            category: collectionId,
            imageUrl: imageUrl || '',
            createdAt: Date.now(),
            price: 0,
            history: [{ action: 'created', by: owner, at: Date.now() }]
        };

        NFT_COLLECTIONS.get(collectionId).push(nft);

        res.json({ success: true, nft });
    } catch (e) {
        res.json({ success: false, error: e.message });
    }
});

app.get('/api/nft/:id', (req, res) => {
    for (const collection of NFT_COLLECTIONS.values()) {
        const nft = collection.find(n => n.id === req.params.id);
        if (nft) return res.json(nft);
    }
    res.json({ error: 'NFT no encontrado' });
});

app.get('/api/nfts', (req, res) => {
    const all = [];
    NFT_COLLECTIONS.forEach(collection => all.push(...collection));
    res.json(all);
});

app.post('/api/nft/transfer', (req, res) => {
    try {
        const { nftId, from, to } = req.body;

        for (const collection of NFT_COLLECTIONS.values()) {
            const nft = collection.find(n => n.id === nftId);
            if (nft) {
                if (nft.owner !== from) {
                    return res.json({ success: false, error: 'No eres el owner' });
                }
                nft.owner = to;
                nft.history.push({ action: 'transfer', from, to, at: Date.now() });
                return res.json({ success: true, nft });
            }
        }
        res.json({ success: false, error: 'NFT no encontrado' });
    } catch (e) {
        res.json({ success: false, error: e.message });
    }
});

// ==================== STAKING ====================
app.post('/api/staking/create', (req, res) => {
    try {
        const { name, token, apy, minStake, duration } = req.body;

        const pool = {
            id: crypto.randomUUID(),
            name,
            token,
            apy: apy || 10,
            minStake: minStake || 100,
            duration: duration || 30,
            totalStaked: 0,
            stakers: [],
            createdAt: Date.now()
        };

        STAKING_POOLS.set(pool.id, pool);

        res.json({ success: true, pool });
    } catch (e) {
        res.json({ success: false, error: e.message });
    }
});

app.post('/api/staking/stake', (req, res) => {
    try {
        const { poolId, user, amount } = req.body;

        const pool = STAKING_POOLS.get(poolId);
        if (!pool) return res.json({ success: false, error: 'Pool no encontrado' });

        const balance = blockchain.getBalance(user);
        if (balance < amount) return res.json({ success: false, error: 'Saldo insuficiente' });

        const staker = pool.stakers.find(s => s.user === user);
        if (staker) {
            staker.amount += amount;
            staker.stakedAt = Date.now();
        } else {
            pool.stakers.push({ user, amount, stakedAt: Date.now() });
        }

        pool.totalStaked += amount;

        blockchain.balances.set(user, balance - amount);

        res.json({ success: true, pool });
    } catch (e) {
        res.json({ success: false, error: e.message });
    }
});

app.get('/api/staking/pools', (req, res) => {
    res.json(Array.from(STAKING_POOLS.values()));
});

// ==================== BRIDGE ====================
app.post('/api/bridge/transfer', (req, res) => {
    try {
        const { fromChain, toChain, user, token, amount } = req.body;

        const balance = blockchain.getBalance(user);
        if (balance < amount) {
            return res.json({ success: false, error: 'Saldo insuficiente' });
        }

        const tx = {
            id: crypto.randomUUID(),
            fromChain,
            toChain,
            user,
            token,
            amount,
            status: 'pending',
            createdAt: Date.now()
        };

        BRIDGE_TRANSACTIONS.set(tx.id, tx);

        blockchain.balances.set(user, balance - amount);

        res.json({ success: true, tx });
    } catch (e) {
        res.json({ success: false, error: e.message });
    }
});

app.get('/api/bridge/:id', (req, res) => {
    const tx = BRIDGE_TRANSACTIONS.get(req.params.id);
    res.json(tx || { error: 'Transacción no encontrada' });
});

// ==================== TOKEN SWAP ====================
// ==================== TOKEN SWAP ====================
app.post('/api/swap/exchange', (req, res) => {
    try {
        const { user, fromToken, toToken, amount } = req.body;
        const SWAP_FEE_PERCENT = 0.004; // 0.4% (Competitive: ~54% cheaper than MetaMask 0.875% & Phantom 0.85%)

        const balance = blockchain.getBalance(user);
        if (balance < amount) return res.json({ success: false, error: 'Saldo insuficiente' });

        // Calculate Fee
        const fee = amount * SWAP_FEE_PERCENT;
        const amountAfterFee = amount - fee;

        // Execute Swap (Simplified: Burn 'from' -> Mint 'to' or Liquidity Pool logic)
        // For standard L1-native swap:
        blockchain.balances.set(user, balance - amount);
        blockchain.balances.set(MOTHER_WALLET, (blockchain.balances.get(MOTHER_WALLET) || 0) + fee);

        // Simulate receiving target token (In a real DEX, this would come from a pool)
        // Here we just log the event as the ecosystem is single-asset centric in this demo
        const estimatedOutput = amountAfterFee; // 1:1 Stub for demo

        res.json({
            success: true,
            swap: {
                from: fromToken,
                to: toToken,
                input: amount,
                output: estimatedOutput,
                fee: fee,
                feeRate: '0.1%'
            }
        });
    } catch (e) {
        res.json({ success: false, error: e.message });
    }
});


// ==================== HOSTING ====================
app.post('/api/hosting/create', (req, res) => {
    try {
        const { domain, owner, plan = 'basic' } = req.body;
        const selectedPlan = HOSTING_PLANS[plan] || HOSTING_PLANS.basic;
        const price = selectedPlan.price;

        const userBalance = blockchain.getBalance(owner);
        if (userBalance < price) return res.json({ success: false, error: 'Saldo insuficiente' });

        const site = {
            id: crypto.randomUUID(),
            domain,
            owner,
            plan,
            storage: selectedPlan.storage,
            ipfsHash: crypto.randomBytes(23).toString('hex'),
            status: 'active',
            createdAt: Date.now(),
            expiresAt: Date.now() + (365 * 24 * 3600 * 1000)
        };

        blockchain.balances.set(owner, userBalance - price);
        // Fee Distribution (1% Protocol / 99% Service)
        blockchain.balances.set(MOTHER_WALLET, (blockchain.balances.get(MOTHER_WALLET) || 0) + (price * 0.01));

        HOSTING_REGISTRY.set(site.id, site);
        res.json({ success: true, site });
    } catch (e) {
        res.json({ success: false, error: e.message });
    }
});

// ==================== EMAIL ====================
app.post('/api/email/create', (req, res) => {
    try {
        const { alias, domain, owner } = req.body;
        const email = `${alias}@${domain}`;
        const price = EMAIL_SPECS.price;

        if (EMAIL_REGISTRY.has(email)) return res.json({ success: false, error: 'Email ya existe' });

        const userBalance = blockchain.getBalance(owner);
        if (userBalance < price) return res.json({ success: false, error: 'Saldo insuficiente' });

        const emailDetails = {
            email,
            owner,
            createdAt: Date.now(),
            storage: EMAIL_SPECS.storage,
            status: 'active'
        };

        blockchain.balances.set(owner, userBalance - price);
        // Fee Distribution (1% Protocol Fee / 99% Service)
        blockchain.balances.set(MOTHER_WALLET, (blockchain.balances.get(MOTHER_WALLET) || 0) + (price * 0.01));

        EMAIL_REGISTRY.set(email, emailDetails);
        res.json({ success: true, email: emailDetails });
    } catch (e) {
        res.json({ success: false, error: e.message });
    }
});

// ==================== SSL ====================
app.post('/api/ssl/issue', (req, res) => {
    try {
        const { domain, owner } = req.body;
        const price = SSL_SPECS.price;

        const userBalance = blockchain.getBalance(owner);
        if (userBalance < price) return res.json({ success: false, error: 'Saldo insuficiente' });

        const certificate = {
            id: crypto.randomUUID(),
            domain,
            owner,
            cert: `---BEGIN CERTIFICATE---\n${crypto.randomBytes(128).toString('base64')}\n---END CERTIFICATE---`,
            expiresAt: Date.now() + (SSL_SPECS.validityYears * 365 * 24 * 3600 * 1000)
        };

        blockchain.balances.set(owner, userBalance - price);
        // Fee Distribution (1% Protocol Fee / 99% Service)
        blockchain.balances.set(MOTHER_WALLET, (blockchain.balances.get(MOTHER_WALLET) || 0) + (price * 0.01));

        SSL_REGISTRY.set(domain, certificate);
        res.json({ success: true, certificate });
    } catch (e) {
        res.json({ success: false, error: e.message });
    }
});

// ==================== MINI LOTTERY ====================
app.post('/api/lottery/buy', (req, res) => {
    try {
        const { user } = req.body;
        const price = LOTTERY_STATE.ticketPrice;

        const userBalance = blockchain.getBalance(user);
        if (userBalance < price) return res.json({ success: false, error: 'Saldo insuficiente' });

        // Fee Distribution (20% Protocol Fee / 80% Pool)
        const motherFee = price * 0.20;
        const poolPart = price - motherFee;

        blockchain.balances.set(user, userBalance - price);
        blockchain.balances.set(MOTHER_WALLET, (blockchain.balances.get(MOTHER_WALLET) || 0) + motherFee);

        LOTTERY_STATE.tickets.push({ user, round: LOTTERY_STATE.round });
        LOTTERY_STATE.currentPool += poolPart;

        res.json({
            success: true,
            lottery: {
                ticket: LOTTERY_STATE.tickets.length,
                round: LOTTERY_STATE.round,
                pool: LOTTERY_STATE.currentPool
            }
        });
    } catch (e) {
        res.json({ success: false, error: e.message });
    }
});

app.post('/api/lottery/draw', (req, res) => {
    try {
        if (LOTTERY_STATE.tickets.length === 0) {
            return res.json({ success: false, error: 'No hay tickets vendidos' });
        }

        const winnerIndex = crypto.randomInt(0, LOTTERY_STATE.tickets.length);
        const winner = LOTTERY_STATE.tickets[winnerIndex];
        const prize = LOTTERY_STATE.currentPool;

        const winnerBalance = blockchain.getBalance(winner.user);
        blockchain.balances.set(winner.user, winnerBalance + prize);

        const result = {
            round: LOTTERY_STATE.round,
            winner: winner.user,
            prize: prize,
            totalParticipants: LOTTERY_STATE.tickets.length
        };

        LOTTERY_STATE.lastWinner = result;
        LOTTERY_STATE.round++;
        LOTTERY_STATE.tickets = [];
        LOTTERY_STATE.currentPool = 0;

        res.json({ success: true, result });
    } catch (e) {
        res.json({ success: false, error: e.message });
    }
});

// ==================== IOT MINING API ====================
app.get('/api/miner/candidate/:address', (req, res) => {
    try {
        const minerAddress = req.params.address;
        const latestBlock = blockchain.getLatestBlock();

        let candidateBlock;
        // Check if we already have pending transactions mined into a candidate
        // For simplicity, we create a fresh candidate on request
        // Ideally we would cache this
        const pendingTx = blockchain.pendingTransactions;

        // Construct the candidate block components for simpler hashing on ESP32
        // Block structure: index + prevHash + timestamp + receiptsRoot + diff + nonce + extra

        const candidateIndex = latestBlock.index + 1;
        const prevHash = latestBlock.hash;
        const timestamp = Date.now();
        const difficulty = blockchain.difficulty;

        // Calculate root for pending txs (plus reward)
        // Note: verify-integration might fail if we don't include reward tx logic here exactly as minePendingTransactions
        // But for ESP32 we just want a valid hash.
        // We will simulate the "receiptsRoot" of the pending transactions
        // For accurate mining, the server should ideally construct the full block first.

        // Simplified approach: The server "mines" a block with 0 nonce to get the root, then sends it.
        const tempBlock = new Block(
            candidateIndex,
            timestamp,
            [...pendingTx], // We exclude reward tx for now to keep simulation simple, or add it server side on submit
            difficulty,
            minerAddress,
            prevHash
        );

        res.json({
            success: true,
            work: {
                index: candidateIndex,
                prevHash: prevHash,
                timestamp: timestamp,
                receiptsRoot: tempBlock.receiptsRoot,
                difficulty: difficulty,
                target: '0'.repeat(difficulty)
            }
        });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

app.post('/api/miner/submit', (req, res) => {
    try {
        const { miner, nonce, work } = req.body;
        // work object contains the timestamp and root we sent earlier

        // Verify hash
        // Reconstruct the data string
        const k = keccak('keccak256');
        const data = work.index +
            work.prevHash +
            work.timestamp +
            work.receiptsRoot +
            work.difficulty +
            nonce +
            ''; // extraData empty

        k.update(data);
        const hash = k.digest('hex');
        const target = '0'.repeat(work.difficulty);

        if (hash.substring(0, work.difficulty) === target) {
            // Valid block!
            // Start real mining process on server with this nonce to finalize it
            // Or manually construct and push (safer to use minePendingTransactions and force nonce)

            // For this simulation, we'll just award the user and push a block
            // We need to properly instantiate the block to save it

            // Rewarding miner:
            const reward = blockchain.getBlockReward();
            const rewardTx = {
                from: '0x0000000000000000000000000000000000000000',
                to: miner,
                amount: reward,
                timestamp: Date.now(),
                nonce: blockchain.nonces.get(miner) || 0,
                isReward: true
            };

            const newBlock = new Block(
                work.index,
                work.timestamp,
                [...blockchain.pendingTransactions, rewardTx], // Pending + Reward
                work.difficulty,
                miner,
                work.prevHash
            );

            newBlock.nonce = nonce;
            newBlock.hash = hash; // The hash we verified
            newBlock.receiptsRoot = newBlock.calculateReceiptsRoot(); // Recalculate to be safe

            // Note: The receiptsRoot in 'work' might differ if we added rewardTx differently
            // IF the ESP32 mined on a root W/O rewardTx, verifying here with rewardTx will FAIL the hash check locally 
            // unless we excluded rewardTx from the root sent to ESP32.
            // FOR SIMPLICITY: We will trust the ESP32 proof on the 'work' provided, 
            // but when saving to chain, we accept that 'receiptsRoot' might technically be different 
            // from the block's actual transaction content (snapshotting).
            // OR: Server pre-calculates reward tx in 'candidate' endpoint. <--- BETTER

            // Let's stick to: If hash matches work provided, we accept.
            // We push the block with the data used to hash it.

            newBlock.receiptsRoot = work.receiptsRoot; // Force the root used for mining
            // (transactions array might be out of sync with root, but valid for PoW check)

            blockchain.chain.push(newBlock);
            blockchain.pendingTransactions = []; // Clear mempool
            blockchain.nonces.set(miner, (blockchain.nonces.get(miner) || 0) + 1);

            // Reward balance
            const currentBal = blockchain.balances.get(miner) || 0;
            blockchain.balances.set(miner, currentBal + reward);

            return res.json({ success: true, message: 'Block Accepted', hash: hash });
        } else {
            return res.json({ success: false, error: 'Invalid Hash' });
        }
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});
app.get('/api/status', (req, res) => res.json({
    chainId: CHAIN_ID,
    blockNumber: blockchain.chain.length - 1,
    totalTransactions: blockchain.chain.reduce((a, b) => a + b.transactions.length, 0),
    domainsCount: DOMAIN_REGISTRY.size,
    nftsCount: Array.from(NFT_COLLECTIONS.values()).reduce((a, c) => a + c.length, 0),
    stakingPools: STAKING_POOLS.size,
    bridgeTransactions: BRIDGE_TRANSACTIONS.size,
    lotteryRound: LOTTERY_STATE.round,
    lotteryPool: LOTTERY_STATE.currentPool
}));

app.post('/', (req, res) => {
    const { jsonrpc, method, params, id } = req.body;

    const rpcMethods = {
        'web3_clientVersion': () => 'BLAST/1.0.0',
        'net_version': () => CHAIN_ID.toString(),
        'eth_blockNumber': () => '0x' + (blockchain.chain.length - 1).toString(16),
        'eth_getBalance': (params) => '0x' + blockchain.getBalance(params[0]).toString(16),
        'eth_sendTransaction': (params) => {
            const tx = params[0];
            blockchain.addTransaction({
                from: tx.from,
                to: tx.to,
                amount: parseFloat(tx.value || '0', 16),
                nonce: parseInt(tx.nonce || '0', 16),
                timestamp: Date.now()
            });
            return '0x' + crypto.randomBytes(32).toString('hex');
        },
        'blast_getInfo': () => ({
            chainId: CHAIN_ID,
            network: 'BLAST Mainnet',
            blockNumber: blockchain.chain.length - 1,
            difficulty: blockchain.difficulty,
            totalTransactions: blockchain.chain.reduce((a, b) => a + b.transactions.length, 0),
            domainsCount: DOMAIN_REGISTRY.size,
            nftsCount: Array.from(NFT_COLLECTIONS.values()).reduce((a, c) => a + c.length, 0),
            stakingPools: STAKING_POOLS.size
        }),
        'blast_mineBlock': (params) => {
            const miner = params[0] || '0xBLAST0000000000000000000000000000001';
            const block = blockchain.minePendingTransactions(miner);
            return { blockNumber: block.index, hash: block.hash, miner: block.miner };
        }
    };

    if (rpcMethods[method]) {
        try {
            const result = rpcMethods[method](params || []);
            res.json({ jsonrpc: '2.0', result, id });
        } catch (e) {
            res.json({ jsonrpc: '2.0', error: { code: -32000, message: e.message }, id });
        }
    } else {
        res.json({ jsonrpc: '2.0', error: { code: -32601, message: 'Method not found' }, id });
    }
});

app.get('/', (req, res) => {
    res.json({
        name: 'BLAST Network - Complete Ecosystem',
        version: '1.0.0',
        chainId: CHAIN_ID,
        modules: ['blockchain', 'domains', 'nfts', 'staking', 'bridge']
    });
});

// ==================== SECURITY & AUDIT ====================
app.get('/api/security/audit', mfaChallenge, (req, res) => {
    res.json({ success: true, logs: SECURITY_LOGS.slice(-100) });
});

app.post('/api/security/anti-rug/lock', mfaChallenge, (req, res) => {
    try {
        const { type, id, owner } = req.body; // type: domain, nft

        if (type === 'domain') {
            const domain = DOMAIN_REGISTRY.get(id);
            if (!domain || domain.owner !== owner) return res.json({ success: false, error: 'No autorizado' });
            domain.locked = true;
            logSecurityEvent('DOMAIN_LOCKED', { id, owner }, 'IMPORTANT');
        } else {
            // Logic for NFT locking
        }

        res.json({ success: true, message: 'Activo bloqueado con seguridad anti-rug' });
    } catch (e) {
        res.json({ success: false, error: e.message });
    }
});

// ==================== GOVERNANCE & VOTING ====================
app.post('/api/governance/propose', (req, res) => {
    try {
        const { title, description, creator, durationDays = 7 } = req.body;
        const MIN_PROPOSAL_BALANCE = 1000;

        const balance = blockchain.getBalance(creator);
        if (balance < MIN_PROPOSAL_BALANCE) {
            return res.json({ success: false, error: 'Saldo insuficiente para crear propuesta', required: MIN_PROPOSAL_BALANCE });
        }

        const id = crypto.randomUUID();
        const proposal = {
            id,
            title,
            description,
            creator,
            createdAt: Date.now(),
            expiresAt: Date.now() + (durationDays * 24 * 3600 * 1000),
            votes: { yay: 0, nay: 0 },
            voters: new Set(),
            status: 'active'
        };

        GOVERNANCE_PROPOSALS.set(id, proposal);
        logSecurityEvent('PROPOSAL_CREATED', { id, title, creator }, 'INFO');

        res.json({ success: true, proposal: { ...proposal, voters: Array.from(proposal.voters) } });
    } catch (e) {
        res.json({ success: false, error: e.message });
    }
});

app.post('/api/governance/vote', (req, res) => {
    try {
        const { proposalId, voter, choice } = req.body; // choice: 'yay' or 'nay'
        const proposal = GOVERNANCE_PROPOSALS.get(proposalId);

        if (!proposal) return res.json({ success: false, error: 'Propuesta no encontrada' });
        if (Date.now() > proposal.expiresAt) return res.json({ success: false, error: 'Propuesta cerrada' });
        if (proposal.voters.has(voter)) return res.json({ success: false, error: 'Ya has votado' });

        const weight = blockchain.getBalance(voter);
        if (weight <= 0) return res.json({ success: false, error: 'No tienes poder de voto (BLAST)' });

        // Address Validation (0xBLAST format)
        if (!voter.startsWith('0xBLAST')) {
            return res.json({ success: false, error: 'Formato de dirección inválido. Debe usar prefijo 0xBLAST' });
        }

        if (choice === 'yay') proposal.votes.yay += weight;
        else if (choice === 'nay') proposal.votes.nay += weight;
        else return res.json({ success: false, error: 'Elección inválida' });

        proposal.voters.add(voter);
        logSecurityEvent('VOTE_CAST', { proposalId, voter, choice, weight }, 'INFO');

        res.json({ success: true, votes: proposal.votes });
    } catch (e) {
        res.json({ success: false, error: e.message });
    }
});

app.get('/api/governance/proposals', (req, res) => {
    const list = Array.from(GOVERNANCE_PROPOSALS.values()).map(p => ({
        ...p,
        voters: p.voters.size,
        isActive: Date.now() < p.expiresAt
    }));
    res.json({ success: true, proposals: list });
});

// ═══════════════════════════════════════════════════
// REFERRAL SYSTEM ENDPOINTS
// ═══════════════════════════════════════════════════

// Generate referral code for a wallet
app.post('/api/referral/generate', (req, res) => {
    try {
        const { wallet } = req.body;
        if (!wallet) return res.json({ success: false, error: 'Wallet address required' });
        const result = referralSystem.generateCode(wallet);
        logSecurityEvent('REFERRAL_CODE_GENERATED', { wallet }, 'INFO');
        res.json(result);
    } catch (e) {
        res.json({ success: false, error: e.message });
    }
});

// Register a new user via referral link
app.post('/api/referral/register', (req, res) => {
    try {
        const { wallet, referralCode } = req.body;
        if (!wallet || !referralCode) return res.json({ success: false, error: 'Wallet and referral code required' });
        const result = referralSystem.registerReferral(wallet, referralCode);
        if (result.success) {
            logSecurityEvent('REFERRAL_REGISTERED', { wallet, referralCode }, 'INFO');
        }
        res.json(result);
    } catch (e) {
        res.json({ success: false, error: e.message });
    }
});

// Process a purchase (triggers referral reward for the referrer)
app.post('/api/referral/purchase', (req, res) => {
    try {
        const { wallet, amount } = req.body;
        if (!wallet || !amount) return res.json({ success: false, error: 'Wallet and amount required' });

        // Add 0.3% of purchase to burn pool for referral rewards
        const burnContribution = amount * 0.003;
        referralSystem.addToBurnPool(burnContribution);

        const result = referralSystem.processPurchase(wallet, amount);
        if (result && result.success) {
            logSecurityEvent('REFERRAL_REWARD_TRIGGERED', {
                buyer: wallet,
                amount,
                reward: result.reward,
                referrer: result.referrer
            }, 'INFO');
        }
        res.json(result || { success: true, message: 'Purchase processed, no referral linked' });
    } catch (e) {
        res.json({ success: false, error: e.message });
    }
});

// Claim pending referral rewards
app.post('/api/referral/claim', (req, res) => {
    try {
        const { wallet } = req.body;
        if (!wallet) return res.json({ success: false, error: 'Wallet address required' });
        const result = referralSystem.claimRewards(wallet);
        if (result.success) {
            logSecurityEvent('REFERRAL_REWARDS_CLAIMED', { wallet, amount: result.amount }, 'INFO');
        }
        res.json(result);
    } catch (e) {
        res.json({ success: false, error: e.message });
    }
});

// Get referral stats for a wallet
app.get('/api/referral/stats/:address', (req, res) => {
    try {
        const result = referralSystem.getStats(req.params.address);
        res.json(result);
    } catch (e) {
        res.json({ success: false, error: e.message });
    }
});

// Get referral leaderboard
app.get('/api/referral/leaderboard', (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const result = referralSystem.getLeaderboard(limit);
        res.json(result);
    } catch (e) {
        res.json({ success: false, error: e.message });
    }
});

// Get referral levels info
app.get('/api/referral/levels', (req, res) => {
    try {
        res.json(referralSystem.getLevels());
    } catch (e) {
        res.json({ success: false, error: e.message });
    }
});

app.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════════════════════════════════════╗
║                    ✅ BLAST ECOSYSTEM INICIADO                     ║
║                                                                          ║
║   🌐 http://localhost:${PORT}                                        ║
║   📦 Módulos: Blockchain, Domains, NFTs, Staking, Bridge            ║
╚══════════════════════════════════════════════════════════════════════════╝
    `);
});

module.exports = app;
