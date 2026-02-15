const {
    BlastColdWallet,
    BlastVaultCompanion,
    BlastNetworkIntegration,
    CreatorMasterWallet
} = require('./blast-cold-wallet');

// =====================================
// 7. EJEMPLO DE USO
// =====================================

async function ejemploUsoCompleto() {
    console.log('\n=== EJEMPLO DE USO BLAST COLD WALLET ===\n');

    try {
        // 1. Crear companion app
        const app = new BlastVaultCompanion();

        // 2. Conectar dispositivo
        await app.connectDevice('USB');

        // 3. Setup inicial (primera vez)
        console.log('\n📱 Configurando nuevo dispositivo...');
        const setup = await app.setupNewDevice('1234');
        console.log('✅ Wallet creada:', setup.address);
        console.log('⚠️', setup.warning);

        // 4. Desbloquear dispositivo
        console.log('\n🔓 Desbloqueando dispositivo...');
        await app.unlockDevice('1234');

        // 5. Obtener dirección
        console.log('\n📍 Obteniendo dirección...');
        const { address } = await app.getAddress(0);
        console.log('Dirección BLAST:', address);

        // 6. Consultar balance
        console.log('\n💰 Consultando balance...');
        const balance = await app.getBalance(address);
        console.log(`Balance: ${balance.balance} ${balance.symbol}`);

        // 7. Enviar transacción
        console.log('\n📤 Enviando transacción...');
        const tx = await app.sendTransaction(
            '0x1234567890123456789012345678901234567890',
            '100'
        );
        console.log('✅ Transacción enviada:', tx.txHash);

        // 8. Integración con BLAST Network
        const blastIntegration = new BlastNetworkIntegration(app.connectedDevice);
        await blastIntegration.connectToNetwork();

        // 9. Registrar dominio .blast
        console.log('\n🌐 Registrando dominio .blast...');
        const domain = await blastIntegration.registerBlastDomain('miempresa');
        console.log('✅ Dominio registrado:', domain.domain);

        // 10. Staking
        console.log('\n🥩 Haciendo staking de BLAST...');
        const stake = await blastIntegration.stakeBlast(
            '1000',
            '0x1234567890123456789012345678901234567890'
        );
        console.log('✅ Staking exitoso:', stake.txHash);

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

// =====================================
// 8. EJEMPLO WALLET MADRE DEL CREADOR
// =====================================

async function ejemploWalletMadre() {
    console.log('\n=== WALLET MADRE DEL CREADOR ===\n');

    const masterWallet = new CreatorMasterWallet();
    const result = await masterWallet.initializeMasterWallet();

    console.log('\n📊 Estado de la Wallet Madre:');
    console.log(result);
}

// Ejecutar ejemplos
(async () => {
    await ejemploUsoCompleto();
    await ejemploWalletMadre();
})();
