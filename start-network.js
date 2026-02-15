const { spawn } = require('child_process');
const path = require('path');

console.log(`
╔══════════════════════════════════════════════════════════════════════════╗
║                                                                          ║
║              🚀 BLAST NETWORK - INICIO RÁPIDO 🚀                       ║
║                                                                          ║
╚══════════════════════════════════════════════════════════════════════════╝
`);

const services = [];
let serviceCount = 0;
const totalServices = 3;

function startService(name, command, args) {
    return new Promise((resolve) => {
        console.log(`\n📦 Iniciando ${name}...`);

        const proc = spawn(command, args, {
            cwd: process.cwd(),
            stdio: ['ignore', 'pipe', 'pipe'],
            shell: true
        });

        proc.stdout.on('data', (data) => {
            const output = data.toString();
            if (output.includes('BLAST') || output.includes('localhost')) {
                console.log(`   ${output.trim()}`);
            }
        });

        proc.stderr.on('data', (data) => {
            const output = data.toString();
            if (!output.includes('npm')) {
                console.error(`   ⚠️ ${output.trim()}`);
            }
        });

        console.log(`   ✅ ${name} iniciado`);
        serviceCount++;
        setTimeout(resolve, 1000);

        proc.on('error', (err) => {
            console.error(`   ❌ Error: ${err.message}`);
            resolve();
        });

        services.push({ name, proc });
    });
}

async function startAll() {
    console.log('\n🎯 Starting BLAST Network Services...\n');

    await startService(
        'BLAST Full Node (RPC)',
        'node',
        ['src/network/fullNode.js']
    );

    await startService(
        'BLAST Wallet Web',
        'node',
        ['src/wallet/webServer.js']
    );

    await startService(
        'BLAST Website (Mainnet)',
        'node',
        ['src/website/server.js']
    );

    console.log(`
╔══════════════════════════════════════════════════════════════════════════╗
║                    ✅ TODOS LOS SERVICIOS INICIADOS                     ║
╠══════════════════════════════════════════════════════════════════════════╣
║                                                                          ║
║   🌐 BLAST Full Node (RPC):                                            ║
║      http://localhost:8545                                             ║
║                                                                          ║
║   💎 BLAST Wallet Web:                                                 ║
║      http://localhost:3000                                             ║
║                                                                          ║
║   🌍 BLAST Website:                                                    ║
║      http://localhost:8080                                             ║
║                                                                          ║
╚══════════════════════════════════════════════════════════════════════════╝

📋 Comandos útiles:

   # Ver información de la red:
   curl -X POST http://localhost:8545 -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"blast_getInfo","params":[],"id":1}'

   # Obtener número de bloque:
   curl -X POST http://localhost:8545 -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'

   # Obtener balance:
   curl -X POST http://localhost:8545 -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"eth_getBalance","params":["0xBLAST0000000000000000000000000000000001","latest"],"id":1}'

   # Mine un bloque:
   curl -X POST http://localhost:8545 -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"blast_mineBlock","params":["0xBLAST0000000000000000000000000000000001"],"id":1}'

🛑 Para detener todos los servicios presiona Ctrl+C
`);

    process.on('SIGINT', () => {
        console.log('\n\n🛑 Deteniendo servicios...');
        services.forEach(s => {
            console.log(`   Deteniendo ${s.name}...`);
            s.proc.kill();
        });
        console.log('\n✅ Servicios detenidos. ¡Hasta pronto!\n');
        process.exit(0);
    });
}

startAll();
