import express from 'express';
import { register, login } from '../controllers/authController.js';
import { getAllArticles, getArticleById, createArticle, updateArticle, deleteArticle } from '../controllers/articleController.js';
import { getAllProducts, getProductById, createProduct, updateProduct, deleteProduct } from '../controllers/productController.js';
import { getAllCarts, addToCart, updateCart, removeFromCart } from '../controllers/cartController.js';
import { checkout } from '../controllers/paymentController.js';

const router = express.Router();

// Authen Router
router.post('/auth/register', register);
router.post('/auth/login', login);

// Article Router
router.get('/article/list', getAllArticles);
router.get('/article/:id', getArticleById);
router.post('/article/create', createArticle);
router.put('/article/update/:id', updateArticle);
router.delete('/article/delete/:id', deleteArticle);

// Product Router
router.get('/product/list', getAllProducts);
router.get('/product/:id', getProductById);
router.post('/product/create', createProduct);
router.put('/product/update/:id', updateProduct);
router.delete('/product/delete/:id', deleteProduct);

// Cart Router
router.get('/cart', getAllCarts);
router.post('/cart/create', addToCart);
router.put('/cart/update', updateCart);
router.delete('/cart/remove', removeFromCart);

// Payment Router
router.post('/checkout', checkout);

export default router;