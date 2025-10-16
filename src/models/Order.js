import mongoose from 'mongoose';

const orderSchema = mongoose.Schema({
    orderNumber: {
        type: String,
        required: true,
        unique: true
    },

    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    items: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        title: String,
        sku: String,
        price: Number,
        quantity: Number,
        subtotal: Number
    }],

    shippingAddress: {
        fullName: {
            type: String,
            required: true
        },
        phone: {
            type: String,
            required: true
        },
        address: {
            type: String,
            required: true
        },
        city: {
            type: String,
            required: true
        },
        postalCode: String,
        country: {
            type: String,
            default: 'VN'
        }
    },

    pricing: {
        subtotal: {
            type: Number,
            required: true
        },
        shipping: {
            type: Number,
            default: 0
        },
        tax: {
            type: Number,
            default: 0
        },
        total: {
            type: Number,
            required: true
        }
    },

    payment: {
        method: {
            type: String,
            enum: ['card', 'bank_transfer', 'cod'],
            default: 'card'
        },
        status: {
            type: String,
            enum: ['pending', 'processing', 'succeeded', 'failed', 'refunded'],
            default: 'pending'
        },
        stripePaymentIntentId: String,
        paidAt: Date,
        failedReason: String
    },

    shipping: {
        method: {
            type: String,
            enum: ['standard', 'express'],
            default: 'standard'
        },
        status: {
            type: String,
            enum: ['pending', 'preparing', 'shipped', 'delivered', 'cancelled'],
            default: 'pending'
        },
        trackingNumber: String,
        shippedAt: Date,
        deliveredAt: Date
    },

    status: {
        type: String,
        enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
        default: 'pending'
    },

    notes: String,

    cancelledAt: Date,
    cancelledBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    cancelReason: String

}, {
    timestamps: true
});

// Index cho search và filter
orderSchema.index({ user: 1, status: 1 });
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ 'payment.status': 1 });
orderSchema.index({ 'shipping.status': 1 });
orderSchema.index({ createdAt: -1 });

// Generate order number
orderSchema.pre('save', async function(next) {
    if (this.isNew && !this.orderNumber) {
        const count = await mongoose.model('Order').countDocuments();
        this.orderNumber = `ORD-${Date.now()}-${(count + 1).toString().padStart(5, '0')}`;
    }
    next();
});

const Order = mongoose.model('Order', orderSchema);
export default Order;