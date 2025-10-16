import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const checkout = async (req, res) => {
    try {
        const cart = req.session.cart;
        
        if (!cart || cart.length === 0) {
            return res.status(400).json({
                status_code: 0,
                data: {
                    error_code: 1,
                    message: 'Giỏ hàng trống'
                }
            });
        }

        // Tính tổng tiền (VND)
        const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

        // Stripe yêu cầu amount ở đơn vị nhỏ nhất (VND không có đơn vị nhỏ hơn)
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(totalAmount), // ✅ Làm tròn
            currency: 'vnd',
            payment_method_types: ['card'],
            metadata: {
                userId: req.user ? req.user._id.toString() : 'guest',
                cartItems: JSON.stringify(cart.map(item => ({
                    productId: item.productId,
                    quantity: item.quantity
                })))
            }
        });

        // Xóa giỏ hàng sau khi tạo payment intent
        req.session.cart = [];

        return res.status(200).json({
            status_code: 1,
            data: {
                paymentIntentId: paymentIntent.id,
                clientSecret: paymentIntent.client_secret,
                amount: totalAmount,
                message: 'Tạo payment intent thành công'
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

    // Xử lý các events từ Stripe
    switch (event.type) {
        case 'payment_intent.succeeded':
            const paymentIntent = event.data.object;
            console.log('Payment succeeded:', paymentIntent.id);
            // TODO: Cập nhật order status trong database
            break;
        
        case 'payment_intent.payment_failed':
            const failedPayment = event.data.object;
            console.log('Payment failed:', failedPayment.id);
            // TODO: Thông báo cho user
            break;
    }

    res.json({ received: true });
};