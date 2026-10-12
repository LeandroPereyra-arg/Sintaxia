#!/bin/sh
# Compila Supabase Auth (GoTrue), el servidor de autenticacion que usa Supabase,
# para poder probar el registro, los invitados y la recuperacion de acceso sin
# tocar el proyecto real. Es el MISMO codigo fuente que corre en Supabase.
#
# Hace falta Go (https://go.dev/dl/) y acceso a https://proxy.golang.org.
# Deja el binario en ~/.cache/sintaxia/gotrue (se puede cambiar con GOTRUE_BIN).
#
#   sh pruebas/compilar-auth-local.sh
#
# Por que no es un simple `go install`: el proyecto declara un `replace` en su
# go.mod que apunta a un directorio que el proxy de modulos no incluye. Se baja
# el codigo, se quita ese reemplazo (queda la libreria original) y se compila.
set -eu

DESTINO="${GOTRUE_BIN:-$HOME/.cache/sintaxia/gotrue}"
TRABAJO="${TMPDIR:-/tmp}/sintaxia-auth-build"
export GOPATH="${GOPATH:-$HOME/.cache/sintaxia/gopath}"
export GOFLAGS=-mod=mod
export GOTOOLCHAIN=auto

mkdir -p "$(dirname "$DESTINO")" "$TRABAJO"
cd "$TRABAJO"

# Ultima version que publico el proxy de modulos (una version "pseudo" por commit).
VERSION="$(curl -fsS 'https://proxy.golang.org/github.com/supabase/auth/@v/master.info' \
  | sed -n 's/.*"Version":"\([^"]*\)".*/\1/p')"
[ -n "$VERSION" ] || { echo "No pude averiguar la ultima version de supabase/auth"; exit 1; }
echo "Compilando supabase/auth $VERSION"

rm -rf fuente && mkdir fuente
curl -fsS -o auth.zip "https://proxy.golang.org/github.com/supabase/auth/@v/$VERSION.zip"
unzip -q auth.zip -d fuente

cd fuente/github.com/supabase/auth@*
sed -i '/^replace github.com\/joho\/godotenv/d' go.mod
go build -o "$DESTINO" .

echo "Listo: $DESTINO"
