import ProductModel from '../models/Product.js';
import { calculateShipping, getAvailableShippingMethods } from '../utils/shipping.js';
import { calculateTax } from '../utils/tax.js';

export const addToCart = async (req, res) => {
    try {
        const { productId, quantity } = req.body;
        
        if (!productId || !quantity || quantity < 1) {
            return res.status(400).json({
                status_code: 0,
                data: {
                    error_code: 1,
                    message: 'Thông tin không hợp lệ'
                }
            });
        }

        const cartKey = req.user ? `cart_${req.user._id}` : 'cart_guest';
        
        if (!req.session[cartKey]) {
            req.session[cartKey] = [];
        }

        const product = await ProductModel.findById(productId);
        
        if (!product) {
            return res.status(404).json({
                status_code: 0,
                data: {
                    error_code: 2,
                    message: 'Sản phẩm không tồn tại'
                }
            });
        }

        if (!product.isPublished) {
            return res.status(400).json({
                status_code: 0,
                data: {
                    error_code: 5,
                    message: 'Sản phẩm không khả dụng'
                }
            });
        }

        // Kiểm tra tồn kho
        if (product.inStock < quantity) {
            return res.status(400).json({
                status_code: 0,
                data: {
                    error_code: 3,
                    message: `Chỉ còn ${product.inStock} sản phẩm trong kho`
                }
            });
        }

        const cart = req.session[cartKey];
        const existingProductItem = cart.find(
            item => item.productId === productId
        );
        
        if (existingProductItem) {
            const newQuantity = existingProductItem.quantity + parseInt(quantity);
            
            if (newQuantity > product.inStock) {
                return res.status(400).json({
                    status_code: 0,
                    data: {
                        error_code: 4,
                        message: 'Số lượng vượt quá tồn kho'
                    }
                });
            }
            
            existingProductItem.quantity = newQuantity;
            existingProductItem.addedAt = Date.now(); 

        } else {
            cart.push({
                productId,
                title: product.title,
                thumbnail: product.thumbnail,
                sku: product.sku,
                price: product.salePrice || product.regularPrice,
                regularPrice: product.regularPrice,
                quantity: parseInt(quantity),
                weight: product.weight?.value || 0.5, 
                addedAt: Date.now()
            });
        }

        res.status(200).json({
            status_code: 1,
            data: {
                cart: cart,
                message: 'Thêm vào giỏ hàng thành công'
            }
        });
    } catch (err) {
        console.error('Add to cart error:', err);
        res.status(500).json({
            status_code: 0,
            data: {
                error_code: 0,
                message: 'Lỗi thêm vào giỏ hàng'
            }
        });
    }
};

/**
 * Clean expired cart items (older than 7 days)
 */
function cleanExpiredCartItems(cart) {
    const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    
    return cart.filter(item => {
        if (!item.addedAt) return true; // Keep items without timestamp
        return (now - item.addedAt) < SEVEN_DAYS;
    });
}

/**
 * Validate và sync giá sản phẩm trong giỏ hàng
 * @param {Array} cart - Giỏ hàng hiện tại
 * @returns {Object} - { updatedCart, priceChanges }
 */
async function validateCartPrices(cart) {
    const updatedCart = [];
    const priceChanges = [];

    for (const item of cart) {
        const product = await ProductModel.findById(item.productId);
        
        if (!product || product.isDeleted || !product.isPublished) {
            // Sản phẩm không còn tồn tại hoặc bị unpublish
            priceChanges.push({
                productId: item.productId,
                title: item.title,
                status: 'unavailable'
            });
            continue; // Bỏ qua sản phẩm này
        }

        const currentPrice = product.salePrice || product.regularPrice;
        
        if (item.price !== currentPrice) {
            // Giá đã thay đổi
            priceChanges.push({
                productId: item.productId,
                title: item.title,
                oldPrice: item.price,
                newPrice: currentPrice,
                difference: currentPrice - item.price
            });
            
            item.price = currentPrice; // Update giá mới
        }

        // Kiểm tra tồn kho
        if (item.quantity > product.inStock) {
            priceChanges.push({
                productId: item.productId,
                title: item.title,
                status: 'stock_updated',
                oldQuantity: item.quantity,
                newQuantity: product.inStock
            });
            
            item.quantity = Math.min(item.quantity, product.inStock);
        }

        updatedCart.push(item);
    }

    return { updatedCart, priceChanges };
}

