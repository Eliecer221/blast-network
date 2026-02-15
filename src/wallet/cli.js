const readline = require('readline');
const { walletCore, FEES, MASTER_WALLET, SUPPORTED_TOKENS, MEMECOINS } = require('./blastWallet');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function prompt(question) {
    return new Promise((resolve) => {
        rl.question(question, resolve);
    });
}

async function showBanner() {
    console.log('\n');
    console.log('╔═══════════════════════════════════════════════════════════════╗');
    console.log('║                                                               ║');
    console.log('║          💎 BLAST WALLET - LA WALLET TODO EN UNO 💎          ║');
    console.log('║                                                               ║');
    console.log('║  🪙 Crypto + 🖼️ NFTs + 🐕 Memecoins + ⚡ Swap + 🌉 Bridge    ║');
    console.log('║                                                               ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝');
    console.log('\n');
}

async function showFees() {
    console.log('\n📊 COMISIONES (Las más bajas del mercado):\n');
    console.log('  ┌─────────────────────┬──────────┐');
    console.log('  │ Acción              │ Comisión │');
    console.log('  ├─────────────────────┼──────────┤');
    console.log('  │ 💱 Swap             │  0.175%  │');
    console.log('  │ 🎨 Crear NFT        │   0.5%   │');
    console.log('  │ 🏷️  Trade NFT       │  0.25%   │');
    console.log('  │ 💸 Transferencia    │   0%     │');
    console.log('  │ 📈 Staking          │    2%    │');
    console.log('  │ 🌉 Bridge           │   0.3%   │');
    console.log('  └─────────────────────┴──────────┘\n');
    console.log(`💰 Wallet Madre: ${MASTER_WALLET}\n`);
}

async function showMainMenu() {
    await showBanner();
    console.log('  [1] 👛 Crear nueva wallet');
    console.log('  [2] 📥 Importar wallet (mnemónico)');
    console.log('  [3] 💰 Ver balance');
    console.log('  [4] 💱 Swap (intercambiar tokens)');
    console.log('  [5] 🎨 Crear NFT');
    console.log('  [6] 🖼️ Mis NFTs');
    console.log('  [7] 📊 Mercado (precios)');
    console.log('  [8] 💸 Transferir');
    console.log('  [9] 📈 Trading (comprar/vender crypto)');
    console.log('  [10] 🐕 Memecoins');
    console.log('  [11] 📜 Transacciones');
    console.log('  [12] 💵 Comisiones cobradas');
    console.log('  [13] ℹ️ Información de red');
    console.log('  [0] 🚪 Salir\n');
}

async function createWallet() {
    console.log('\n--- CREAR NUEVA WALLET ---\n');
    
    const password = await prompt('Ingresa una contraseña segura: ');
    const confirm = await prompt('Confirma la contraseña: ');
    
    if (password !== confirm) {
        console.log('❌ Las contraseñas no coinciden.');
        return;
    }

    if (password.length < 6) {
        console.log('❌ La contraseña debe tener al menos 6 caracteres.');
        return;
    }

    const result = walletCore.createWallet(password);
    
    console.log('\n✅ Wallet creada exitosamente!\n');
    console.log('═'.repeat(50));
    console.log('\n📍 DIRECCIÓN:');
    console.log(`   ${result.wallet.address}`);
    console.log('\n🔐 MNEMÓNICO (GUÁRDALO EN LUGAR SEGURO!):');
    console.log(`   ${result.mnemonic}`);
    console.log('\n💰 Balance inicial: 0 BLAST');
    console.log('\n' + '═'.repeat(50));
    console.log('\n⚠️  IMPORTANTE: Guarda tu mnemónico en un lugar seguro.');
    console.log('    Si lo pierdes, perderás acceso a tu wallet para siempre.\n');
}

