import mongoose from 'mongoose';

const articleSchema = mongoose.Schema({
    id: {
        type: Number
    },

    title: {
        type: String,
        required: true
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

    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    createDate: {
        type: Date,
        default: Date.now 
    },

    timestamp: {
        type: Date,
        default: Date.now
    }
});

const Article = mongoose.model('Article', articleSchema);

export default Article;