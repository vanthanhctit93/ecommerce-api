export const checkout = async (req, res) => {
    try {
        const cart = req.session.cart;
        if (!cart || cart.length === 0) {
            return res.status(200).json({
                status_code: 0,
                data: {
                    error_code: 1,
                    message: 'Giỏ hàng trống'
                }
            });
        }

        const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0) * 1000;
        const paymentIntent = await stripe.paymentInt.create({
            amount: totalAmount,
            payment_method_types: ['card'],
            currency: 'vnd'
        });

        req.session.cart = [];

        return res.status(200).json({
            status_code: 1,
            data: {
                paymentIntent,
                message: 'Thanh toán thành công',
                clientSecret: paymentIntent.client_secret
            }
        });
    } catch (error) {
        
    }
}