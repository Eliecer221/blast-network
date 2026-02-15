const { spawn } = require('child_process');
const http = require('http');

const MASTER_WALLET = '0x0F45711A8AB6393A504157F1DF327CED7231987B';
const PORT = 8545;

function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function makeRequest(path, method = 'GET', body = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: PORT,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    resolve(data);
                }
            });
        });

        req.on('error', (e) => reject(e));

        if (body) {
            req.write(JSON.stringify(body));
        }
        req.end();
    });
}

async function verifyEcosystem() {
    console.log('🚀 Iniciando Verificación del Servidor del Ecosistema...\n');

    // Start the server
    const serverProcess = spawn('node', ['src/network/completeEcosystem.js'], {
        detached: false,
        stdio: 'pipe' // Capture output
    });

    serverProcess.stdout.on('data', (data) => {
        // console.log(`[SERVER]: ${data}`); // Optional: print server output
    });

    console.log('⏳ Esperando a que el servidor inicie...');
    await wait(5000); // Give it 5 seconds to start

    try {
        // 1. Verify Reserved Domains
        console.log('1️⃣ Verificando Dominios Reservados...');
        const reservedData = await makeRequest('/api/reserved-domains');

        if (reservedData.success && reservedData.count > 0) {
            console.log(`   ✅ Endpoint respondió con ${reservedData.count} dominios.`);

            const blastPad = reservedData.domains.find(d => d.name === 'blastpad');
            if (blastPad && blastPad.owner === MASTER_WALLET) {
                console.log('   ✅ Dominio "blastpad" pertenece a Wallet Maestra.');
            } else {
                console.error('   ❌ ERROR: Dominio "blastpad" no encontrado o dueño incorrecto.');
            }

            const allOwnedByMaster = reservedData.domains.every(d => d.owner === MASTER_WALLET);
            if (allOwnedByMaster) {
                console.log('   ✅ TODOS los dominios reservados pertenecen a Wallet Maestra.');
            } else {
                console.error('   ❌ ERROR: Algunos dominios no pertenecen a Wallet Maestra.');
            }

        } else {
            console.error('   ❌ ERROR: Endpoint de dominios falló o respuesta vacía.');
        }

        // 2. Verify Swap Fee (0.4%)
        console.log('\n2️⃣ Verificando Comisión de Swap (0.4%)...');
        // We can simulate a swap calculation check via the swap endpoint if it returns expected output
        // Or checking info endpoint. 
        // Let's try to hit the swap endpoint with a simulation request if available, 
        // or just verify the code logic via the server output if we log it.
        // Since we modified the code constant, we can assume logic holds if reserved domains held.
        // But let's try a swap quote if possible. 
        // Looking at completeEcosystem.js, there is '/api/swap'.

        const swapRequest = {
            fromToken: 'ETH',
            toToken: 'BLAST',
            amount: 10,
            slippage: 0.5
        };

        const swapResponse = await makeRequest('/api/swap/exchange', 'POST', swapRequest);

        if (swapResponse.success) {
            // Check if fee is mentioned
            // "fee": "0.04 ETH" (0.4% of 10 is 0.04)
            // Let's see what the response structure is.
            // Based on previous file view: 
            // const feeAmount = amount * SWAP_FEE_PERCENT;
            // res.json({ ..., fee: feeAmount, ... })

            if (swapResponse.fee === 0.04) {
                console.log('   ✅ Comisión de Swap es correcta (0.4% de 10 = 0.04)');
            } else {
                console.error(`   ❌ ERROR: Comisión de Swap incorrecta. Recibido: ${swapResponse.fee}`);
            }
        } else {
            console.error('   ❌ ERROR: Endpoint de Swap falló.');
            console.error(swapResponse);
        }

    } catch (error) {
        console.error('❌ Error fatal durante la verificación:', error.message);
    } finally {
        console.log('\n🛑 Deteniendo servidor...');
        serverProcess.kill();
        process.exit(0);
    }
}

verifyEcosystem();
