const { app } = require('electron');
const Database = require('better-sqlite3-multiple-ciphers');
const path = require('path');
const os = require('os');
const fs = require('fs');

app.whenReady().then(() => {
    try {
        const ARKAS_PASSWORD = 'K3md1kbudRIS3n4yan';
        const envPath = path.join(process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming'), 'Arkas', 'arkas.db');
        console.log("Membuka database di:", envPath);
        
        const db = new Database(envPath, { readonly: true });
        db.pragma("cipher='sqlcipher'");
        db.pragma("legacy=4");
        db.pragma(`key='${ARKAS_PASSWORD}'`);
        
        // Cek anggaran yg is_approve
        let qAnggaran = db.prepare(`
            SELECT a.id_anggaran, a.tahun_anggaran, a.is_revisi, a.is_approve, sd.nama_sumber_dana 
            FROM anggaran a
            LEFT JOIN ref_sumber_dana sd ON a.id_ref_sumber_dana = sd.id_ref_sumber_dana
            WHERE a.soft_delete = 0 AND a.is_approve = 1 AND (a.tahun_anggaran = '2026' OR a.tahun_anggaran = 2026)
        `).all();
        console.log("\\n>>> ANGGARAN (APPROVED=1) TA 2026:");
        console.log(JSON.stringify(qAnggaran, null, 2));

        // Pilih anggaran bos reguler dgn revisi tertinggi
        let sah = qAnggaran.filter(x => x.nama_sumber_dana === 'BOS Reguler')
                           .reduce((max, cur) => (cur.is_revisi > max?.is_revisi ? cur : max), qAnggaran.find(x => x.nama_sumber_dana === 'BOS Reguler'));
        
        console.log("\\n>>> ANGGARAN BOS REGULER TERPILIH:", sah);

        if (sah) {
            let qFutsal = db.prepare(`
                SELECT id_rapbs, id_anggaran, uraian, volume, satuan, harga_satuan, jumlah 
                FROM rapbs 
                WHERE id_anggaran='${sah.id_anggaran}' AND soft_delete=0 AND uraian LIKE '%Futsal%'
            `).all();
            console.log("\\n>>> ISI TABEL RAPBS UNTUK 'Futsal' PADA ANGGARAN INI:");
            console.log(JSON.stringify(qFutsal, null, 2));

            if (qFutsal.length > 0) {
                 // Cek periodenya (karena kalau di ARKAS periode ini yg diprint)
                 let idR = qFutsal.map(f => "'" + f.id_rapbs + "'").join(',');
                 let qPeriode = db.prepare(`
                     SELECT id_rapbs_periode, id_rapbs, id_periode, volume, jumlah 
                     FROM rapbs_periode 
                     WHERE id_rapbs IN (${idR}) AND soft_delete=0 AND volume > 0
                 `).all();
                 console.log("\\n>>> TABEL TARGET PERIODE (rapbs_periode) untuk Futsal tersebut:");
                 console.log(JSON.stringify(qPeriode, null, 2));
            }
        }
        
        // Let's also check if there is any Cartesian product in our getBudgetRealization mechanism
        console.log("\\n>>> Cek Ref Kode (Kategori Lomba) - Apakah ganda? ");
        let qKode = db.prepare(`
            SELECT id_ref_kode, tahun, id_kode, uraian_kode FROM ref_kode WHERE uraian_kode LIKE '%Lomba%' AND (tahun='2026' OR tahun=2026)
        `).all();
        console.log(JSON.stringify(qKode, null, 2));

        db.close();
        
    } catch(e) {
        console.error("DIAG ERROR:", e);
    }
    app.quit();
});
