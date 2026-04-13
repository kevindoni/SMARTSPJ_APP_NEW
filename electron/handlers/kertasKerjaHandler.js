const { ipcMain } = require('electron');
const Database = require('better-sqlite3-multiple-ciphers');
const path = require('path');

/**
 * Smart Match Transactions - Redistributes transactions for items with same uraian
 * Fixes ARKAS data issue where transactions may be linked to wrong items
 * CRITICAL: Queries ALL items from DB (not just visible rows) to avoid month filtering issues
 */
function smartMatchTransactions(db, rows, validBudgetIds, selectedMonth) {
  if (!rows || rows.length === 0) return rows;

  // Group items by uraian (nama_barang) only - normalized
  const uraianGroups = {};
  rows.forEach((row, idx) => {
    const key = (row.nama_barang || '').trim().toLowerCase();
    if (!uraianGroups[key]) uraianGroups[key] = [];
    uraianGroups[key].push({ ...row, _originalIdx: idx });
  });

  const idPlaceholders = validBudgetIds.map(() => '?').join(',');
  const mStr = selectedMonth > 0 ? String(selectedMonth).padStart(2, '0') : '12';

  for (const key of Object.keys(uraianGroups)) {
    const group = uraianGroups[key];
    if (group.length <= 1) continue;

    const uraian = group[0].nama_barang;

    try {
      // CRITICAL: Query ALL items with this uraian from database
      // Not just the ones in rows (which may be filtered by month)
      const allItemsQuery = `
                SELECT r.jumlah as total_anggaran, r.harga_satuan
                FROM rapbs r
                WHERE r.id_anggaran IN (${idPlaceholders})
                  AND LOWER(TRIM(r.uraian)) = LOWER(TRIM(?))
                  AND r.soft_delete = 0
            `;
      const allItemsFromDb = db.prepare(allItemsQuery).all(...validBudgetIds, uraian);

      // Get all transactions for this uraian
      const txQuery = `
                SELECT ku.saldo, ku.volume
                FROM kas_umum ku
                JOIN rapbs_periode rp ON ku.id_rapbs_periode = rp.id_rapbs_periode
                JOIN rapbs r ON rp.id_rapbs = r.id_rapbs
                WHERE r.id_anggaran IN (${idPlaceholders})
                  AND LOWER(TRIM(r.uraian)) = LOWER(TRIM(?))
                  AND ku.soft_delete = 0
                  AND ku.id_ref_bku NOT IN (5, 33, 10, 11)
                  AND strftime('%m', ku.tanggal_transaksi) <= '${mStr}'
            `;
      const transactions = db.prepare(txQuery).all(...validBudgetIds, uraian);

      if (transactions.length === 0) continue;

      // Create virtual items from ALL database items
      const virtualItems = allItemsFromDb.map((dbItem) => ({
        total_anggaran: dbItem.total_anggaran,
        harga_satuan: dbItem.harga_satuan,
        cumulative_realisasi: 0,
        total_volume_realisasi: 0,
      }));

      // Create pagu map for exact matching
      const paguMap = new Map();
      virtualItems.forEach((item) => {
        if (!paguMap.has(item.total_anggaran)) {
          paguMap.set(item.total_anggaran, []);
        }
        paguMap.get(item.total_anggaran).push(item);
      });

      const assignedTx = new Set();

      // PASS 1: Exact match
      for (let i = 0; i < transactions.length; i++) {
        if (assignedTx.has(i)) continue;
        const tx = transactions[i];
        const matching = paguMap.get(tx.saldo);
        if (matching) {
          const available = matching.find(
            (it) => it.cumulative_realisasi < it.total_anggaran * 0.01
          );
          if (available) {
            available.cumulative_realisasi += tx.saldo;
            available.total_volume_realisasi +=
              tx.volume || Math.round(tx.saldo / (available.harga_satuan || 1));
            assignedTx.add(i);
          }
        }
      }

      // PASS 2: Best fit
      for (let i = 0; i < transactions.length; i++) {
        if (assignedTx.has(i)) continue;
        const tx = transactions[i];
        let best = null,
          bestScore = -Infinity;

        for (const item of virtualItems) {
          const remaining = item.total_anggaran - item.cumulative_realisasi;
          if (remaining <= 0) continue;
          const score =
            tx.saldo <= remaining * 1.01
              ? 100 + (tx.saldo / remaining) * 50
              : (remaining / tx.saldo) * 50;
          if (score > bestScore) {
            bestScore = score;
            best = item;
          }
        }

        if (best) {
          best.cumulative_realisasi += tx.saldo;
          best.total_volume_realisasi +=
            tx.volume || Math.round(tx.saldo / (best.harga_satuan || 1));
          assignedTx.add(i);
        }
      }

      // Update only items in rows by matching pagu
      for (const rowItem of group) {
        const match = virtualItems.find(
          (v) => v.total_anggaran === rowItem.total_anggaran && v.cumulative_realisasi > 0
        );
        if (match) {
          rowItem.total_realisasi = match.cumulative_realisasi;
          rowItem.total_volume_realisasi = match.total_volume_realisasi;
          rowItem.cumulative_realisasi = match.cumulative_realisasi;
          rowItem.cumulative_volume_realisasi = match.total_volume_realisasi;
          match.cumulative_realisasi = -1; // Mark used
        } else {
          rowItem.total_realisasi = 0;
          rowItem.total_volume_realisasi = 0;
          rowItem.cumulative_realisasi = 0;
          rowItem.cumulative_volume_realisasi = 0;
        }
        rows[rowItem._originalIdx] = rowItem;
      }
    } catch (err) {
      console.error('[SmartMatch] Error:', key, err.message);
    }
  }

  return rows;
}

