import Stripe from 'stripe';
import Order from '../models/Order.js';
import ProductModel from '../models/Product.js';
import { calculateShipping } from '../utils/shipping.js';
import { calculateTax } from '../utils/tax.js';
import { validateShippingAddress } from '../utils/shipping.js';
import {
    sendOrderConfirmationEmail,
    sendPaymentFailedEmail,
    sendRefundConfirmationEmail
} from '../services/emailService.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * Validate cart prices với database
 */
async function validateCartPrices(cart) {
    const validatedCart = [];
    let hasChanges = false;

    for (const item of cart) {
        const product = await ProductModel.findById(item.productId);

        if (!product || product.isDeleted || !product.isPublished) {
            throw new Error(`Sản phẩm ${item.title} không còn khả dụng`);
        }

        if (product.inStock < item.quantity) {
            throw new Error(`Sản phẩm ${item.title} chỉ còn ${product.inStock} trong kho`);
        }

        const currentPrice = product.salePrice || product.regularPrice;

        if (item.price !== currentPrice) {
            hasChanges = true;
        }

        validatedCart.push({
            productId: product._id,
            title: product.title,
            sku: product.sku,
            price: currentPrice,
            quantity: item.quantity,
            subtotal: currentPrice * item.quantity
        });
    }

    return { validatedCart, hasChanges };
}

export const checkout = async (req, res) => {
    try {
        const cartKey = req.user ? `cart_${req.user._id}` : 'cart';
        const cart = req.session[cartKey];
        
        if (!cart || cart.length === 0) {
            return res.status(400).json({
                status_code: 0,
                data: {
                    error_code: 1,
                    message: 'Giỏ hàng trống'
                }
            });
        }

        // ✅ Get shipping address from request
        const { shippingAddress, shippingMethod } = req.body;

        if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.phone || !shippingAddress.address || !shippingAddress.city) {
            return res.status(400).json({
                status_code: 0,
                data: {
                    error_code: 2,
                    message: 'Vui lòng nhập đầy đủ địa chỉ giao hàng'
                }
            });
        }

        // ✅ Validate shipping address
        const addressValidation = validateShippingAddress(shippingAddress);
        
        if (!addressValidation.valid) {
            return res.status(400).json({
                status_code: 0,
                data: {
                    error_code: 5,
                    message: 'Địa chỉ giao hàng không hợp lệ',
                    errors: addressValidation.errors
                }
            });
        }

        // ✅ Validate cart prices
        let validatedCart, hasChanges;
        try {
            ({ validatedCart, hasChanges } = await validateCartPrices(cart));
        } catch (error) {
            return res.status(400).json({
                status_code: 0,
                data: {
                    error_code: 3,
                    message: error.message
                }
            });
        }

        // ✅ Notify if prices changed
        if (hasChanges) {
            return res.status(400).json({
                status_code: 0,
                data: {
                    error_code: 4,
                    message: 'Giá một số sản phẩm đã thay đổi, vui lòng kiểm tra lại giỏ hàng',
                    updatedCart: validatedCart
                }
            });
        }

        // ✅ Calculate pricing
        const subtotal = validatedCart.reduce((sum, item) => sum + item.subtotal, 0);
        
        const totalWeight = validatedCart.reduce((sum, item) => {
            return sum + (item.weight || 0.5) * item.quantity;
        }, 0);

        const shipping = calculateShipping({
            subtotal,
            weight: totalWeight,
            location: shippingAddress.city.toLowerCase(),
            shippingMethod: shippingMethod || 'standard'
        });

        const tax = calculateTax({
            subtotal,
            country: shippingAddress.country || 'VN',
            isBusiness: req.user?.isBusiness || false
        });

        const total = subtotal + shipping.cost + tax.amount;

        // ✅ Create order in database FIRST
        const order = new Order({
            user: req.user._id,
            items: validatedCart,
            shippingAddress,
            pricing: {
                subtotal,
                shipping: shipping.cost,
                tax: tax.amount,
                total
            },
            shipping: {
                method: shippingMethod || 'standard'
            },
            payment: {
                status: 'pending'
            }
        });

        await order.save();

        // ✅ Create Stripe PaymentIntent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(total),
            currency: 'vnd',
            payment_method_types: ['card'],
            metadata: {
                orderId: order._id.toString(),
                orderNumber: order.orderNumber,
                userId: req.user._id.toString()
            }
        });

        // ✅ Update order with paymentIntentId
        order.payment.stripePaymentIntentId = paymentIntent.id;
        await order.save();

        // ✅ Clear cart
        req.session[cartKey] = [];

        return res.status(200).json({
            status_code: 1,
            data: {
                orderId: order._id,
                orderNumber: order.orderNumber,
                paymentIntentId: paymentIntent.id,
                clientSecret: paymentIntent.client_secret,
                amount: total,
                breakdown: {
                    subtotal,
                    shipping: shipping.cost,
                    tax: tax.amount,
                    total
                },
                message: 'Tạo đơn hàng thành công'
            }
        });
    } catch (error) {
        console.error('Checkout error:', error);
        return res.status(500).json({
            status_code: 0,
            data: {
                error_code: 0,
                message: 'Lỗi xử lý thanh toán',
                error: error.message
            }
        });
    }
};

