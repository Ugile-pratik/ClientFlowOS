const rules = require('./recommendationRules');

/**
 * Evaluates client parameters against business logic rules to compile actionable insights.
 * @param {Object} clientMetrics - The business statistics for a specific client
 * @param {number} clientMetrics.averageDelayDays - Average days payment is received post-deadline
 * @param {number} clientMetrics.revisionCount - Number of project edits requested
 * @param {number} clientMetrics.unpaidInvoicesCount - Total unpaid or overdue invoices
 * @param {boolean} clientMetrics.isHighestEarner - Flag if this client generated max revenue
 * @returns {Array} List of compiled recommendation alerts
 */
const generateInsights = (clientMetrics) => {
  const insights = [];

  // 1. Advance Payment Check
  if (rules.shouldSuggestAdvancePayment(clientMetrics.averageDelayDays)) {
    insights.push({
      insightType: 'ADVANCE_PAYMENT',
      message: 'Recommend requesting a 50% advance payment for future projects due to an average payment delay exceeding 15 days.'
    });
  }

  // 2. Revision Charge Check
  if (rules.shouldSuggestRevisionChargeIncrease(clientMetrics.revisionCount)) {
    insights.push({
      insightType: 'REVISION_CHARGE',
      message: 'Recommend increasing revision fees or setting revision caps as project iteration requests have exceeded 5.'
    });
  }

  // 3. High Risk Check
  if (rules.isClientHighRisk(clientMetrics.unpaidInvoicesCount)) {
    insights.push({
      insightType: 'HIGH_RISK',
      message: 'Warning: Client flagged as High Risk due to multiple outstanding unpaid invoices.'
    });
  }

  // 4. Profitability Check
  if (clientMetrics.isHighestEarner) {
    insights.push({
      insightType: 'MOST_PROFITABLE',
      message: 'Most Profitable Client: This client has generated the highest total revenue to date.'
    });
  }

  return insights;
};

module.exports = {
  generateInsights
};
