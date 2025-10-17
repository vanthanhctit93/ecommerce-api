import Order from '../models/Order.js';
import ProductModel from '../models/Product.js';
import { calculateAdvancedShipping } from '../utils/shipping.js';
import { validateAndParseAddress } from '../services/addressService.js';
// ✅ ADD IMPORT
import { 
    sendSuccess, 
    sendError, 
    sendNotFound, 
    sendValidationError,
    sendServerError 
} from '../utils/responseHelper.js';

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

        return sendSuccess(res, {
            orders,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get orders error:', error);
        return sendServerError(res, 'Lỗi lấy danh sách đơn hàng');
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
            return sendNotFound(res, 'Đơn hàng không tồn tại');
        }

        return sendSuccess(res, { order });
    } catch (error) {
        console.error('Get order error:', error);
        return sendServerError(res, 'Lỗi lấy thông tin đơn hàng');
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
            return sendNotFound(res, 'Đơn hàng không tồn tại');
        }

        if (['shipped', 'delivered', 'cancelled', 'refunded'].includes(order.status)) {
            return sendError(res, 2, 'Không thể hủy đơn hàng ở trạng thái này');
        }

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
        }

        return sendSuccess(res, { order }, 'Hủy đơn hàng thành công');
    } catch (error) {
        console.error('Cancel order error:', error);
        return sendServerError(res, 'Lỗi hủy đơn hàng');
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

        return sendSuccess(res, {
            totalOrders,
            totalSpent: totalSpent[0]?.total || 0,
            byStatus: stats
        });
    } catch (error) {
        console.error('Get order stats error:', error);
        return sendServerError(res, 'Lỗi lấy thống kê đơn hàng');
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

        return sendSuccess(res, { shippingCost });
    } catch (error) {
        return sendServerError(res, 'Lỗi khi tính phí vận chuyển');
    }
}

/**
 * Validate shipping address
 */
export async function validateAddress(req, res) {
    try {
        const addressValidation = await validateAndParseAddress(req.body);

        if (!addressValidation.valid) {
            return sendValidationError(res, 'Địa chỉ không hợp lệ', addressValidation.errors);
        }

        return sendSuccess(res, { address: addressValidation.parsedAddress });
    } catch (error) {
        return sendServerError(res, 'Lỗi khi xác thực địa chỉ');
    }
}