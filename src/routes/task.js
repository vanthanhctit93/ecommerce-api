import express from'express';
import { body } from'express-validator';
import taskController from'../controllers/task';
import validate from'../middleware/validate';
import auth from'@/middlewares/auth.middleware';

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

export default router;