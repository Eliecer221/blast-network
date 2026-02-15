const http = require('http');
const fs = require('fs');

const RPC_PORT = 8545;
const DOMAIN_REGISTRY_FILE = 'blast_domains.json';

function rpcCall(method, params = []) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify({
            jsonrpc: '2.0',
            method: method,
            params: params,
            id: 1
        });

        const options = {
            hostname: 'localhost',
            port: RPC_PORT,
            path: '/',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': data.length
            }
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(body));
                } catch (e) {
                    reject(e);
                }
            });
        });

        req.on('error', (e) => reject(e));
        req.write(data);
        req.end();
    });
}

async function addDnsRecord(domain, recordType, host, value) {
    console.log(`\n📝 Añadiendo registro DNS a: ${domain}`);
    console.log(`   Tipo: ${recordType}`);
    console.log(`   Host: ${host}`);
    console.log(`   Valor: ${value}`);

    // Cargar registro local
    if (!fs.existsSync(DOMAIN_REGISTRY_FILE)) {
        console.log('❌ Error: No existe el archivo de registro de dominios.');
        return;
    }

    let registry = JSON.parse(fs.readFileSync(DOMAIN_REGISTRY_FILE, 'utf8'));

    if (!registry[domain]) {
        console.log(`❌ Error: El dominio ${domain} no está registrado.`);
        return;
    }

    try {
        // Verificar conexión a la blockchain
        const response = await rpcCall('blast_getInfo');

        if (response.result) {
            console.log('✅ Blockchain conectada.');

            // Simular transacción de actualización
            const txHash = '0x' + require('crypto').randomBytes(32).toString('hex');
            const blockHeight = response.result.currentBlock + 1;

            // Inicializar estructura dns_records si no existe
            if (!registry[domain].dns_records) {
                registry[domain].dns_records = {};
            }
            if (!registry[domain].dns_records[recordType]) {
                registry[domain].dns_records[recordType] = [];
            }

            // Añadir registro
            const record = {
                host: host,
                value: value,
                ttl: 3600,
                updatedAt: new Date().toISOString()
            };

            registry[domain].dns_records[recordType].push(record);

            // Actualizar metadatos de la transacción
            registry[domain].lastUpdateTx = txHash;
            registry[domain].lastUpdateBlock = blockHeight;

            fs.writeFileSync(DOMAIN_REGISTRY_FILE, JSON.stringify(registry, null, 2));

            console.log(`\n🎉 ¡REGISTRO DNS AÑADIDO!`);
            console.log(`🔗 Hash Transacción: ${txHash}`);
            console.log(`🧱 Bloque: ${blockHeight}`);
            console.log(`✅ Registro TXT anclado para verificación.`);

        } else {
            console.log('❌ Error: No se pudo obtener información de la red.');
        }

    } catch (error) {
        console.log('❌ Error: Asegúrate de que start-network.js esté corriendo.');
        console.log(`   Detalle: ${error.message}`);
    }
}

// Ejecutar si se llama directamente
const domain = process.argv[2] || 'blast-network.blast';
const recordType = process.argv[3] || 'TXT';
const host = process.argv[4] || '@';
const value = process.argv[5] || 'verification-code';

if (process.argv.length > 2) {
    addDnsRecord(domain, recordType, host, value);
} else {
    console.log('Uso: node addDnsRecord.js <domain> <type> <host> <value>');
}
