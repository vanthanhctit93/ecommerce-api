import express from 'express';
import auth from './auth.js';
import product from './product.js';
const router = express.Router();

//router.use('/', require('@routes/index'));
router.use('/auth', auth);
//router.use('/poll', require('@routes/poll'));
//app.use('/post', require('@/routes/post'));
router.use('/product', product);

export default router;