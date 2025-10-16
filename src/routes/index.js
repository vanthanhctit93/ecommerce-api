import express from 'express';
import { register, login, refreshToken, logout } from '../controllers/authController.js';
import { getProfile, updateProfile, changePassword, deleteAccount } from '../controllers/userController.js';
import { getAllArticles, getArticleById, createArticle, updateArticle, deleteArticle } from '../controllers/articleController.js';
import { getAllProducts, getProductById, createProduct, updateProduct, deleteProduct } from '../controllers/productController.js';
import { getAllCarts, addToCart, updateCart, removeFromCart } from '../controllers/cartController.js';
import { checkout, stripeWebhook } from '../controllers/paymentController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

// ========================================
// AUTH ROUTES (Public - Không cần token)
// ========================================
router.post('/auth/register', register);
router.post('/auth/login', login);
router.post('/auth/refresh-token', refreshToken);
router.post('/auth/logout', protect, logout); // Optional: có thể để public

// ========================================
// USER PROFILE ROUTES (Private - Cần token)
// ========================================
router.get('/user/profile', protect, getProfile);
router.put('/user/profile', protect, updateProfile);
router.put('/user/change-password', protect, changePassword);
router.delete('/user/account', protect, deleteAccount);

// ========================================
// ARTICLE ROUTES
// ========================================
router.get('/article/list', getAllArticles); // Public
router.get('/article/:id', getArticleById); // Public
router.post('/article/create', protect, createArticle); // Private
router.put('/article/update/:id', protect, updateArticle); // Private
router.delete('/article/delete/:id', protect, deleteArticle); // Private

// ========================================
// PRODUCT ROUTES
// ========================================
router.get('/product/list', getAllProducts); // Public
router.get('/product/:id', getProductById); // Public
router.post('/product/create', protect, createProduct); // Private
router.put('/product/update/:id', protect, updateProduct); // Private
router.delete('/product/delete/:id', protect, deleteProduct); // Private

// ========================================
// CART ROUTES (All Private)
// ========================================
router.get('/cart', protect, getAllCarts);
router.post('/cart/create', protect, addToCart);
router.put('/cart/update', protect, updateCart);
router.delete('/cart/remove', protect, removeFromCart);

// ========================================
// PAYMENT ROUTES
// ========================================
router.post('/checkout', protect, checkout);
router.post('/payment/webhook', express.raw({ type: 'application/json' }), stripeWebhook);

export default router;