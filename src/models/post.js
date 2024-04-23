const mongoose = require('mongoose');

const postSchema = mongoose.Schema(
    {
        id: {
            type: Number
        },

        title: {
            type: String,
        },

        excerpt: {
            type: String
        },

        thumbnail: {
            type: String,
        },

        description: {
            type: String,
        },
    },
    {
        timestamp: true
    }
);

module.exports = mongoose.model('Post', postSchema);