import ProductModel from '../models/Product.js';
export const getAllCarts = async (req, res) => {
    try {
        if (!req.session.cart) {
            req.session.cart = [];
        }

        res.json(req.session.cart);
    } catch (err) {
        
    }
}

export const addToCart = async (req, res) => {
    try {
        const { productId, quantity } = req.body;

        if (!req.session.cart) {
            req.session.cart = [];
        }

        const product = await ProductModel.findById(productId);

        if(!product){
            return res.status(200).json({
                status_code: 0,
                data: {
                    error_code: 1,
                    message: 'Sản phẩm không tồn tại'
                }
            });
        }

        const existingProductItem = req.session.cart.find(item => item.productId === productId);
        
        if (existingProductItem) {
            existingProductItem.quantity += quantity;
        } else {
            req.session.cart.push({
                productId,
                name: product.name,
                price: product.price,
                quantity: parseInt(quantity)
            });
        }

        res.json(req.session.cart);
    } catch (err) {
        
    }
}

export const updateCart = async (req, res) => {
    try {
        const { productId, quantity } = req.body;

        if (!req.session.cart) {
            return res.status(200).json({
                status_code: 0,
                data: {
                    error_code: 1,
                    message: 'Giỏ hàng rỗng'
                }
            });
        }

        const existingProductItem = req.session.cart.find(item => item.productId === productId);

        if (!existingProductItem) {
            return res.status(200).json({
                status_code: 0,
                data: {
                    error_code: 2,
                    message: 'Sản phẩm không tồn tại trong giỏ hàng'
                }
            });
        }

        existingProductItem.quantity = parseInt(quantity);

        res.json({
            status_code: 1,
            data: {
                error_code: 0,
                message: 'Cập nhật giỏ hàng thành công'
            }
        });
    } catch (err) {
        
    }
}

export const removeFromCart = async (req, res) => {
    try {
        const { productId } = req.body;

        if (!req.session.cart) {
            return res.status(200).json({
                status_code: 0,
                data: {
                    error_code: 1,
                    message: 'Giỏ hàng rỗng'
                }
            });
        }

        req.session.cart = req.session.cart.filter(item => item.productId !== productId);

        res.json({
            status_code: 1,
            data: {
                error_code: 0,
                message: 'Xóa sản phẩm khỏi giỏ hàng thành công'
            }
        });
    } catch (err) {
        
    }
}