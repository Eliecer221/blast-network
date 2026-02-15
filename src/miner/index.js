const crypto = require('crypto');
const keccak = require('keccak');
const http = require('http');
const WebSocket = require('ws');

const CONFIG = {
    algorithm: 'BlastHash',
    blockTime: 15,
    initialDifficulty: 1,
    initialReward: 50,
    halvingInterval: 210000,
    maxSupply: 42000000,
    memorySize: 128 * 1024 * 1024,
    rounds: 64
};

class BlastHash {
    constructor() {
        this.memorySize = CONFIG.memorySize;
        this.rounds = CONFIG.rounds;
    }

    computeHash(header, nonce) {
        const nonceBuffer = Buffer.alloc(8);
        nonceBuffer.writeBigUInt64BE(BigInt(nonce));
        
        const sha3Hash = crypto.createHash('sha3-256')
            .update(Buffer.concat([Buffer.from(header), nonceBuffer]))
            .digest();
        
        const keccakHash = this.keccak256(sha3Hash);
        
        const memoryHash = this.memoryHardFunction(keccakHash);
        
        const finalHash = crypto.createHash('sha3-256').update(memoryHash).digest();
        
        return finalHash;
    }

    keccak256(data) {
        const k = keccak('keccak256');
        k.update(data);
        return k.digest();
    }

    memoryHardFunction(seed) {
        const memory = Buffer.alloc(this.memorySize);
        
        let current = seed;
        for (let i = 0; i < this.memorySize; i += 32) {
            current = crypto.createHash('sha3-256').update(current).digest();
            current.copy(memory, i);
        }
        
        let result = seed;
        for (let r = 0; r < this.rounds; r++) {
            const index = result.readUInt32BE(0) % (this.memorySize - 32);
            const chunk = memory.slice(index, index + 32);
            result = crypto.createHash('sha3-256')
                .update(Buffer.concat([result, chunk]))
                .digest();
        }
        
        return result;
    }

    verify(header, nonce, target) {
        const hashResult = this.computeHash(header, nonce);
        const hashInt = BigInt('0x' + hashResult.toString('hex'));
        return hashInt < target;
    }
}

class Miner {
    constructor(walletAddress, rpcUrl = 'http://localhost:8545') {
        this.walletAddress = walletAddress;
        this.rpcUrl = rpcUrl;
        this.hasher = new BlastHash();
        this.hashrate = 0;
        this.isMining = false;
        this.currentBlock = null;
    }

    async start(threads = 4) {
        this.isMining = true;
        console.log(`\n========================================`);
        console.log(`    BLAST NETWORK MINER v1.0.0         `);
        console.log(`========================================\n`);
        console.log(`Wallet: ${this.walletAddress}`);
        console.log(`Threads: ${threads}`);
        console.log(`RPC: ${this.rpcUrl}`);
        console.log(`========================================\n`);

        while (this.isMining) {
            try {
                await this.fetchWork();
                await this.mine(threads);
            } catch (error) {
                console.error('Error:', error.message);
                await this.sleep(5000);
            }
        }
    }

    stop() {
        this.isMining = false;
        console.log('Minero detenido.');
    }

    async fetchWork() {
        try {
            const response = await this.rpcCall('eth_getWork');
            this.currentBlock = {
                header: response[0],
                seedHash: response[1],
                target: response[2]
            };
        } catch (error) {
            this.currentBlock = {
                header: '0'.repeat(64),
                seedHash: '0'.repeat(64),
                target: '0'.repeat(64)
            };
        }
    }

    async mine(threads) {
        const startTime = Date.now();
        let nonce = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
        let hashCount = 0;

        const target = BigInt('0x' + this.currentBlock.target);

        while (this.isMining) {
            const hashResult = this.hasher.computeHash(this.currentBlock.header, nonce);
            const hashInt = BigInt('0x' + hashResult.toString('hex'));
            hashCount++;

            if (hashInt < target) {
                console.log(`\n[BLOQUE MINADO!]`);
                console.log(`Nonce: ${nonce}`);
                console.log(`Hash: 0x${hashResult.toString('hex')}`);
                
                try {
                    await this.submitWork(nonce, hashResult.toString('hex'));
                } catch (error) {
                    console.log('Error al enviar bloque:', error.message);
                }
                
                break;
            }

            nonce++;

            if (hashCount % 100000 === 0) {
                const elapsed = (Date.now() - startTime) / 1000;
                this.hashrate = Math.round(hashCount / elapsed);
                
                process.stdout.write(`\rHashrate: ${this.formatHashrate(this.hashrate)} | Nonce: ${nonce}    `);
            }
        }
    }

    async submitWork(nonce, hash) {
        try {
            await this.rpcCall('eth_submitWork', [
                '0x' + nonce.toString(16),
                hash,
                this.currentBlock.header
            ]);
        } catch (error) {
            throw error;
        }
    }

    rpcCall(method, params = []) {
        return new Promise((resolve, reject) => {
            const data = JSON.stringify({
                jsonrpc: '2.0',
                method: method,
                params: params,
                id: 1
            });

            const url = new URL(this.rpcUrl);
            const options = {
                hostname: url.hostname,
                port: url.port || 8545,
                path: url.pathname || '/',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(data)
                }
            };

            const req = http.request(options, (res) => {
                let body = '';
                res.on('data', (chunk) => body += chunk);
                res.on('end', () => {
                    try {
                        const response = JSON.parse(body);
                        if (response.error) {
                            reject(new Error(response.error.message));
                        } else {
                            resolve(response.result);
                        }
                    } catch (e) {
                        reject(e);
                    }
                });
            });

            req.on('error', reject);
            req.write(data);
            req.end();
        });
    }

    formatHashrate(hashrate) {
        if (hashrate > 1e9) return (hashrate / 1e9).toFixed(2) + ' GH/s';
        if (hashrate > 1e6) return (hashrate / 1e6).toFixed(2) + ' MH/s';
        if (hashrate > 1e3) return (hashrate / 1e3).toFixed(2) + ' KH/s';
        return hashrate + ' H/s';
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

function parseArgs() {
    const args = process.argv.slice(2);
    const config = {
        wallet: null,
        rpc: 'http://localhost:8545',
        threads: 4
    };

    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--wallet' || args[i] === '-w') {
            config.wallet = args[++i];
        } else if (args[i] === '--rpc' || args[i] === '-r') {
            config.rpc = args[++i];
        } else if (args[i] === '--threads' || args[i] === '-t') {
            config.threads = parseInt(args[++i]);
        }
    }

    return config;
}

if (require.main === module) {
    const args = parseArgs();
    
    if (!args.wallet) {
        console.log('Uso: node miner.js --wallet <dirección> [--rpc <url>] [--threads <n>]');
        console.log('Ejemplo: node miner.js --wallet 0xTuWalletAqui --threads 8');
        process.exit(1);
    }

    const miner = new Miner(args.wallet, args.rpc);
    
    process.on('SIGINT', () => {
        console.log('\nDeteniendo miner...');
        miner.stop();
        process.exit(0);
    });

    miner.start(args.threads);
}

module.exports = {
    Miner,
    BlastHash,
    CONFIG
};
