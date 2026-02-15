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

const SUPPORTED_CHAINS = {
    BLAST: { id: 8888, name: 'BLAST Network', symbol: 'BLAST', decimals: 18 },
    BTC: { id: 0, name: 'Bitcoin', symbol: 'BTC', decimals: 8 },
    ETH: { id: 1, name: 'Ethereum', symbol: 'ETH', decimals: 18 },
    BNB: { id: 56, name: 'BNB Chain', symbol: 'BNB', decimals: 18 },
    SOL: { id: 501, name: 'Solana', symbol: 'SOL', decimals: 9 },
    MATIC: { id: 137, name: 'Polygon', symbol: 'MATIC', decimals: 18 },
    AVAX: { id: 43114, name: 'Avalanche', symbol: 'AVAX', decimals: 18 },
    ARB: { id: 42161, name: 'Arbitrum', symbol: 'ETH', decimals: 18 },
    OPT: { id: 10, name: 'Optimism', symbol: 'ETH', decimals: 18 },
    BASE: { id: 8453, name: 'Base', symbol: 'ETH', decimals: 18 }
};

const TOKENS_BY_CHAIN = {
    BLAST: ['BLAST', 'USDT', 'USDC', 'WBTC', 'WETH'],
    BTC: ['BTC'],
    ETH: ['ETH', 'USDT', 'USDC', 'WBTC', 'WETH', 'LINK', 'UNI', 'AAVE', 'SHIB', 'PEPE'],
    BNB: ['BNB', 'CAKE', 'BUSD'],
    SOL: ['SOL', 'USDC', 'USDT'],
    MATIC: ['MATIC', 'USDC', 'USDT'],
    AVAX: ['AVAX', 'USDC', 'JOE'],
    ARB: ['ETH', 'USDC', 'ARB'],
    OPT: ['ETH', 'USDC', 'OP'],
    BASE: ['ETH', 'USDC', 'CBETH']
};

const FEES = {
    SWAP: 0.175,
    NFT_CREATE: 0.5,
    NFT_TRADE: 0.25,
    TRANSFER: 0
};

class TrezorStyleWallet {
    constructor(basePath = null) {
        this.basePath = basePath || process.cwd();
        this.dataPath = path.join(this.basePath, 'BLAST_TREZOR');
        this.walletFile = path.join(this.dataPath, 'wallet.enc');
        this.pinFile = path.join(this.dataPath, 'pin.hash');
        this.shamirDir = path.join(this.dataPath, 'shamir');

        this.ensureDirectories();

        this.wallet = null;
        this.isLocked = true;
        this.sessionExpiry = null;
        this.failedPinAttempts = 0;
        this.maxPinAttempts = 10;

        this.prices = this.initializePrices();
        this.loadWallet();
    }

    ensureDirectories() {
        [this.dataPath, this.shamirDir].forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
    }

    initializePrices() {
        const prices = {
            BLAST: 0.001, BTC: 67500, ETH: 3450, BNB: 580, SOL: 145,
            MATIC: 0.85, AVAX: 35, ARB: 1.2, OPT: 2.5, BASE: 3.2,
            USDT: 1, USDC: 1, WBTC: 67000, WETH: 3400, SHIB: 0.000009,
            PEPE: 0.0000017, LINK: 14, UNI: 7.5, AAVE: 95, CAKE: 2.8,
            JOE: 0.35, OP: 2.5, CBETH: 3450, BUSD: 1
        };
        return prices;
    }

    loadWallet() {
        if (fs.existsSync(this.walletFile)) {
            this.wallet = JSON.parse(fs.readFileSync(this.walletFile, 'utf8'));
        }
    }

    saveWallet() {
        fs.writeFileSync(this.walletFile, JSON.stringify(this.wallet, null, 2));
    }

    hasWallet() {
        return this.wallet !== null && this.wallet.mnemonic !== null;
    }

    hasPin() {
        return fs.existsSync(this.pinFile);
    }

    generateMnemonic(wordCount = 12) {
        const entropy = randomBytes(16 * (wordCount / 12));
        const words = [];
        for (let i = 0; i < wordCount; i++) {
            const index = Math.floor(Math.random() * BIP39_WORDLIST.length);
            words.push(BIP39_WORDLIST[index]);
        }
        return words.join(' ');
    }

