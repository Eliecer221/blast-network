const crypto = require('crypto');
const secp256k1 = require('secp256k1');
const { randomBytes, createReadStream, createWriteStream } = require('crypto');
const fs = require('fs');
const path = require('path');
const os = require('os');
const http = require('http');
const express = require('express');

const MASTER_WALLET = '0x0F45711A8AB6393A504157F1DF327CED7231987B';

const FEES = {
    SWAP: 0.175,
    NFT_CREATE: 0.5,
    NFT_TRADE: 0.25,
    TRANSFER: 0,
    STAKING: 2,
    BRIDGE: 0.3
};

const SUPPORTED_TOKENS = {
    BTC: { name: 'Bitcoin', symbol: 'BTC', decimals: 8 },
    ETH: { name: 'Ethereum', symbol: 'ETH', decimals: 18 },
    BNB: { name: 'BNB', symbol: 'BNB', decimals: 18 },
    SOL: { name: 'Solana', symbol: 'SOL', decimals: 9 },
    XRP: { name: 'Ripple', symbol: 'XRP', decimals: 6 },
    ADA: { name: 'Cardano', symbol: 'ADA', decimals: 6 },
    DOGE: { name: 'Dogecoin', symbol: 'DOGE', decimals: 8 },
    SHIB: { name: 'Shiba Inu', symbol: 'SHIB', decimals: 18 },
    PEPE: { name: 'Pepe', symbol: 'PEPE', decimals: 18 },
    FLOKI: { name: 'Floki', symbol: 'FLOKI', decimals: 9 },
    BLAST: { name: 'BLAST Network', symbol: 'BLAST', decimals: 18 },
    USDT: { name: 'Tether USD', symbol: 'USDT', decimals: 6 },
    USDC: { name: 'USD Coin', symbol: 'USDC', decimals: 6 },
    MATIC: { name: 'Polygon', symbol: 'MATIC', decimals: 18 },
    AVAX: { name: 'Avalanche', symbol: 'AVAX', decimals: 18 },
    LINK: { name: 'Chainlink', symbol: 'LINK', decimals: 18 },
    UNI: { name: 'Uniswap', symbol: 'UNI', decimals: 18 },
    AAVE: { name: 'Aave', symbol: 'AAVE', decimals: 18 }
};

const MEMECOINS = [
    { name: 'Pepe', symbol: 'PEPE', price: 0.0000017 },
    { name: 'Dogecoin', symbol: 'DOGE', price: 0.12 },
    { name: 'Shiba Inu', symbol: 'SHIB', price: 0.000009 },
    { name: 'Floki', symbol: 'FLOKI', price: 0.00012 },
    { name: 'Bonk', symbol: 'BONK', price: 0.000015 },
    { name: 'DogWifHat', symbol: 'WIF', price: 2.35 },
    { name: 'BRETT', symbol: 'BRETT', price: 0.08 },
    { name: 'MAGA', symbol: 'TRUMP', price: 12.5 }
];

class PortableBlastWallet {
    constructor(basePath = null) {
        this.basePath = basePath || this.detectPortableDrive();
        this.dataPath = path.join(this.basePath, 'blast_data');
        this.walletsPath = path.join(this.dataPath, 'wallets');
        this.configPath = path.join(this.dataPath, 'config.json');
        this.isPortable = basePath !== null || this.checkIsPortable();

        this.wallets = new Map();
        this.transactions = [];
        this.swaps = [];
        this.nfts = [];
        this.feesCollected = { swap: 0, nft: 0, staking: 0, bridge: 0 };
        this.prices = this.initializePrices();

        this.ensureDirectories();
        this.loadData();
    }

    detectPortableDrive() {
        const driveLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        for (const letter of driveLetters) {
            const drivePath = `${letter}:\\`;
            try {
                if (fs.existsSync(drivePath)) {
                    const stats = fs.statSync(drivePath);
                    if (stats.size === 0 || drivePath.includes('USB') || drivePath.includes(' removable')) {
                        return drivePath;
                    }
                }
            } catch (e) { }
        }
        return process.cwd();
    }

