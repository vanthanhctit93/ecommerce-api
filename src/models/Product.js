import mongoose from 'mongoose';

const productSchema = mongoose.Schema({
    id: {
        type: Number
    },

    type: {
        type: String
    },

    sku: {
        type: String
    },

    title: {
        type: String,
    },

    thumbnail: {
        type: String,
    },

    shortDescription: {
        type: String,
    },

    description: {
        type: String,
    },

    salePrice: {
        type: Number
    },

    regularPrice: {
        type: Number
    },

    inStock: {
        type: Number
    },

    isPublished: {
        type: Boolean
    },

    isFeatured: {
        type: Boolean
    },

    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    timestamp: {
        type: Date,
        default: Date.now
    }
});

const Product = mongoose.model('Product', productSchema);
export default Product;