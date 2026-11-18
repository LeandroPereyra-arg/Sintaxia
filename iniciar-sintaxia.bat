@echo off
setlocal
title Sintaxia
cd /d "%~dp0"

echo.
echo  ===== Sintaxia =====
echo.

if not exist "package.json" (
  echo  Este archivo tiene que estar DENTRO de la carpeta Sintaxia-main,
  echo  al lado de package.json.
  pause
  exit /b 1
)

where node >nul 2>nul
if errorlevel 1 (
  echo  Falta Node.js. Se abre la pagina de descarga: instala la version LTS
  echo  y despues volve a hacer doble clic en este archivo.
  start "" "https://nodejs.org/"
  pause
  exit /b 1
)
for /f "tokens=1 delims=." %%v in ('node -v') do set NODEV=%%v
set NODEV=%NODEV:v=%
if %NODEV% LSS 18 (
  echo  Tu Node.js es muy viejo. Instala la version LTS desde nodejs.org.
  start "" "https://nodejs.org/"
  pause
  exit /b 1
)

if not exist ".env" (
  echo  Creando la configuracion de Supabase...
  > ".env" echo VITE_SUPABASE_URL=https://lbhktoibjccncblxpets.supabase.co
  >> ".env" echo VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_Ty32Dfcm0vpaT3jav3F7wg_tS6z5Jt4
)

if not exist "node_modules" (
  echo  Instalando dependencias. La primera vez tarda unos minutos...
  call npm install --no-audit --no-fund
  if errorlevel 1 (
    echo  No se pudo instalar. Revisa la conexion a internet y volve a intentar.
    pause
    exit /b 1
  )
)

echo.
echo  Listo. Se abre el navegador con Sintaxia.
echo    App ...................... http://localhost:5173/
echo    Pantalla del ranking ..... http://localhost:5173/expo/expo-2026/ranking
echo    Panel de administracion .. http://localhost:5173/admin
echo.
echo  Para cerrar Sintaxia, cerra esta ventana.
echo.
call npx vite --port 5173 --open /
pause