/**
 * Get cart with price validation
 * @route GET /cart
 * @access Private
 */
export const getAllCarts = async (req, res) => {
    try {
        const cartKey = req.user ? `cart_${req.user._id}` : 'cart_guest';
        
        if (!req.session[cartKey]) {
            req.session[cartKey] = [];
        }

        // Clean expired items
        req.session[cartKey] = cleanExpiredCartItems(req.session[cartKey]);

        // Validate và update giá
        const { updatedCart, priceChanges } = await validateCartPrices(req.session[cartKey]);
        req.session[cartKey] = updatedCart;

        res.status(200).json({
            status_code: 1,
            data: {
                cart: updatedCart,
                totalItems: updatedCart.reduce((sum, item) => sum + item.quantity, 0),
                totalAmount: updatedCart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
                userId: req.user ? req.user._id : 'guest',
                priceChanges: priceChanges.length > 0 ? priceChanges : undefined
            }
        });
    } catch (err) {
        console.error('Get cart error:', err);
        res.status(500).json({
            status_code: 0,
            data: {
                error_code: 0,
                message: 'Lỗi lấy giỏ hàng'
            }
        });
    }
};

export const updateCart = async (req, res) => {
    try {
        const { productId, quantity } = req.body;

        if (!productId || quantity === undefined || quantity < 0) {
            return res.status(400).json({
                status_code: 0,
                data: {
                    error_code: 1,
                    message: 'Thông tin không hợp lệ'
                }
            });
        }

        const cartKey = req.user ? `cart_${req.user._id}` : 'cart_guest';

        if (!req.session[cartKey] || req.session[cartKey].length === 0) {
            return res.status(400).json({
                status_code: 0,
                data: {
                    error_code: 2,
                    message: 'Giỏ hàng rỗng'
                }
            });
        }

        const cart = req.session[cartKey];
        const existingProductItem = cart.find(
            item => item.productId === productId
        );

        if (!existingProductItem) {
            return res.status(404).json({
                status_code: 0,
                data: {
                    error_code: 3,
                    message: 'Sản phẩm không tồn tại trong giỏ hàng'
                }
            });
        }

        // Kiểm tra tồn kho
        const product = await ProductModel.findById(productId);
        if (product && quantity > product.inStock) {
            return res.status(400).json({
                status_code: 0,
                data: {
                    error_code: 4,
                    message: `Chỉ còn ${product.inStock} sản phẩm trong kho`
                }
            });
        }

        if (quantity === 0) {
            // Xóa sản phẩm nếu quantity = 0
            req.session[cartKey] = cart.filter(
                item => item.productId !== productId
            );
        } else {
            existingProductItem.quantity = parseInt(quantity);
        }

        res.status(200).json({
            status_code: 1,
            data: {
                cart: req.session[cartKey],
                message: 'Cập nhật giỏ hàng thành công'
            }
        });
    } catch (err) {
        console.error('Update cart error:', err);
        res.status(500).json({
            status_code: 0,
            data: {
                error_code: 0,
                message: 'Lỗi cập nhật giỏ hàng'
            }
        });
    }
};

export const removeFromCart = async (req, res) => {
    try {
        const { productId } = req.body;

        if (!productId) {
            return res.status(400).json({
                status_code: 0,
                data: {
                    error_code: 1,
                    message: 'ProductId không được cung cấp'
                }
            });
        }

        const cartKey = req.user ? `cart_${req.user._id}` : 'cart_guest';

        if (!req.session[cartKey] || req.session[cartKey].length === 0) {
            return res.status(400).json({
                status_code: 0,
                data: {
                    error_code: 2,
                    message: 'Giỏ hàng rỗng'
                }
            });
        }

        const cart = req.session[cartKey];
        const initialLength = cart.length;
        req.session[cartKey] = cart.filter(
            item => item.productId !== productId
        );

        if (req.session[cartKey].length === initialLength) {
            return res.status(404).json({
                status_code: 0,
                data: {
                    error_code: 3,
                    message: 'Sản phẩm không tồn tại trong giỏ hàng'
                }
            });
        }

        res.status(200).json({
            status_code: 1,
            data: {
                cart: req.session[cartKey],
                message: 'Xóa sản phẩm khỏi giỏ hàng thành công'
            }
        });
    } catch (err) {
        console.error('Remove from cart error:', err);
        res.status(500).json({
            status_code: 0,
            data: {
                error_code: 0,
                message: 'Lỗi xóa sản phẩm khỏi giỏ hàng'
            }
        });
    }
};

