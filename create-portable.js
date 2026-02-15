const fs = require('fs');
const path = require('path');

const DIST_DIR = path.join(__dirname, 'dist', 'BLAST_WALLET_PENDIVE');

function createPortablePackage() {
    console.log('📦 CREANDO PAQUETE PORTABLE PARA PENDRIVE\n');
    
    if (!fs.existsSync(path.join(DIST_DIR, '..'))) {
        fs.mkdirSync(path.join(DIST_DIR, '..'), { recursive: true });
    }
    
    if (fs.existsSync(DIST_DIR)) {
        fs.rmSync(DIST_DIR, { recursive: true });
    }
    
    fs.mkdirSync(DIST_DIR, { recursive: true });
    fs.mkdirSync(path.join(DIST_DIR, 'data'), { recursive: true });
    
    const filesToCopy = [
        'package.json',
        'README.md',
        'config/genesis.json',
        'src/blockchain/index.js',
        'src/wallet/trezorWallet.js',
        'src/wallet/hardwareWallet.js',
        'src/wallet/portable.js',
        'src/wallet/blastWallet.js',
        'src/rpc/server.js',
        'src/miner/index.js',
        'src/domains/registry.js'
    ];
    
    console.log('📋 Copiando archivos...\n');
    
    filesToCopy.forEach(file => {
        const src = path.join(__dirname, file);
        if (fs.existsSync(src)) {
            const dest = path.join(DIST_DIR, file);
            const destDir = path.dirname(dest);
            
            if (!fs.existsSync(destDir)) {
                fs.mkdirSync(destDir, { recursive: true });
            }
            
            fs.copyFileSync(src, dest);
            console.log(`   ✓ ${file}`);
        }
    });
    
    const packageJson = {
        name: "blast-wallet-portable",
        version: "1.0.0",
        description: "BLAST Wallet Portable - Trezor Edition",
        main: "src/wallet/trezorWallet.js",
        scripts: {
            "start": "node src/wallet/trezorWallet.js",
            "wallet": "node src/wallet/trezorWallet.js",
            "rpc": "node src/rpc/server.js"
        },
        dependencies: {
            "express": "^4.18.2",
            "ws": "^8.14.2",
            "secp256k1": "^4.0.3",
            "keccak": "^3.0.3",
            "uuid": "^9.0.1"
        }
    };
    
    fs.writeFileSync(
        path.join(DIST_DIR, 'package.json'),
        JSON.stringify(packageJson, null, 2)
    );
    
    const readme = `
# 💎 BLAST WALLET - EDICIÓN PENDRIVE

## 📋 CARACTERÍSTICAS

- ✅ Estilo Trezor Safe 3
- ✅ PIN de 4-8 dígitos
- ✅ 12 palabras semilla
- ✅ Passphrase oculto
- ✅ Shamir Backup
- ✅ Multi-chain (10+ chains)
- ✅ Sin instalación requerida

## 🚀 CÓMO USAR

### Opción 1: Doble clic
1. Haz doble clic en \`BLAST-Wallet.bat\`
2. Selecciona el modo de wallet
3. ¡Listo!

### Opción 2: Línea de comandos
\`\`\`bash
node src/wallet/trezorWallet.js
\`\`\`

## 🔐 MODOS DE WALLET

### Trezor Edition (Recomendado)
- PIN de 4-8 dígitos
- Passphrase oculto
- Shamir Backup
- Confirmación de transacciones

### Wallet Básica
- 12 palabras semilla
- Password simple

### Secure Wallet
- Máxima seguridad
- Auto-lock
- Whitelist

## 📦 ARCHIVOS

\`\`\`
BLAST_WALLET_PENDIVE/
├── BLAST-Wallet.bat      ← Ejecutar esto
├── package.json
├── src/
│   └── wallet/
│       ├── trezorWallet.js     ← Trezor Edition
│       ├── hardwareWallet.js   ← Básica
│       └── portable.js         ← Portable
├── data/                   ← Tus wallets aquí
└── README.txt
\`\`\`

## ⚠️ IMPORTANTE

1. **Primera vez**: Crea tu wallet y guarda las 12 palabras
2. **PIN**: No lo olvides, no hay recuperación
3. **Backups**: Haz backup de tus palabras
4. **Seguridad**: Desconecta el pendrive cuando no lo uses

## 🔧 INSTALAR DEPENDENCIAS

Si es la primera vez que ejecutas en una PC:
\`\`\`bash
npm install
\`\`\`

## 📱 CARACTERÍSTICAS DE SEGURIDAD

✓ PIN Protection (4-8 dígitos)
✓ 12 Palabras Semilla (BIP39)
✓ Passphrase Oculto
✓ Shamir Backup (3-of-5)
✓ Confirmación de Transacciones
✓ Auto-lock por inactividad
✓ Almacenamiento Cifrado

---

**BLAST NETWORK** - Blockchain Layer 1
Creador: Eliecer Jose Depablos Miquilena
`;

    fs.writeFileSync(path.join(DIST_DIR, 'README.txt'), readme);
    
    const batchFile = `
@echo off
chcp 65001 >nul
title BLAST Wallet
color 0a

echo.
echo ╔═══════════════════════════════════════════════════════════════╗
echo ║                     💎 BLAST WALLET 💎                        ║
echo ║                   EDICION PENDRIVE v1.0                      ║
echo ╚═══════════════════════════════════════════════════════════════╝
echo.

where node >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js no esta instalado
    echo Descargalo de: https://nodejs.org
    pause
    exit /b 1
)

if not exist "node_modules" (
    echo 📦 Instalando dependencias...
    call npm install
)

echo.
echoSelecciona modo:
echo   [1] Trezor Edition (Recomendado)
echo   [2] Wallet Basica  
echo   [3] Servidor RPC
echo.

set /p opt="Opcion: "

if "%opt%"=="1" node src\\wallet\\trezorWallet.js
if "%opt%"=="2" node src\\wallet\\hardwareWallet.js
if "%opt%"=="3" node src\\rpc\\server.js
`;

    fs.writeFileSync(path.join(DIST_DIR, 'BLAST-Wallet.bat'), batchFile);
    
    const infoFile = `
BLAST WALLET - INFORMACIÓN DE SEGURIDAD
========================================

✓ Esta wallet NO guarda tu private key
✓ Tu clave se deriva de las 12 palabras + PIN
✓ Las 12 palabras son LA ÚNICA forma de recuperar
✓ Passphrase crea una wallet OCULTA adicional
✓ Shamir divide tus palabras en 5 fragmentos

RECOMENDACIONES:
1. Guarda las 12 palabras en papel
2. No las guardes digitalmente
3. No las compartas con nadie
4. Usa passphrase para mayor privacidad
5. Desconecta el pendrive cuando no lo uses

ARCHIVOS IMPORTANTES:
- wallet.enc = Tu wallet cifrada
- pin.hash = Hash de tu PIN
- shamir/ = Fragmentos de backup

EN CASO DE PÉRDIDA:
- Necesitas tus 12 palabras
- Creas nueva wallet en cualquier dispositivo
- Importas tus 12 palabras
- Recuperas TODOS tus fondos
`;

    fs.writeFileSync(path.join(DIST_DIR, 'INFO-SECURIDAD.txt'), infoFile);
    
    console.log('\n✅ PAQUETE CREADO EN:');
    console.log(`   ${DIST_DIR}\n`);
    console.log('📂 Archivos creados:');
    console.log('   - BLAST-Wallet.bat');
    console.log('   - package.json');
    console.log('   - README.txt');
    console.log('   - INFO-SECURIDAD.txt');
    console.log('   - src/ (código fuente)');
    console.log('   - data/ (wallets)');
    console.log('\n🚀 Listo para copiar al pendrive!\n');
}

createPortablePackage();
