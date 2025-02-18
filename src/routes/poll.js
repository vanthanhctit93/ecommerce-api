import express from 'express';
import { body } from 'express-validator';
import pollController from '@/controllers/pollController';
import validate from '@/middlewares/validate';

const router = express.Router();

router.post('/', 
    [
        body('question').not().isEmpty().trim().escape().withMessage('Câu hỏi là bắt buộc'),
        body('choices').isArray({ min: 2}).withMessage('Cần có ít nhất 2 lựa chọn')
    ],
    validate,
    pollController.createPoll
);

router.get('/:id', pollController.getPoll);
router.get('/:id/vote', 
    [
        body('choice').not().isEmpty().trim().escape().withMessage('Lựa chọn không được để trống')
    ],
    validate,
    pollController.votePoll
);

module.exports = router;