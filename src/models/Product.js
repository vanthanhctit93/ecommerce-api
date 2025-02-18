import mongoose from 'mongoose';

const productSchema = mongoose.Schema(
    {
        id: {
            type: Number
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

        description: {
            type: String,
        },

        price: {
            type: Number
        }

    },
    {
        timestamp: true
    }
);

const Product = mongoose.model('Product', productSchema);
export default Product;