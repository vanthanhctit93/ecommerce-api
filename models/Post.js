const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const postSchema = new Schema(
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

        createDate: {
            type: Date,
            default: new Date()
        }
    },
    {
        timestamp: true
    }
);

const Post = mongoose.model('Post', postSchema);
module.exports = Post;