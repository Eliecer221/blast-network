const crypto = require('crypto');
const secp256k1 = require('secp256k1');
const { randomBytes } = require('crypto');
const keccak = require('keccak');
const fs = require('fs');
const path = require('path');

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
    BTC: { name: 'Bitcoin', symbol: 'BTC', decimals: 8, type: 'native' },
    ETH: { name: 'Ethereum', symbol: 'ETH', decimals: 18, type: 'erc20' },
    BNB: { name: 'BNB', symbol: 'BNB', decimals: 18, type: 'bep20' },
    SOL: { name: 'Solana', symbol: 'SOL', decimals: 9, type: 'native' },
    XRP: { name: 'Ripple', symbol: 'XRP', decimals: 6, type: 'native' },
    ADA: { name: 'Cardano', symbol: 'ADA', decimals: 6, type: 'native' },
    DOGE: { name: 'Dogecoin', symbol: 'DOGE', decimals: 8, type: 'native' },
    SHIB: { name: 'Shiba Inu', symbol: 'SHIB', decimals: 18, type: 'erc20' },
    PEPE: { name: 'Pepe', symbol: 'PEPE', decimals: 18, type: 'erc20' },
    FLOKI: { name: 'Floki', symbol: 'FLOKI', decimals: 9, type: 'erc20' },
    BLAST: { name: 'BLAST Network', symbol: 'BLAST', decimals: 18, type: 'native' },
    USDT: { name: 'Tether USD', symbol: 'USDT', decimals: 6, type: 'erc20' },
    USDC: { name: 'USD Coin', symbol: 'USDC', decimals: 6, type: 'erc20' },
    BUSD: { name: 'Binance USD', symbol: 'BUSD', decimals: 18, type: 'bep20' },
    DAI: { name: 'Dai', symbol: 'DAI', decimals: 18, type: 'erc20' },
    MATIC: { name: 'Polygon', symbol: 'MATIC', decimals: 18, type: 'erc20' },
    AVAX: { name: 'Avalanche', symbol: 'AVAX', decimals: 18, type: 'native' },
    LINK: { name: 'Chainlink', symbol: 'LINK', decimals: 18, type: 'erc20' },
    UNI: { name: 'Uniswap', symbol: 'UNI', decimals: 18, type: 'erc20' },
    AAVE: { name: 'Aave', symbol: 'AAVE', decimals: 18, type: 'erc20' }
};

const MEMECOINS = [
    { name: 'Pepe', symbol: 'PEPE', price: 0.0000017 },
    { name: 'Dogecoin', symbol: 'DOGE', price: 0.12 },
    { name: 'Shiba Inu', symbol: 'SHIB', price: 0.000009 },
    { name: 'Floki', symbol: 'FLOKI', price: 0.00012 },
    { name: 'Bonk', symbol: 'BONK', price: 0.000015 },
    { name: 'DogWifHat', symbol: 'WIF', price: 2.35 },
    { name: 'PEPE', symbol: 'PEPE', price: 0.0000017 },
    { name: 'MOG', symbol: 'MOG', price: 0.0000008 },
    { name: 'BRETT', symbol: 'BRETT', price: 0.08 },
    { name: 'MAGA', symbol: 'TRUMP', price: 12.5 }
];

class BlastWalletCore {
    constructor() {
        this.wallets = new Map();
        this.transactions = [];
        this.swaps = [];
        this.nfts = [];
        this.feesCollected = {
            swap: 0,
            nft: 0,
            staking: 0,
            bridge: 0
        };
        this.prices = this.initializePrices();
    }

    initializePrices() {
        const prices = {};
        const tokens = Object.keys(SUPPORTED_TOKENS);
        tokens.forEach(token => {
            prices[token] = this.generateMockPrice(token);
        });
        return prices;
    }

    generateMockPrice(symbol) {
        const basePrices = {
            BTC: 67500, ETH: 3450, BNB: 580, SOL: 145, XRP: 0.52,
            ADA: 0.45, DOGE: 0.12, SHIB: 0.000009, PEPE: 0.0000017,
            FLOKI: 0.00012, BLAST: 0.001, USDT: 1, USDC: 1, BUSD: 1,
            DAI: 1, MATIC: 0.85, AVAX: 35, LINK: 14, UNI: 7.5, AAVE: 95
        };
        const base = basePrices[symbol] || 1;
        const variation = (Math.random() - 0.5) * 0.1;
        return base * (1 + variation);
    }

    generateMnemonic() {
        const entropy = randomBytes(32);
        return entropy.toString('hex');
    }

    generateKeyPair() {
        const privateKey = randomBytes(32);
        const publicKey = secp256k1.publicKeyCreate(privateKey, false).slice(1);

        const k = keccak('keccak256');
        k.update(Buffer.from(publicKey));
        const address = '0x' + k.digest('hex').slice(-40).toUpperCase();

        return {
            privateKey: privateKey.toString('hex'),
            publicKey: publicKey.toString('hex'),
            address: address
        };
    }

