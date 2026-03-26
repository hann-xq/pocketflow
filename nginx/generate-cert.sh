#!/bin/sh
set -e

if [ -f /certs/server.crt ]; then
  echo "Certificate already exists, skipping generation."
  exit 0
fi

openssl req -x509 -nodes -days 3650 \
  -newkey rsa:2048 \
  -keyout /certs/server.key \
  -out /certs/server.crt \
  -subj '/CN=localhost' \
  -addext 'subjectAltName=DNS:localhost,IP:127.0.0.1'
