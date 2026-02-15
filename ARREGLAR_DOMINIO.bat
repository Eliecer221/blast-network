@echo off
TITLE Arreglar Dominio BLAST
CLS

:: Verificando permisos
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo.
    echo  [ERROR] NECESITAS EJECUTAR COMO ADMINISTRADOR.
    echo.
    echo  1. Cierra esto.
    echo  2. Clic derecho en el archivo - Ejecutar como administrador.
    echo.
    PAUSE
    EXIT /B
)

SET HOSTS=%WINDIR%\System32\drivers\etc\hosts

:: Forzar salto de línea y luego la entrada correcta
ECHO.>>%HOSTS%
ECHO 127.0.0.1       blast-network.blast>>%HOSTS%

ECHO.
ECHO  =======================================================
ECHO    CORRECCION APLICADA
ECHO  =======================================================
ECHO.
ECHO  Se ha forzado un salto de linea y agregado el dominio.
ECHO  Prueba ahora entrar a: http://blast-network.blast:8080
ECHO.
PAUSE
