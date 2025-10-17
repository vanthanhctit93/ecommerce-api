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
        fullName: String,
        phone: String,
        address: String,
        provinceCode: String,
        provinceName: String,
        communeCode: String,
        communeName: String,
        fullAddress: String
    },

    shippingDetails: {
        actualWeight: Number,
        dimensions: {
            length: Number,
            width: Number,
            height: Number
        },
        chargeableWeight: Number,
        zone: String,
        method: String,
        estimatedDays: String,
        cost: Number,
        breakdown: {
            baseCost: Number,
            weightSurcharge: Number,
            codFee: Number,
            insuranceFee: Number,
            vatFee: Number
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

// ========================================
// INDEXES
// ========================================
// Note: orderNumber already has unique index from schema definition
orderSchema.index({ user: 1, status: 1 });  
orderSchema.index({ user: 1, createdAt: -1 });  
orderSchema.index({ 'payment.status': 1, createdAt: -1 });  
orderSchema.index({ 'payment.stripePaymentIntentId': 1 }, { sparse: true });  
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