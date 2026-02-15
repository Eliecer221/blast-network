@echo off
chcp 65001 >nul
title BLAST Wallet - Trezor Edition
color 0a

echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║                                                                ║
echo ║          💎 BLAST WALLET - TREZOR EDITION 💎                 ║
echo ║                                                                ║
echo ║              Instalando dependencias...                       ║
echo ║                                                                ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.

REM Verificar si Node.js está instalado
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo ❌ Node.js no está instalado!
    echo.
    echo Por favor instala Node.js desde: https://nodejs.org
    echo.
    pause
    exit /b 1
)

REM Verificar si las dependencias están instaladas
if not exist "node_modules" (
    echo 📦 Instalando dependencias...
    call npm install
    if %errorlevel% neq 0 (
        echo.
        echo ❌ Error al instalar dependencias
        pause
        exit /b 1
    )
)

echo.
echo ✅ Todo listo!
echo.
echo ═════════════════════════════════════════════════════════════════
echo.
echo Selecciona el modo de wallet:
echo.
echo   [1] 💎 Trezor Edition (Recomendado)
echo   [2] 💳 Wallet Basica
echo   [3] 🔐 Secure Wallet
echo   [4] 🌐 Servidor RPC
echo   [5] 🚀 Iniciar Todo
echo.
echo   [0] 🚪 Salir
echo.
set /p choice="Opcion: "

if "%choice%"=="1" goto trezor
if "%choice%"=="2" goto basic
if "%choice%"=="3" goto secure
if "%choice%"=="4" goto rpc
if "%choice%"=="5" goto all
if "%choice%"=="0" exit /b

:trezor
echo.
echo Iniciando BLAST Wallet Trezor Edition...
node src\wallet\trezorWallet.js
goto end

:basic
echo.
echo Iniciando BLAST Wallet Basica...
node src\wallet\hardwareWallet.js
goto end

:secure
echo.
echo Iniciando BLAST Secure Wallet...
node src\wallet\portable.js cli
goto end

:rpc
echo.
echo Iniciando servidor RPC...
node src\rpc\server.js
goto end

:all
echo.
echo Iniciando todo...
start "BLAST RPC" node src\rpc\server.js
timeout /t 2 /nobreak >nul
start "BLAST Wallet" node src\wallet\trezorWallet.js
goto end

:end
echo.
echo ================================================================
echo.
echo Gracias por usar BLAST Wallet!
echo.
pause