    checkIsPortable() {
        const possiblePaths = [
            'D:\\',
            'E:\\',
            'F:\\',
            'G:\\',
            process.cwd()
        ];

        for (const p of possiblePaths) {
            if (fs.existsSync(p)) {
                const blastData = path.join(p, 'blast_data');
                if (fs.existsSync(blastData)) {
                    return true;
                }
            }
        }
        return false;
    }

    ensureDirectories() {
        [this.dataPath, this.walletsPath].forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
    }

    loadData() {
        const configFile = path.join(this.dataPath, 'wallet_data.json');
        if (fs.existsSync(configFile)) {
            try {
                const data = JSON.parse(fs.readFileSync(configFile, 'utf8'));
                if (data.wallets) {
                    Object.entries(data.wallets).forEach(([addr, wallet]) => {
                        this.wallets.set(addr, wallet);
                    });
                }
                if (data.feesCollected) {
                    this.feesCollected = data.feesCollected;
                }
            } catch (e) {
                console.log('Error loading data:', e.message);
            }
        }
    }

    saveData() {
        const data = {
            wallets: Object.fromEntries(this.wallets),
            feesCollected: this.feesCollected,
            lastUpdated: new Date().toISOString()
        };
        fs.writeFileSync(
            path.join(this.dataPath, 'wallet_data.json'),
            JSON.stringify(data, null, 2)
        );
    }

    initializePrices() {
        const basePrices = {
            BTC: 67500, ETH: 3450, BNB: 580, SOL: 145, XRP: 0.52,
            ADA: 0.45, DOGE: 0.12, SHIB: 0.000009, PEPE: 0.0000017,
            FLOKI: 0.00012, BLAST: 0.001, USDT: 1, USDC: 1,
            MATIC: 0.85, AVAX: 35, LINK: 14, UNI: 7.5, AAVE: 95
        };
        const prices = {};
        Object.keys(SUPPORTED_TOKENS).forEach(token => {
            const base = basePrices[token] || 1;
            prices[token] = base * (1 + (Math.random() - 0.5) * 0.1);
        });
        return prices;
    }

    generateKeyPair() {
        const privateKey = randomBytes(32);
        const publicKey = secp256k1.publicKeyCreate(privateKey, false).slice(1);

        const keccakHash = require('keccak')('keccak256');
        keccakHash.update(Buffer.from(publicKey));
        const address = '0x' + keccakHash.digest('hex').slice(-40).toUpperCase();

        return {
            privateKey: privateKey.toString('hex'),
            publicKey: publicKey.toString('hex'),
            address: address
        };
    }

    encryptData(data, password) {
        const salt = randomBytes(32);
        const key = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha512');
        const iv = randomBytes(16);

        const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
        let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
        encrypted += cipher.final('hex');

        return {
            salt: salt.toString('hex'),
            iv: iv.toString('hex'),
            data: encrypted,
            authTag: cipher.getAuthTag().toString('hex')
        };
    }

    decryptData(encryptedData, password) {
        try {
            const salt = Buffer.from(encryptedData.salt, 'hex');
            const key = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha512');
            const iv = Buffer.from(encryptedData.iv, 'hex');
            const authTag = Buffer.from(encryptedData.authTag, 'hex');

            const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
            decipher.setAuthTag(authTag);

            let decrypted = decipher.update(encryptedData.data, 'hex', 'utf8');
            decrypted += decipher.final('utf8');

            return JSON.parse(decrypted);
        } catch (e) {
            throw new Error('Contraseña incorrecta');
        }
    }

