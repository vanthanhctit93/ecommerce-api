const { protect } = require('./middleware/authMiddleware');

router.get('/me', protect, getLoggedInUser);