async function importWallet() {
    console.log('\n--- IMPORTAR WALLET ---\n');
    
    const mnemonic = await prompt('Ingresa tu mnemónico: ');
    const password = await prompt('Ingresa una contraseña: ');
    const confirm = await prompt('Confirma la contraseña: ');
    
    if (password !== confirm) {
        console.log('❌ Las contraseñas no coinciden.');
        return;
    }

    console.log('\n⚠️  Funcionalidad de importación en desarrollo.');
    console.log('    Por ahora usa "Crear nueva wallet" para generar una nueva.\n');
}

async function showBalance() {
    console.log('\n--- VER BALANCE ---\n');
    
    const address = await prompt('Ingresa tu dirección de wallet: ');
    
    const info = walletCore.getWalletInfo(address);
    
    if (!info) {
        console.log('❌ Wallet no encontrada.');
        return;
    }

    console.log('\n═══════════════════════════════════════════');
    console.log(`   📍 ${info.address}`);
    console.log('═══════════════════════════════════════════\n');
    
    console.log('💰 BALANCES:\n');
    
    let hasBalance = false;
    Object.entries(info.balances).forEach(([token, amount]) => {
        if (amount > 0) {
            hasBalance = true;
            const price = walletCore.prices[token] || 0;
            const value = amount * price;
            console.log(`  ${token}: ${amount.toLocaleString()} (~$${value.toFixed(2)})`);
        }
    });
    
    if (!hasBalance) {
        console.log('  Sin balances disponibles.');
    }
    
    console.log(`\n🖼️ NFTs: ${info.nftCount}`);
    console.log(`💵 Valor Total: $${info.totalValueUSD.toFixed(2)} USD\n`);
}

async function doSwap() {
    console.log('\n--- SWAP (INTERCAMBIO) ---\n');
    
    const address = await prompt('Tu dirección: ');
    const fromToken = await prompt('Token a vender (ej: BLAST, ETH, BTC): ').then(s => s.toUpperCase());
    const toToken = await prompt('Token a comprar (ej: USDT, ETH, DOGE): ').then(s => s.toUpperCase());
    const amount = await prompt('Cantidad: ');
    
    if (!SUPPORTED_TOKENS[fromToken] || !SUPPORTED_TOKENS[toToken]) {
        console.log('❌ Token no soportado.');
        return;
    }
    
    const price = walletCore.getSwapPrice(fromToken, toToken, parseFloat(amount));
    
    console.log('\n═══════════════════════════════════════════');
    console.log('              PREVIEW DEL SWAP');
    console.log('═══════════════════════════════════════════');
    console.log(`  De:     ${amount} ${fromToken}`);
    console.log(`  A:      ${price.toAmount.toFixed(6)} ${toToken}`);
    console.log(`  Fee:    ${price.fee.toFixed(4)} ${fromToken} (${FEES.SWAP}%)`);
    console.log(`  Rate:   1 ${fromToken} = ${price.rate.toFixed(4)} ${toToken}`);
    console.log('═══════════════════════════════════════════\n');
    
    const confirm = await prompt('Confirmar swap? (s/n): ');
    
    if (confirm.toLowerCase() === 's') {
        try {
            const result = walletCore.swap(fromToken, toToken, parseFloat(amount), address);
            console.log('\n✅ Swap ejecutado exitosamente!');
            console.log(`   Hash: ${result.hash}`);
        } catch (error) {
            console.log(`\n❌ Error: ${error.message}`);
        }
    }
}

async function createNFT() {
    console.log('\n--- CREAR NFT ---\n');
    
    const address = await prompt('Tu dirección: ');
    const name = await prompt('Nombre del NFT: ');
    const description = await prompt('Descripción: ');
    const category = await prompt('Categoría (art/music/sports/gaming): ');
    
    try {
        const nft = walletCore.createNFT(address, name, description, '', category);
        console.log('\n✅ NFT creado exitosamente!');
        console.log(`   ID: ${nft.id}`);
        console.log(`   Fee: ${nft.fee} BLAST`);
    } catch (error) {
        console.log(`\n❌ Error: ${error.message}`);
    }
}

async function showNFTs() {
    console.log('\n--- MIS NFTs ---\n');
    
    const address = await prompt('Tu dirección: ');
    const nfts = walletCore.getNFTs(address);
    
    if (nfts.length === 0) {
        console.log('No tienes NFTs.');
        return;
    }
    
    console.log(`\nTienes ${nfts.length} NFT(s):\n`);
    
    nfts.forEach((nft, i) => {
        console.log(`  [${i + 1}] ${nft.name}`);
        console.log(`      ${nft.description}`);
        console.log(`      Categoría: ${nft.category}`);
        console.log(`      Precio: ${nft.price} BLAST\n`);
    });
}

async function showMarket() {
    console.log('\n--- MERCRADO ---\n');
    
    const data = walletCore.getMarketData();
    
    console.log('═══════════════════════════════════════════');
    console.log('              TOP GAINERS');
    console.log('═══════════════════════════════════════════');
    data.topGainers.forEach((token, i) => {
        console.log(`  ${i + 1}. ${token.symbol} - $${token.price.toFixed(4)} (+${token.change24h.toFixed(2)}%)`);
    });
    
    console.log('\n═══════════════════════════════════════════');
    console.log('              TOP LOSERS');
    console.log('═══════════════════════════════════════════');
    data.topLosers.forEach((token, i) => {
        console.log(`  ${i + 1}. ${token.symbol} - $${token.price.toFixed(4)} (${token.change24h.toFixed(2)}%)`);
    });
    
    console.log('\n═══════════════════════════════════════════');
    console.log('              MEMECOINS');
    console.log('═══════════════════════════════════════════');
    data.memecoins.slice(0, 5).forEach((m, i) => {
        console.log(`  ${i + 1}. ${m.name} (${m.symbol}) - $${m.price.toFixed(6)}`);
    });
    
    console.log('\n📊 Todos los precios son simulados.\n');
}

async function transfer() {
    console.log('\n--- TRANSFERIR ---\n');
    
    const from = await prompt('Tu dirección: ');
    const to = await prompt('Dirección destino: ');
    const amount = await prompt('Cantidad: ');
    const token = await prompt('Token (BLAST/ETH/etc): ').then(s => s.toUpperCase());
    
    try {
        const tx = walletCore.transfer(from, to, parseFloat(amount), token);
        console.log('\n✅ Transferencia exitosa!');
        console.log(`   Hash: ${tx.hash}`);
    } catch (error) {
        console.log(`\n❌ Error: ${error.message}`);
    }
}

async function showMemecoins() {
    console.log('\n--- MEMECOINS ---\n');
    
    console.log('═══════════════════════════════════════════');
    console.log('              MEMECOINS POPULARES');
    console.log('═══════════════════════════════════════════\n');
    
    MEMECOINS.forEach((m, i) => {
        const change = (Math.random() - 0.5) * 20;
        console.log(`  ${i + 1}. ${m.name} (${m.symbol})`);
        console.log(`     Precio: $${m.price.toFixed(6)}`);
        console.log(`     24h: ${change >= 0 ? '+' : ''}${change.toFixed(2)}%\n`);
    });
    
    console.log('💡 Usa la función Swap para comprar memecoins!\n');
}

async function showTransactions() {
    console.log('\n--- TRANSACCIONES ---\n');
    
    const address = await prompt('Tu dirección: ');
    const txs = walletCore.getTransactions(address);
    
    if (txs.length === 0) {
        console.log('No hay transacciones.');
        return;
    }
    
    console.log(`\nÚltimas ${txs.length} transacciones:\n`);
    
    txs.slice(0, 10).forEach((tx, i) => {
        console.log(`  [${i + 1}] ${tx.type.toUpperCase()}`);
        console.log(`      ${tx.amount} ${tx.token}`);
        console.log(`      De: ${tx.from.substring(0, 10)}...`);
        console.log(`      A: ${tx.to.substring(0, 10)}...`);
        console.log(`      Fee: ${tx.fee || 0}`);
        console.log(`      ${new Date(tx.timestamp).toLocaleString()}\n`);
    });
}

