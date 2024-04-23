const mongoose = require('mongoose');

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

module.exports = mongoose.model('Product', productSchema);