/**
 * manualTaxHandler.js
 * Handles CRUD operations for manual tax entries stored in a local JSON file.
 * This keeps the main arkas.db database untouched.
 */

const fs = require('fs');
const path = require('path');
const { app } = require('electron');

// Data file path (stored in the project's data folder)
let dataFilePath = null;

/**
 * Initialize the data file path based on the project's data directory.
 * This should be called after the app has been configured.
 * @param {string} projectDataDir - The project's data directory (e.g., d:\laragon\www\pendamping\SmartSPJ\data)
 */
function initManualTaxStorage(projectDataDir) {
    dataFilePath = path.join(projectDataDir, 'manual_taxes.json');

    // Ensure the file exists with empty array if not present
    if (!fs.existsSync(dataFilePath)) {
        fs.writeFileSync(dataFilePath, JSON.stringify([], null, 2), 'utf8');
    }
}

/**
 * Read all manual tax entries from the JSON file.
 * @returns {Array} Array of manual tax entries.
 */
function getManualTaxes() {
    if (!dataFilePath) {
        console.error('Manual tax storage not initialized');
        return [];
    }

    try {
        if (!fs.existsSync(dataFilePath)) {
            return [];
        }
        const data = fs.readFileSync(dataFilePath, 'utf8');
        return JSON.parse(data) || [];
    } catch (err) {
        console.error('Error reading manual taxes:', err);
        return [];
    }
}

/**
 * Get manual taxes filtered by year.
 * @param {number} year - The year to filter by.
 * @returns {Array} Array of manual tax entries for the given year.
 */
function getManualTaxesByYear(year) {
    const allTaxes = getManualTaxes();
    return allTaxes.filter(tax => tax.year === year);
}

/**
 * Save a new manual tax entry.
 * @param {Object} entry - The tax entry to save.
 * @returns {Object} The saved entry with its generated ID.
 */
function saveManualTax(entry) {
    if (!dataFilePath) {
        throw new Error('Manual tax storage not initialized');
    }

    const taxes = getManualTaxes();

    // Generate a unique ID for the new entry
    const newEntry = {
        ...entry,
        id: `manual_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        created_at: new Date().toISOString(),
        is_manual: true
    };

    taxes.push(newEntry);

    try {
        fs.writeFileSync(dataFilePath, JSON.stringify(taxes, null, 2), 'utf8');
        return newEntry;
    } catch (err) {
        console.error('Error saving manual tax:', err);
        throw err;
    }
}

/**
 * Update an existing manual tax entry.
 * @param {string} id - The ID of the entry to update.
 * @param {Object} updates - The fields to update.
 * @returns {Object|null} The updated entry or null if not found.
 */
function updateManualTax(id, updates) {
    if (!dataFilePath) {
        throw new Error('Manual tax storage not initialized');
    }

    const taxes = getManualTaxes();
    const index = taxes.findIndex(tax => tax.id === id);

    if (index === -1) {
        return null;
    }

    taxes[index] = {
        ...taxes[index],
        ...updates,
        updated_at: new Date().toISOString()
    };

    try {
        fs.writeFileSync(dataFilePath, JSON.stringify(taxes, null, 2), 'utf8');
        return taxes[index];
    } catch (err) {
        console.error('Error updating manual tax:', err);
        throw err;
    }
}

/**
 * Delete a manual tax entry.
 * @param {string} id - The ID of the entry to delete.
 * @returns {boolean} True if deleted, false if not found.
 */
function deleteManualTax(id) {
    if (!dataFilePath) {
        throw new Error('Manual tax storage not initialized');
    }

    const taxes = getManualTaxes();
    const index = taxes.findIndex(tax => tax.id === id);

    if (index === -1) {
        return false;
    }

    taxes.splice(index, 1);

    try {
        fs.writeFileSync(dataFilePath, JSON.stringify(taxes, null, 2), 'utf8');
        return true;
    } catch (err) {
        console.error('Error deleting manual tax:', err);
        throw err;
    }
}

/**
 * Transform manual tax entries to match the format used by transaction data.
 * This allows seamless merging with ARKAS database results.
 * @param {Array} manualTaxes - Array of manual tax entries.
 * @returns {Array} Transformed entries matching transaction format.
 */
function transformManualTaxesToTransactionFormat(manualTaxes) {
    return manualTaxes.map(tax => {
        // Determine if it's income (pungutan) or expense (setoran)
        const isPungutan = tax.position === 'pungutan' || tax.position === '+';

        return {
            id_kas_umum: tax.id,
            no_bukti: tax.no_bukti || 'MANUAL',
            tanggal: tax.tanggal || tax.created_at.split('T')[0],
            uraian: tax.keterangan || tax.uraian || 'Entri Pajak Manual',
            pungut: isPungutan ? (tax.nominal || 0) : 0,
            setor: !isPungutan ? (tax.nominal || 0) : 0,
            jenis_pajak: tax.jenis_pajak,
            is_manual: true,
            manual_type: tax.jenis_input || 'transaksi',
            year: tax.year
        };
    });
}

module.exports = {
    initManualTaxStorage,
    getManualTaxes,
    getManualTaxesByYear,
    saveManualTax,
    updateManualTax,
    deleteManualTax,
    transformManualTaxesToTransactionFormat
};
