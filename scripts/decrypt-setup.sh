#!/bin/bash
# ============================================================
# SmartSPJ — Decrypt Setup Script
# Jalankan script ini SETELAH clone repo di mesin baru
# ============================================================
#
# CARA PAKAI:
# 1. Copy file crypto-key ke folder yang sama dengan repo
# 2. git clone https://github.com/kevindoni/SMARTSPJ_APP_NEW.git
# 3. cd SMARTSPJ_APP_NEW
# 4. Copy crypto-key ke .git/crypto-key
# 5. Jalankan: bash scripts/decrypt-setup.sh
#
# TANPA KEY, SOURCE CODE TIDAK BISA DIBACA.
# SIMPAN KEY DI TEMPAT AMAN (USB, Cloud Storage, DLL).
# ============================================================

set -e

KEY_FILE=".git/crypto-key"

if [ ! -f "$KEY_FILE" ]; then
  echo "ERROR: Key file tidak ditemukan di $KEY_FILE"
  echo "Copy file crypto-key ke .git/crypto-key terlebih dahulu."
  exit 1
fi

echo "[1/3] Configuring git encryption filter..."

git config filter.crypto.clean "openssl aes-256-cbc -pbkdf2 -salt -pass file:.git/crypto-key"
git config filter.crypto.smudge "openssl aes-256-cbc -pbkdf2 -d -pass file:.git/crypto-key"
git config filter.crypto.required true

echo "[2/3] Decrypting all files..."

# Force re-checkout to trigger smudge filter (decrypt)
git rm --cached -r . > /dev/null 2>&1
git reset --hard HEAD > /dev/null 2>&1

echo "[3/3] Verifying..."

if grep -q "const { app" electron/main.js 2>/dev/null; then
  echo ""
  echo "=========================================="
  echo "  DECRYPT BERHASIL!"
  echo "  Source code siap digunakan."
  echo "=========================================="
else
  echo ""
  echo "=========================================="
  echo "  WARNING: Verifikasi gagal."
  echo "  Pastikan key file benar."
  echo "=========================================="
  exit 1
fi