/**
 * Get cart summary with shipping & tax
 * @route GET /cart/summary
 * @access Private
 */
export const getCartSummary = async (req, res) => {
    try {
        const cartKey = req.user ? `cart_${req.user._id}` : 'cart_guest';
        
        if (!req.session[cartKey]) {
            req.session[cartKey] = [];
        }

        const cart = req.session[cartKey];
        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

        // Get shipping & location from query params
        const shippingMethod = req.query.shippingMethod || 'standard';
        const location = req.query.location || 'default';
        const country = req.query.country || 'VN';

        // Calculate total weight
        const totalWeight = cart.reduce((sum, item) => {
            // Assume each item has weight, or use default
            const itemWeight = item.weight || 0.5; // 500g default
            return sum + (itemWeight * item.quantity);
        }, 0);

        // Calculate shipping
        const shipping = calculateShipping({
            subtotal,
            weight: totalWeight,
            location,
            shippingMethod
        });

        // Calculate tax
        const tax = calculateTax({
            subtotal,
            country,
            isBusiness: req.user?.isBusiness || false
        });

        // Calculate grand total
        const grandTotal = subtotal + shipping.cost + tax.amount;

        res.status(200).json({
            status_code: 1,
            data: {
                itemCount: cart.length,
                totalItems: totalItems,
                subtotal: subtotal,
                shipping: {
                    cost: shipping.cost,
                    method: shipping.method,
                    estimatedDays: shipping.estimatedDays,
                    isFree: shipping.isFree,
                    breakdown: shipping.breakdown
                },
                tax: {
                    amount: tax.amount,
                    rate: tax.rate,
                    isExempt: tax.isExempt
                },
                grandTotal: grandTotal,
                breakdown: {
                    subtotal,
                    shippingCost: shipping.cost,
                    taxAmount: tax.amount,
                    total: grandTotal
                }
            }
        });
    } catch (err) {
        console.error('Get cart summary error:', err);
        res.status(500).json({
            status_code: 0,
            data: {
                error_code: 0,
                message: 'Lỗi lấy tóm tắt giỏ hàng'
            }
        });
    }
};

/**
 * Get available shipping methods
 * @route GET /cart/shipping-methods
 * @access Private
 */
export const getShippingMethods = async (req, res) => {
    try {
        const location = req.query.location || 'default';
        const methods = getAvailableShippingMethods(location);

        res.status(200).json({
            status_code: 1,
            data: {
                methods,
                location
            }
        });
    } catch (err) {
        console.error('Get shipping methods error:', err);
        res.status(500).json({
            status_code: 0,
            data: {
                error_code: 0,
                message: 'Lỗi lấy phương thức vận chuyển'
            }
        });
    }
};

/**
 * Calculate cart total with shipping & tax
 * @route POST /cart/calculate
 * @access Private
 */
