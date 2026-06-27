<p align="center">
    <img src="docs/logo.png" width="120" alt="SmartSPJ Logo">
</p>

<h1 align="center">
SmartSPJ
</h1>

<p align="center">
Desktop companion for <strong>ARKAS</strong> that simplifies BOS financial administration,
SPJ generation, reporting, and reconciliation.
</p>

<p align="center">

<img src="https://img.shields.io/github/v/release/kevindoni/SMARTSPJ_APP_NEW?style=flat-square">
<img src="https://img.shields.io/badge/Windows-10+-0078D4?style=flat-square&logo=windows">
<img src="https://img.shields.io/badge/Electron-28-47848F?style=flat-square&logo=electron">
<img src="https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react">
<img src="https://img.shields.io/badge/License-Proprietary-red?style=flat-square">

</p>

<p align="center">

<a href="https://github.com/kevindoni/SMARTSPJ_APP_NEW/releases">Download</a>
•
<a href="docs/PANDUAN_LENGKAP.md">Documentation</a>
•
<a href="CHANGELOG.md">Changelog</a>

</p>

---

<p align="center">
<img src="docs/dashboard.png" width="100%">
</p>

## Overview

SmartSPJ is a Windows desktop application built to assist Indonesian schools in managing BOS financial accountability documents.

Instead of replacing ARKAS, SmartSPJ works alongside it by providing a read-only analytical layer for financial reporting, reconciliation, document generation, and data validation.

Core principles:

- Read-only access to ARKAS database
- Fast report generation
- Consistent financial calculations
- Modern desktop interface
- Secure local processing

---

## Features

| Module | Description |
|---------|-------------|
| Dashboard | Financial overview, statistics, charts, monthly balance |
| RKAS Creator | Budget planning, realization tracking, proportional analysis |
| Cash Books | BKU, Cash, Bank, Tax Ledger |
| Reporting | SPTJM, K7, Register Kas, Realization Report |
| Reconciliation | BA Rekonsiliasi, Bank Reconciliation, Working Papers |
| Printing | Receipts, Payment Proofs, Batch Printing |
| Export | PDF, Excel, HTML |
| Backup | Configuration & Full Project Backup |

---

## What's New in v1.11.4

### Realization Tracking

- Budget realization per activity
- Budget variance calculation
- Monthly realization breakdown
- Smart reconciliation table

### ARKAS Synchronization

- Detect outdated RKAS
- Synchronization reminder
- Automatic validation

### Improvements

- Duplicate realization fixes
- Performance optimization
- Better yearly calculations

---

## Screenshots

| Dashboard | RKAS |
|-----------|------|
| ![](docs/dashboard.png) | ![](docs/rkas.png) |

| Cash Book | Reconciliation |
|-----------|----------------|
| ![](docs/bku.png) | ![](docs/rekonsiliasi.png) |

---

## Technology

| Component | Technology |
|-----------|------------|
| Framework | Electron 28 |
| UI | React 18 |
| Build | Vite 5 |
| Styling | TailwindCSS |
| Database | SQLCipher |
| Charts | Chart.js |
| Excel | ExcelJS |
| PDF | jsPDF & PDFKit |
| Updates | Electron Updater |

---

## Security

SmartSPJ is designed with multiple security layers.

| Layer | Implementation |
|--------|----------------|
| Database | SQLCipher |
| ARKAS Access | Read-only |
| Credential Storage | Windows DPAPI |
| Licensing | Ed25519 Signature |
| Device Binding | Hardware Fingerprint |
| Source Protection | Bytenode (.jsc) |

---

## Download

Download the latest installer from the GitHub Releases page.

> Windows SmartScreen may display a warning because the application is not yet signed with a public code-signing certificate.

---

## Documentation

- User Guide
- Installation Guide
- Changelog
- License

---

## License

Copyright © 2024–2026 KevinDoni.

SmartSPJ is distributed under the SmartSPJ Proprietary License.

Unauthorized redistribution, modification, or commercial use is prohibited.
```
