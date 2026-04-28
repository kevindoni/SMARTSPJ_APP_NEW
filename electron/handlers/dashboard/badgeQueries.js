/**
 * Badge Queries - Dashboard badge/status calculations
 * Handles: BKU status, Pengesahan, Transfer, Revisi, Pagu Sisa
 */

/**
 * Get BKU activation status
 * @param {Object} db - Database connection
 * @param {string} yearStr - Year as string
 * @returns {Object|null} BKU status data
 */
function getBkuStatus(db, yearStr) {
    try {
        return db.prepare(`
      SELECT id_periode, tanggal_aktivasi, tanggal_finish, status_pengiriman 
      FROM aktivasi_bku
      WHERE (strftime('%Y', tanggal_aktivasi) = ? OR tanggal_aktivasi LIKE ?)
      ORDER BY tanggal_aktivasi DESC 
      LIMIT 1
    `).get(yearStr, `${yearStr}%`);
    } catch (e) {
        return null;
    }
}

/**
 * Get pengesahan (approval) status
 * @param {Object} db - Database connection
 * @param {string} yearStr - Year as string
 * @param {string} fundFilterAnggaran - Fund filter for anggaran
 * @param {number} year - Year number
 * @returns {Object} Pengesahan status
 */
function getPengesahanStatus(db, yearStr, fundFilterAnggaran, year) {
    // Try pengesahan table first
    try {
        const result = db.prepare(`
      SELECT is_sah, create_date, keterangan
      FROM pengesahan
      WHERE (strftime('%Y', create_date) = ? OR create_date LIKE ?)
      ORDER BY create_date DESC 
      LIMIT 1
    `).get(yearStr, `${yearStr}%`);

        if (result) return result;
    } catch (e) { /* table might not exist */ }

    // Fallback to anggaran.is_approve
    try {
        const checkAnggaran = db.prepare(`
      SELECT is_approve 
      FROM anggaran a
      LEFT JOIN ref_sumber_dana sd ON a.id_ref_sumber_dana = sd.id_ref_sumber_dana
      WHERE (a.tahun_anggaran = ? OR a.tahun_anggaran = ?) 
        AND a.soft_delete = 0
        ${fundFilterAnggaran}
      ORDER BY a.is_revisi DESC, a.id_anggaran DESC
      LIMIT 1
    `).get(yearStr, Number(year));

        if (checkAnggaran) {
            return { is_sah: checkAnggaran.is_approve || 0, create_date: null };
        }
    } catch (e) { /* fallback failed */ }

    return { is_sah: 0, create_date: null, keterangan: null };
}

/**
 * Get latest transfer/penerimaan dana
 * @param {Object} db - Database connection
 * @param {string} yearStr - Year as string
 * @param {string} fundSource - Fund source name
 * @returns {Object|null} Transfer data
 */
function getLatestTransfer(db, yearStr, fundSource) {
    try {
        let transferFilter = '';
        if (fundSource && fundSource !== 'SEMUA') {
            transferFilter = `AND id_anggaran IN (
        SELECT a.id_anggaran FROM anggaran a
        JOIN ref_sumber_dana sd ON a.id_ref_sumber_dana = sd.id_ref_sumber_dana
        WHERE sd.nama_sumber_dana = '${fundSource}'
      )`;
        }

        return db.prepare(`
      SELECT tanggal_transaksi, saldo, uraian 
      FROM kas_umum 
      WHERE id_ref_bku = 2
        AND (strftime('%Y', tanggal_transaksi) = ? OR tanggal_transaksi LIKE ?)
        AND soft_delete = 0
        ${transferFilter}
      ORDER BY tanggal_transaksi DESC 
      LIMIT 1
    `).get(yearStr, `${yearStr}%`);
    } catch (e) {
        return null;
    }
}

/**
 * Get revision status
 * @param {Object} db - Database connection
 * @param {string} yearStr - Year as string
 * @param {string} fundFilterAnggaran - Fund filter
 * @param {number} year - Year number
 * @returns {Object} Revision info
 */
function getRevisiStatus(db, yearStr, fundFilterAnggaran, year) {
    try {
        const result = db.prepare(`
      SELECT a.is_revisi as rev, a.is_approve 
      FROM anggaran a
      LEFT JOIN ref_sumber_dana sd ON a.id_ref_sumber_dana = sd.id_ref_sumber_dana
      WHERE (a.tahun_anggaran = ? OR a.tahun_anggaran = ?) 
        AND a.soft_delete = 0
        ${fundFilterAnggaran}
      ORDER BY a.is_revisi DESC, a.id_anggaran DESC
      LIMIT 1
    `).get(yearStr, Number(year));

        return {
            nomor: result?.rev ?? 0,
            is_approve: result?.is_approve ?? 0
        };
    } catch (e) {
        return { nomor: 0, is_approve: 0 };
    }
}

/**
 * Calculate remaining budget (pagu sisa)
 * @param {Object} db - Database connection
 * @param {string} yearStr - Year as string
 * @param {string} fundSource - Fund source name
 * @param {number} revisiNum - Current revision number
 * @param {number} year - Year number
 * @returns {number} Remaining budget amount
 */
function calculatePaguSisa(db, yearStr, fundSource, revisiNum, year) {
    try {
        let paguFilter = '';
        if (fundSource && fundSource !== 'SEMUA') {
            paguFilter = `AND id_ref_sumber_dana = (
        SELECT id_ref_sumber_dana FROM ref_sumber_dana 
        WHERE nama_sumber_dana = '${fundSource}' LIMIT 1
      )`;
        }

        const totalAnggaran = db.prepare(`
      SELECT SUM(jumlah) as total FROM anggaran
      WHERE (tahun_anggaran = ? OR tahun_anggaran = ?) 
        AND is_revisi = ? 
        AND soft_delete = 0
        ${paguFilter}
    `).get(yearStr, Number(year), revisiNum)?.total || 0;

        const totalRapbs = db.prepare(`
      SELECT SUM(jumlah) as total FROM rapbs r
      JOIN anggaran a ON r.id_anggaran = a.id_anggaran
      WHERE (a.tahun_anggaran = ? OR a.tahun_anggaran = ?) 
        AND a.is_revisi = ? 
        AND r.soft_delete = 0
        ${paguFilter.replace('id_ref_sumber_dana', 'a.id_ref_sumber_dana')}
    `).get(yearStr, Number(year), revisiNum)?.total || 0;

        return totalAnggaran - totalRapbs;
    } catch (e) {
        return 0;
    }
}

module.exports = {
    getBkuStatus,
    getPengesahanStatus,
    getLatestTransfer,
    getRevisiStatus,
    calculatePaguSisa
};