    createWallet(password) {
        const mnemonic = this.generateMnemonic();
        const keypair = this.generateKeyPair();

        const wallet = {
            address: keypair.address,
            privateKey: keypair.privateKey,
            publicKey: keypair.publicKey,
            mnemonic: mnemonic,
            balances: {},
            nfts: [],
            createdAt: new Date().toISOString(),
            type: 'standard'
        };

        Object.keys(SUPPORTED_TOKENS).forEach(token => {
            wallet.balances[token] = 0;
        });

        this.wallets.set(keypair.address, wallet);

        this.saveWallet(wallet, password);

        return { wallet, mnemonic };
    }

    saveWallet(wallet, password) {
        const walletsDir = path.join(__dirname, '../../wallets');
        if (!fs.existsSync(walletsDir)) {
            fs.mkdirSync(walletsDir, { recursive: true });
        }

        const data = {
            address: wallet.address,
            balances: wallet.balances,
            nfts: wallet.nfts,
            createdAt: wallet.createdAt
        };

        const encrypted = this.encryptData(data, password);

        const filename = `wallet_${wallet.address.slice(2, 8)}.json`;
        fs.writeFileSync(
            path.join(walletsDir, filename),
            JSON.stringify({ ...encrypted, version: '1.0.0' }, null, 2)
        );
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

    getBalance(address, token = 'BLAST') {
        const wallet = this.wallets.get(address);
        if (!wallet) return 0;
        return wallet.balances[token] || 0;
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

        const tx = {
            hash: crypto.randomUUID(),
            from,
            to,
            token,
            amount,
            fee,
            timestamp: new Date().toISOString(),
            type: 'transfer'
        };

        this.transactions.push(tx);

        return tx;
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
        wallet.balances[toToken] += toAmount;

        this.feesCollected.swap += fee;

        const swapRecord = {
            hash: crypto.randomUUID(),
            wallet: walletAddress,
            fromToken,
            toToken,
            fromAmount: amount,
            toAmount: toAmount,
            fee: fee,
            rate: fromPrice / toPrice,
            timestamp: new Date().toISOString()
        };

        this.swaps.push(swapRecord);

        return swapRecord;
    }

    createNFT(walletAddress, name, description, imageUrl, category = 'art') {
        const wallet = this.wallets.get(walletAddress);
        if (!wallet) throw new Error('Wallet no encontrada');

        const price = this.prices.BLAST * 100;
        const fee = price * (FEES.NFT_CREATE / 100);

        if (wallet.balances.BLAST < price + fee) {
            throw new Error('Saldo insuficiente para crear NFT');
        }

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
            createdAt: new Date().toISOString(),
            history: []
        };

        wallet.balances.BLAST -= (price + fee);
        this.feesCollected.nft += fee;

        wallet.nfts.push(nft.id);
        this.nfts.push(nft);

        return nft;
    }

    tradeNFT(nftId, buyerAddress, sellerAddress) {
        const nft = this.nfts.find(n => n.id === nftId);
        if (!nft) throw new Error('NFT no encontrado');

        const buyer = this.wallets.get(buyerAddress);
        const seller = this.wallets.get(sellerAddress);

        if (!buyer || !seller) throw new Error('Wallet no encontrada');

        const price = nft.price;
        const fee = price * (FEES.NFT_TRADE / 100);

        if (buyer.balances.BLAST < price) {
            throw new Error('Saldo insuficiente');
        }

        buyer.balances.BLAST -= price;
        seller.balances.BLAST += (price - fee);

        nft.owner = buyerAddress;
        nft.history.push({
            from: sellerAddress,
            to: buyerAddress,
            price: price,
            timestamp: new Date().toISOString()
        });

        this.feesCollected.nft += fee;

        return nft;
    }

    addLiquidity(walletAddress, tokenA, tokenB, amountA, amountB) {
        const wallet = this.wallets.get(walletAddress);
        if (!wallet) throw new Error('Wallet no encontrada');

        if (wallet.balances[tokenA] < amountA || wallet.balances[tokenB] < amountB) {
            throw new Error('Saldo insuficiente');
        }

        wallet.balances[tokenA] -= amountA;
        wallet.balances[tokenB] -= amountB;

        const poolToken = `LP-${tokenA}-${tokenB}`;
        if (!wallet.balances[poolToken]) {
            wallet.balances[poolToken] = 0;
        }

        const liquidityAmount = Math.sqrt(amountA * amountB);
        wallet.balances[poolToken] += liquidityAmount;

        return {
            poolToken,
            liquidityAmount,
            tokenA,
            tokenB,
            amountA,
            amountB
        };
    }

