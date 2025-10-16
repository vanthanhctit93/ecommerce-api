import transporter from '../config/email.js';
import {
    orderConfirmationTemplate,
    orderShippedTemplate,
    paymentFailedTemplate,
    refundConfirmationTemplate
} from '../utils/emailTemplates.js';

/**
 * Send order confirmation email
 */
export async function sendOrderConfirmationEmail(order) {
    try {
        // Populate user if not populated
        if (!order.user.email) {
            await order.populate('user', 'email fullname username');
        }
        
        const userEmail = order.user.email;
        
        if (!userEmail) {
            console.error('User email not found for order:', order.orderNumber);
            return;
        }
        
        await transporter.sendMail({
            from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
            to: userEmail,
            subject: `Xác nhận đơn hàng #${order.orderNumber}`,
            html: orderConfirmationTemplate(order)
        });
        
        console.log('Sent order confirmation email to:', userEmail);
    } catch (error) {
        console.error('Failed to send order confirmation email:', error);
        // Don't throw - email failure shouldn't block order processing
    }
}

/**
 * Send order shipped email
 */
export async function sendOrderShippedEmail(order) {
    try {
        if (!order.user.email) {
            await order.populate('user', 'email fullname username');
        }
        
        const userEmail = order.user.email;
        
        if (!userEmail) {
            console.error('User email not found for order:', order.orderNumber);
            return;
        }
        
        await transporter.sendMail({
            from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
            to: userEmail,
            subject: `Đơn hàng #${order.orderNumber} đang được giao`,
            html: orderShippedTemplate(order)
        });
        
        console.log('Sent shipping notification email to:', userEmail);
    } catch (error) {
        console.error('Failed to send shipping notification email:', error);
    }
}

/**
 * Send payment failed email
 */
export async function sendPaymentFailedEmail(order) {
    try {
        if (!order.user.email) {
            await order.populate('user', 'email fullname username');
        }
        
        const userEmail = order.user.email;
        
        if (!userEmail) {
            console.error('User email not found for order:', order.orderNumber);
            return;
        }
        
        await transporter.sendMail({
            from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
            to: userEmail,
            subject: `Thanh toán thất bại - Đơn hàng #${order.orderNumber}`,
            html: paymentFailedTemplate(order)
        });
        
        console.log('Sent payment failed notification email to:', userEmail);
    } catch (error) {
        console.error('Failed to send payment failed notification email:', error);
    }
}

/**
 * Send refund confirmation email
 */
export async function sendRefundConfirmationEmail(order) {
    try {
        if (!order.user.email) {
            await order.populate('user', 'email fullname username');
        }
        
        const userEmail = order.user.email;
        
        if (!userEmail) {
            console.error('User email not found for order:', order.orderNumber);
            return;
        }
        
        await transporter.sendMail({
            from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
            to: userEmail,
            subject: `Hoàn tiền thành công - Đơn hàng #${order.orderNumber}`,
            html: refundConfirmationTemplate(order)
        });
        
        console.log('Sent refund confirmation email to:', userEmail);
    } catch (error) {
        console.error('Failed to send refund confirmation email:', error);
    }
}