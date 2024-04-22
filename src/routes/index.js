const express = require('express');
const router = express.Router();
const { getApi, setApi, updateApi, deleteApi } = require('../controllers/api')

router.route('/').get(getApi).post(setApi)
router.route('/:id').put(updateApi).delete(deleteApi)

module.exports = router;