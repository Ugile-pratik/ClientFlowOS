const notificationService = require('../services/notification.service');

const getNotifications = async (req, res) => {
  const userId = req.user.id;
  try {
    const data = await notificationService.getNotifications(userId);
    res.status(200).json(data);
  } catch (error) {
    console.error('Get Notifications Error:', error);
    const status = error.status || 500;
    res.status(status).json({ error: error.message || 'Failed to fetch notifications.' });
  }
};

module.exports = {
  getNotifications,
};
