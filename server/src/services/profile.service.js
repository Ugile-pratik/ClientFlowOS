const prisma = require('../config/db');

const USER_SELECT_FIELDS = {
  id: true,
  email: true,
  fullName: true,
  isVerified: true,
  profilePhotoUrl: true,
  phone: true,
  location: true,
  profession: true,
  bio: true,
  skills: true,
  experienceLevel: true,
  hourlyRate: true,
  website: true,
  linkedIn: true,
  github: true,
  businessName: true,
  businessType: true,
  gstNumber: true,
  businessAddress: true,
  businessDescription: true,
  upiId: true,
  paymentQrUrl: true,
  paymentInstructions: true,
  invoicePrefix: true,
  nextInvoiceNumber: true,
  defaultCurrency: true,
  defaultTaxRate: true,
  defaultPaymentTerms: true,
  defaultNotes: true,
  invoiceLogoUrl: true,
  invoiceColor: true,
  showAddressOnInvoice: true,
  showPhoneOnInvoice: true,
  showEmailOnInvoice: true,
  showWebsiteOnInvoice: true,
  theme: true,
  dateFormat: true,
  timeZone: true,
  notifyProjectDeadlines: true,
  notifyInvoiceDue: true,
  notifyPaymentReceived: true,
  notifyAiInsights: true,
  createdAt: true,
  updatedAt: true,
};

/**
 * Fetch profile and settings for logged-in user
 */
const getProfile = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: USER_SELECT_FIELDS,
  });

  if (!user) {
    const error = new Error('User profile not found.');
    error.status = 404;
    throw error;
  }

  return user;
};

/**
 * Update profile and settings for logged-in user
 */
const updateProfile = async (userId, data) => {
  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!existingUser) {
    const error = new Error('User profile not found.');
    error.status = 404;
    throw error;
  }

  const allowedKeys = [
    'fullName',
    'profilePhotoUrl',
    'phone',
    'location',
    'profession',
    'bio',
    'skills',
    'experienceLevel',
    'hourlyRate',
    'website',
    'linkedIn',
    'github',
    'businessName',
    'businessType',
    'gstNumber',
    'businessAddress',
    'businessDescription',
    'upiId',
    'paymentQrUrl',
    'paymentInstructions',
    'invoicePrefix',
    'nextInvoiceNumber',
    'defaultCurrency',
    'defaultTaxRate',
    'defaultPaymentTerms',
    'defaultNotes',
    'invoiceLogoUrl',
    'invoiceColor',
    'showAddressOnInvoice',
    'showPhoneOnInvoice',
    'showEmailOnInvoice',
    'showWebsiteOnInvoice',
    'theme',
    'dateFormat',
    'timeZone',
    'notifyProjectDeadlines',
    'notifyInvoiceDue',
    'notifyPaymentReceived',
    'notifyAiInsights',
  ];

  const updateData = {};
  for (const key of allowedKeys) {
    if (data[key] !== undefined) {
      updateData[key] = data[key];
    }
  }

  return await prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: USER_SELECT_FIELDS,
  });
};

module.exports = {
  getProfile,
  updateProfile,
};
