import mongoose from 'mongoose';

const articleSchema = mongoose.Schema({
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
    },

    timestamp: {
        type: Date,
        default: Date.now
    }
});

const Article = mongoose.model('Article', articleSchema);

export default Article;