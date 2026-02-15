const fs = require('fs');
const path = require('path');

const DIST_DIR = path.join(__dirname, 'dist');
const PORTABLE_DIR = path.join(DIST_DIR, 'BLAST_WALLET_PENDRIVE');
const PC_DIR = path.join(DIST_DIR, 'BLAST_WALLET_PC');

// Archivos comunes a incluir en ambas versiones
const COMMON_FILES = [
    'package.json',
    'README.md',
    'config/genesis.json',
    'src/blockchain/index.js',
    'src/wallet/trezorWallet.js',
    'src/wallet/hardwareWallet.js',
    'src/wallet/portable.js',
    'src/wallet/blastWallet.js',
    'src/wallet/secureWallet.js', // Incluir secureWallet también
    'src/rpc/server.js',
    'src/miner/index.js',
    'src/domains/registry.js',
    'blastwallet-integration.js' // Incluir la integración también
];

function log(msg) {
    console.log(`[GENERATOR] ${msg}`);
}

function ensureDir(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

function copyFiles(destinationDir, files) {
    log(`Copiando archivos a: ${destinationDir}`);
    ensureDir(destinationDir);
    ensureDir(path.join(destinationDir, 'data')); // Carpeta de datos vacía

    files.forEach(file => {
        const src = path.join(__dirname, file);
        if (fs.existsSync(src)) {
            const dest = path.join(destinationDir, file);
            const destDir = path.dirname(dest);
            ensureDir(destDir);
            fs.copyFileSync(src, dest);
            // log(`  + ${file}`);
        } else {
            console.warn(`  ! Archivo no encontrado: ${file}`);
        }
    });
}

function createBatchFile(dir, fileName, title, modeMenu) {
    const content = `
@echo off
chcp 65001 >nul
title ${title}
color 0b

echo.
echo ╔═══════════════════════════════════════════════════════════════╗
echo ║                     💎 BLAST WALLET 💎                        ║
echo ║                  ${title.padEnd(29)}                ║
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
    echo 📦 Instalando dependencias (Primera ejecucion)...
    call npm install
)

echo.
${modeMenu}
echo.

set /p opt="Opcion: "

${modeMenu.includes('[1]') ? 'if "%opt%"=="1" node src\\wallet\\trezorWallet.js' : ''}
${modeMenu.includes('[2]') ? 'if "%opt%"=="2" node src\\wallet\\hardwareWallet.js' : ''}
${modeMenu.includes('[3]') ? 'if "%opt%"=="3" node src\\wallet\\secureWallet.js' : ''}
${modeMenu.includes('[4]') ? 'if "%opt%"=="4" node src\\rpc\\server.js' : ''}

if "%opt%"=="" goto :eof
pause
`;
    fs.writeFileSync(path.join(dir, fileName), content);
}

function createPortableVersion() {
    log('🔨 Creando versión PORTABLE (Pendrive)...');

    // Limpiar si existe
    if (fs.existsSync(PORTABLE_DIR)) {
        fs.rmSync(PORTABLE_DIR, { recursive: true });
    }

    copyFiles(PORTABLE_DIR, COMMON_FILES);

    // Crear BAT específico para Portable
    const menu = `
echoSelecciona modo:
echo   [1] Trezor Edition (Recomendado - Alta Seguridad)
echo   [2] Wallet Basica (Rapida)
echo   [3] Secure Wallet (Maxima Seguridad)
`;
    createBatchFile(PORTABLE_DIR, 'BLAST-Wallet-Portable.bat', 'EDICION PENDRIVE', menu);

    // Info específica
    const info = `BLAST WALLET - EDICIÓN PORTABLE\n\nEsta versión está diseñada para ejecutarse desde un pendrive.\nMantenga siempre su pendrive en un lugar seguro.`;
    fs.writeFileSync(path.join(PORTABLE_DIR, 'LEEME.txt'), info);

    log('✅ Versión Portable creada.');
}

function createPCVersion() {
    log('🔨 Creando versión PC (Estática)...');

    // Limpiar si existe
    if (fs.existsSync(PC_DIR)) {
        fs.rmSync(PC_DIR, { recursive: true });
    }

    copyFiles(PC_DIR, COMMON_FILES);

    // Crear BAT específico para PC
    const menu = `
echoSelecciona modo:
echo   [1] Iniciar Wallet (Trezor Mode)
echo   [3] Secure Wallet Dashboard
echo   [4] Iniciar Nodo RPC (Segundo plano)
`;
    createBatchFile(PC_DIR, 'BLAST-Wallet-PC.bat', 'EDICION DE ESCRITORIO', menu);

    // Script de "Instalación" simulada (Crear acceso directo sería complejo sin módulos externos, así que un BAT de setup simple)
    const setupScript = `
@echo off
echo Configurando BLAST Wallet para PC...
echo.
if not exist "node_modules" (
    echo Instalando dependencias...
    call npm install
)
echo.
echo ✅ Instalacion completada.
echo Ejecute BLAST-Wallet-PC.bat para iniciar.
pause
    `;
    fs.writeFileSync(path.join(PC_DIR, 'INSTALAR.bat'), setupScript);

    log('✅ Versión PC creada.');
}

async function main() {
    console.log('🚀 INICIANDO GENERADOR DE WALLETS DE BLAST NETWORK\n');

    createPortableVersion();
    console.log('-'.repeat(40));
    createPCVersion();

    console.log('\n✨ PROCESO COMPLETADO EXITOSAMENTE');
    console.log(`📂 Directorio de salida: ${DIST_DIR}`);
}

main();