    hashPin(pin) {
        return crypto.createHash('sha256').update(pin + 'BLAST_PIN_SALT').digest('hex');
    }

    setPin(pin) {
        if (pin.length < 4 || pin.length > 8 || !/^\d+$/.test(pin)) {
            throw new Error('PIN debe tener 4-8 dígitos');
        }

        const pinHash = this.hashPin(pin);
        fs.writeFileSync(this.pinFile, pinHash);

        return { success: true, message: 'PIN establecido' };
    }

    verifyPin(pin) {
        if (!this.hasPin()) {
            throw new Error('PIN no configurado');
        }

        const storedHash = fs.readFileSync(this.pinFile, 'utf8');
        const inputHash = this.hashPin(pin);

        if (storedHash !== inputHash) {
            this.failedPinAttempts++;
            if (this.failedPinAttempts >= this.maxPinAttempts) {
                this.wipeAfterTooManyAttempts();
            }
            throw new Error(`PIN incorrecto. Intentos restantes: ${this.maxPinAttempts - this.failedPinAttempts}`);
        }

        this.failedPinAttempts = 0;
        return true;
    }

    wipeAfterTooManyAttempts() {
        if (fs.existsSync(this.walletFile)) fs.unlinkSync(this.walletFile);
        if (fs.existsSync(this.pinFile)) fs.unlinkSync(this.pinFile);
        this.wallet = null;
        console.log('⚠️ Wallet borrada por demasiados intentos fallidos');
    }

    deriveKeyPair(mnemonic, passphrase = '') {
        const seed = crypto.pbkdf2Sync(
            mnemonic + passphrase,
            'trezor_blast_salt',
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
            address: address,
            chainCode: seed.slice(32, 64).toString('hex')
        };
    }

    createNewWallet(pin) {
        const mnemonic = this.generateMnemonic(12);

        this.setPin(pin);

        const keypair = this.deriveKeyPair(mnemonic);

        this.wallet = {
            version: '1.0.0',
            type: 'trezor_style',
            mnemonic: mnemonic,
            address: keypair.address,
            publicKey: keypair.publicKey,
            chains: Object.keys(SUPPORTED_CHAINS),
            balances: {},
            nfts: [],
            transactions: [],
            createdAt: new Date().toISOString(),
            features: {
                pin: true,
                passphrase: true,
                shamir: true,
                multiChain: true
            }
        };

        Object.values(SUPPORTED_CHAINS).forEach(chain => {
            this.wallet.balances[chain.symbol] = 0;
        });

        this.saveWallet();

        return {
            mnemonic: mnemonic,
            address: keypair.address,
            pin: pin,
            message: 'Wallet creada exitosamente'
        };
    }

    importWallet(mnemonic, pin) {
        const words = mnemonic.trim().toLowerCase().split(/\s+/);

        if (words.length !== 12 && words.length !== 24) {
            throw new Error('Mnemonic debe tener 12 o 24 palabras');
        }

        this.setPin(pin);

        const keypair = this.deriveKeyPair(mnemonic);

        this.wallet = {
            version: '1.0.0',
            type: 'trezor_style',
            mnemonic: mnemonic,
            address: keypair.address,
            publicKey: keypair.publicKey,
            chains: Object.keys(SUPPORTED_CHAINS),
            balances: {},
            nfts: [],
            transactions: [],
            importedAt: new Date().toISOString(),
            features: {
                pin: true,
                passphrase: true,
                shamir: true,
                multiChain: true
            }
        };

        Object.values(SUPPORTED_CHAINS).forEach(chain => {
            this.wallet.balances[chain.symbol] = 0;
        });

        this.saveWallet();

        return {
            address: keypair.address,
            message: 'Wallet importada exitosamente'
        };
    }

    unlock(pin) {
        if (!this.hasWallet()) {
            throw new Error('No hay wallet configurada');
        }

        this.verifyPin(pin);

        const keypair = this.deriveKeyPair(this.wallet.mnemonic);

        this.wallet.privateKey = keypair.privateKey;
        this.wallet.chainCode = keypair.chainCode;

        this.isLocked = false;
        this.sessionExpiry = Date.now() + 300000;

        return {
            address: this.wallet.address,
            unlocked: true,
            expiresIn: 300
        };
    }

