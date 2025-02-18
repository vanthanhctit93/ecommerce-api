import mongoose from 'mongoose';

const SiteSchema = mongoose.Schema({
    siteUrl: {
        type: String
    },

    siteName: {
        type: String
    },

    siteDescription: {
        type: String
    },

    siteEmail: {
        type: String
    },

    timestamps: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Site', SiteSchema);