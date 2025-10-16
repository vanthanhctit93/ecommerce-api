import ProductModel from '../models/Product.js';

export const getAllCarts = async (req, res) => {
    try {
        if (!req.session.cart) {
            req.session.cart = [];
        }

        res.status(200).json({
            status_code: 1,
            data: {
                cart: req.session.cart,
                totalItems: req.session.cart.reduce((sum, item) => sum + item.quantity, 0),
                totalAmount: req.session.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
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

        if (!req.session.cart) {
            req.session.cart = [];
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

        const existingProductItem = req.session.cart.find(
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
        } else {
            req.session.cart.push({
                productId,
                title: product.title,
                thumbnail: product.thumbnail,
                price: product.salePrice || product.regularPrice,
                quantity: parseInt(quantity)
            });
        }

        res.status(200).json({
            status_code: 1,
            data: {
                cart: req.session.cart,
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

export const updateCart = async (req, res) => {
    try {
        const { productId, quantity } = req.body;

        if (!productId || !quantity || quantity < 0) {
            return res.status(400).json({
                status_code: 0,
                data: {
                    error_code: 1,
                    message: 'Thông tin không hợp lệ'
                }
            });
        }

        if (!req.session.cart || req.session.cart.length === 0) {
            return res.status(400).json({
                status_code: 0,
                data: {
                    error_code: 2,
                    message: 'Giỏ hàng rỗng'
                }
            });
        }

        const existingProductItem = req.session.cart.find(
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
            req.session.cart = req.session.cart.filter(
                item => item.productId !== productId
            );
        } else {
            existingProductItem.quantity = parseInt(quantity);
        }

        res.status(200).json({
            status_code: 1,
            data: {
                cart: req.session.cart,
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

        if (!req.session.cart || req.session.cart.length === 0) {
            return res.status(400).json({
                status_code: 0,
                data: {
                    error_code: 2,
                    message: 'Giỏ hàng rỗng'
                }
            });
        }

        const initialLength = req.session.cart.length;
        req.session.cart = req.session.cart.filter(
            item => item.productId !== productId
        );

        if (req.session.cart.length === initialLength) {
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
                cart: req.session.cart,
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