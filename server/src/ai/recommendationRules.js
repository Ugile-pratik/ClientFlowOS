// ClientFlow AI Recommendation Engine - Analytical Rules
// Note: This is rule-based Node.js business logic, not Machine Learning.

const rules = {
  /**
   * Rule: If payment delay averages > 15 days, suggest advance payments.
   */
  shouldSuggestAdvancePayment: (averageDelayDays) => {
    return averageDelayDays > 15;
  },

  /**
   * Rule: If customer project revisions exceed 5, suggest higher revision charges.
   */
  shouldSuggestRevisionChargeIncrease: (revisionCount) => {
    return revisionCount > 5;
  },

  /**
   * Rule: If multiple invoices remain unpaid, flag the client as high risk.
   */
  isClientHighRisk: (unpaidInvoicesCount) => {
    return unpaidInvoicesCount > 1;
  }
};

module.exports = rules;
