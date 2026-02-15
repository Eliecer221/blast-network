const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { Blockchain } = require('../blockchain');
const crypto = require('crypto');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = process.env.PORT || 8545;
const CHAIN_ID = 8888;

const blockchain = new Blockchain();

app.use(helmet());
app.use(cors());
app.use(express.json());

const limiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 100,
    message: { jsonrpc: '2.0', error: { code: -32000, message: 'Too many requests' }, id: null }
});
app.use(limiter);

app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

app.get('/', (req, res) => {
    res.json({
        name: 'BLAST Network',
        version: '1.0.0',
        chainId: CHAIN_ID,
        description: 'BLAST Network RPC Server'
    });
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok', blockNumber: blockchain.chain.length });
});

const rpcMethods = {
    web3_clientVersion: () => 'BLAST/1.0.0',

    web3_sha3: (params) => {
        const k = require('keccak')('keccak256');
        k.update(Buffer.from(params[0].slice(2), 'hex'));
        return '0x' + k.digest('hex');
    },

    net_version: () => CHAIN_ID.toString(),
    net_chainId: () => '0x' + CHAIN_ID.toString(16),
    net_peerCount: () => '0x0',
    net_listening: () => true,

    eth_blockNumber: () => '0x' + (blockchain.chain.length - 1).toString(16),

    eth_getBlockByNumber: (params) => {
        const blockNum = parseInt(params[0], 16);
        const block = blockchain.chain[blockNum];
        if (!block) return null;

        return {
            number: '0x' + block.index.toString(16),
            hash: '0x' + block.hash,
            parentHash: '0x' + block.previousHash,
            timestamp: '0x' + Math.floor(block.timestamp / 1000).toString(16),
            transactions: block.transactions,
            miner: block.miner,
            difficulty: '0x' + block.difficulty.toString(16),
            gasLimit: '0x' + block.gasLimit.toString(16),
            gasUsed: '0x' + block.gasUsed.toString(16),
            nonce: '0x' + block.nonce.toString(16),
            extraData: '0x' + Buffer.from(block.extraData).toString('hex')
        };
    },

    eth_getBlockByHash: (params) => {
        const block = blockchain.getBlockByHash(params[0].slice(2));
        if (!block) return null;

        return {
            number: '0x' + block.index.toString(16),
            hash: '0x' + block.hash,
            parentHash: '0x' + block.previousHash,
            timestamp: '0x' + Math.floor(block.timestamp / 1000).toString(16),
            transactions: block.transactions,
            miner: block.miner,
            difficulty: '0x' + block.difficulty.toString(16)
        };
    },

    eth_getTransactionCount: (params) => {
        const address = params[0];
        const count = blockchain.getTransactionCount(address);
        return '0x' + count.toString(16);
    },

    eth_getBalance: (params) => {
        const address = params[0];
        const balance = blockchain.getBalance(address);
        return '0x' + balance.toString(16);
    },

    eth_call: (params) => {
        return '0x';
    },

    eth_sendTransaction: (params) => {
        const tx = params[0];

        try {
            const txData = {
                from: tx.from,
                to: tx.to,
                amount: parseFloat(tx.value || '0x0', 16),
                nonce: parseInt(tx.nonce || '0x0', 16),
                timestamp: Date.now(),
                data: tx.data || '0x'
            };

            blockchain.addTransaction(txData);

            const txHash = crypto.createHash('sha256')
                .update(JSON.stringify(txData))
                .digest('hex');

            return '0x' + txHash;
        } catch (error) {
            throw { code: -32000, message: error.message };
        }
    },

    eth_getWork: () => {
        const latestBlock = blockchain.getLatestBlock();
        const header = latestBlock.hash + latestBlock.previousHash;
        const target = '0x' + 'ff'.repeat(32);

        return [header, '0x' + '00'.repeat(32), target];
    },

    eth_submitWork: (params) => {
        const [nonce, hash, header] = params;

        console.log(`\n[MINERO] Nuevo bloque propuesto!`);
        console.log(`Nonce: ${nonce}`);

        blockchain.minePendingTransactions('0x0F45711A8AB6393A504157F1DF327CED7231987B');

        return true;
    },

    eth_getTransactionReceipt: (params) => {
        return null;
    },

    eth_estimateGas: (params) => {
        return '0x' + (21000).toString(16);
    },

    eth_chainId: () => '0x' + CHAIN_ID.toString(16)
};

app.post('/', (req, res) => {
    const { jsonrpc, method, params, id } = req.body;

    if (rpcMethods[method]) {
        try {
            const result = rpcMethods[method](params || []);
            res.json({ jsonrpc: '2.0', result, id });
        } catch (error) {
            res.json({ jsonrpc: '2.0', error: { code: -32000, message: error.message || error }, id });
        }
    } else {
        res.json({ jsonrpc: '2.0', error: { code: -32601, message: 'Method not found' }, id });
    }
});

wss.on('connection', (ws) => {
    console.log('Nuevo cliente WebSocket conectado');

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            const { jsonrpc, method, params, id } = data;

            if (rpcMethods[method]) {
                const result = rpcMethods[method](params || []);
                ws.send(JSON.stringify({ jsonrpc: '2.0', result, id }));
            }
        } catch (error) {
            ws.send(JSON.stringify({ jsonrpc: '2.0', error: { code: -32700, message: 'Parse error' }, id: null }));
        }
    });

    ws.send(JSON.stringify({ jsonrpc: '2.0', result: { version: '1.0.0' }, id: null }));
});

server.listen(PORT, () => {
    console.log('\n========================================');
    console.log('    BLAST NETWORK RPC SERVER           ');
    console.log('========================================');
    console.log(`Servidor RPC ejecutándose en:`);
    console.log(`  HTTP: http://localhost:${PORT}`);
    console.log(`  WS:   ws://localhost:${PORT}`);
    console.log(`Chain ID: ${CHAIN_ID}`);
    console.log('========================================\n');
});

module.exports = { app, server, blockchain };
