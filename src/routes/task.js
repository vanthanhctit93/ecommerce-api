const express = require('express');
const { body } = require('express-validator');
const taskController = require('../controllers/task');
const validate = require('../middleware/validate');
const auth = require('@/middlewares/auth.middleware');

const router = express.Router();

router.post('/',
    auth,
    [
        body('title').not().isEmpty().trim().escape().withMessage('Title không được để trống'),
        body('description').not().isEmpty().trim().escape().withMessage('Description không được để trống'),
    ],
    validate,
    taskController.createTask
);

router.get('/', auth, taskController.getTasks);
router.get('/:id', auth, taskController.getTask);
router.put('/:id', auth, taskController.updateTask);
router.delete('/:id', auth, taskController.deleteTask);

module.exports = router;