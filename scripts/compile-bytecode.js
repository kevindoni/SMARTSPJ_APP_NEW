/**
 * Script untuk mengompilasi file Electron ke bytecode
 * Melindungi kode sumber dari reverse engineering
 */

const bytenode = require('bytenode');
const fs = require('fs');
const path = require('path');

const ELECTRON_DIR = path.join(__dirname, '..', 'electron');

// Daftar file yang akan dikompilasi ke bytecode
const filesToCompile = [
    'main.js',
];

// Recursive function to get all .js files
function getAllJsFiles(dir, fileList = [], rootDir = ELECTRON_DIR) {
    const files = fs.readdirSync(dir);

    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            getAllJsFiles(filePath, fileList, rootDir);
        } else {
            if (file.endsWith('.js')) {
                // Get relative path from electron root
                const relativePath = path.relative(rootDir, filePath);
                fileList.push(relativePath);
            }
        }
    });

    return fileList;
}

// Handler files (Recursive)
const handlersDir = path.join(ELECTRON_DIR, 'handlers');
if (fs.existsSync(handlersDir)) {
    const allHandlers = getAllJsFiles(handlersDir, [], ELECTRON_DIR);
    filesToCompile.push(...allHandlers);
}

// Config files (Recursive)
const configDir = path.join(ELECTRON_DIR, 'config');
if (fs.existsSync(configDir)) {
    const allConfig = getAllJsFiles(configDir, [], ELECTRON_DIR);
    filesToCompile.push(...allConfig);
}

console.log('🔐 Memulai kompilasi bytecode...\n');

filesToCompile.forEach(file => {
    const srcPath = path.join(ELECTRON_DIR, file);
    const destPath = srcPath.replace('.js', '.jsc');

    if (!fs.existsSync(srcPath)) {
        console.log(`⚠️  Skip: ${file} tidak ditemukan`);
        return;
    }

    try {
        bytenode.compileFile({
            filename: srcPath,
            output: destPath,
            electron: true
        });
        console.log(`✅ Kompilasi: ${file} → ${file.replace('.js', '.jsc')}`);

        // Hapus file JS asli (opsional - bisa di-comment jika mau tetap simpan)
        // fs.unlinkSync(srcPath);
    } catch (err) {
        console.error(`❌ Gagal kompilasi ${file}:`, err.message);
    }
});

// Buat loader untuk main.js
const loaderContent = `
'use strict';
require('bytenode');
require('./main.jsc');
`;

fs.writeFileSync(
    path.join(ELECTRON_DIR, 'main-loader.js'),
    loaderContent.trim()
);
console.log('\n✅ Loader main-loader.js dibuat');

console.log('\n🎉 Kompilasi bytecode selesai!');