const kertasKerjaHandler = {
  getKertasKerja: (dbPath, dbAuth, year, fundSource) => {
    let db;
    try {
      db = new Database(dbPath, { readonly: true });
      db.pragma("cipher='sqlcipher'");
      db.pragma('legacy=4');
      db.pragma("key='" + dbAuth + "'");

      const yearStr = String(year);

      const budgetQuery = `
        SELECT id_anggaran 
        FROM anggaran a
        WHERE tahun_anggaran = ? 
          AND is_approve = 1 
          AND soft_delete = 0
          AND is_revisi = (
                SELECT MAX(is_revisi) 
                FROM anggaran a2 
                WHERE a2.tahun_anggaran = a.tahun_anggaran 
                  AND a2.id_ref_sumber_dana = a.id_ref_sumber_dana
                  AND a2.soft_delete = 0
                  AND a2.is_approve = 1
          )
      `;

      const validBudgetRows = db.prepare(budgetQuery).all(yearStr);
      const validBudgetIds = validBudgetRows.map((r) => r.id_anggaran);

      if (validBudgetIds.length === 0) {
        return { success: true, data: [] };
      }

      let fundFilter = '';
      let params = [...validBudgetIds];

      if (fundSource && fundSource !== 'SEMUA') {
        fundFilter = `AND sd.nama_sumber_dana = ?`;
        params.push(fundSource);
      }

      const idPlaceholders = validBudgetIds.map(() => '?').join(',');

      const query = `
        SELECT 
            k.id_kode as kode_kegiatan,
            k.uraian_kode as nama_kegiatan,
            k.parent_kode,
            r.kode_rekening as kode_rekening,
            COALESCE(rr.rekening, r.uraian) as nama_rekening,
            r.uraian as nama_barang,
            r.uraian_text as nama_barang_clean,
            r.harga_satuan,
            r.volume,
            r.satuan,
            r.jumlah as total,
            (
                SELECT GROUP_CONCAT(p.periode || ':' || rp.volume, '|')
                FROM rapbs_periode rp
                JOIN ref_periode p ON rp.id_periode = p.id_periode
                WHERE rp.id_rapbs = r.id_rapbs 
                  AND rp.soft_delete = 0
            ) as volumes_str,
            r.urutan,
            sd.nama_sumber_dana
        FROM rapbs r
        JOIN anggaran a ON r.id_anggaran = a.id_anggaran
        LEFT JOIN ref_sumber_dana sd ON a.id_ref_sumber_dana = sd.id_ref_sumber_dana
        LEFT JOIN ref_kode k ON r.id_ref_kode = k.id_ref_kode AND k.tahun = a.tahun_anggaran
        LEFT JOIN ref_rekening rr ON r.kode_rekening = rr.kode_rekening AND rr.tahun = a.tahun_anggaran
        WHERE a.id_anggaran IN (${idPlaceholders})
          AND r.soft_delete = 0
          ${fundFilter}
        GROUP BY r.id_rapbs
        ORDER BY k.id_kode ASC, r.kode_rekening ASC, r.urutan ASC
      `;

      const rows = db.prepare(query).all(...params);
      return { success: true, data: rows };
    } catch (err) {
      console.error('[KertasKerjaHandler] Error:', err);
      return { success: false, error: err.message };
    } finally {
      if (db && db.open) db.close();
    }
  },

  getBudgetRealization: (dbPath, dbAuth, year, fundSource, selectedMonth) => {
    let db;
    try {
      db = new Database(dbPath, { readonly: true });
      db.pragma("cipher='sqlcipher'");
      db.pragma('legacy=4');
      db.pragma("key='" + dbAuth + "'");

      const yearStr = String(year);
      const yearNum = Number(year);

      const budgetQuery = `
                SELECT id_anggaran 
                FROM anggaran a
                LEFT JOIN ref_sumber_dana sd ON a.id_ref_sumber_dana = sd.id_ref_sumber_dana
                WHERE (a.tahun_anggaran = ? OR a.tahun_anggaran = ?) 
                  AND a.soft_delete = 0
                  AND a.is_approve = 1
                  ${fundSource && fundSource !== 'SEMUA' ? 'AND sd.nama_sumber_dana = ?' : ''}
                  AND a.is_revisi = (
                      SELECT MAX(is_revisi) FROM anggaran a2
                      WHERE a2.id_ref_sumber_dana = a.id_ref_sumber_dana
                        AND (a2.tahun_anggaran = a.tahun_anggaran OR a2.tahun_anggaran = ?)
                        AND a2.soft_delete = 0
                        AND a2.is_approve = 1
                  )
            `;

      const budgetParams = [yearStr, yearNum];
      if (fundSource && fundSource !== 'SEMUA') budgetParams.push(fundSource);
      budgetParams.push(yearStr);

      const validBudgetRows = db.prepare(budgetQuery).all(...budgetParams);
      const validBudgetIds = validBudgetRows.map((r) => r.id_anggaran);

      if (validBudgetIds.length === 0) return { success: true, data: [] };

      const idPlaceholders = validBudgetIds.map(() => '?').join(',');

      let monthCondition = '1=1';
      if (selectedMonth && selectedMonth > 0) {
        const mStr = String(selectedMonth).padStart(2, '0');
        monthCondition = `strftime('%m', ku.tanggal_transaksi) = '${mStr}'`;
      }

      const m = selectedMonth || 0;
      const mArkas = m > 0 ? m + 80 : 0;

      const query = `
                SELECT 
                    k.id_kode as kode_kegiatan,
                    k.uraian_kode as nama_kegiatan,
                    r.kode_rekening,
                    COALESCE(rr.rekening, r.uraian) as nama_rekening,
                    r.uraian as nama_barang,
                    r.satuan,
                    r.harga_satuan,
                    r.volume as total_volume_pagu,
                    r.jumlah as total_anggaran,
                    COALESCE(target.vol_rencana, 0) as target_volume_bulan,
                    COALESCE(target.jumlah_rencana, 0) as target_anggaran_bulan,
                    COALESCE(realisasi.monthly_saldo, 0) as total_realisasi,
                    COALESCE(realisasi.monthly_vol, 0) as total_volume_realisasi,
                    COALESCE(realisasi.cum_saldo, 0) as cumulative_realisasi,
                    COALESCE(realisasi.cum_vol, 0) as cumulative_volume_realisasi,
                    (
                        SELECT SUM(rp3.volume * r.harga_satuan)
                        FROM rapbs_periode rp3
                        WHERE rp3.id_rapbs = r.id_rapbs AND rp3.id_periode <= (80 + ?)
                    ) as cumulative_pagu,
                    (SELECT GROUP_CONCAT(id_periode || ':' || volume) FROM rapbs_periode WHERE id_rapbs = r.id_rapbs) as planned_months,
                    (
                        SELECT GROUP_CONCAT(m || ':' || total_s)
                        FROM (
                            SELECT strftime('%m', ku2.tanggal_transaksi) as m, SUM(ku2.saldo) as total_s
                            FROM kas_umum ku2
                            JOIN rapbs_periode rp2 ON ku2.id_rapbs_periode = rp2.id_rapbs_periode
                            WHERE rp2.id_rapbs = r.id_rapbs AND ku2.soft_delete = 0 AND ku2.id_ref_bku NOT IN (5, 33, 10, 11)
                            GROUP BY m
                        )
                    ) as realized_months
                FROM rapbs r
                JOIN anggaran a ON r.id_anggaran = a.id_anggaran
                LEFT JOIN ref_kode k ON r.id_ref_kode = k.id_ref_kode AND (k.tahun = ? OR k.tahun = ?)
                LEFT JOIN ref_rekening rr ON r.kode_rekening = rr.kode_rekening AND (rr.tahun = ? OR rr.tahun = ?)
                LEFT JOIN (
                    SELECT id_rapbs, volume as vol_rencana, jumlah as jumlah_rencana
                    FROM rapbs_periode 
                    WHERE id_periode = ${mArkas}
                ) target ON r.id_rapbs = target.id_rapbs
                LEFT JOIN (
                    SELECT 
                        rp_sub.id_rapbs, 
                        SUM(CASE WHEN ${monthCondition} THEN ku.saldo ELSE 0 END) as monthly_saldo,
                        SUM(CASE WHEN ${monthCondition} THEN 
                            CASE WHEN ku.volume > 0 THEN ku.volume 
                                 ELSE CAST(ku.saldo / NULLIF(rp_item.harga_satuan, 0) AS INTEGER) 
                            END 
                        ELSE 0 END) as monthly_vol,
                        SUM(ku.saldo) as cum_saldo,
                        SUM(CASE WHEN ku.volume > 0 THEN ku.volume 
                                 ELSE CAST(ku.saldo / NULLIF(rp_item.harga_satuan, 0) AS INTEGER) 
                            END) as cum_vol
                    FROM rapbs_periode rp_sub
                    JOIN rapbs rp_item ON rp_sub.id_rapbs = rp_item.id_rapbs
                    JOIN kas_umum ku ON rp_sub.id_rapbs_periode = ku.id_rapbs_periode
                    WHERE ku.soft_delete = 0
                      AND ku.id_ref_bku NOT IN (5, 33, 10, 11)
                      AND strftime('%m', ku.tanggal_transaksi) <= '${String(m || 12).padStart(2, '0')}'
                    GROUP BY rp_sub.id_rapbs
                ) realisasi ON r.id_rapbs = realisasi.id_rapbs
                WHERE a.id_anggaran IN (${idPlaceholders})
                  AND r.soft_delete = 0
                  ${
                    m > 0
                      ? `
                  AND (
                    r.id_rapbs IN (SELECT id_rapbs FROM rapbs_periode WHERE id_periode = ${mArkas} AND (volume > 0 OR jumlah > 0))
                    OR COALESCE(realisasi.monthly_vol, 0) > 0
                  )`
                      : ''
                  }
                GROUP BY r.id_rapbs
                ORDER BY k.id_kode ASC, r.kode_rekening ASC
            `;

      const rows = db.prepare(query).all(m, yearStr, yearNum, yearStr, yearNum, ...validBudgetIds);

      const annualPagu = db
        .prepare(
          `
                SELECT SUM(jumlah) as total 
                FROM rapbs 
                WHERE id_anggaran IN (${idPlaceholders}) AND soft_delete = 0
            `
        )
        .get(...validBudgetIds).total;

      let cumFilter = '';
      if (m > 0) {
        const mStr = String(m).padStart(2, '0');
        cumFilter = `AND strftime('%m', ku.tanggal_transaksi) <= '${mStr}'`;
      }
      const cumulativeRealisasiRow = db
        .prepare(
          `
                SELECT COALESCE(SUM(ku.saldo), 0) as total
                FROM kas_umum ku
                JOIN rapbs_periode rp ON ku.id_rapbs_periode = rp.id_rapbs_periode
                JOIN rapbs r ON rp.id_rapbs = r.id_rapbs
                WHERE r.id_anggaran IN (${idPlaceholders})
                  AND ku.soft_delete = 0
                  AND ku.id_ref_bku NOT IN (5, 33, 10, 11)
                  ${cumFilter}
            `
        )
        .get(...validBudgetIds);

      const cumulativeRealisasi = cumulativeRealisasiRow ? cumulativeRealisasiRow.total : 0;

      // Apply smart matching for items with same uraian
      const processedRows = smartMatchTransactions(db, rows, validBudgetIds, m);

      return { success: true, data: processedRows, annualPagu, cumulativeRealisasi };
    } catch (err) {
      console.error('[BudgetHandler] Error:', err);
      return { success: false, error: err.message };
    } finally {
      if (db && db.open) db.close();
    }
  },
};

module.exports = kertasKerjaHandler;