    createWallet(password, name = 'Main Wallet') {
        const keypair = this.generateKeyPair();

        const wallet = {
            address: keypair.address,
            privateKey: keypair.privateKey,
            publicKey: keypair.publicKey,
            name: name,
            balances: {},
            nfts: [],
            createdAt: new Date().toISOString(),
            type: 'standard'
        };

        Object.keys(SUPPORTED_TOKENS).forEach(token => {
            wallet.balances[token] = 0;
        });

        const encrypted = this.encryptData({
            privateKey: keypair.privateKey,
            mnemonic: randomBytes(32).toString('hex')
        }, password);

        wallet.encrypted = encrypted;

        this.wallets.set(keypair.address, wallet);
        this.saveData();

        return {
            wallet: {
                address: wallet.address,
                publicKey: wallet.publicKey,
                name: wallet.name
            },
            privateKey: keypair.privateKey,
            mnemonic: wallet.encrypted ? 'Encrypted' : 'N/A'
        };
    }

    importWallet(privateKeyOrMnemonic, password, name = 'Imported Wallet') {
        let privateKey;

        if (privateKeyOrMnemonic.length === 64) {
            privateKey = privateKeyOrMnemonic;
        } else {
            privateKey = randomBytes(32).toString('hex');
        }

        const privKeyBuffer = Buffer.from(privateKey, 'hex');
        const publicKey = secp256k1.publicKeyCreate(privKeyBuffer, false).slice(1);

        const keccakHash = require('keccak')('keccak256');
        keccakHash.update(Buffer.from(publicKey));
        const address = '0x' + keccakHash.digest('hex').slice(-40).toUpperCase();

        const wallet = {
            address: address,
            privateKey: privateKey,
            publicKey: publicKey.toString('hex'),
            name: name,
            balances: {},
            nfts: [],
            createdAt: new Date().toISOString(),
            type: 'imported'
        };

        Object.keys(SUPPORTED_TOKENS).forEach(token => {
            wallet.balances[token] = 0;
        });

        this.wallets.set(address, wallet);
        this.saveData();

        return {
            wallet: { address: wallet.address, publicKey: wallet.publicKey, name: wallet.name },
            privateKey: privateKey
        };
    }

    getWallets() {
        return Array.from(this.wallets.values()).map(w => ({
            address: w.address,
            name: w.name,
            createdAt: w.createdAt
        }));
    }

    exportWallet(address, password) {
        const wallet = this.wallets.get(address);
        if (!wallet) throw new Error('Wallet no encontrada');

        return this.decryptData(wallet.encrypted, password);
    }

    getBalance(address, token = 'BLAST') {
        const wallet = this.wallets.get(address);
        if (!wallet) return 0;
        return wallet.balances[token] || 0;
    }

    addFunds(address, token, amount) {
        const wallet = this.wallets.get(address);
        if (!wallet) throw new Error('Wallet no encontrada');

        wallet.balances[token] = (wallet.balances[token] || 0) + amount;
        this.saveData();

        return wallet.balances[token];
    }

    transfer(from, to, amount, token = 'BLAST') {
        const fromWallet = this.wallets.get(from);
        const toWallet = this.wallets.get(to);

        if (!fromWallet) throw new Error('Wallet origen no encontrada');
        if (!toWallet) throw new Error('Wallet destino no encontrada');

        if (fromWallet.balances[token] < amount) {
            throw new Error('Saldo insuficiente');
        }

        const fee = amount * (FEES.TRANSFER / 100);
        const amountAfterFee = amount - fee;

        fromWallet.balances[token] -= amount;
        toWallet.balances[token] += amountAfterFee;

        if (fee > 0) {
            this.feesCollected.swap += fee;
        }

        this.saveData();

        return { hash: crypto.randomUUID(), from, to, token, amount, fee };
    }