/**
 * Xác nhận thanh toán thành công (webhook từ Stripe)
 * @route POST /payment/webhook
 * @access Public (nhưng cần verify signature)
 */
export const stripeWebhook = async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
        switch (event.type) {
            case 'payment_intent.succeeded':
                await handlePaymentSuccess(event.data.object);
                break;
            
            case 'payment_intent.payment_failed':
                await handlePaymentFailed(event.data.object);
                break;
            
            case 'payment_intent.canceled':
                await handlePaymentCanceled(event.data.object);
                break;
            
            case 'charge.refunded':
                await handleRefund(event.data.object);
                break;
            
            default:
                console.log(`Unhandled event type: ${event.type}`);
        }

        res.json({ received: true });
    } catch (error) {
        console.error('Webhook handler error:', error);
        res.status(500).json({ error: 'Webhook handler failed' });
    }
};

/**
 * Handle successful payment
 */
async function handlePaymentSuccess(paymentIntent) {
    try {
        const order = await Order.findOne({
            'payment.stripePaymentIntentId': paymentIntent.id
        }).populate('items.product').populate('user');

        if (!order) {
            console.error('Order not found for paymentIntent:', paymentIntent.id);
            return;
        }

        // ✅ Update order status
        order.payment.status = 'succeeded';
        order.payment.paidAt = new Date();
        order.status = 'confirmed';
        order.shipping.status = 'preparing';

        await order.save();

        // ✅ Update product stock
        for (const item of order.items) {
            await ProductModel.findByIdAndUpdate(
                item.product,
                {
                    $inc: {
                        inStock: -item.quantity,
                        soldCount: item.quantity
                    }
                }
            );
        }

        console.log('Payment successful, order updated:', order.orderNumber);

        // TODO: Send confirmation email
        await sendOrderConfirmationEmail(order);

        // TODO: Notify admin
        // await notifyAdmin(order);
    } catch (error) {
        console.error('Error handling payment success:', error);
        throw error;
    }
}

/**
 * Handle failed payment
 */
async function handlePaymentFailed(paymentIntent) {
    try {
        const order = await Order.findOne({
            'payment.stripePaymentIntentId': paymentIntent.id
        }).populate('user');

        if (!order) {
            console.error('Order not found for paymentIntent:', paymentIntent.id);
            return;
        }

        // ✅ Update order status
        order.payment.status = 'failed';
        order.payment.failedReason = paymentIntent.last_payment_error?.message || 'Unknown error';
        order.status = 'cancelled';

        await order.save();

        console.log('Payment failed, order cancelled:', order.orderNumber);

        // TODO: Send failed payment notification
        await sendPaymentFailedEmail(order);
    } catch (error) {
        console.error('Error handling payment failure:', error);
        throw error;
    }
}

/**
 * Handle canceled payment
 */
async function handlePaymentCanceled(paymentIntent) {
    try {
        const order = await Order.findOne({
            'payment.stripePaymentIntentId': paymentIntent.id
        });

        if (!order) {
            console.error('Order not found for paymentIntent:', paymentIntent.id);
            return;
        }

        // ✅ Update order status
        order.payment.status = 'failed';
        order.status = 'cancelled';
        order.cancelledAt = new Date();
        order.cancelReason = 'Payment cancelled by user';

        await order.save();

        console.log('Payment cancelled, order cancelled:', order.orderNumber);
    } catch (error) {
        console.error('Error handling payment cancellation:', error);
        throw error;
    }
}

/**
 * Handle refund
 */
async function handleRefund(charge) {
    try {
        const paymentIntentId = charge.payment_intent;

        const order = await Order.findOne({
            'payment.stripePaymentIntentId': paymentIntentId
        }).populate('items.product').populate('user');

        if (!order) {
            console.error('Order not found for charge:', charge.id);
            return;
        }

        // ✅ Update order status
        order.payment.status = 'refunded';
        order.status = 'refunded';

        await order.save();

        // ✅ Restore product stock
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

        console.log('Refund processed, order updated:', order.orderNumber);

        // TODO: Send refund confirmation email
        await sendRefundConfirmationEmail(order);
    } catch (error) {
        console.error('Error handling refund:', error);
        throw error;
    }
}