const { protect } = require('../middleware/auth.middleware');

router.get('/me', protect, getLoggedInUser);