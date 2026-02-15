const { Blockchain } = require('./src/blockchain');

const MASTER_WALLET = '0x0F45711A8AB6393A504157F1DF327CED7231987B';
const TEST_WALLET = '0xTestWalletAddress123456789';

async function verifyMasterWalletIntegration() {
    console.log('🔍 Iniciando Verificación de Integración de Wallet Maestra...\n');

    const blastChain = new Blockchain();

    // 1. Verify Genesis Allocation
    console.log('1️⃣ Verificando Bloque Génesis...');
    const genesisBalance = blastChain.getBalance(MASTER_WALLET);
    console.log(`   Balance Wallet Maestra: ${genesisBalance} BLAST`);

    if (genesisBalance === 8400000) {
        console.log('   ✅ Asignación Génesis Correcta (20% - 8,400,000 BLAST)');
    } else {
        console.error(`   ❌ ERROR: Asignación Génesis Incorrecta. Esperado: 8400000, Actual: ${genesisBalance}`);
    }

    // 2. Verify Transaction Fees
    console.log('\n2️⃣ Verificando Comisiones de Transacción...');

    // Give test wallet some funds (minting for test)
    blastChain.balances.set(TEST_WALLET, 1000);
    const initialMasterBalance = blastChain.getBalance(MASTER_WALLET);

    // Create a transaction: Test Wallet -> Logic check
    const tx = {
        from: TEST_WALLET,
        to: '0xRecipient',
        amount: 100,
        nonce: 0 // Since it's a fresh test wallet, nonce is 0
    };

    blastChain.addTransaction(tx);

    // Now we mine a block to process
    blastChain.minePendingTransactions(TEST_WALLET); // Miner gets reward + fees? 
    // Wait, in our implementation fees are deducted immediately in addTransaction logic from sender?
    // Let's check src/blockchain/index.js logic again.
    // Yes:
    // const fee = amount * TX_FEE_RATE;
    // this.balances.set(MOTHER_WALLET, motherBalance + fee);

    const newMasterBalance = blastChain.getBalance(MASTER_WALLET);
    const feeCollected = newMasterBalance - initialMasterBalance;

    console.log(`   Balance Inicial Maestra: ${initialMasterBalance}`);
    console.log(`   Balance Final Maestra:   ${newMasterBalance}`);
    console.log(`   Fee Recolectada:         ${feeCollected}`);

    // 1% of 100 is 1. So feeCollected should be 1.
    if (Math.abs(feeCollected - 1) < 0.0001) {
        console.log('   ✅ Comisión del 1% recibida correctamente en Wallet Maestra');
    } else {
        console.error(`   ❌ ERROR: Comisión incorrecta. Esperado: 1, Recibido: ${feeCollected}`);
    }

    console.log('\n🏁 Verificación Completada.');
}

verifyMasterWalletIntegration();
