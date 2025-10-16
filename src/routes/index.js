import express from 'express';
import { register, login, refreshToken, logout } from '../controllers/authController.js';
import { getProfile, updateProfile, changePassword, deleteAccount } from '../controllers/userController.js';
import { getAllArticles, getArticleById, createArticle, updateArticle, deleteArticle } from '../controllers/articleController.js';
import { 
    getAllProducts, 
    getProductById, 
    createProduct, 
    updateProduct, 
    deleteProduct,
    restoreProduct,
    bulkUpdateProducts,
    bulkDeleteProducts,
    bulkPublishProducts,
    bulkRestoreProducts,
    uploadProductImages,
    deleteProductImage,
    setPrimaryImage
} from '../controllers/productController.js';
import { getAllCarts, addToCart, updateCart, removeFromCart } from '../controllers/cartController.js';
import { checkout, stripeWebhook } from '../controllers/paymentController.js';
import { protect } from '../middlewares/authMiddleware.js';
import upload from '../config/upload.js';

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
// Public routes
router.get('/product/list', getAllProducts);
router.get('/product/:id', getProductById);

// Private routes - Single operations
router.post('/product/create', protect, createProduct);
router.put('/product/update/:id', protect, updateProduct);
router.delete('/product/delete/:id', protect, deleteProduct);
router.put('/product/restore/:id', protect, restoreProduct);

// Private routes - Bulk operations
router.put('/product/bulk-update', protect, bulkUpdateProducts);
router.delete('/product/bulk-delete', protect, bulkDeleteProducts);
router.put('/product/bulk-publish', protect, bulkPublishProducts);
router.put('/product/bulk-restore', protect, bulkRestoreProducts);

// Private routes - Image upload
router.post('/product/upload-images/:id', protect, upload.array('images', 10), uploadProductImages);
router.delete('/product/delete-image/:id', protect, deleteProductImage);
router.put('/product/set-primary-image/:id', protect, setPrimaryImage);

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