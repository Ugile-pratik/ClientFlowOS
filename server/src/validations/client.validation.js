const validateClient = (req, res, next) => {
  const {
    company,
    name,
    email,
    phone,
    address,
    city,
    state,
    country,
    postalCode,
    status,
    tags
  } = req.body;

  // Company Name
  if (!company || typeof company !== 'string' || company.trim() === '') {
    return res.status(400).json({ error: 'Company Name is required.' });
  }

  // Contact Person (name)
  if (!name || typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({ error: 'Contact Person is required.' });
  }

  // Email format check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }

  // Phone check
  if (!phone || typeof phone !== 'string' || phone.trim() === '') {
    return res.status(400).json({ error: 'Phone number is required.' });
  }

  // Address check
  if (!address || typeof address !== 'string' || address.trim() === '') {
    return res.status(400).json({ error: 'Address is required.' });
  }

  // City check
  if (!city || typeof city !== 'string' || city.trim() === '') {
    return res.status(400).json({ error: 'City is required.' });
  }

  // State check
  if (!state || typeof state !== 'string' || state.trim() === '') {
    return res.status(400).json({ error: 'State is required.' });
  }

  // Country check
  if (!country || typeof country !== 'string' || country.trim() === '') {
    return res.status(400).json({ error: 'Country is required.' });
  }

  // Postal Code check
  if (!postalCode || typeof postalCode !== 'string' || postalCode.trim() === '') {
    return res.status(400).json({ error: 'Postal Code is required.' });
  }

  // Status check
  const validStatuses = ['Active', 'Inactive', 'Lead', 'Blocked'];
  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Status must be one of: Active, Inactive, Lead, Blocked.' });
  }

  // Tags validation (if provided, must be array)
  if (tags && !Array.isArray(tags)) {
    return res.status(400).json({ error: 'Tags must be an array of strings.' });
  }

  next();
};

module.exports = {
  validateClient,
};
