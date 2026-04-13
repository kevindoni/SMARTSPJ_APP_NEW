/**
 * Tax Rates Configuration
 * ========================
 * Konfigurasi tarif pajak yang dapat diubah sesuai kebijakan terbaru.
 * 
 * Update file ini jika ada perubahan peraturan perpajakan.
 * 
 * Referensi:
 * - PPh 21: PMK-59/PMK.03/2022, PP 80/2010
 * - PPN: UU HPP 2021 (UU No. 7 Tahun 2021)
 * - PPh 23: Pasal 23 UU PPh
 * - PPh 4 ayat 2: PP 34/2017
 * 
 * Last Updated: Januari 2026
 */

module.exports = {
    // ============================================
    // PPh 21 (Pajak atas Penghasilan Orang Pribadi)
    // ============================================

    // Non-PNS tanpa NPWP - 6%
    PPH_21_NON_PNS_NO_NPWP: 0.06,

    // Non-PNS dengan NPWP - 5%
    PPH_21_NON_PNS_NPWP: 0.05,

    // PNS Golongan I dan II - 0%
    PPH_21_PNS_GOL_1_2: 0.00,

    // PNS Golongan III - 5%
    PPH_21_PNS_GOL_3: 0.05,

    // PNS Golongan IV - 15%
    PPH_21_PNS_GOL_4: 0.15,

    // Default PPh 21 (jika tidak diketahui statusnya)
    PPH_21_DEFAULT: 0.05,

    // ============================================
    // PPN (Pajak Pertambahan Nilai)
    // ============================================

    // PPN Barang dan Jasa - 11% (sejak April 2022)
    PPN: 0.11,

    // ============================================
    // PPh 23 (Pajak atas Jasa)
    // ============================================

    // PPh 23 Jasa - 2%
    PPH_23_JASA: 0.02,

    // PPh 23 Sewa (non tanah/bangunan) - 2%
    PPH_23_SEWA: 0.02,

    // PPh 23 untuk sewa alat berat / kendaraan - 4% (jika ada)
    PPH_23_SEWA_ALAT: 0.04,

    // ============================================
    // PPh 4 ayat 2 (Pajak Final)
    // ============================================

    // PPh 4 Sewa Tanah dan/atau Bangunan - 10%
    PPH_4_SEWA_TANAH_BANGUNAN: 0.10,

    // PPh 4 Jasa Konstruksi - 2-6% (tergantung klasifikasi)
    // Default menggunakan rate terendah
    PPH_4_JASA_KONSTRUKSI: 0.02,

    // ============================================
    // SSPD (Surat Setoran Pajak Daerah)
    // ============================================

    // Pajak Restoran/Rumah Makan - 10% (bervariasi per daerah)
    SSPD_RESTORAN: 0.10,

    // Default SSPD
    SSPD_DEFAULT: 0.10,

    // ============================================
    // Helper Functions
    // ============================================

    /**
     * Get PPh 21 rate based on uraian_pajak description
     * @param {string} uraianPajak - Description from kas_umum.uraian_pajak
     * @returns {number} Tax rate as decimal
     */
    getPPh21Rate: function (uraianPajak) {
        if (!uraianPajak) return this.PPH_21_DEFAULT;

        const text = uraianPajak.toLowerCase();

        // Non-PNS tanpa NPWP
        if (text.includes('tidak memiliki npwp') || text.includes('tanpa npwp')) {
            return this.PPH_21_NON_PNS_NO_NPWP;
        }

        // PNS Golongan checks
        if (text.includes('pns')) {
            if (text.includes('golongan iv') || text.includes('gol iv') || text.includes('gol. iv')) {
                return this.PPH_21_PNS_GOL_4;
            }
            if (text.includes('golongan iii') || text.includes('gol iii') || text.includes('gol. iii')) {
                return this.PPH_21_PNS_GOL_3;
            }
            if (text.includes('golongan i') || text.includes('golongan ii') ||
                text.includes('gol i') || text.includes('gol ii')) {
                return this.PPH_21_PNS_GOL_1_2;
            }
        }

        // Default to 5% for Non-PNS with NPWP
        return this.PPH_21_NON_PNS_NPWP;
    },

    /**
     * Get PPh 23 rate based on transaction type
     * @param {string} uraian - Transaction description
     * @returns {number} Tax rate as decimal
     */
    getPPh23Rate: function (uraian) {
        if (!uraian) return this.PPH_23_JASA;

        const text = uraian.toLowerCase();

        // Check for equipment/vehicle rental (4%)
        if (text.includes('sewa') && (
            text.includes('genset') ||
            text.includes('generator') ||
            text.includes('kendaraan') ||
            text.includes('alat')
        )) {
            return this.PPH_23_SEWA_ALAT;
        }

        // Default jasa rate (2%)
        return this.PPH_23_JASA;
    }
};