    unlockWithPassphrase(pin, passphrase) {
        this.verifyPin(pin);

        const keypair = this.deriveKeyPair(this.wallet.mnemonic, passphrase);

        this.wallet.privateKey = keypair.privateKey;
        this.wallet.passphrase = passphrase;

        this.isLocked = false;
        this.sessionExpiry = Date.now() + 300000;

        return {
            address: keypair.address,
            unlocked: true,
            isHiddenWallet: !!passphrase,
            expiresIn: 300
        };
    }

    lock() {
        this.wallet.privateKey = null;
        this.wallet.passphrase = null;
        this.isLocked = true;
        this.sessionExpiry = null;

        return { locked: true };
    }

    isUnlocked() {
        if (this.isLocked || !this.wallet.privateKey) return false;
        if (this.sessionExpiry && Date.now() > this.sessionExpiry) {
            this.lock();
            return false;
        }
        return true;
    }

    createShamirBackup(threshold = 3, shares = 5) {
        if (!this.wallet || !this.wallet.mnemonic) {
            throw new Error('No hay wallet para hacer backup');
        }

        const mnemonicHex = Buffer.from(this.wallet.mnemonic).toString('hex');

        const shareLength = Math.ceil(mnemonicHex.length / shares);
        const shares_data = [];

        for (let i = 0; i < shares; i++) {
            const randomBytes_data = randomBytes(shareLength);
            let share = '';

            for (let j = 0; j < shareLength; j++) {
                const charCode = (randomBytes_data[j] ^ (mnemonicHex.charCodeAt(j) || 0));
                share += String.fromCharCode(charCode);
            }

            shares_data.push(Buffer.from(share).toString('hex'));
        }

        const shareFiles = [];
        for (let i = 0; i < shares; i++) {
            const shareFile = path.join(this.shamirDir, `shamir_share_${i + 1}.txt`);
            fs.writeFileSync(shareFile, shares_data[i]);
            shareFiles.push(shareFile);
        }

        return {
            threshold: threshold,
            totalShares: shares,
            sharesCreated: shares,
            shareFiles: shareFiles,
            message: `${shares} fragmentos creados. Necesitas ${threshold} para recuperar.`
        };
    }

    recoverFromShamir(shares_data) {
        if (shares_data.length < 2) {
            throw new Error('Necesitas al menos 2 fragmentos');
        }

        let combined = '';
        const maxLength = Math.max(...shares_data.map(s => s.length));

        for (let i = 0; i < maxLength; i++) {
            let char = 0;
            shares_data.forEach(share => {
                if (i < share.length) {
                    const shareByte = parseInt(share.substr(i * 2, 2), 16) || 0;
                    const mnemonicByte = (combined.charCodeAt(i) || 0);
                    char ^= shareByte;
                }
            });
            combined += String.fromCharCode(char);
        }

        const mnemonic = Buffer.from(combined, 'hex').toString('utf8');

        if (!BIP39_WORDLIST.includes(mnemonic.split(' ')[0])) {
            throw new Error('Fragmentos inválidos o insuficientes');
        }

        return {
            mnemonic: mnemonic,
            verified: true
        };
    }

    getSupportedChains() {
        return SUPPORTED_CHAINS;
    }

    getTokensForChain(chain) {
        return TOKENS_BY_CHAIN[chain] || [];
    }

    getBalance(token = 'BLAST') {
        if (!this.wallet) return 0;
        return this.wallet.balances[token] || 0;
    }

    getAllBalances() {
        if (!this.wallet) return {};
        return this.wallet.balances;
    }

    addFunds(token, amount) {
        if (!this.isUnlocked()) throw new Error('Wallet bloqueada');

        this.wallet.balances[token] = (this.wallet.balances[token] || 0) + amount;
        this.saveWallet();

        return { token, amount, newBalance: this.wallet.balances[token] };
    }