    getSwapPrice(fromToken, toToken, amount) {
        const fromPrice = this.prices[fromToken];
        const toPrice = this.prices[toToken];

        const fee = amount * (FEES.SWAP / 100);
        const amountMinusFee = amount - fee;

        const fromValueUSD = amountMinusFee * fromPrice;
        const toAmount = fromValueUSD / toPrice;

        return {
            fromAmount: amount,
            toAmount: toAmount,
            fee: fee,
            priceImpact: 0.1,
            rate: fromPrice / toPrice
        };
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
            })),
            topGainers: tokens.sort((a, b) => b.change24h - a.change24h).slice(0, 5),
            topLosers: tokens.sort((a, b) => a.change24h - b.change24h).slice(0, 5)
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
            balances: wallet.balances,
            nftCount: wallet.nfts.length,
            totalValueUSD: totalUSD,
            createdAt: wallet.createdAt
        };
    }

    getFeesCollected() {
        const total = Object.values(this.feesCollected).reduce((a, b) => a + b, 0);

        return {
            byType: this.feesCollected,
            total: total,
            masterWallet: MASTER_WALLET,
            breakdown: {
                swap: `${FEES.SWAP}% por swap`,
                nftCreate: `${FEES.NFT_CREATE}% por crear NFT`,
                nftTrade: `${FEES.NFT_TRADE}% por trading NFT`,
                transfer: `${FEES.TRANSFER}% por transferencia`,
                staking: `${FEES.STAKING}% por staking`,
                bridge: `${FEES.BRIDGE}% por bridge`
            }
        };
    }

    getTransactions(address, limit = 50) {
        return this.transactions
            .filter(tx => tx.from === address || tx.to === address)
            .slice(-limit)
            .reverse();
    }

    getNFTs(walletAddress) {
        const wallet = this.wallets.get(walletAddress);
        if (!wallet) return [];

        return this.nfts.filter(nft => wallet.nfts.includes(nft.id));
    }

    searchTokens(query) {
        const results = Object.values(SUPPORTED_TOKENS).filter(token =>
            token.name.toLowerCase().includes(query.toLowerCase()) ||
            token.symbol.toLowerCase().includes(query.toLowerCase())
        );

        const memecoins = MEMECOINS.filter(m =>
            m.name.toLowerCase().includes(query.toLowerCase()) ||
            m.symbol.toLowerCase().includes(query.toLowerCase())
        );

        return { tokens: results, memecoins };
    }

    simulateTrade(fromToken, toToken, amount) {
        return this.getSwapPrice(fromToken, toToken, amount);
    }

    getSupportedAssets() {
        return {
            tokens: SUPPORTED_TOKENS,
            memecoins: MEMECOINS,
            categories: ['crypto', 'stablecoins', 'defi', 'memecoins', 'nft']
        };
    }
}

const walletCore = new BlastWalletCore();

function createMasterWallet() {
    const keypair = walletCore.generateKeyPair();

    const masterWallet = {
        address: MASTER_WALLET,
        privateKey: keypair.privateKey,
        publicKey: keypair.publicKey,
        type: 'master',
        balances: {},
        createdAt: '2025-01-27T00:00:00.000Z'
    };

    Object.keys(SUPPORTED_TOKENS).forEach(token => {
        masterWallet.balances[token] = 0;
    });

    walletCore.wallets.set(MASTER_WALLET, masterWallet);

    console.log('\n' + '='.repeat(60));
    console.log('    BLAST WALLET - SISTEMA DE COMISIONES');
    console.log('='.repeat(60));
    console.log('\n📋 COMISIONES (Las más bajas del mercado):\n');
    console.log('  • Swap:            ' + FEES.SWAP + '%');
    console.log('  • Crear NFT:       ' + FEES.NFT_CREATE + '%');
    console.log('  • Trade NFT:       ' + FEES.NFT_TRADE + '%');
    console.log('  • Transferencia:   ' + FEES.TRANSFER + '% (GRATIS)');
    console.log('  • Staking:         ' + FEES.STAKING + '%');
    console.log('  • Bridge:          ' + FEES.BRIDGE + '%');
    console.log('\n💰 Wallet Madre Receptora:');
    console.log('   ' + MASTER_WALLET);
    console.log('\n' + '='.repeat(60));
    console.log('\n📦 Activos Soportados:');
    console.log('  • Tokens: ' + Object.keys(SUPPORTED_TOKENS).length);
    console.log('  • Memecoins: ' + MEMECOINS.length);
    console.log('  • NFTs: Ilimitados');
    console.log('\n' + '='.repeat(60) + '\n');

    return masterWallet;
}

createMasterWallet();

module.exports = {
    BlastWalletCore,
    walletCore,
    FEES,
    MASTER_WALLET,
    SUPPORTED_TOKENS,
    MEMECOINS
};