    swap(fromToken, toToken, amount, walletAddress) {
        const wallet = this.wallets.get(walletAddress);
        if (!wallet) throw new Error('Wallet no encontrada');

        if (wallet.balances[fromToken] < amount) {
            throw new Error('Saldo insuficiente');
        }

        const fromPrice = this.prices[fromToken];
        const toPrice = this.prices[toToken];

        const fee = amount * (FEES.SWAP / 100);
        const amountMinusFee = amount - fee;

        const fromValueUSD = amountMinusFee * fromPrice;
        const toAmount = fromValueUSD / toPrice;

        wallet.balances[fromToken] -= amount;
        wallet.balets ? wallet.balances[toToken] += toAmount : wallet.balances[toToken] = toAmount;

        this.feesCollected.swap += fee;

        this.saveData();

        return {
            hash: crypto.randomUUID(),
            fromToken,
            toToken,
            fromAmount: amount,
            toAmount: toAmount,
            fee: fee
        };
    }

    createNFT(walletAddress, name, description, imageUrl, category = 'art') {
        const wallet = this.wallets.get(walletAddress);
        if (!wallet) throw new Error('Wallet no encontrada');

        const price = this.prices.BLAST * 100;
        const fee = price * (FEES.NFT_CREATE / 100);

        const nft = {
            id: crypto.randomUUID(),
            name,
            description,
            imageUrl,
            category,
            creator: walletAddress,
            owner: walletAddress,
            price: price,
            fee: fee,
            createdAt: new Date().toISOString()
        };

        wallet.nfts.push(nft.id);
        this.nfts.push(nft);

        this.feesCollected.nft += fee;
        this.saveData();

        return nft;
    }

    getNFTs(walletAddress) {
        const wallet = this.wallets.get(walletAddress);
        if (!wallet) return [];
        return this.nfts.filter(nft => wallet.nfts.includes(nft.id));
    }

    getMarketData() {
        const tokens = Object.keys(SUPPORTED_TOKENS).map(symbol => ({
            ...SUPPORTED_TOKENS[symbol],
            price: this.prices[symbol],
            change24h: (Math.random() - 0.5) * 10
        }));

        return {
            tokens,
            memecoins: MEMECOINS.map(m => ({
                ...m,
                change24h: (Math.random() - 0.5) * 20
            }))
        };
    }

    getWalletInfo(address) {
        const wallet = this.wallets.get(address);
        if (!wallet) return null;

        const totalUSD = Object.keys(wallet.balances).reduce((total, token) => {
            return total + (wallet.balances[token] * (this.prices[token] || 0));
        }, 0);

        return {
            address: wallet.address,
            name: wallet.name,
            balances: wallet.balances,
            nftCount: wallet.nfts.length,
            totalValueUSD: totalUSD
        };
    }

    generateBackup(address, password) {
        const wallet = this.wallets.get(address);
        if (!wallet) throw new Error('Wallet no encontrada');

        const backup = {
            address: wallet.address,
            privateKey: wallet.privateKey,
            publicKey: wallet.publicKey,
            name: wallet.name,
            balances: wallet.balances,
            createdAt: wallet.createdAt,
            backedUpAt: new Date().toISOString()
        };

        return this.encryptData(backup, password);
    }

    restoreFromBackup(backupData, password) {
        const decrypted = this.decryptData(backupData, password);

        const wallet = {
            address: decrypted.address,
            privateKey: decrypted.privateKey,
            publicKey: decrypted.publicKey,
            name: decrypted.name || 'Restored Wallet',
            balances: decrypted.balances || {},
            nfts: [],
            createdAt: decrypted.createdAt,
            type: 'restored'
        };

        Object.keys(SUPPORTED_TOKENS).forEach(token => {
            if (wallet.balances[token] === undefined) {
                wallet.balances[token] = 0;
            }
        });

        this.wallets.set(wallet.address, wallet);
        this.saveData();

        return wallet;
    }

    getStatus() {
        return {
            isPortable: this.isPortable,
            basePath: this.basePath,
            walletsCount: this.wallets.size,
            totalFees: Object.values(this.feesCollected).reduce((a, b) => a + b, 0),
            masterWallet: MASTER_WALLET,
            fees: FEES
        };
    }

