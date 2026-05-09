const User = require('../models/User');

// @route   GET /api/users
// @access  Private (Admin only)
const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json({ success: true, count: users.length, data: users });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAllUsers };
