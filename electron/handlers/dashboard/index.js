/**
 * Dashboard Module Index
 * Re-exports all dashboard query modules
 */

const queryBuilders = require('./queryBuilders');
const statsQueries = require('./statsQueries');
const cashflowQueries = require('./cashflowQueries');
const chartQueries = require('./chartQueries');
const badgeQueries = require('./badgeQueries');

module.exports = {
    ...queryBuilders,
    ...statsQueries,
    ...cashflowQueries,
    ...chartQueries,
    ...badgeQueries
};