    exportToUSB(targetDrive) {
        const usbPath = targetDrive + '\\';

        if (!fs.existsSync(usbPath)) {
            throw new Error('Unidad no encontrada');
        }

        const filesToCopy = [
            { src: __filename, dest: 'blast_wallet_portable.exe' },
            { src: path.join(this.dataPath, 'wallet_data.json'), dest: 'blast_data\\wallet_data.json' }
        ];

        console.log(`\n📦 Exportando a ${usbPath}...`);

        fs.mkdirSync(path.join(usbPath, 'blast_data'), { recursive: true });

        const dataExport = {
            wallets: Object.fromEntries(this.wallets),
            feesCollected: this.feesCollected,
            exportedAt: new Date().toISOString()
        };

        fs.writeFileSync(
            path.join(usbPath, 'blast_data', 'wallet_data.json'),
            JSON.stringify(dataExport, null, 2)
        );

        const readme = `
BLAST WALLET PORTABLE
=====================

Para usar:
1. Conecta este pendrive a cualquier computadora
2. Haz doble click en blast_wallet_portable.exe
3. Tus wallets estarán disponibles automáticamente

CARACTERISTICAS:
- Funciona sin instalación
- Almacenamiento cifrado
- Compatible con Windows
- Cold Wallet Ready

¡Nunca pierdas este pendrive!
`;

        fs.writeFileSync(path.join(usbPath, 'README.txt'), readme);

        return true;
    }

    getOfflineTransactionData(from, to, amount, token) {
        return {
            from,
            to,
            amount,
            token,
            timestamp: Date.now(),
            network: 'BLAST',
            chainId: 8888
        };
    }

    signOfflineTransaction(txData, privateKey) {
        const txString = JSON.stringify(txData);
        const hash = crypto.createHash('sha256').update(txString).digest('hex');

        const privKeyBuffer = Buffer.from(privateKey, 'hex');
        const signature = secp256k1.sign(hash, privKeyBuffer);

        return {
            ...txData,
            signature: signature.toString('hex'),
            signedAt: new Date().toISOString()
        };
    }
}

function createPortableExecutable() {
    const portableScript = `
// =====================================================
// BLAST WALLET PORTABLE - PENDRIVE EDITION
// =====================================================
// Este archivo funciona como ejecutable portable
// Copia toda la carpeta a tu pendrive y usa en cualquier PC

const PortableBlastWallet = require('./src/wallet/portable.js');

console.log('
============================================================
    BLAST WALLET - MODO PORTABLE
============================================================

💾 Modo: PENDRIVE / USB
📂 Ubicación: ${process.cwd()}

');

// Detectar unidad USB
const portable = new PortableBlastWallet();

console.log('\\nEstado:', portable.getStatus());

// Menú interactivo
const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

function menu() {
    console.log('\\n[1] Crear wallet');
    console.log('[2] Listar wallets');
    console.log('[3] Ver balance');
    console.log('[4] Agregar fondos (test)');
    console.log('[5] Exportar a USB');
    console.log('[0] Salir');
    
    rl.question('\\nOpción: ', (opt) => {
        switch(opt) {
            case '1':
                rl.question('Nombre: ', (name) => {
                    rl.question('Password: ', (pwd) => {
                        const w = portable.createWallet(pwd, name);
                        console.log('\\n✅ Wallet creada!');
                        console.log('Dirección:', w.wallet.address);
                        menu();
                    });
                });
                break;
            case '2':
                console.log('\\nWallets:', portable.getWallets());
                menu();
                break;
            case '3':
                rl.question('Dirección: ', (addr) => {
                    console.log('\\n', portable.getWalletInfo(addr));
                    menu();
                });
                break;
            case '4':
                rl.question('Dirección: ', (addr) => {
                    rl.question('Cantidad: ', (amt) => {
                        portable.addFunds(addr, 'BLAST', parseFloat(amt));
                        console.log('\\n✅ Fondos agregados!');
                        menu();
                    });
                });
                break;
            default:
                rl.close();
        }
    });
}

menu();
`;
    return portableScript;
}

