const crypto = require('crypto');
const keccak = require('keccak');
const secp256k1 = require('secp256k1');
const { randomBytes } = require('crypto');

const CHAIN_ID = 8888;
const NETWORK_ID = 8888;
const BLOCK_TIME = 15;
const GAS_LIMIT = 30000000;
const DECIMALS = 18;
const MAX_SUPPLY = 42000000;
const INITIAL_REWARD = 50;
const HALVING_INTERVAL = 210000;

class Block {
    constructor(index, timestamp, transactions, difficulty, miner, previousHash = '') {
        this.index = index;
        this.timestamp = timestamp;
        this.transactions = transactions;
        this.difficulty = difficulty;
        this.miner = miner;
        this.previousHash = previousHash;
        this.hash = '';
        this.nonce = 0;
        this.gasUsed = 0;
        this.gasLimit = GAS_LIMIT;
        this.extraData = '';
        this.receiptsRoot = this.calculateReceiptsRoot();
    }

    calculateReceiptsRoot() {
        const receipts = this.transactions.map(tx => this.calculateTransactionHash(tx));
        return crypto.createHash('sha256').update(JSON.stringify(receipts)).digest('hex');
    }

    calculateTransactionHash(tx) {
        return crypto.createHash('sha256')
            .update(tx.from + tx.to + tx.amount + tx.nonce + tx.timestamp)
            .digest('hex');
    }

    calculateHash() {
        const k = keccak('keccak256');
        const data = this.index +
            this.previousHash +
            this.timestamp +
            this.receiptsRoot +
            this.difficulty +
            this.nonce +
            this.extraData;
        k.update(data);
        return k.digest('hex');
    }

    mineBlock(difficulty) {
        const target = '0'.repeat(difficulty);
        while (this.hash.substring(0, difficulty) !== target) {
            this.nonce++;
            this.hash = this.calculateHash();
        }
    }

    hasValidHash() {
        const hash = this.calculateHash();
        const target = '0'.repeat(this.difficulty);
        return hash.substring(0, this.difficulty) === target;
    }
}

class Blockchain {
    constructor() {
        this.chain = [];
        this.difficulty = 1;
        this.pendingTransactions = [];
        this.miners = new Map();
        this.stakers = new Map();
        this.balances = new Map();
        this.nonces = new Map();
        this.initGenesis();
    }

    initGenesis() {
        const genesisBlock = new Block(
            0,
            Date.now(),
            [],
            1,
            '0xBLAST0000000000000000000000000000001',
            '0'.repeat(64)
        );

        genesisBlock.hash = genesisBlock.calculateHash();

        // Distribución 80/20: 80% Minería (33,600,000) / 20% Genesis (8,400,000)
        this.balances.set('0x0F45711A8AB6393A504157F1DF327CED7231987B', 8400000);

        this.chain.push(genesisBlock);
    }

    getLatestBlock() {
        return this.chain[this.chain.length - 1];
    }

    addTransaction(transaction) {
        const from = transaction.from;
        const amount = parseFloat(transaction.amount);
        const balance = this.balances.get(from) || 0;
        const nonce = this.nonces.get(from) || 0;

        // Comisión del 1% por transacción → Wallet Madre
        const MOTHER_WALLET = '0x0F45711A8AB6393A504157F1DF327CED7231987B';
        const TX_FEE_RATE = 0.01; // 1%
        const fee = amount * TX_FEE_RATE;
        const totalCost = amount + fee;

        if (balance < totalCost) {
            throw new Error('Insufficient balance (amount + 1% fee)');
        }

        if (transaction.nonce !== nonce) {
            throw new Error('Invalid nonce');
        }

        // Guardar fee en la transacción para transparencia
        transaction.fee = fee;
        transaction.netAmount = amount - 0; // el destinatario recibe el monto completo, fee se cobra aparte

        this.pendingTransactions.push(transaction);
        this.balances.set(from, balance - totalCost);

        // Acreditar fee a la Wallet Madre
        const motherBalance = this.balances.get(MOTHER_WALLET) || 0;
        this.balances.set(MOTHER_WALLET, motherBalance + fee);

        return this.getLatestBlock().index + 1;
    }

