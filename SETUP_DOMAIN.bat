@echo off
TITLE Configurar Dominio BLAST - Ejecutar como Administrador
CLS

ECHO  =======================================================
ECHO    CONFIGURACION DE DOMINIO BLAST NETWORK
ECHO  =======================================================
ECHO.

:: Verificar permisos de Administrador
net session >nul 2>&1
if %errorLevel% neq 0 (
    ECHO  [ERROR] NO TIENES PERMISOS DE ADMINISTRADOR.
    ECHO.
    ECHO  POR FAVOR:
    ECHO  1. Cierra esta ventana.
    ECHO  2. Haz CLIC DERECHO en el archivo "SETUP_DOMAIN".
    ECHO  3. Selecciona "Ejecutar como administrador".
    ECHO.
    PAUSE
    EXIT /B
)

:: Si tiene permisos, continuar
SET NEWLINE=^& echo.
SET DOMAIN=blast-network.blast
SET IP=127.0.0.1
SET HOSTS_FILE=%WINDIR%\System32\drivers\etc\hosts

ECHO  Agregando %DOMAIN% al archivo hosts de Windows...
ECHO.

:: Buscar si ya existe
FIND /C /I "%DOMAIN%" %HOSTS_FILE% >OY.txt
SET /p VAL=<OY.txt
DEL OY.txt

IF %VAL%==0 (
    ECHO %NEWLINE%^%IP%       %DOMAIN%>>%HOSTS_FILE%
    ECHO  [OK] Dominio agregado exitosamente.
) ELSE (
    ECHO  [INFO] El dominio ya estaba configurado.
)

ECHO.
ECHO  =======================================================
ECHO    LISTO!
ECHO  =======================================================
ECHO.
ECHO  Ahora puedes abrir en tu navegador:
ECHO  http://blast-network.blast:8080
ECHO.
PAUSE
