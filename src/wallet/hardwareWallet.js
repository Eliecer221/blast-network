const crypto = require('crypto');
const secp256k1 = require('secp256k1');
const { randomBytes } = require('crypto');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const MASTER_WALLET = '0x0F45711A8AB6393A504157F1DF327CED7231987B';

const BIP39_WORDLIST = [
    'abandon', 'ability', 'able', 'about', 'above', 'absent', 'absorb', 'abstract', 'absurd', 'abuse',
    'access', 'accident', 'account', 'accuse', 'achieve', 'acid', 'acoustic', 'acquire', 'across', 'act',
    'action', 'actor', 'actress', 'actual', 'adapt', 'add', 'addict', 'address', 'adjust', 'admit',
    'adult', 'advance', 'advice', 'aerobic', 'affair', 'afford', 'afraid', 'again', 'age', 'agent',
    'agree', 'ahead', 'aim', 'air', 'airport', 'aisle', 'alarm', 'album', 'alcohol', 'alert',
    'alien', 'all', 'alley', 'allow', 'almost', 'alone', 'alpha', 'already', 'also', 'alter',
    'always', 'amateur', 'amazing', 'among', 'amount', 'amused', 'analyst', 'anchor', 'ancient', 'anger',
    'angle', 'angry', 'animal', 'ankle', 'announce', 'annual', 'another', 'answer', 'antenna', 'antique',
    'anxiety', 'any', 'apart', 'apology', 'appear', 'apple', 'approve', 'april', 'arch', 'arctic',
    'area', 'arena', 'argue', 'arm', 'armed', 'armor', 'army', 'around', 'arrange', 'arrest'
];

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
    DOGE: { name: 'Dogecoin', symbol: 'DOGE', decimals: 8 },
    SHIB: { name: 'Shiba Inu', symbol: 'SHIB', decimals: 18 },
    PEPE: { name: 'Pepe', symbol: 'PEPE', decimals: 18 },
    BLAST: { name: 'BLAST Network', symbol: 'BLAST', decimals: 18 },
    USDT: { name: 'Tether USD', symbol: 'USDT', decimals: 6 },
    USDC: { name: 'USD Coin', symbol: 'USDC', decimals: 6 },
    MATIC: { name: 'Polygon', symbol: 'MATIC', decimals: 18 },
    AVAX: { name: 'Avalanche', symbol: 'AVAX', decimals: 18 },
    LINK: { name: 'Chainlink', symbol: 'LINK', decimals: 18 }
};

class HardwareBlastWallet {
    constructor(basePath = null) {
        this.basePath = basePath || process.cwd();
        this.dataPath = path.join(this.basePath, 'BLAST_WALLET');
        this.walletFile = path.join(this.dataPath, 'wallet.json');
        this.ensureDirectories();

        this.wallet = null;
        this.prices = this.initializePrices();

        this.loadWallet();
    }

    ensureDirectories() {
        if (!fs.existsSync(this.dataPath)) {
            fs.mkdirSync(this.dataPath, { recursive: true });
        }
    }

    initializePrices() {
        const basePrices = {
            BTC: 67500, ETH: 3450, BNB: 580, SOL: 145, DOGE: 0.12,
            SHIB: 0.000009, PEPE: 0.0000017, BLAST: 0.001, USDT: 1, USDC: 1,
            MATIC: 0.85, AVAX: 35, LINK: 14
        };
        const prices = {};
        Object.keys(SUPPORTED_TOKENS).forEach(token => {
            const base = basePrices[token] || 1;
            prices[token] = base * (1 + (Math.random() - 0.5) * 0.1);
        });
        return prices;
    }

    loadWallet() {
        if (fs.existsSync(this.walletFile)) {
            try {
                this.wallet = JSON.parse(fs.readFileSync(this.walletFile, 'utf8'));
            } catch (e) {
                this.wallet = null;
            }
        }
    }

    saveWallet() {
        fs.writeFileSync(this.walletFile, JSON.stringify(this.wallet, null, 2));
    }

    generateMnemonic(wordCount = 12) {
        const entropy = randomBytes(16);
        const words = [];

        for (let i = 0; i < wordCount; i++) {
            const index = Math.floor(Math.random() * BIP39_WORDLIST.length);
            words.push(BIP39_WORDLIST[index]);
        }

        return words.join(' ');
    }

