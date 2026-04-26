const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('arkas', {
  checkConnection: () => ipcRenderer.invoke('arkas:check-connection'),
  getAppVersion: () => ipcRenderer.invoke('arkas:get-app-version'),
  getSchoolInfo: () => ipcRenderer.invoke('arkas:get-school-info'),
  getFundSources: (year) => ipcRenderer.invoke('arkas:get-fund-sources', year),
  getAvailableYears: () => ipcRenderer.invoke('arkas:get-available-years'),
  getDashboardStats: (year, fundSource) =>
    ipcRenderer.invoke('arkas:get-dashboard-stats', year, fundSource),
  getKertasKerja: (year, fundSource) =>
    ipcRenderer.invoke('arkas:get-kertas-kerja', year, fundSource),
  getBudgetRealization: (year, fundSource, month) =>
    ipcRenderer.invoke('arkas:get-budget-realization', year, fundSource, month),
  getTransactions: (params) => ipcRenderer.invoke('arkas:get-transactions', params),
  syncRegionData: (npsn) => ipcRenderer.invoke('arkas:sync-region-data', npsn),
  reloadSchoolData: () => ipcRenderer.invoke('arkas:reload-school-data'),
  getDashboardBadges: (year, fundSource) =>
    ipcRenderer.invoke('arkas:get-dashboard-badges', year, fundSource),
  exportBku: (transactions, options) =>
    ipcRenderer.invoke('arkas:export-bku', transactions, options),
  printKwitansi: (transaction, year) =>
    ipcRenderer.invoke('arkas:print-kwitansi', transaction, year),
  mergeTransactions: (idList, targetNoBukti) =>
    ipcRenderer.invoke('arkas:merge-transactions', idList, targetNoBukti),
  printMergedKwitansi: (idList, customNoBukti, customUraian, year) =>
    ipcRenderer.invoke('arkas:print-merged-kwitansi', idList, customNoBukti, customUraian, year),
  printBuktiAutoSave: (idList, noBuktiList, year) =>
    ipcRenderer.invoke('arkas:print-bukti-autosave', idList, noBuktiList, year),
  printA2AutoSave: (idList, noBuktiList, year) =>
    ipcRenderer.invoke('arkas:print-a2-autosave', idList, noBuktiList, year),
  getReconciliationData: (year) => ipcRenderer.invoke('arkas:get-reconciliation-data', year),
  getReconciliationFundSources: (year) =>
    ipcRenderer.invoke('arkas:get-reconciliation-fund-sources', year),
  getFundSourceDetail: (year, fundSourceId) =>
    ipcRenderer.invoke('arkas:get-fund-source-detail', year, fundSourceId),
  getBungaDetail: (year) => ipcRenderer.invoke('arkas:get-bunga-detail', year),
  getPajakDetail: (year) => ipcRenderer.invoke('arkas:get-pajak-detail', year),
  saveSignatoryData: (data) => ipcRenderer.invoke('arkas:save-signatory-data', data),
  getSignatoryData: () => ipcRenderer.invoke('arkas:get-signatory-data'),
  getBaAuditData: (year) => ipcRenderer.invoke('arkas:get-ba-audit-data', year),
  getSPTJMData: (year, semester, fundType) =>
    ipcRenderer.invoke('arkas:get-sptjm-data', year, semester, fundType),
  getK7Data: (year, periodType, activeTahap, activeMonth, fundType) =>
    ipcRenderer.invoke('arkas:get-k7-data', year, periodType, activeTahap, activeMonth, fundType),
  getClosingBalances: (year, month, fundSource) =>
    ipcRenderer.invoke('arkas:get-closing-balances', year, month, fundSource),
  getRelatedTaxes: (uraian, date, kodeRekening, year, nominal) =>
    ipcRenderer.invoke('arkas:get-related-taxes', uraian, date, kodeRekening, year, nominal),
  saveSchoolInfo: (data) => ipcRenderer.invoke('arkas:save-school-info', data),
  getBankReconciliation: (year) => ipcRenderer.invoke('arkas:get-bank-reconciliation', year),
  saveBankReconciliation: (year, values) =>
    ipcRenderer.invoke('arkas:save-bank-reconciliation', year, values),
  getRegisterKas: (year, month, fundSource) =>
    ipcRenderer.invoke('arkas:get-register-kas', year, month, fundSource),
  saveRegisterKas: (year, month, fundSource, denominations) =>
    ipcRenderer.invoke('arkas:save-register-kas', year, month, fundSource, denominations),
  getManualTaxes: (year) => ipcRenderer.invoke('arkas:get-manual-taxes', year),
  saveManualTax: (entry) => ipcRenderer.invoke('arkas:save-manual-tax', entry),
  updateManualTax: (id, updates) => ipcRenderer.invoke('arkas:update-manual-tax', { id, updates }),
  deleteManualTax: (id) => ipcRenderer.invoke('arkas:delete-manual-tax', id),
  createBackup: (savePath, localStorageData) =>
    ipcRenderer.invoke('arkas:create-backup', savePath, localStorageData),
  createFullBackup: (savePath, localStorageData) =>
    ipcRenderer.invoke('arkas:create-full-backup', savePath, localStorageData),
  getBackupInfo: (filePath) => ipcRenderer.invoke('arkas:get-backup-info', filePath),
  restoreBackup: (filePath, currentLocalStorageData) =>
    ipcRenderer.invoke('arkas:restore-backup', filePath, currentLocalStorageData),
  showSaveDialog: (options) => ipcRenderer.invoke('arkas:show-save-dialog', options),
  showOpenDialog: (options) => ipcRenderer.invoke('arkas:show-open-dialog', options),
  exportAllBku: (params) => ipcRenderer.invoke('arkas:export-all-bku', params),
  notaGroups: {
    getAll: (year) => ipcRenderer.invoke('nota-groups:get-all', year),
    save: (group) => ipcRenderer.invoke('nota-groups:save', group),
    delete: (groupId) => ipcRenderer.invoke('nota-groups:delete', groupId),
    getById: (groupId) => ipcRenderer.invoke('nota-groups:get-by-id', groupId),
    getTransactionsByNota: (year, month) =>
      ipcRenderer.invoke('arkas:get-transactions-by-nota', year, month),
  },

  // ─── License APIs ───
  getLicenseStatus: () => ipcRenderer.invoke('arkas:get-license-status'),
  activateLicense: (key) => ipcRenderer.invoke('arkas:activate-license', key),
  deactivateLicense: () => ipcRenderer.invoke('arkas:deactivate-license'),
  checkLicenseFeature: (feature) => ipcRenderer.invoke('arkas:check-license-feature', feature),
  incrementLicenseUsage: (feature) => ipcRenderer.invoke('arkas:increment-license-usage', feature),
  getBlockedMenus: () => ipcRenderer.invoke('arkas:get-blocked-menus'),
  getHardwareId: () => ipcRenderer.invoke('arkas:get-hardware-id'),
  getStoredLicenseKey: () => ipcRenderer.invoke('arkas:get-stored-license-key'),
  openPaymentPage: (tier) => ipcRenderer.invoke('arkas:open-payment-page', tier),
  createPayment: (tier) => ipcRenderer.invoke('arkas:create-payment', tier),
  checkServerLicense: () => ipcRenderer.invoke('arkas:check-server-license'),

  // ─── Updater APIs ───
  checkForUpdate: () => ipcRenderer.invoke('arkas:check-update'),
  downloadUpdate: () => ipcRenderer.invoke('arkas:download-update'),
  installUpdate: () => ipcRenderer.invoke('arkas:install-update'),
  saveUpdaterToken: (token) => ipcRenderer.invoke('arkas:save-updater-token', token),
  getUpdaterTokenStatus: () => ipcRenderer.invoke('arkas:get-updater-token-status'),

  onUpdateAvailable: (cb) => {
    const handler = (_, info) => cb(info);
    ipcRenderer.on('update-available', handler);
    return () => ipcRenderer.removeListener('update-available', handler);
  },
  onUpdateProgress: (cb) => {
    const handler = (_, p) => cb(p);
    ipcRenderer.on('update-progress', handler);
    return () => ipcRenderer.removeListener('update-progress', handler);
  },
  onUpdateDownloaded: (cb) => {
    const handler = () => cb();
    ipcRenderer.on('update-downloaded', handler);
    return () => ipcRenderer.removeListener('update-downloaded', handler);
  },
  onUpdateNotAvailable: (cb) => {
    const handler = () => cb();
    ipcRenderer.on('update-not-available', handler);
    return () => ipcRenderer.removeListener('update-not-available', handler);
  },
  onUpdateError: (cb) => {
    const handler = (_, err) => cb(err);
    ipcRenderer.on('update-error', handler);
    return () => ipcRenderer.removeListener('update-error', handler);
  },
});