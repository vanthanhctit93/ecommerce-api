import mongoose from 'mongoose';

const productSchema = mongoose.Schema({
    sku: {
        type: String,
        required: [true, 'SKU là bắt buộc'],
        unique: true,
        uppercase: true,
        trim: true,
        match: [/^[A-Z0-9-]{3,50}$/, 'SKU không hợp lệ']
    },

    title: {
        type: String,
        required: [true, 'Tên sản phẩm là bắt buộc'],
        trim: true,
        minlength: [3, 'Tên sản phẩm phải có ít nhất 3 ký tự'],
        maxlength: [200, 'Tên sản phẩm không được quá 200 ký tự']
    },

    slug: {
        type: String,
        unique: true,
        lowercase: true
    },

    shortDescription: {
        type: String,
        maxlength: [500, 'Mô tả ngắn không được quá 500 ký tự']
    },

    description: {
        type: String
    },

    // Hỗ trợ nhiều ảnh
    images: [{
        url: String,
        alt: String,
        isPrimary: {
            type: Boolean,
            default: false
        }
    }],

    thumbnail: {
        type: String
    },

    // Danh mục sản phẩm
    categories: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category'
    }],

    regularPrice: {
        type: Number,
        required: [true, 'Giá sản phẩm là bắt buộc'],
        min: [0, 'Giá sản phẩm không thể âm']
    },

    salePrice: {
        type: Number,
        min: [0, 'Giá sale không thể âm'],
        validate: {
            validator: function(value) {
                return !value || value <= this.regularPrice;
            },
            message: 'Giá sale không thể lớn hơn giá gốc'
        }
    },

    // Phần trăm giảm giá (tự động tính)
    discountPercentage: {
        type: Number,
        default: 0
    },

    inStock: {
        type: Number,
        required: true,
        min: [0, 'Tồn kho không thể âm'],
        default: 0
    },

    // Ngưỡng cảnh báo hết hàng
    lowStockThreshold: {
        type: Number,
        default: 10
    },

    // Đánh giá và review
    rating: {
        type: Number,
        default: 0,
        min: [0, 'Rating không thể âm'],
        max: [5, 'Rating không thể lớn hơn 5']
    },

    numReviews: {
        type: Number,
        default: 0
    },

    // Thống kê bán hàng
    soldCount: {
        type: Number,
        default: 0
    },

    views: {
        type: Number,
        default: 0
    },

    isPublished: {
        type: Boolean,
        default: false
    },

    isFeatured: {
        type: Boolean,
        default: false
    },

    // Thông tin vận chuyển
    weight: {
        value: {
            type: Number,
            default: 0.5  // ✅ Default 500g
        },
        unit: {
            type: String,
            enum: ['kg', 'g', 'lb'],
            default: 'kg'
        }
    },

    dimensions: {
        length: Number,
        width: Number,
        height: Number,
        unit: {
            type: String,
            enum: ['cm', 'm', 'in'],
            default: 'cm'
        }
    },

    // Metadata SEO
    seo: {
        metaTitle: String,
        metaDescription: String,
        metaKeywords: [String]
    },

    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    // Timestamps
    createdAt: {
        type: Date,
        default: Date.now
    },

    updatedAt: {
        type: Date,
        default: Date.now
    },

    // Soft delete
    isDeleted: {
        type: Boolean,
        default: false
    },

    deletedAt: {
        type: Date
    },

    deletedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// ========================================
// INDEXES
// ========================================
// Note: sku already has unique index from schema definition
// Note: slug already has unique index from schema definition
productSchema.index({ owner: 1, isDeleted: 1 });  
productSchema.index({ title: 'text', description: 'text' }); 
productSchema.index({ categories: 1 });
productSchema.index({ isPublished: 1, isFeatured: 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ regularPrice: 1 }); 
productSchema.index({ salePrice: 1 });
productSchema.index({ soldCount: -1 });  

// Virtual để check low stock
productSchema.virtual('isLowStock').get(function() {
    return this.inStock <= this.lowStockThreshold && this.inStock > 0;
});

// Virtual để check out of stock
productSchema.virtual('isOutOfStock').get(function() {
    return this.inStock === 0;
});

// Virtual để tính giá cuối cùng
productSchema.virtual('finalPrice').get(function() {
    return this.salePrice || this.regularPrice;
});

// Middleware: Tự động tính discountPercentage
productSchema.pre('save', function(next) {
    if (this.salePrice && this.regularPrice) {
        this.discountPercentage = Math.round(
            ((this.regularPrice - this.salePrice) / this.regularPrice) * 100
        );
    } else {
        this.discountPercentage = 0;
    }
    next();
});

// Middleware: Tự động tạo slug
productSchema.pre('save', function(next) {
    if (this.isModified('title') && !this.slug) {
        this.slug = this.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
    }
    next();
});

// Middleware: Update updatedAt
productSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Query helper để filter deleted products
productSchema.query.notDeleted = function() {
    return this.where({ isDeleted: false });
};

// Middleware: Tự động filter deleted products
productSchema.pre(/^find/, function(next) {
    if (!this.getOptions().includeDeleted) {
        this.where({ isDeleted: false });
    }
    next();
});

const Product = mongoose.model('Product', productSchema);
export default Product;