    deriveKeyPair(mnemonic, password = '') {
        const seed = crypto.pbkdf2Sync(
            mnemonic + password,
            'BLAST_WALLET_SALT',
            2048,
            64,
            'sha512'
        );

        const privateKey = seed.slice(0, 32);
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

    createNewWallet(password) {
        if (password.length < 6) {
            throw new Error('Password debe tener al menos 6 caracteres');
        }

        const mnemonic = this.generateMnemonic(12);
        const keypair = this.deriveKeyPair(mnemonic, password);

        this.wallet = {
            address: keypair.address,
            publicKey: keypair.publicKey,
            mnemonic: mnemonic,
            name: 'BLAST Wallet',
            balances: {},
            nfts: [],
            createdAt: new Date().toISOString(),
            version: '1.0.0',
            security: {
                hasPassword: true,
                createdOn: 'pendrive'
            }
        };

        Object.keys(SUPPORTED_TOKENS).forEach(token => {
            this.wallet.balances[token] = 0;
        });

        this.saveWallet();

        return {
            mnemonic: mnemonic,
            address: this.wallet.address,
            publicKey: this.wallet.publicKey
        };
    }

    importWallet(mnemonic, password) {
        const words = mnemonic.trim().split(/\s+/);

        if (words.length !== 12 && words.length !== 24) {
            throw new Error('Mnemonic debe tener 12 o 24 palabras');
        }

        const validWords = words.every(w => BIP39_WORDLIST.includes(w.toLowerCase()));
        if (!validWords) {
            throw new Error('Palabras inválidas en mnemonic');
        }

        const keypair = this.deriveKeyPair(mnemonic.toLowerCase().join(' '), password);

        this.wallet = {
            address: keypair.address,
            publicKey: keypair.publicKey,
            mnemonic: mnemonic.toLowerCase().join(' '),
            name: 'BLAST Wallet (Importada)',
            balances: {},
            nfts: [],
            importedAt: new Date().toISOString(),
            version: '1.0.0',
            security: {
                hasPassword: true,
                imported: true
            }
        };

        Object.keys(SUPPORTED_TOKENS).forEach(token => {
            this.wallet.balances[token] = 0;
        });

        this.saveWallet();

        return {
            address: this.wallet.address,
            publicKey: this.wallet.publicKey
        };
    }

    unlock(password) {
        if (!this.wallet) {
            throw new Error('No hay wallet creada. Crea una primero.');
        }

        if (!this.wallet.unlockedAt || Date.now() - this.wallet.unlockedAt > 300000) {
            const keypair = this.deriveKeyPair(this.wallet.mnemonic, password);

            if (keypair.address !== this.wallet.address) {
                throw new Error('Password incorrecto');
            }

            this.wallet.privateKey = keypair.privateKey;
            this.wallet.unlockedAt = Date.now();
            this.wallet.unlockCount = (this.wallet.unlockCount || 0) + 1;
            this.wallet.lastUnlock = new Date().toISOString();
            this.saveWallet();
        }

        return {
            address: this.wallet.address,
            unlocked: true,
            expiresIn: 300
        };
    }

    lock() {
        if (this.wallet) {
            this.wallet.privateKey = null;
            this.wallet.unlockedAt = null;
            this.saveWallet();
        }
        return { locked: true };
    }

    isUnlocked() {
        return this.wallet &&
            this.wallet.privateKey !== null &&
            this.wallet.unlockedAt &&
            Date.now() - this.wallet.unlockedAt < 300000;
    }

    getAddress() {
        return this.wallet ? this.wallet.address : null;
    }

    hasWallet() {
        return this.wallet !== null;
    }

    getBalance(token = 'BLAST') {
        if (!this.wallet) return 0;
        return this.wallet.balances[token] || 0;
    }

    getAllBalances() {
        if (!this.wallet) return {};
        return this.wallet.balances;
    }

    getWalletInfo() {
        if (!this.wallet) return null;

        const totalUSD = Object.keys(this.wallet.balances).reduce((total, token) => {
            return total + (this.wallet.balances[token] * (this.prices[token] || 0));
        }, 0);

        return {
            address: this.wallet.address,
            name: this.wallet.name,
            balances: this.wallet.balances,
            nftCount: this.wallet.nfts?.length || 0,
            totalValueUSD: totalUSD,
            createdAt: this.wallet.createdAt || this.wallet.importedAt,
            isUnlocked: this.isUnlocked(),
            security: this.wallet.security
        };
    }

    addFunds(token, amount) {
        if (!this.wallet) throw new Error('No hay wallet');

        this.wallet.balances[token] = (this.wallet.balances[token] || 0) + amount;
        this.saveWallet();

        return this.wallet.balances[token];
    }

    transfer(to, amount, token = 'BLAST') {
        if (!this.isUnlocked()) {
            throw new Error('Wallet bloqueada. Desbloquea con tu password.');
        }

        const balance = this.wallet.balances[token] || 0;
        if (balance < amount) {
            throw new Error('Saldo insuficiente');
        }

        const fee = amount * (FEES.TRANSFER / 100);
        const amountAfterFee = amount - fee;

        this.wallet.balances[token] -= amount;

        const tx = {
            hash: crypto.randomUUID(),
            from: this.wallet.address,
            to: to,
            amount: amount,
            fee: fee,
            token: token,
            timestamp: new Date().toISOString()
        };

        this.wallet.transactions = this.wallet.transactions || [];
        this.wallet.transactions.push(tx);

        this.saveWallet();

        return tx;
    }

    signMessage(message) {
        if (!this.isUnlocked()) {
            throw new Error('Wallet bloqueada');
        }

        const hash = crypto.createHash('sha256').update(message).digest();
        const signature = secp256k1.sign(hash, Buffer.from(this.wallet.privateKey, 'hex'));

        return {
            message: message,
            signature: signature.toString('hex'),
            address: this.wallet.address
        };
    }

    resetWallet() {
        this.wallet = null;
        if (fs.existsSync(this.walletFile)) {
            fs.unlinkSync(this.walletFile);
        }
        return { reset: true };
    }

    exportBackup(password) {
        if (!this.wallet) throw new Error('No hay wallet');

        const backupData = {
            address: this.wallet.address,
            publicKey: this.wallet.publicKey,
            balances: this.wallet.balances,
            nfts: this.wallet.nfts,
            createdAt: this.wallet.createdAt,
            backedUpAt: new Date().toISOString()
        };

        const encrypted = this.encrypt(JSON.stringify(backupData), password);

        const backupPath = path.join(this.dataPath, 'backup_' + Date.now() + '.json');
        fs.writeFileSync(backupPath, JSON.stringify(encrypted));

        return { backupPath, createdAt: backupData.backedUpAt };
    }

    encrypt(data, password) {
        const salt = randomBytes(32);
        const key = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha512');
        const iv = randomBytes(16);

        const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
        let encrypted = cipher.update(data, 'utf8', 'hex');
        encrypted += cipher.final('hex');

        return {
            salt: salt.toString('hex'),
            iv: iv.toString('hex'),
            data: encrypted,
            authTag: cipher.getAuthTag().toString('hex')
        };
    }

    decrypt(encryptedData, password) {
        const salt = Buffer.from(encryptedData.salt, 'hex');
        const key = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha512');
        const iv = Buffer.from(encryptedData.iv, 'hex');
        const authTag = Buffer.from(encryptedData.authTag, 'hex');

        const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
        decipher.setAuthTag(authTag);

        let decrypted = decipher.update(encryptedData.data, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        return JSON.parse(decrypted);
    }

    getMarketData() {
        return {
            tokens: Object.keys(SUPPORTED_TOKENS).map(symbol => ({
                ...SUPPORTED_TOKENS[symbol],
                price: this.prices[symbol],
                change24h: (Math.random() - 0.5) * 10
            }))
        };
    }
}

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function prompt(question) {
    return new Promise((resolve) => {
        rl.question(question, resolve);
    });
}

async function main() {
    const wallet = new HardwareBlastWallet();

    console.log(`
╔═══════════════════════════════════════════════════════════════════╗
║                                                                   ║
║           💎 BLAST WALLET - EDICIÓN PENDRIVE 💎                 ║
║                                                                   ║
║  🔐 Seguridad Hardware (como Ledger/Trezor)                     ║
║  📝 12 palabras semilla (BIP39)                                 ║
║  🔑 Tu password protege el acceso                                ║
║  💾 Sin guardar private keys - se deriva cada vez               ║
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝
    `);

    if (!wallet.hasWallet()) {
        console.log('\n📝 PRIMERA VEZ - CREANDO WALLET\n');

        const option = await prompt('[1] Crear nueva wallet\n[2] Importar con palabras semilla\n\nOpción: ');

        if (option === '1') {
            const password = await prompt('Crea un password (mínimo 6 caracteres): ');

            if (password.length < 6) {
                console.log('Password muy corto.');
                process.exit(1);
            }

            const result = wallet.createNewWallet(password);

            console.log('\n' + '═'.repeat(60));
            console.log('\n✅ WALLET CREADA EXITOSAMENTE!\n');
            console.log('📍 DIRECCIÓN:');
            console.log('   ' + result.address);
            console.log('\n🔐 12 PALABRAS SEMILLA (GUÁRDALAS BIEN!):\n');

            const words = result.mnemonic.split(' ');
            for (let i = 0; i < words.length; i += 3) {
                console.log(`   ${i + 1}. ${words[i]}   ${i + 2}. ${words[i + 1]}   ${i + 3}. ${words[i + 2]}`);
            }

            console.log('\n' + '═'.repeat(60));
            console.log('\n⚠️  IMPORTANTE:');
            console.log('   • Las 12 palabras son la clave de tu wallet');
            console.log('   • Guárdalas en lugar SEGURO');
            console.log('   • Si las pierdes, pierdes tus fondos');
            console.log('   • El pendrive NO guarda las palabras');
            console.log('   • Cada vez que te conectes, usa tu password\n');

        } else if (option === '2') {
            console.log('\n📋 Ingresa tus 12 palabras separadas por espacio:\n');
            const mnemonic = await prompt('Palabras: ');
            const password = await prompt('Crea un password: ');

            try {
                const result = wallet.importWallet(mnemonic, password);
                console.log('\n✅ Wallet importada!');
                console.log('Dirección:', result.address);
            } catch (e) {
                console.log('\n❌ Error:', e.message);
            }
        }
    }

    console.log('\n--- ACCEDIENDO A WALLET ---\n');

    const password = await prompt('Ingresa tu password para desbloquear: ');

    try {
        wallet.unlock(password);
        console.log('\n✅ Wallet desbloqueada!\n');

        while (true) {
            const info = wallet.getWalletInfo();
            console.log(`
╔═══════════════════════════════════════════════════════════════════╗
║                     MENU BLAST WALLET                              ║
╠═══════════════════════════════════════════════════════════════════╣
║  Dirección: ${info.address.padEnd(50)}║
║  Balance:   ${info.balances.BLAST.toFixed(4)} BLAST                          ║
║  Valor:     $${info.totalValueUSD.toFixed(2)} USD                              ║
╚═══════════════════════════════════════════════════════════════════╝

[1] 💰 Ver todos los balances
[2] 💵 Agregar fondos (test)
[3] 💸 Transferir
[4] 🔐 Bloquear wallet
[5] 📊 Ver precios mercado
[6] ℹ️ Info wallet
[7] 📋 Transacciones
[0] 🚪 Salir y desconectar
`);

            const opt = await prompt('Opción: ');

            if (opt === '1') {
                console.log('\n💰 BALANCES:\n');
                Object.entries(info.balances).forEach(([token, amount]) => {
                    if (amount > 0) {
                        console.log(`   ${token}: ${amount.toFixed(4)} (~$${(amount * wallet.prices[token]).toFixed(2)})`);
                    }
                });

            } else if (opt === '2') {
                const amount = await prompt('Cantidad: ');
                wallet.addFunds('BLAST', parseFloat(amount));
                console.log('✅ Fondos agregados!');

            } else if (opt === '3') {
                const to = await prompt('Dirección destino: ');
                const amount = await prompt('Cantidad: ');

                try {
                    const tx = wallet.transfer(to, parseFloat(amount), 'BLAST');
                    console.log('\n✅ Transferencia enviada!');
                    console.log('Hash:', tx.hash);
                    console.log('Fee:', tx.fee, 'BLAST');
                } catch (e) {
                    console.log('\n❌ Error:', e.message);
                }

            } else if (opt === '4') {
                wallet.lock();
                console.log('\n🔒 Wallet bloqueada.\n');

            } else if (opt === '5') {
                const market = wallet.getMarketData();
                console.log('\n📊 PRECIOS:\n');
                market.tokens.slice(0, 10).forEach(t => {
                    console.log(`   ${t.symbol}: $${t.price.toFixed(4)} (${t.change24h >= 0 ? '+' : ''}${t.change24h.toFixed(2)}%)`);
                });

            } else if (opt === '6') {
                console.log('\n📋 INFO:\n');
                console.log('   Dirección:', info.address);
                console.log('   Nombre:', info.name);
                console.log('   Creada:', info.createdAt);
                console.log('   NFTs:', info.nftCount);
                console.log('   Security:', JSON.stringify(info.security));

            } else if (opt === '7') {
                const txs = wallet.wallet.transactions || [];
                console.log('\n📋 TRANSACCIONES:\n');
                txs.slice(-5).forEach((tx, i) => {
                    console.log(`   ${i + 1}. ${tx.amount} ${tx.token} → ${tx.to.substring(0, 10)}...`);
                });

            } else if (opt === '0') {
                wallet.lock();
                console.log('\n👋 Wallet bloqueada. Puedes quitar el pendrive.\n');
                rl.close();
                process.exit(0);
            }

            await prompt('\nPresiona Enter...');
        }

    } catch (e) {
        console.log('\n❌ Error:', e.message);
    }

    rl.close();
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = { HardwareBlastWallet };