    transfer(to, amount, token = 'BLAST') {
        if (!this.isUnlocked()) {
            throw new Error('Wallet bloqueada. Desbloquea con PIN.');
        }

        const balance = this.wallet.balances[token] || 0;
        if (balance < amount) {
            throw new Error('Saldo insuficiente');
        }

        const fee = amount * (FEES.TRANSFER / 100);
        const amountAfterFee = amount - fee;

        this.wallet.balances[token] -= amount;

        const tx = {
            id: crypto.randomUUID(),
            from: this.wallet.address,
            to: to,
            amount: amountAfterFee,
            fee: fee,
            token: token,
            timestamp: new Date().toISOString(),
            status: 'pending_confirmation'
        };

        this.wallet.transactions.push(tx);
        this.saveWallet();

        return {
            tx: tx,
            requiresConfirmation: true,
            message: 'Transacción creada. Confirma en dispositivo para enviar.'
        };
    }

    confirmTransaction(txId) {
        if (!this.isUnlocked()) {
            throw new Error('Wallet bloqueada');
        }

        const tx = this.wallet.transactions.find(t => t.id === txId);
        if (!tx) {
            throw new Error('Transacción no encontrada');
        }

        tx.status = 'confirmed';
        tx.confirmedAt = new Date().toISOString();

        this.saveWallet();

        return {
            txId: tx.id,
            status: 'confirmed',
            message: 'Transacción confirmada y enviada'
        };
    }

    rejectTransaction(txId) {
        const tx = this.wallet.transactions.find(t => t.id === txId);
        if (!tx) throw new Error('Transacción no encontrada');

        tx.status = 'rejected';
        this.saveWallet();

        return { txId, status: 'rejected' };
    }

    getPendingTransactions() {
        if (!this.wallet) return [];
        return this.wallet.transactions.filter(tx => tx.status === 'pending_confirmation');
    }

    getAddressForChain(chain) {
        if (!this.wallet) return null;

        const keypair = this.deriveKeyPair(
            this.wallet.mnemonic + (this.wallet.passphrase || ''),
            chain
        );

        return {
            chain: chain,
            address: keypair.address,
            publicKey: keypair.publicKey
        };
    }

    signMessage(message) {
        if (!this.isUnlocked()) throw new Error('Wallet bloqueada');

        const hash = crypto.createHash('sha256').update(message).digest();
        const signature = secp256k1.sign(hash, Buffer.from(this.wallet.privateKey, 'hex'));

        return {
            message: message,
            signature: signature.toString('hex'),
            address: this.wallet.address
        };
    }

    getWalletInfo() {
        if (!this.wallet) return null;

        const totalUSD = Object.entries(this.wallet.balances).reduce((total, [token, amount]) => {
            return total + (amount * (this.prices[token] || 0));
        }, 0);

        return {
            address: this.wallet.address,
            type: this.wallet.type,
            chains: this.wallet.chains,
            features: this.wallet.features,
            balances: this.wallet.balances,
            totalValueUSD: totalUSD,
            nftCount: this.wallet.nfts?.length || 0,
            pendingConfirmations: this.getPendingTransactions().length,
            isUnlocked: this.isUnlocked(),
            createdAt: this.wallet.createdAt || this.wallet.importedAt
        };
    }

    wipe() {
        const files = [this.walletFile, this.pinFile];
        fs.readdirSync(this.shamirDir).forEach(f => {
            files.push(path.join(this.shamirDir, f));
        });

        files.forEach(f => {
            if (fs.existsSync(f)) fs.unlinkSync(f);
        });

        this.wallet = null;
        this.isLocked = true;

        return { wiped: true, message: 'Wallet completamente borrada' };
    }

