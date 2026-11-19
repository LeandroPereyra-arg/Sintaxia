#!/bin/sh
# Sintaxia: ./iniciar-sintaxia.sh (Linux o macOS), dentro de la carpeta Sintaxia-main.
cd "$(dirname "$0")" || exit 1
[ -f package.json ] || { echo "Este archivo tiene que estar dentro de la carpeta Sintaxia-main."; exit 1; }
if ! command -v node >/dev/null 2>&1; then
  echo "Falta Node.js: instala la version LTS desde https://nodejs.org/ y volve a correr esto."; exit 1
fi
mayor=$(node -v | sed 's/^v//; s/\..*//')
[ "$mayor" -ge 18 ] || { echo "Tu Node.js es muy viejo: instala la version LTS desde https://nodejs.org/"; exit 1; }
if [ ! -f .env ]; then
  echo "Creando la configuracion de Supabase..."
  printf 'VITE_SUPABASE_URL=https://lbhktoibjccncblxpets.supabase.co\nVITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_Ty32Dfcm0vpaT3jav3F7wg_tS6z5Jt4\n' > .env
fi
if ! node scripts/faltan-dependencias.cjs; then
  echo "Instalando dependencias. La primera vez tarda unos minutos..."
  npm install --no-audit --no-fund || { echo "No se pudo instalar. Revisa la conexion."; exit 1; }
fi
echo ""
echo "Listo. Se abre el navegador con Sintaxia."
echo "  App ...................... http://localhost:5173/"
echo "  Pantalla del ranking ..... http://localhost:5173/expo/expo-2026/ranking"
echo "  Panel de administracion .. http://localhost:5173/admin"
echo "Para cerrar Sintaxia: Ctrl+C o cerrar esta ventana."
exec npx vite --port 5173 --open /
