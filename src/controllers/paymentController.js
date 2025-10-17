import Stripe from 'stripe';
import Order from '../models/Order.js';
import ProductModel from '../models/Product.js';
import { calculateShipping, validateShippingAddress } from '../utils/shipping.js';
import { calculateTax } from '../utils/tax.js';
import {
    sendOrderConfirmationEmail,
    sendPaymentFailedEmail,
    sendRefundConfirmationEmail
} from '../services/emailService.js';
import { 
    sendSuccess, 
    sendError, 
    sendValidationError,
    sendServerError 
} from '../utils/responseHelper.js';

import {
    ORDER_STATUS,
    PAYMENT_STATUS,
    PAYMENT_METHOD,
    SHIPPING_METHOD,
    ERROR_MESSAGES,
    ERROR_CODE
} from '../constants/index.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * Validate cart prices
 */
async function validateCartPrices(cart) {
    const validatedCart = [];
    let hasChanges = false;

    for (const item of cart) {
        const product = await ProductModel.findById(item.productId);

        if (!product || product.isDeleted || !product.isPublished) {
            throw new Error(`${ERROR_MESSAGES.PRODUCT_NOT_FOUND}: ${item.title}`);
        }

        if (product.inStock < item.quantity) {
            throw new Error(`${ERROR_MESSAGES.OUT_OF_STOCK}: ${item.title} (còn ${product.inStock})`);
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

/**
 * Checkout
 */
export const checkout = async (req, res) => {
    try {
        const cartKey = req.user ? `cart_${req.user._id}` : 'cart';
        const cart = req.session[cartKey];
        
        if (!cart || cart.length === 0) {
            return sendError(res, ERROR_CODE.VALIDATION_ERROR, ERROR_MESSAGES.CART_EMPTY);
        }

        const { shippingAddress, shippingMethod } = req.body;

        if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.phone || 
            !shippingAddress.address || !shippingAddress.city) {
            return sendValidationError(res, ERROR_MESSAGES.MISSING_REQUIRED_FIELDS);
        }

        const addressValidation = validateShippingAddress(shippingAddress);
        
        if (!addressValidation.valid) {
            return sendError(res, ERROR_CODE.VALIDATION_ERROR, ERROR_MESSAGES.INVALID_ADDRESS, 400, {
                errors: addressValidation.errors
            });
        }

        let validatedCart, hasChanges;
        try {
            ({ validatedCart, hasChanges } = await validateCartPrices(cart));
        } catch (error) {
            return sendError(res, ERROR_CODE.BUSINESS_LOGIC_ERROR, error.message);
        }

        if (hasChanges) {
            return sendError(res, ERROR_CODE.BUSINESS_LOGIC_ERROR, ERROR_MESSAGES.PRICE_CHANGED, 400, {
                updatedCart: validatedCart
            });
        }

        const subtotal = validatedCart.reduce((sum, item) => sum + item.subtotal, 0);
        
        const totalWeight = validatedCart.reduce((sum, item) => {
            return sum + (item.weight || 0.5) * item.quantity;
        }, 0);

        const shipping = calculateShipping({
            subtotal,
            weight: totalWeight,
            location: shippingAddress.city.toLowerCase(),
            shippingMethod: shippingMethod || SHIPPING_METHOD.STANDARD
        });

        const tax = calculateTax({
            subtotal,
            country: shippingAddress.country || 'VN',
            isBusiness: req.user?.isBusiness || false
        });

        const total = subtotal + shipping.cost + tax.amount;

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
                method: shippingMethod || SHIPPING_METHOD.STANDARD
            },
            payment: {
                status: PAYMENT_STATUS.PENDING
            }
        });

        await order.save();

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

        order.payment.stripePaymentIntentId = paymentIntent.id;
        await order.save();

        req.session[cartKey] = [];

        return sendSuccess(res, {
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
            }
        }, 'Tạo đơn hàng thành công');
    } catch (error) {
        console.error('Checkout error:', error);
        return sendServerError(res, ERROR_MESSAGES[ERROR_CODE.SERVER_ERROR]);
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
    const session = await mongoose.startSession();
    
    try {
        session.startTransaction();

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

        await order.save({ session });

        // ✅ Update sold count atomically
        await updateSoldCount(
            order.items.map(item => ({
                productId: item.product._id,
                quantity: item.quantity
            })),
            session
        );

        await session.commitTransaction();

        console.log('Payment successful, order updated:', order.orderNumber);

        // Send confirmation email (outside transaction)
        await sendOrderConfirmationEmail(order);
    } catch (error) {
        await session.abortTransaction();
        console.error('Error handling payment success:', error);
        throw error;
    } finally {
        session.endSession();
    }
}

/**
 * Handle failed payment
 */
async function handlePaymentFailed(paymentIntent) {
    const session = await mongoose.startSession();
    
    try {
        session.startTransaction();

        const order = await Order.findOne({
            'payment.stripePaymentIntentId': paymentIntent.id
        }).populate('user').populate('items.product');

        if (!order) {
            console.error('Order not found for paymentIntent:', paymentIntent.id);
            return;
        }

        // ✅ Update order status
        order.payment.status = 'failed';
        order.payment.failedReason = paymentIntent.last_payment_error?.message || 'Unknown error';
        order.status = 'cancelled';

        await order.save({ session });

        // ✅ Release reserved stock
        await releaseStock(
            order.items.map(item => ({
                productId: item.product._id,
                quantity: item.quantity
            })),
            session
        );

        await session.commitTransaction();

        console.log('Payment failed, order cancelled:', order.orderNumber);

        // Send failed payment notification (outside transaction)
        await sendPaymentFailedEmail(order);
    } catch (error) {
        await session.abortTransaction();
        console.error('Error handling payment failure:', error);
        throw error;
    } finally {
        session.endSession();
    }
}

/**
 * Handle canceled payment
 */
async function handlePaymentCanceled(paymentIntent) {
    const session = await mongoose.startSession();
    
    try {
        session.startTransaction();

        const order = await Order.findOne({
            'payment.stripePaymentIntentId': paymentIntent.id
        }).populate('items.product');

        if (!order) {
            console.error('Order not found for paymentIntent:', paymentIntent.id);
            return;
        }

        // ✅ Update order status
        order.payment.status = 'failed';
        order.status = 'cancelled';
        order.cancelledAt = new Date();
        order.cancelReason = 'Payment cancelled by user';

        await order.save({ session });

        // ✅ Release reserved stock
        await releaseStock(
            order.items.map(item => ({
                productId: item.product._id,
                quantity: item.quantity
            })),
            session
        );

        await session.commitTransaction();

        console.log('Payment cancelled, order cancelled:', order.orderNumber);
    } catch (error) {
        await session.abortTransaction();
        console.error('Error handling payment cancellation:', error);
        throw error;
    } finally {
        session.endSession();
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