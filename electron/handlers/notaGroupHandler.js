/**
 * Nota Group Handler
 * Manages local storage for grouped transactions (nota gabungan)
 * ARKAS database is READONLY - only local config is modified
 */

const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');

let NOTA_GROUPS_PATH = null;

/**
 * Initialize nota group storage
 * @param {string} dataDir - Data directory path
 */
function initNotaGroupStorage(dataDir) {
  NOTA_GROUPS_PATH = path.join(dataDir, 'nota-groups.json');

  // Create file if doesn't exist
  if (!fs.existsSync(NOTA_GROUPS_PATH)) {
    fs.writeFileSync(NOTA_GROUPS_PATH, JSON.stringify({ groups: [] }, null, 2));
  }
}

/**
 * Load all nota groups from storage
 * @param {string} year - Filter by year (optional)
 * @returns {Array} Array of nota groups
 */
function getNotaGroups(year = null) {
  try {
    const data = JSON.parse(fs.readFileSync(NOTA_GROUPS_PATH, 'utf8'));
    let groups = data.groups || [];

    if (year) {
      groups = groups.filter((g) => g.year === year.toString());
    }

    return groups;
  } catch (error) {
    console.error('Error loading nota groups:', error);
    return [];
  }
}

/**
 * Save or update a nota group
 * @param {Object} group - Nota group object
 * @returns {Object} Result with success status
 */
function saveNotaGroup(group) {
  try {
    const data = JSON.parse(fs.readFileSync(NOTA_GROUPS_PATH, 'utf8'));

    // Generate ID if new
    if (!group.id) {
      group.id = randomUUID();
      group.createdAt = new Date().toISOString();
    }
    group.updatedAt = new Date().toISOString();

    // Find existing or add new
    const existingIndex = data.groups.findIndex((g) => g.id === group.id);
    if (existingIndex >= 0) {
      data.groups[existingIndex] = group;
    } else {
      data.groups.push(group);
    }

    fs.writeFileSync(NOTA_GROUPS_PATH, JSON.stringify(data, null, 2));
    return { success: true, group };
  } catch (error) {
    console.error('Error saving nota group:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Delete a nota group
 * @param {string} groupId - Group ID to delete
 * @returns {Object} Result with success status
 */
function deleteNotaGroup(groupId) {
  try {
    const data = JSON.parse(fs.readFileSync(NOTA_GROUPS_PATH, 'utf8'));
    data.groups = data.groups.filter((g) => g.id !== groupId);
    fs.writeFileSync(NOTA_GROUPS_PATH, JSON.stringify(data, null, 2));
    return { success: true };
  } catch (error) {
    console.error('Error deleting nota group:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get a single nota group by ID
 * @param {string} groupId - Group ID
 * @returns {Object|null} Nota group or null
 */
function getNotaGroupById(groupId) {
  try {
    const data = JSON.parse(fs.readFileSync(NOTA_GROUPS_PATH, 'utf8'));
    return data.groups.find((g) => g.id === groupId) || null;
  } catch (error) {
    console.error('Error getting nota group:', error);
    return null;
  }
}

module.exports = {
  initNotaGroupStorage,
  getNotaGroups,
  saveNotaGroup,
  deleteNotaGroup,
  getNotaGroupById,
};
