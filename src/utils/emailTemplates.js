/**
 * Order Confirmation Email Template
 */
export function orderConfirmationTemplate(order) {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Xác nhận đơn hàng</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            margin: 0;
            padding: 0;
            background-color: #f4f4f4;
        }
        .container { 
            max-width: 600px; 
            margin: 20px auto; 
            background: white;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white; 
            padding: 30px 20px; 
            text-align: center; 
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
        }
        .content { 
            padding: 30px 20px; 
        }
        .order-info { 
            background: #f8f9fa; 
            padding: 20px; 
            margin: 20px 0; 
            border-radius: 8px;
            border-left: 4px solid #667eea;
        }
        .order-info h3 {
            margin-top: 0;
            color: #667eea;
        }
        .order-info p {
            margin: 8px 0;
        }
        .item { 
            padding: 15px; 
            border-bottom: 1px solid #eee; 
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .item:last-child {
            border-bottom: none;
        }
        .item-details {
            flex: 1;
        }
        .item-price {
            font-weight: bold;
            color: #667eea;
        }
        .total-section {
            background: #f8f9fa;
            padding: 20px;
            margin: 20px 0;
            border-radius: 8px;
        }
        .total-row {
            display: flex;
            justify-content: space-between;
            margin: 10px 0;
        }
        .total-label {
            font-weight: normal;
        }
        .total-value {
            font-weight: bold;
        }
        .grand-total {
            font-size: 20px;
            color: #667eea;
            padding-top: 15px;
            border-top: 2px solid #ddd;
            margin-top: 15px;
        }
        .button { 
            display: inline-block; 
            padding: 15px 40px; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white; 
            text-decoration: none; 
            border-radius: 50px; 
            margin: 20px 0;
            font-weight: bold;
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
            transition: transform 0.2s;
        }
        .button:hover {
            transform: translateY(-2px);
        }
        .footer { 
            text-align: center; 
            padding: 30px 20px; 
            color: #777; 
            font-size: 12px;
            background: #f8f9fa;
        }
        .footer a {
            color: #667eea;
            text-decoration: none;
        }
        .status-badge {
            display: inline-block;
            padding: 5px 15px;
            background: #28a745;
            color: white;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>✅ Đơn hàng đã được xác nhận!</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Cảm ơn bạn đã mua sắm tại cửa hàng chúng tôi</p>
        </div>
        
        <div class="content">
            <p>Xin chào <strong>${order.shippingAddress.fullName}</strong>,</p>
            
            <p>Đơn hàng của bạn đã được xác nhận và đang được xử lý. Chúng tôi sẽ sớm gửi hàng đến bạn!</p>
            
            <div class="order-info">
                <h3>📦 Thông tin đơn hàng</h3>
                <p><strong>Mã đơn hàng:</strong> ${order.orderNumber}</p>
                <p><strong>Ngày đặt:</strong> ${new Date(order.createdAt).toLocaleString('vi-VN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                })}</p>
                <p><strong>Trạng thái:</strong> <span class="status-badge">Đã xác nhận</span></p>
                <p><strong>Phương thức vận chuyển:</strong> ${order.shipping.method === 'express' ? 'Giao hàng nhanh (1-2 ngày)' : 'Giao hàng tiêu chuẩn (3-5 ngày)'}</p>
            </div>
            
            <div class="order-info">
                <h3>🛍️ Sản phẩm đã đặt</h3>
                ${order.items.map(item => `
                    <div class="item">
                        <div class="item-details">
                            <strong>${item.title}</strong><br>
                            <span style="color: #999; font-size: 14px;">SKU: ${item.sku}</span><br>
                            <span style="color: #666;">Số lượng: ${item.quantity}</span>
                        </div>
                        <div class="item-price">
                            ${item.price.toLocaleString('vi-VN')} ₫
                        </div>
                    </div>
                `).join('')}
            </div>
            
            <div class="order-info">
                <h3>📍 Địa chỉ giao hàng</h3>
                <p>
                    <strong>${order.shippingAddress.fullName}</strong><br>
                    📞 ${order.shippingAddress.phone}<br>
                    📍 ${order.shippingAddress.address}<br>
                    ${order.shippingAddress.city}, ${order.shippingAddress.country}
                </p>
            </div>
            
            <div class="total-section">
                <h3 style="margin-top: 0;">💰 Chi tiết thanh toán</h3>
                <div class="total-row">
                    <span class="total-label">Tạm tính:</span>
                    <span class="total-value">${order.pricing.subtotal.toLocaleString('vi-VN')} ₫</span>
                </div>
                <div class="total-row">
                    <span class="total-label">Phí vận chuyển:</span>
                    <span class="total-value">${order.pricing.shipping.toLocaleString('vi-VN')} ₫</span>
                </div>
                <div class="total-row">
                    <span class="total-label">Thuế:</span>
                    <span class="total-value">${order.pricing.tax.toLocaleString('vi-VN')} ₫</span>
                </div>
                <div class="total-row grand-total">
                    <span class="total-label">Tổng cộng:</span>
                    <span class="total-value">${order.pricing.total.toLocaleString('vi-VN')} ₫</span>
                </div>
            </div>
            
            <center>
                <a href="${process.env.FRONTEND_URL}/order/${order._id}" class="button">
                    Xem chi tiết đơn hàng
                </a>
            </center>
            
            <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ với chúng tôi:
            </p>
            <p style="text-align: center;">
                📧 Email: <a href="mailto:support@yourstore.com">support@yourstore.com</a><br>
                📞 Hotline: 1900-xxxx
            </p>
        </div>
        
        <div class="footer">
            <p><strong>E-commerce Store</strong></p>
            <p>Địa chỉ cửa hàng của bạn</p>
            <p>
                <a href="${process.env.FRONTEND_URL}">Trang chủ</a> | 
                <a href="${process.env.FRONTEND_URL}/contact">Liên hệ</a> | 
                <a href="${process.env.FRONTEND_URL}/policy">Chính sách</a>
            </p>
            <p style="margin-top: 20px;">© 2024 E-commerce Store. All rights reserved</p>
        </div>
    </div>
</body>
</html>
    `;
}

/**
 * Order Shipped Email Template
 */
export function orderShippedTemplate(order) {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
        .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%); color: white; padding: 30px 20px; text-align: center; }
        .content { padding: 30px 20px; }
        .tracking { background: #FFF3CD; padding: 20px; margin: 20px 0; border-left: 4px solid #FFC107; border-radius: 8px; }
        .button { display: inline-block; padding: 15px 40px; background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%); color: white; text-decoration: none; border-radius: 50px; margin: 20px 0; font-weight: bold; box-shadow: 0 4px 15px rgba(33, 150, 243, 0.4); }
        .footer { text-align: center; padding: 30px 20px; color: #777; font-size: 12px; background: #f8f9fa; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚚 Đơn hàng đang được giao!</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Hàng của bạn đã rời kho</p>
        </div>
        
        <div class="content">
            <p>Xin chào <strong>${order.shippingAddress.fullName}</strong>,</p>
            
            <p>Tin tốt lành! Đơn hàng <strong>${order.orderNumber}</strong> của bạn đã được giao cho đơn vị vận chuyển và đang trên đường đến bạn.</p>
            
            ${order.shipping.trackingNumber ? `
                <div class="tracking">
                    <h3 style="margin-top: 0;">🔍 Thông tin vận chuyển</h3>
                    <p><strong>Mã vận đơn:</strong> <span style="font-size: 18px; color: #FF9800;">${order.shipping.trackingNumber}</span></p>
                    <p>Bạn có thể tra cứu trạng thái đơn hàng chi tiết tại trang tracking của đơn vị vận chuyển.</p>
                </div>
            ` : ''}
            
            <p><strong>Thời gian giao hàng dự kiến:</strong> ${order.shipping.method === 'express' ? '1-2 ngày làm việc' : '3-5 ngày làm việc'}</p>
            
            <p><strong>Địa chỉ giao hàng:</strong></p>
            <p style="background: #f8f9fa; padding: 15px; border-radius: 8px;">
                ${order.shippingAddress.fullName}<br>
                ${order.shippingAddress.phone}<br>
                ${order.shippingAddress.address}<br>
                ${order.shippingAddress.city}, ${order.shippingAddress.country}
            </p>
            
            <center>
                <a href="${process.env.FRONTEND_URL}/order/track/${order.orderNumber}" class="button">
                    Tra cứu đơn hàng
                </a>
            </center>
            
            <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                <strong>Lưu ý quan trọng:</strong><br>
                • Vui lòng kiểm tra hàng hóa trước khi thanh toán (nếu COD)<br>
                • Giữ lại biên lai giao hàng để đối chiếu<br>
                • Liên hệ ngay với chúng tôi nếu có vấn đề
            </p>
        </div>
        
        <div class="footer">
            <p><strong>E-commerce Store</strong></p>
            <p>📧 support@yourstore.com | 📞 1900-xxxx</p>
            <p>© 2024 All rights reserved</p>
        </div>
    </div>
</body>
</html>
    `;
}

/**
 * Payment Failed Email Template
 */
export function paymentFailedTemplate(order) {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
        .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%); color: white; padding: 30px 20px; text-align: center; }
        .content { padding: 30px 20px; }
        .error { background: #ffebee; padding: 20px; margin: 20px 0; border-left: 4px solid #f44336; border-radius: 8px; }
        .button { display: inline-block; padding: 15px 40px; background: linear-gradient(135deg, #4CAF50 0%, #388E3C 100%); color: white; text-decoration: none; border-radius: 50px; margin: 20px 0; font-weight: bold; box-shadow: 0 4px 15px rgba(76, 175, 80, 0.4); }
        .footer { text-align: center; padding: 30px 20px; color: #777; font-size: 12px; background: #f8f9fa; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>❌ Thanh toán không thành công</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Có lỗi xảy ra trong quá trình thanh toán</p>
        </div>
        
        <div class="content">
            <p>Xin chào <strong>${order.shippingAddress.fullName}</strong>,</p>
            
            <p>Rất tiếc, thanh toán cho đơn hàng <strong>${order.orderNumber}</strong> đã không thành công.</p>
            
            <div class="error">
                <h3 style="margin-top: 0;">⚠️ Lý do thất bại:</h3>
                <p style="font-size: 16px; color: #d32f2f;"><strong>${order.payment.failedReason || 'Không xác định'}</strong></p>
            </div>
            
            <p><strong>Các nguyên nhân có thể:</strong></p>
            <ul>
                <li>Số dư tài khoản không đủ</li>
                <li>Thông tin thẻ không chính xác</li>
                <li>Thẻ đã hết hạn hoặc bị khóa</li>
                <li>Ngân hàng từ chối giao dịch</li>
                <li>Vượt quá hạn mức giao dịch</li>
            </ul>
            
            <p><strong>Giải pháp:</strong></p>
            <ul>
                <li>Kiểm tra lại thông tin thẻ</li>
                <li>Liên hệ ngân hàng của bạn</li>
                <li>Thử lại với phương thức thanh toán khác</li>
                <li>Liên hệ với chúng tôi để được hỗ trợ</li>
            </ul>
            
            <center>
                <a href="${process.env.FRONTEND_URL}/order/${order._id}/retry-payment" class="button">
                    Thử thanh toán lại
                </a>
            </center>
            
            <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center;">
                Cần hỗ trợ? Liên hệ ngay:<br>
                📧 <a href="mailto:support@yourstore.com">support@yourstore.com</a><br>
                📞 Hotline: 1900-xxxx
            </p>
        </div>
        
        <div class="footer">
            <p><strong>E-commerce Store</strong></p>
            <p>© 2024 All rights reserved</p>
        </div>
    </div>
</body>
</html>
    `;
}

/**
 * Refund Confirmation Email Template
 */
export function refundConfirmationTemplate(order) {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
        .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #9C27B0 0%, #7B1FA2 100%); color: white; padding: 30px 20px; text-align: center; }
        .content { padding: 30px 20px; }
        .refund-info { background: #E1BEE7; padding: 20px; margin: 20px 0; border-left: 4px solid #9C27B0; border-radius: 8px; }
        .button { display: inline-block; padding: 15px 40px; background: linear-gradient(135deg, #9C27B0 0%, #7B1FA2 100%); color: white; text-decoration: none; border-radius: 50px; margin: 20px 0; font-weight: bold; box-shadow: 0 4px 15px rgba(156, 39, 176, 0.4); }
        .footer { text-align: center; padding: 30px 20px; color: #777; font-size: 12px; background: #f8f9fa; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>💰 Hoàn tiền thành công</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Yêu cầu hoàn tiền đã được xử lý</p>
        </div>
        
        <div class="content">
            <p>Xin chào <strong>${order.shippingAddress.fullName}</strong>,</p>
            
            <p>Đơn hàng <strong>${order.orderNumber}</strong> đã được hoàn tiền thành công.</p>
            
            <div class="refund-info">
                <h3 style="margin-top: 0;">💳 Thông tin hoàn tiền</h3>
                <p><strong>Số tiền hoàn:</strong> <span style="font-size: 24px; color: #9C27B0;">${order.pricing.total.toLocaleString('vi-VN')} ₫</span></p>
                <p><strong>Phương thức hoàn:</strong> ${order.payment.method === 'card' ? 'Về thẻ thanh toán' : 'Chuyển khoản ngân hàng'}</p>
                <p><strong>Thời gian xử lý:</strong> 5-10 ngày làm việc</p>
                <p><strong>Trạng thái:</strong> <span style="color: #4CAF50; font-weight: bold;">✅ Đã xử lý</span></p>
            </div>
            
            <p><strong>📝 Lưu ý quan trọng:</strong></p>
            <ul>
                <li>Số tiền sẽ được hoàn về tài khoản thanh toán của bạn trong vòng <strong>5-10 ngày làm việc</strong></li>
                <li>Thời gian cụ thể phụ thuộc vào ngân hàng của bạn</li>
                <li>Bạn sẽ nhận được thông báo từ ngân hàng khi tiền về tài khoản</li>
                <li>Nếu sau 10 ngày chưa nhận được tiền, vui lòng liên hệ với chúng tôi</li>
            </ul>
            
            <p><strong>Chi tiết đơn hàng đã hoàn:</strong></p>
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0;">
                <p style="margin: 5px 0;"><strong>Mã đơn hàng:</strong> ${order.orderNumber}</p>
                <p style="margin: 5px 0;"><strong>Ngày đặt hàng:</strong> ${new Date(order.createdAt).toLocaleDateString('vi-VN')}</p>
                <p style="margin: 5px 0;"><strong>Tổng tiền đã thanh toán:</strong> ${order.pricing.total.toLocaleString('vi-VN')} ₫</p>
            </div>
            
            <center>
                <a href="${process.env.FRONTEND_URL}/order/${order._id}" class="button">
                    Xem chi tiết đơn hàng
                </a>
            </center>
            
            <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                Chúng tôi rất tiếc vì trải nghiệm này. Hy vọng bạn sẽ quay lại mua sắm với chúng tôi trong tương lai!
            </p>
            
            <p style="text-align: center;">
                Có thắc mắc? Liên hệ ngay:<br>
                📧 <a href="mailto:support@yourstore.com">support@yourstore.com</a><br>
                📞 Hotline: 1900-xxxx
            </p>
        </div>
        
        <div class="footer">
            <p><strong>E-commerce Store</strong></p>
            <p>Cảm ơn bạn đã tin tưởng!</p>
            <p>© 2024 All rights reserved</p>
        </div>
    </div>
</body>
</html>
    `;
}