export const calculateCartTotal = async (req, res) => {
    try {
        const { shippingMethod, location, country, address } = req.body;

        const cartKey = req.user ? `cart_${req.user._id}` : 'cart_guest';
        
        if (!req.session[cartKey]) {
            req.session[cartKey] = [];
        }

        const cart = req.session[cartKey];

        if (cart.length === 0) {
            return res.status(400).json({
                status_code: 0,
                data: {
                    error_code: 1,
                    message: 'Giỏ hàng trống'
                }
            });
        }

        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        // Calculate weight
        const totalWeight = cart.reduce((sum, item) => {
            const itemWeight = item.weight || 0.5;
            return sum + (itemWeight * item.quantity);
        }, 0);

        // Calculate shipping
        const shipping = calculateShipping({
            subtotal,
            weight: totalWeight,
            location: location || 'default',
            shippingMethod: shippingMethod || 'standard'
        });

        // Calculate tax
        const tax = calculateTax({
            subtotal,
            country: country || 'VN',
            isBusiness: req.user?.isBusiness || false
        });

        const grandTotal = subtotal + shipping.cost + tax.amount;

        res.status(200).json({
            status_code: 1,
            data: {
                subtotal,
                shipping,
                tax,
                grandTotal,
                cart
            }
        });
    } catch (err) {
        console.error('Calculate cart total error:', err);
        res.status(500).json({
            status_code: 0,
            data: {
                error_code: 0,
                message: 'Lỗi tính tổng giỏ hàng'
            }
        });
    }
};

/**
 * Clean expired cart items (older than 7 days)
 */
function cleanExpiredCartItems(cart) {
    const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    
    return cart.filter(item => {
        if (!item.addedAt) return true; // Keep items without timestamp
        return (now - item.addedAt) < SEVEN_DAYS;
    });
}

/**
 * Validate và sync giá sản phẩm trong giỏ hàng
 * @param {Array} cart - Giỏ hàng hiện tại
 * @returns {Object} - { updatedCart, priceChanges }
 */
async function validateCartPrices(cart) {
    const updatedCart = [];
    const priceChanges = [];

    for (const item of cart) {
        const product = await ProductModel.findById(item.productId);
        
        if (!product || product.isDeleted || !product.isPublished) {
            // Sản phẩm không còn tồn tại hoặc bị unpublish
            priceChanges.push({
                productId: item.productId,
                title: item.title,
                status: 'unavailable'
            });
            continue; // Bỏ qua sản phẩm này
        }

        const currentPrice = product.salePrice || product.regularPrice;
        
        if (item.price !== currentPrice) {
            // Giá đã thay đổi
            priceChanges.push({
                productId: item.productId,
                title: item.title,
                oldPrice: item.price,
                newPrice: currentPrice,
                difference: currentPrice - item.price
            });
            
            item.price = currentPrice; // Update giá mới
        }

        // Kiểm tra tồn kho
        if (item.quantity > product.inStock) {
            priceChanges.push({
                productId: item.productId,
                title: item.title,
                status: 'stock_updated',
                oldQuantity: item.quantity,
                newQuantity: product.inStock
            });
            
            item.quantity = Math.min(item.quantity, product.inStock);
        }

        updatedCart.push(item);
    }

    return { updatedCart, priceChanges };
}

/**
 * Merge guest cart với user cart khi login
 * @param {Object} req - Request object
 * @returns {Promise<void>}
 */
export async function mergeGuestCart(req) {
    try {
        const guestCartKey = 'cart_guest';
        const userCartKey = `cart_${req.user._id}`;

        // Lấy cả 2 carts
        const guestCart = req.session[guestCartKey] || [];
        const userCart = req.session[userCartKey] || [];

        if (guestCart.length === 0) {
            return; // Không có gì để merge
        }

        // Merge logic
        for (const guestItem of guestCart) {
            const existingItem = userCart.find(
                item => item.productId === guestItem.productId
            );

            if (existingItem) {
                // Cộng dồn quantity
                const product = await ProductModel.findById(guestItem.productId);
                const newQuantity = existingItem.quantity + guestItem.quantity;

                if (product && newQuantity <= product.inStock) {
                    existingItem.quantity = newQuantity;
                    existingItem.addedAt = Date.now(); // Update timestamp
                } else if (product) {
                    existingItem.quantity = product.inStock; // Max tồn kho
                }
            } else {
                // Thêm item mới
                userCart.push({
                    ...guestItem,
                    addedAt: Date.now()
                });
            }
        }

        // Lưu user cart và xóa guest cart
        req.session[userCartKey] = userCart;
        req.session[guestCartKey] = [];

        console.log(`Merged ${guestCart.length} items from guest cart to user cart`);
    } catch (error) {
        console.error('Merge cart error:', error);
    }
}