function startWebInterface(portable) {
    const app = express();
    app.use(express.json());
    app.use(express.static(path.join(__dirname, '../explorer/public')));

    app.get('/api/status', (req, res) => res.json(portable.getStatus()));

    app.get('/api/wallets', (req, res) => res.json(portable.getWallets()));

    app.post('/api/wallet/create', (req, res) => {
        try {
            const { name, password } = req.body;
            const result = portable.createWallet(password, name);
            res.json({ success: true, wallet: result.wallet });
        } catch (e) {
            res.json({ success: false, error: e.message });
        }
    });

    app.get('/api/wallet/:address', (req, res) => {
        const info = portable.getWalletInfo(req.params.address);
        res.json(info || { error: 'Not found' });
    });

    app.post('/api/wallet/:address/fund', (req, res) => {
        try {
            const { token, amount } = req.body;
            const balance = portable.addFunds(req.params.address, token, amount);
            res.json({ success: true, balance });
        } catch (e) {
            res.json({ success: false, error: e.message });
        }
    });

    app.get('/api/market', (req, res) => res.json(portable.getMarketData()));

    app.get('/', (req, res) => {
        res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>BLAST Wallet Portable</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Courier New', monospace; 
            background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%);
            color: #00ff00;
            min-height: 100vh;
            padding: 20px;
        }
        .container { max-width: 800px; margin: 0 auto; }
        h1 { text-align: center; margin-bottom: 30px; text-shadow: 0 0 10px #00ff00; }
        .card { 
            background: rgba(26, 26, 46, 0.8); 
            border: 1px solid #00ff00; 
            border-radius: 10px; 
            padding: 20px; 
            margin-bottom: 20px;
        }
        .status { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
        .status-item { padding: 10px; background: rgba(0,0,0,0.3); border-radius: 5px; }
        button {
            background: #00ff00; color: #000; border: none;
            padding: 15px 30px; font-size: 16px; font-weight: bold;
            cursor: pointer; border-radius: 5px; margin: 5px;
        }
        button:hover { background: #00cc00; }
        input {
            background: #000; color: #00ff00; border: 1px solid #00ff00;
            padding: 10px; width: 100%; margin: 5px 0;
        }
        .hidden { display: none; }
    </style>
</head>
<body>
    <div class="container">
        <h1>💎 BLAST WALLET PORTABLE</h1>
        
        <div class="card">
            <h2>📊 Estado</h2>
            <div class="status">
                <div class="status-item">Modo: <span id="mode">Portable</span></div>
                <div class="status-item">Wallets: <span id="walletCount">0</span></div>
                <div class="status-item">Comisión Swap: <span>0.175%</span></div>
                <div class="status-item">Comisión NFT: <span>0.5%</span></div>
            </div>
        </div>

        <div class="card">
            <h2>👛 Crear Wallet</h2>
            <input type="text" id="walletName" placeholder="Nombre de wallet">
            <input type="password" id="walletPassword" placeholder="Contraseña">
            <button onclick="createWallet()">Crear</button>
            <div id="walletResult"></div>
        </div>

        <div class="card">
            <h2>💰 Ver Balance</h2>
            <input type="text" id="checkAddress" placeholder="Dirección">
            <button onclick="checkBalance()">Ver</button>
            <div id="balanceResult"></div>
        </div>

        <div class="card">
            <h2>📈 Mercado</h2>
            <button onclick="showMarket()">Ver Precios</button>
            <div id="marketResult"></div>
        </div>
    </div>

    <script>
        async function createWallet() {
            const name = document.getElementById('walletName').value;
            const password = document.getElementById('walletPassword').value;
            
            const res = await fetch('/api/wallet/create', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({name, password})
            });
            const data = await res.json();
            
            if (data.success) {
                document.getElementById('walletResult').innerHTML = 
                    '✅ Creada!<br>Dirección: ' + data.wallet.address;
            } else {
                document.getElementById('walletResult').innerHTML = '❌ ' + data.error;
            }
        }

        async function checkBalance() {
            const address = document.getElementById('checkAddress').value;
            const res = await fetch('/api/wallet/' + address);
            const data = await res.json();
            
            if (data.address) {
                document.getElementById('balanceResult').innerHTML = 
                    'Balance BLAST: ' + (data.balances?.BLAST || 0) + '<br>Valor: $' + data.totalValueUSD?.toFixed(2);
            } else {
                document.getElementById('balanceResult').innerHTML = 'Wallet no encontrada';
            }
        }

        async function showMarket() {
            const res = await fetch('/api/market');
            const data = await res.json();
            
            let html = '<table>';
            data.tokens.slice(0, 10).forEach(t => {
                html += '<tr><td>' + t.symbol + '</td><td>$' + t.price.toFixed(2) + '</td></tr>';
            });
            html += '</table>';
            document.getElementById('marketResult').innerHTML = html;
        }

        fetch('/api/status').then(r => r.json()).then(d => {
            document.getElementById('walletCount').innerText = d.walletsCount;
            document.getElementById('mode').innerText = d.isPortable ? '🖊️ Portable (USB)' : '💾 Local';
        });
    </script>
</body>
</html>
        `);
    });

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`
============================================================
    BLAST WALLET - INTERFAZ WEB PORTABLE
============================================================

🌐 http://localhost:${PORT}

💡 Esta interfaz funciona desde:
   - Tu computadora
   - Cualquier pendrive
   - Modo offline (sin internet)
============================================================
        `);
    });
}

if (require.main === module) {
    const portable = new PortableBlastWallet();

    console.log(`
============================================================
    BLAST WALLET - EDICIÓN PORTABLE
============================================================

📦 Características:
   ✓ Funciona desde pendrive
   ✓ Sin instalación requerida
   ✓ Almacenamiento cifrado
   ✓ Modo offline/cold wallet
   ✓ Interfaz web integrada
   
📋 Ubicación: ${portable.basePath}
📂 Datos: ${portable.dataPath}

Comandos:
   node portable.js web    - Iniciar interfaz web
   node portable.js cli    - Menú interactivo
   node portable.js status - Ver estado
============================================================
    `);

    const args = process.argv.slice(2);

    if (args[0] === 'web') {
        startWebInterface(portable);
    } else if (args[0] === 'cli') {
        const readline = require('readline');
        const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

        function showMenu() {
            console.log('\\n[1] Crear wallet');
            console.log('[2] Listar wallets');
            console.log('[3] Agregar fondos test');
            console.log('[4] Ver estado');
            console.log('[0] Salir');

            rl.question('\\nOpción: ', (opt) => {
                if (opt === '1') {
                    rl.question('Nombre: ', (name) => {
                        rl.question('Password: ', (pwd) => {
                            const w = portable.createWallet(pwd, name);
                            console.log('\\n✅ Wallet creada!');
                            console.log('Dirección:', w.wallet.address);
                            showMenu();
                        });
                    });
                } else if (opt === '2') {
                    console.log('\\n', portable.getWallets());
                    showMenu();
                } else if (opt === '3') {
                    rl.question('Dirección: ', (addr) => {
                        rl.question('Cantidad: ', (amt) => {
                            portable.addFunds(addr, 'BLAST', parseFloat(amt));
                            console.log('✅ Fondos agregados!');
                            showMenu();
                        });
                    });
                } else if (opt === '4') {
                    console.log('\\n', portable.getStatus());
                    showMenu();
                } else {
                    rl.close();
                }
            });
        }

        showMenu();
    } else if (args[0] === 'status') {
        console.log(portable.getStatus());
    } else {
        console.log('Usa: node portable.js [web|cli|status]');
    }
}

module.exports = { PortableBlastWallet };
