#!/bin/sh
#/**
# * Genera un certificado TLS autofirmado para localhost.
# *
# * Crea cert.pem y key.pem en la carpeta indicada (por defecto ./certs).
# * Se ejecuta durante el build de la imagen. El navegador avisará porque
# * no lo firma ninguna autoridad; en local es lo esperado.
# * Uso: sh scripts/generate-cert.sh [carpeta]
# */
set -eu

OUT_DIR="${1:-./certs}"
mkdir -p "$OUT_DIR"

openssl req -x509 -newkey rsa:2048 -nodes -sha256 -days 365 \
  -keyout "$OUT_DIR/key.pem" \
  -out "$OUT_DIR/cert.pem" \
  -subj "/CN=localhost" \
  -addext "subjectAltName=DNS:localhost,IP:127.0.0.1"

echo "Self-signed certificate written to $OUT_DIR (cert.pem, key.pem)"
