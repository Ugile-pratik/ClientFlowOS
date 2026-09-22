const validateProject = (req, res, next) => {
  const { title, clientId, budget, dueDate, status } = req.body;

  // Title check
  if (!title || typeof title !== 'string' || title.trim() === '') {
    return res.status(400).json({ error: 'Project Title is required.' });
  }

  // Client ID check
  const parsedClientId = parseInt(clientId, 10);
  if (!clientId || isNaN(parsedClientId)) {
    return res.status(400).json({ error: 'A valid Client must be selected.' });
  }

  // Budget check
  const parsedBudget = parseFloat(budget);
  if (budget === undefined || budget === null || isNaN(parsedBudget) || parsedBudget < 0) {
    return res.status(400).json({ error: 'Budget must be a non-negative number.' });
  }

  // Due Date check
  if (!dueDate || isNaN(Date.parse(dueDate))) {
    return res.status(400).json({ error: 'A valid Due Date is required.' });
  }

  // Status check
  const validStatuses = ['Planning', 'In Progress', 'In Review', 'Completed', 'On Hold', 'Proposal', 'Cancelled'];
  if (status && !validStatuses.includes(status)) {
    return res.status(400).json({ error: `Status must be one of: ${validStatuses.join(', ')}.` });
  }

  next();
};

module.exports = {
  validateProject,
};
