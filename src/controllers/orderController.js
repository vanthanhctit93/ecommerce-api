import Order from '../models/Order.js';
import ProductModel from '../models/Product.js';
import { calculateAdvancedShipping } from '../utils/shipping.js';
import { validateAndParseAddress } from '../services/addressService.js';

/**
 * Get all orders of current user
 * @route GET /order/list
 * @access Private
 */
export const getUserOrders = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const filters = { user: req.user._id };

        // Filter by status
        if (req.query.status) {
            filters.status = req.query.status;
        }

        const orders = await Order.find(filters)
            .populate('items.product', 'title sku thumbnail')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Order.countDocuments(filters);

        res.status(200).json({
            status_code: 1,
            data: {
                orders,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        console.error('Get orders error:', error);
        res.status(500).json({
            status_code: 0,
            data: {
                error_code: 0,
                message: 'Lỗi lấy danh sách đơn hàng'
            }
        });
    }
};

/**
 * Get order by ID
 * @route GET /order/:id
 * @access Private
 */
export const getOrderById = async (req, res) => {
    try {
        const { id } = req.params;

        const order = await Order.findOne({
            _id: id,
            user: req.user._id
        }).populate('items.product', 'title sku thumbnail regularPrice salePrice');

        if (!order) {
            return res.status(404).json({
                status_code: 0,
                data: {
                    error_code: 1,
                    message: 'Đơn hàng không tồn tại'
                }
            });
        }

        res.status(200).json({
            status_code: 1,
            data: {
                order
            }
        });
    } catch (error) {
        console.error('Get order error:', error);
        res.status(500).json({
            status_code: 0,
            data: {
                error_code: 0,
                message: 'Lỗi lấy thông tin đơn hàng'
            }
        });
    }
};

/**
 * Cancel order
 * @route PUT /order/cancel/:id
 * @access Private
 */
export const cancelOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        const order = await Order.findOne({
            _id: id,
            user: req.user._id
        }).populate('items.product');

        if (!order) {
            return res.status(404).json({
                status_code: 0,
                data: {
                    error_code: 1,
                    message: 'Đơn hàng không tồn tại'
                }
            });
        }

        // Check if order can be cancelled
        if (['shipped', 'delivered', 'cancelled', 'refunded'].includes(order.status)) {
            return res.status(400).json({
                status_code: 0,
                data: {
                    error_code: 2,
                    message: 'Không thể hủy đơn hàng ở trạng thái này'
                }
            });
        }

        // Update order status
        order.status = 'cancelled';
        order.cancelledAt = new Date();
        order.cancelledBy = req.user._id;
        order.cancelReason = reason || 'Cancelled by customer';
        order.shipping.status = 'cancelled';

        await order.save();

        // Restore product stock if payment was successful
        if (order.payment.status === 'succeeded') {
            for (const item of order.items) {
                await ProductModel.findByIdAndUpdate(
                    item.product,
                    {
                        $inc: {
                            inStock: item.quantity,
                            soldCount: -item.quantity
                        }
                    }
                );
            }

            // TODO: Initiate refund via Stripe
            // await stripe.refunds.create({
            //     payment_intent: order.payment.stripePaymentIntentId
            // });
        }

        res.status(200).json({
            status_code: 1,
            data: {
                order,
                message: 'Hủy đơn hàng thành công'
            }
        });
    } catch (error) {
        console.error('Cancel order error:', error);
        res.status(500).json({
            status_code: 0,
            data: {
                error_code: 0,
                message: 'Lỗi hủy đơn hàng'
            }
        });
    }
};

/**
 * Get order statistics
 * @route GET /order/stats
 * @access Private
 */
export const getOrderStats = async (req, res) => {
    try {
        const stats = await Order.aggregate([
            { $match: { user: req.user._id } },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    totalAmount: { $sum: '$pricing.total' }
                }
            }
        ]);

        const totalOrders = await Order.countDocuments({ user: req.user._id });
        const totalSpent = await Order.aggregate([
            { $match: { user: req.user._id, 'payment.status': 'succeeded' } },
            { $group: { _id: null, total: { $sum: '$pricing.total' } } }
        ]);

        res.status(200).json({
            status_code: 1,
            data: {
                totalOrders,
                totalSpent: totalSpent[0]?.total || 0,
                byStatus: stats
            }
        });
    } catch (error) {
        console.error('Get order stats error:', error);
        res.status(500).json({
            status_code: 0,
            data: {
                error_code: 0,
                message: 'Lỗi lấy thống kê đơn hàng'
            }
        });
    }
};

/**
 * Calculate shipping cost for order
 */
export async function calculateShippingCost(req, res) {
    try {
        const {
            actualWeight,
            dimensions,
            fromProvinceCode,
            toProvinceCode,
            fromCommuneCode,
            toCommuneCode,
            shippingMethod,
            codAmount,
            insuranceValue,
            subtotal
        } = req.body;

        const shippingCost = calculateAdvancedShipping({
            actualWeight,
            dimensions,
            fromProvinceCode,
            toProvinceCode,
            fromCommuneCode,
            toCommuneCode,
            shippingMethod,
            codAmount,
            insuranceValue,
            subtotal
        });

        res.json({
            success: true,
            data: shippingCost
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi tính phí vận chuyển',
            error: error.message
        });
    }
}

/**
 * Validate shipping address
 */
export async function validateAddress(req, res) {
    try {
        const addressValidation = await validateAndParseAddress(req.body);

        if (!addressValidation.valid) {
            return res.status(400).json({
                success: false,
                errors: addressValidation.errors
            });
        }

        res.json({
            success: true,
            data: addressValidation.parsedAddress
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi xác thực địa chỉ',
            error: error.message
        });
    }
}