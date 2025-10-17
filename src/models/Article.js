import mongoose from 'mongoose';
import slugify from 'slugify';

const articleSchema = new mongoose.Schema({
    // ========================================
    // BASIC INFORMATION
    // ========================================
    title: {
        type: String,
        required: [true, 'Tiêu đề bài viết là bắt buộc'],
        trim: true,
        maxlength: [200, 'Tiêu đề không được vượt quá 200 ký tự']
    },

    slug: {
        type: String,
        unique: true,
        lowercase: true,
        validate: {
            validator: async function(slug) {
                if (!this.isModified('slug')) return true;
                const article = await this.constructor.findOne({ slug, _id: { $ne: this._id } });
                return !article;
            },
            message: 'Slug đã tồn tại'
        }
    },

    excerpt: {
        type: String,
        maxlength: [500, 'Trích dẫn không được vượt quá 500 ký tự'],
        trim: true
    },

    content: { 
        type: String,
        required: [true, 'Nội dung bài viết là bắt buộc']
    },

    // ========================================
    // MEDIA
    // ========================================
    thumbnail: {
        type: String,
        default: null
    },

    featuredImage: {  
        url: String,
        alt: String,
        caption: String
    },

    gallery: [{  
        url: String,
        alt: String,
        caption: String
    }],

    // ========================================
    // CATEGORIZATION
    // ========================================
    categories: [{  
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category'
    }],

    tags: [{  
        type: String,
        trim: true,
        lowercase: true
    }],

    // ========================================
    // AUTHOR & PUBLISHING
    // ========================================
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    status: {  
        type: String,
        enum: ['draft', 'published', 'archived'],
        default: 'draft'
    },

    publishedAt: {  
        type: Date,
        default: null
    },

    scheduledAt: {  
        type: Date,
        default: null
    },

    // ========================================
    // SEO
    // ========================================
    seo: {  
        metaTitle: {
            type: String,
            maxlength: [70, 'Meta title không được vượt quá 70 ký tự']
        },
        metaDescription: {
            type: String,
            maxlength: [160, 'Meta description không được vượt quá 160 ký tự']
        },
        keywords: [String],
        ogImage: String
    },

    // ========================================
    // ENGAGEMENT
    // ========================================
    viewCount: {  
        type: Number,
        default: 0
    },

    readCount: {
        type: Number,
        default: 0
    },

    averageReadTime: {
        type: Number, // seconds
        default: 0
    },

    likes: [{  
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],

    comments: [{  
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        content: String,
        createdAt: {
            type: Date,
            default: Date.now
        },
        isApproved: {
            type: Boolean,
            default: false
        },
        moderatedBy: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'User' 
        }, 
        moderatedAt: Date, 
        rejectionReason: String 
    }],

    // ========================================
    // SOFT DELETE
    // ========================================
    isDeleted: {  
        type: Boolean,
        default: false
    },

    deletedAt: {
        type: Date,
        default: null
    },

    deletedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },

    // ========================================
    // FEATURED
    // ========================================
    isFeatured: {  
        type: Boolean,
        default: false
    },

    featuredOrder: { 
        type: Number,
        default: 0
    }

}, {
    timestamps: true,  
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// ========================================
// INDEXES
// ========================================
// Note: slug already has unique index from schema definition
articleSchema.index({ author: 1, status: 1 });  
articleSchema.index({ author: 1, isDeleted: 1 });  
articleSchema.index({ status: 1, publishedAt: -1 });  
articleSchema.index({ isDeleted: 1, status: 1 });  
articleSchema.index({ isFeatured: 1, publishedAt: -1 });  
articleSchema.index({ categories: 1, status: 1 });  
articleSchema.index({ tags: 1 });  
articleSchema.index({ viewCount: -1 });  
articleSchema.index({ createdAt: -1 });  
articleSchema.index({ publishedAt: -1 });  

// ========================================
// VIRTUAL FIELDS
// ========================================
articleSchema.virtual('likeCount').get(function() {
    return this.likes ? this.likes.length : 0;
});

articleSchema.virtual('commentCount').get(function() {
    return this.comments ? this.comments.length : 0;
});

articleSchema.virtual('readingTime').get(function() {
    if (!this.content) return 0;
    const wordsPerMinute = 200;
    const wordCount = this.content.trim().split(/\s+/).length;
    return Math.ceil(wordCount / wordsPerMinute);
});

articleSchema.virtual('isPublished').get(function() {
    return this.status === 'published' && this.publishedAt && this.publishedAt <= new Date();
});

// ========================================
// PRE-SAVE HOOKS
// ========================================
// Auto-generate slug from title
articleSchema.pre('save', async function(next) {
    if (this.isModified('title') && !this.slug) {
        this.slug = slugify(this.title, {
            lower: true,
            strict: true,
            locale: 'vi'
        });

        // Ensure unique slug
        const slugRegex = new RegExp(`^${this.slug}(-[0-9]+)?$`, 'i');
        const articlesWithSlug = await this.constructor.find({ slug: slugRegex });

        if (articlesWithSlug.length > 0) {
            this.slug = `${this.slug}-${articlesWithSlug.length + 1}`;
        }
    }

    // Set publishedAt when status changes to published
    if (this.isModified('status') && this.status === 'published' && !this.publishedAt) {
        this.publishedAt = new Date();
    }

    next();
});

// ========================================
// STATIC METHODS
// ========================================
articleSchema.statics.findPublished = function(filters = {}) {
    return this.find({
        ...filters,
        status: 'published',
        isDeleted: false,
        publishedAt: { $lte: new Date() }
    });
};

articleSchema.statics.findFeatured = function(limit = 5) {
    return this.find({
        isFeatured: true,
        status: 'published',
        isDeleted: false
    })
    .sort({ featuredOrder: 1, publishedAt: -1 })
    .limit(limit);
};

// ========================================
// INSTANCE METHODS
// ========================================
articleSchema.methods.incrementViewCount = async function() {
    this.viewCount += 1;
    return await this.save();
};

articleSchema.methods.toggleLike = async function(userId) {
    const likeIndex = this.likes.indexOf(userId);
    
    if (likeIndex > -1) {
        this.likes.splice(likeIndex, 1);
    } else {
        this.likes.push(userId);
    }
    
    return await this.save();
};

articleSchema.methods.addComment = async function(userId, content) {
    this.comments.push({
        user: userId,
        content,
        createdAt: new Date(),
        isApproved: false
    });
    
    return await this.save();
};

const Article = mongoose.model('Article', articleSchema);

export default Article;