async function showFeesCollected() {
    console.log('\n--- COMISIONES COBRADAS ---\n');
    
    const fees = walletCore.getFeesCollected();
    
    console.log('═══════════════════════════════════════════');
    console.log('        COMISIONES BLAST WALLET');
    console.log('═══════════════════════════════════════════\n');
    
    console.log('💰 Total cobrado:');
    console.log(`   ${fees.total.toFixed(4)} BLAST (~$${(fees.total * 0.001).toFixed(4)})\n`);
    
    console.log('📊 Por tipo:');
    console.log(`   Swap:     ${fees.byType.swap.toFixed(4)} BLAST`);
    console.log(`   NFT:      ${fees.byType.nft.toFixed(4)} BLAST`);
    console.log(`   Staking:  ${fees.byType.staking.toFixed(4)} BLAST`);
    console.log(`   Bridge:   ${fees.byType.bridge.toFixed(4)} BLAST`);
    
    console.log('\n🏦 Wallet receptora:');
    console.log(`   ${fees.masterWallet}`);
    console.log('\n📋 Tasas aplicadas:\n');
    
    Object.entries(fees.breakdown).forEach(([type, desc]) => {
        console.log(`   ${type}: ${desc}`);
    });
    
    console.log('\n');
}

async function showNetworkInfo() {
    console.log('\n--- INFORMACIÓN DE RED ---\n');
    
    console.log('═══════════════════════════════════════════');
    console.log('           BLAST NETWORK INFO');
    console.log('═══════════════════════════════════════════\n');
    
    console.log('  Chain ID:        8888');
    console.log('  Network:         BLAST Mainnet');
    console.log('  Block Time:      15 segundos');
    console.log('  Símbolo:         BLAST');
    console.log('  Decimales:       18');
    console.log('  Max Supply:      42,000,000 BLAST\n');
    
    console.log('📦 Activos soportados:');
    console.log(`   Tokens:         ${Object.keys(SUPPORTED_TOKENS).length}`);
    console.log(`   Memecoins:      ${MEMECOINS.length}`);
    console.log('   NFTs:           Ilimitados\n');
    
    console.log('💎 Características:');
    console.log('   ✓ Swap de cualquier token');
    console.log('   ✓ Crear y tradear NFTs');
    console.log('   ✓ Memecoins');
    console.log('   ✓ Staking');
    console.log('   ✓ Bridge');
    console.log('   ✓ Comisiones ultra-bajas');
    console.log('\n');
}

async function main() {
    while (true) {
        await showMainMenu();
        
        const option = await prompt('Selecciona una opción: ');
        
        switch (option.trim()) {
            case '1':
                await createWallet();
                break;
            case '2':
                await importWallet();
                break;
            case '3':
                await showBalance();
                break;
            case '4':
                await doSwap();
                break;
            case '5':
                await createNFT();
                break;
            case '6':
                await showNFTs();
                break;
            case '7':
                await showMarket();
                break;
            case '8':
                await transfer();
                break;
            case '9':
                await showMarket();
                break;
            case '10':
                await showMemecoins();
                break;
            case '11':
                await showTransactions();
                break;
            case '12':
                await showFeesCollected();
                break;
            case '13':
                await showNetworkInfo();
                break;
            case '0':
                console.log('\n¡Gracias por usar BLAST Wallet! 🚀\n');
                rl.close();
                process.exit(0);
            default:
                console.log('\n❌ Opción inválida.\n');
        }
        
        await prompt('\nPresiona Enter para continuar...');
    }
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = { main };
