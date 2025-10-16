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
import { 
    getAllCarts, 
    addToCart, 
    updateCart, 
    removeFromCart,
    clearCart,
    getCartSummary,
    getShippingMethods,      
    calculateCartTotal       
} from '../controllers/cartController.js';
import { checkout, stripeWebhook } from '../controllers/paymentController.js';
import { protect } from '../middlewares/authMiddleware.js';
import upload from '../config/upload.js';
import { 
    getUserOrders, 
    getOrderById, 
    cancelOrder, 
    getOrderStats 
} from '../controllers/orderController.js';
import { sendOrderConfirmationEmail } from '../services/emailService.js';
import { 
    getLocalProvinces, 
    getLocalCommunesByProvince,
    searchProvinces,
    searchCommunes
} from '../services/localAddressService.js';

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
router.get('/cart/summary', protect, getCartSummary);
router.get('/cart/shipping-methods', protect, getShippingMethods);  
router.post('/cart/calculate', protect, calculateCartTotal);       
router.post('/cart/create', protect, addToCart);
router.put('/cart/update', protect, updateCart);
router.delete('/cart/remove', protect, removeFromCart);
router.delete('/cart/clear', protect, clearCart);

// ========================================
// PAYMENT ROUTES
// ========================================
router.post('/checkout', protect, checkout);
router.post('/payment/webhook', express.raw({ type: 'application/json' }), stripeWebhook);

// ========================================
// ORDER ROUTES (All Private)
// ========================================
router.get('/order/list', protect, getUserOrders);
router.get('/order/stats', protect, getOrderStats);
router.get('/order/:id', protect, getOrderById);
router.put('/order/cancel/:id', protect, cancelOrder);

// ========================================
// SHIPPING ROUTES
// ========================================
router.post('/shipping/calculate', calculateShippingCost);
router.post('/shipping/validate-address', validateAddress);

// Sử dụng local data thay vì API
router.get('/shipping/provinces', async (req, res) => {
    try {
        const provinces = await getLocalProvinces();
        res.json({ success: true, data: provinces });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
});

router.get('/shipping/communes/:provinceId', async (req, res) => {
    try {
        const communes = await getLocalCommunesByProvince(req.params.provinceId);
        res.json({ success: true, data: communes });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
});

// Thêm route search
router.get('/shipping/provinces/search', async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) {
            return res.status(400).json({ 
                success: false, 
                message: 'Query parameter "q" is required' 
            });
        }
        
        const results = await searchProvinces(q);
        res.json({ success: true, data: results });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
});

router.get('/shipping/communes/search', async (req, res) => {
    try {
        const { q, provinceCode } = req.query;
        if (!q) {
            return res.status(400).json({ 
                success: false, 
                message: 'Query parameter "q" is required' 
            });
        }
        
        const results = await searchCommunes(q, provinceCode);
        res.json({ success: true, data: results });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
});

// ========================================
// TEST ROUTES (Development Only)
// ========================================
if (process.env.NODE_ENV === 'development') {
    router.post('/test-email', protect, async (req, res) => {
        try {
            const { orderId } = req.body;
            
            const order = await Order.findById(orderId)
                .populate('user', 'email username fullname')
                .populate('items.product', 'title sku');
            
            if (!order) {
                return res.status(404).json({ 
                    status_code: 0,
                    data: {
                        error_code: 1,
                        message: 'Order not found' 
                    }
                });
            }
            
            await sendOrderConfirmationEmail(order);
            
            res.status(200).json({ 
                status_code: 1,
                data: {
                    message: 'Test email sent successfully',
                    sentTo: order.user.email
                }
            });
        } catch (error) {
            console.error('Test email error:', error);
            res.status(500).json({ 
                status_code: 0,
                data: {
                    error_code: 0,
                    message: error.message 
                }
            });
        }
    });
}

export default router;