const http = require('http');
const fs = require('fs');

const RPC_PORT = 8545;
const WEB_PORT = 8080;
const DOMAIN = 'blast-network.blast';

async function checkService(url, name) {
    return new Promise((resolve) => {
        http.get(url, (res) => {
            console.log(`✅ ${name}: ONLINE (${res.statusCode})`);
            resolve(true);
        }).on('error', (e) => {
            console.log(`❌ ${name}: OFFLINE (${e.message})`);
            resolve(false);
        });
    });
}

async function verify() {
    console.log('==========================================');
    console.log('   BLAST NETWORK - VERIFICACIÓN FINAL');
    console.log('==========================================\n');

    // 1. Check Blockchain RPC
    const rpcOnline = await checkService(`http://localhost:${RPC_PORT}`, 'Blockchain RPC');

    // 2. Check Website
    const webOnline = await checkService(`http://localhost:${WEB_PORT}`, 'Sitio Web Local');

    // 3. Check Domain Registry
    if (fs.existsSync('blast_domains.json')) {
        const registry = JSON.parse(fs.readFileSync('blast_domains.json', 'utf8'));
        if (registry[DOMAIN]) {
            console.log(`✅ Registro de Dominio: ENCONTRADO (${DOMAIN})`);
            if (registry[DOMAIN].website) {
                console.log(`🔗 Link Web3: Configurado -> ${registry[DOMAIN].website}`);
            }
        } else {
            console.log(`❌ Registro de Dominio: NO ENCONTRADO (${DOMAIN})`);
        }
    }

    // 4. Check Wallets
    if (fs.existsSync('wallets')) {
        const wallets = fs.readdirSync('wallets');
        console.log(`✅ Billeteras Generadas: ${wallets.length} archivos`);
    }

    console.log('\n==========================================');
    if (rpcOnline && webOnline) {
        console.log('   🚀 ¡SISTEMA LISTO PARA PRODUCCIÓN!');
    } else {
        console.log('   ⚠️ ALGUNOS SERVICIOS REQUIEREN ATENCIÓN');
    }
    console.log('==========================================');
}

verify();