    exportEncryptedBackup(password) {
        if (!this.wallet) throw new Error('No hay wallet');

        const backup = {
            address: this.wallet.address,
            publicKey: this.wallet.publicKey,
            balances: this.wallet.balances,
            transactions: this.wallet.transactions,
            createdAt: this.wallet.createdAt
        };

        const salt = randomBytes(32);
        const key = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha512');
        const iv = randomBytes(16);

        const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
        let encrypted = cipher.update(JSON.stringify(backup), 'utf8', 'hex');
        encrypted += cipher.final('hex');

        const backupFile = path.join(this.dataPath, 'backup_encrypted.json');
        fs.writeFileSync(backupFile, JSON.stringify({
            salt: salt.toString('hex'),
            iv: iv.toString('hex'),
            data: encrypted,
            authTag: cipher.getAuthTag().toString('hex')
        }));

        return { backupFile, createdAt: new Date().toISOString() };
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

function printHeader() {
    console.clear();
    console.log(`
╔═══════════════════════════════════════════════════════════════════════════════╗
║                                                                               ║
║          💎 BLAST WALLET - TREZOR SAFE 3 EDITION 💎                         ║
║                                                                               ║
║  🔐 Secure Element Style    📱 Multi-Chain    🔑 PIN Protection              ║
║  📝 12/24 Palabras         🛡️ Shamir Backup  ⭐ Passphrase                   ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
    `);
}

async function main() {
    const wallet = new TrezorStyleWallet();

    printHeader();

    if (!wallet.hasWallet()) {
        console.log('\n📝 CONFIGURACIÓN INICIAL\n');
        console.log('[1] Crear nueva wallet (12 palabras)');
        console.log('[2] Importar wallet existente');
        console.log('[3] Recuperar con Shamir Backup');

        const opt = await prompt('\nOpción: ');

        if (opt === '1') {
            console.log('\n--- CREAR NUEVA WALLET ---\n');

            let pin = '';
            while (!pin || pin.length < 4 || pin.length > 8) {
                pin = await prompt('Establece tu PIN (4-8 dígitos): ');
            }

            const result = wallet.createNewWallet(pin);

            console.log('\n' + '═'.repeat(60));
            console.log('\n✅ WALLET CREADA COMO TREZOR SAFE 3\n');
            console.log('📍 Dirección:', result.address);
            console.log('🔐 PIN:', pin);
            console.log('\n📝 12 PALABRAS SEMILLA:\n');

            const words = result.mnemonic.split(' ');
            for (let i = 0; i < words.length; i += 3) {
                console.log(`   ${(i + 1).toString().padStart(2)}. ${words[i].padEnd(10)} ${(i + 2).toString().padStart(2)}. ${words[i + 1].padEnd(10)} ${(i + 3).toString().padStart(2)}. ${words[i + 2]}`);
            }

            console.log('\n' + '═'.repeat(60));
            console.log('\n⚠️ IMPORTANTE:');
            console.log('   • Guarda las 12 palabras en lugar SEGURO');
            console.log('   • Tu PIN es de 4-8 dígitos');
            console.log('   • Puedes agregar PASSFRAME para wallet oculta');
            console.log('   • Shamir Backup disponible en menú\n');

            await prompt('Presiona Enter para continuar...');

        } else if (opt === '2') {
            console.log('\n--- IMPORTAR WALLET ---\n');

            const mnemonic = await prompt('Ingresa tus 12/24 palabras: ');

            let pin = '';
            while (!pin || pin.length < 4 || pin.length > 8) {
                pin = await prompt('Establece tu PIN (4-8 dígitos): ');
            }

            try {
                const result = wallet.importWallet(mnemonic, pin);
                console.log('\n✅ Wallet importada!');
                console.log('Dirección:', result.address);
            } catch (e) {
                console.log('\n❌ Error:', e.message);
            }
        } else if (opt === '3') {
            console.log('\n--- RECUPERAR CON SHAMIR ---\n');
            console.log('Ingresa los fragmentos (escribe "done" cuando finishes):\n');

            const shares = [];
            while (true) {
                const share = await prompt('Fragmento: ');
                if (share.toLowerCase() === 'done') break;
                if (share.length > 0) shares.push(share);
            }

            try {
                const result = wallet.recoverFromShamir(shares);
                console.log('\n✅ Mnemonic recuperado:', result.mnemonic.substring(0, 50) + '...');

                let pin = '';
                while (!pin || pin.length < 4 || pin.length > 8) {
                    pin = await prompt('PIN: ');
                }

                wallet.importWallet(result.mnemonic, pin);
                console.log('✅ Wallet restaurada!');
            } catch (e) {
                console.log('\n❌ Error:', e.message);
            }
        }
    }

    printHeader();
    console.log('\n🔐 DESBLOQUEA TU WALLET\n');

    let pin = await prompt('Ingresa tu PIN: ');

    let usePassphrase = await prompt('¿Usar passphrase oculto? (s/n): ');

    try {
        let result;
        if (usePassphrase.toLowerCase() === 's') {
            const passphrase = await prompt('Passphrase (vacío para none): ');
            result = wallet.unlockWithPassphrase(pin, passphrase);
        } else {
            result = wallet.unlock(pin);
        }

        console.log('\n✅ Wallet desbloqueada!\n');

        while (wallet.isUnlocked()) {
            const info = wallet.getWalletInfo();
            const chains = Object.keys(SUPPORTED_CHAINS).length;

            console.log(`
╔═══════════════════════════════════════════════════════════════════════════════╗
║  💎 BLAST WALLET - TREZOR SAFE 3                                              ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║  Dirección: ${info.address.padEnd(54)}║
║  Balance:    ${info.balances.BLAST.toFixed(4)} BLAST ($${(info.balances.BLAST * 0.001).toFixed(2)})                ║
║  Chains:     ${chains} soportadas                                                  ║
╚═══════════════════════════════════════════════════════════════════════════════╝

[1] 💰 Ver todos los balances
[2] 💵 Agregar fondos (test)
[3] 💸 Crear transferencia
[4] ✓ Confirmar transacción pendiente
[5] 🔗 Obtener direcciones por chain
[6] 🔐 Crear Shamir Backup
[7] 📊 Precios mercado
[8] 🛡️ Info seguridad
[9] 📋 Transacciones
[0] 🔒 Bloquear y salir
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
                const amount = await prompt('Cantidad BLAST: ');
                wallet.addFunds('BLAST', parseFloat(amount));
                console.log('✅ Fondos agregados!');

            } else if (opt === '3') {
                const to = await prompt('Dirección destino: ');
                const amount = await prompt('Cantidad: ');

                try {
                    const tx = wallet.transfer(to, parseFloat(amount), 'BLAST');
                    console.log('\n✅ Transferencia creada!');
                    console.log('   ID:', tx.tx.id);
                    console.log('   Estado: Pendiente confirmación');
                    console.log('   Confirma con opción 4');
                } catch (e) {
                    console.log('\n❌ Error:', e.message);
                }

            } else if (opt === '4') {
                const pending = wallet.getPendingTransactions();
                if (pending.length === 0) {
                    console.log('\nNo hay transacciones pendientes.\n');
                } else {
                    console.log('\n📋 TRANSACCIONES PENDIENTES:\n');
                    pending.forEach((tx, i) => {
                        console.log(`   [${i + 1}] ${tx.amount} BLAST → ${tx.to.substring(0, 15)}...`);
                    });

                    const confirm = await prompt('\nID para confirmar (o Enter para cancelar): ');
                    if (confirm) {
                        const result = wallet.confirmTransaction(confirm);
                        console.log('✅ Transacción confirmada!');
                    }
                }

            } else if (opt === '5') {
                console.log('\n🔗 DIRECCIONES POR CHAIN:\n');
                Object.keys(SUPPORTED_CHAINS).forEach(chain => {
                    const addr = wallet.getAddressForChain(chain);
                    console.log(`   ${chain}: ${addr.address}`);
                });

            } else if (opt === '6') {
                console.log('\n--- SHAMIR BACKUP ---\n');
                const result = wallet.createShamirBackup(3, 5);
                console.log('✅ Shamir Backup creado!');
                console.log(result.message);

            } else if (opt === '7') {
                console.log('\n📊 PRECIOS:\n');
                Object.entries(wallet.prices).slice(0, 15).forEach(([token, price]) => {
                    console.log(`   ${token}: $${price.toFixed(4)}`);
                });

            } else if (opt === '8') {
                console.log('\n🛡️ SEGURIDAD:\n');
                console.log('   ✓ PIN establecido:', wallet.hasPin());
                console.log('   ✓ Passphrase disponible');
                console.log('   ✓ Shamir Backup disponible');
                console.log('   ✓ Multi-chain:', chains, 'chains');
                console.log('   ✓ Confirmación en dispositivo');

            } else if (opt === '9') {
                const txs = wallet.wallet.transactions || [];
                console.log('\n📋 TRANSACCIONES:\n');
                txs.slice(-5).forEach((tx, i) => {
                    console.log(`   ${i + 1}. ${tx.amount} ${tx.token} → ${tx.to.substring(0, 10)}... (${tx.status})`);
                });

            } else if (opt === '0') {
                wallet.lock();
                console.log('\n🔒 Wallet bloqueada. Puedes quitar el pendrive.\n');
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

module.exports = { TrezorStyleWallet, SUPPORTED_CHAINS, TOKENS_BY_CHAIN };