    minePendingTransactions(minerAddress) {
        const reward = this.getBlockReward();
        const rewardTx = {
            from: '0x0000000000000000000000000000000000000000',
            to: minerAddress,
            amount: reward,
            timestamp: Date.now(),
            nonce: this.nonces.get(minerAddress) || 0,
            isReward: true
        };

        const block = new Block(
            this.chain.length,
            Date.now(),
            [...this.pendingTransactions, rewardTx],
            this.difficulty,
            minerAddress,
            this.getLatestBlock().hash
        );

        block.mineBlock(this.difficulty);

        this.chain.push(block);

        this.pendingTransactions.forEach(tx => {
            const to = tx.to;
            const balance = this.balances.get(to) || 0;
            this.balances.set(to, balance + parseFloat(tx.amount));
        });

        this.nonces.set(minerAddress, (this.nonces.get(minerAddress) || 0) + 1);

        this.adjustDifficulty();

        return block;
    }

    getBlockReward() {
        const blockCount = this.chain.length;
        const era = Math.floor(blockCount / HALVING_INTERVAL);
        return INITIAL_REWARD / Math.pow(2, era);
    }

    adjustDifficulty() {
        const latestBlock = this.chain[this.chain.length - 1];
        const timeDiff = latestBlock.timestamp - (this.chain.length > 1 ? this.chain[this.chain.length - 2].timestamp : latestBlock.timestamp);

        if (timeDiff > BLOCK_TIME * 1000 * 1.5) {
            this.difficulty = Math.max(1, this.difficulty - 1);
        } else if (timeDiff < BLOCK_TIME * 1000 * 0.5) {
            this.difficulty++;
        }
    }

    getBalance(address) {
        return this.balances.get(address) || 0;
    }

    getTransactionCount(address) {
        return this.nonces.get(address) || 0;
    }

    getBlockByNumber(index) {
        return this.chain[index];
    }

    getBlockByHash(hash) {
        return this.chain.find(block => block.hash === hash);
    }

    isValidChain() {
        for (let i = 1; i < this.chain.length; i++) {
            const currentBlock = this.chain[i];
            const previousBlock = this.chain[i - 1];

            if (currentBlock.previousHash !== previousBlock.hash) {
                return false;
            }

            if (!currentBlock.hasValidHash()) {
                return false;
            }
        }
        return true;
    }
}

function _apply_blast_checksum(address) {
    const prefix = '0xBLAST';
    const addr = address.toLowerCase().replace(prefix.toLowerCase(), '');
    const k = keccak('keccak256');
    k.update(addr);
    const hash = k.digest('hex');

    let checksummed = prefix;
    for (let i = 0; i < addr.length; i++) {
        if (parseInt(hash[i], 16) >= 8) {
            checksummed += addr[i].toUpperCase();
        } else {
            checksummed += addr[i];
        }
    }
    return checksummed;
}

function generateKeyPair() {
    const privateKey = randomBytes(32);
    const publicKey = secp256k1.publicKeyCreate(privateKey, false).slice(1);

    const k = keccak('keccak256');
    k.update(Buffer.from(publicKey));
    const rawAddress = '0xBLAST' + k.digest('hex').slice(-34);
    const address = _apply_blast_checksum(rawAddress);

    return {
        privateKey: privateKey.toString('hex'),
        publicKey: publicKey.toString('hex'),
        address: address
    };
}

function signTransaction(transaction, privateKey) {
    const txData = transaction.from + transaction.to + transaction.amount + transaction.nonce;
    const hash = crypto.createHash('sha256').update(txData).digest();
    const signature = secp256k1.sign(hash, Buffer.from(privateKey, 'hex'));
    return signature.toString('hex');
}

function verifyTransaction(transaction, signature, publicKey) {
    const txData = transaction.from + transaction.to + transaction.amount + transaction.nonce;
    const hash = crypto.createHash('sha256').update(txData).digest();
    return secp256k1.verify(hash, Buffer.from(signature, 'hex'), Buffer.from(publicKey, 'hex'));
}

module.exports = {
    Blockchain,
    Block,
    CHAIN_ID,
    NETWORK_ID,
    BLOCK_TIME,
    GAS_LIMIT,
    DECIMALS,
    MAX_SUPPLY,
    generateKeyPair,
    signTransaction,
    verifyTransaction
};
