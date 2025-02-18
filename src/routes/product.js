import express from 'express';
import { getAllProducts, getProductById, createProduct, updateProduct, deleteProduct } from '../controllers/productController.js';

const router = express.Router();

router.get('/list', getAllProducts);
router.get('/:id', getProductById);
router.post('/create', createProduct);
router.put('update/:id', updateProduct);
router.delete('/delete/:id', deleteProduct);

export default router;