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

const Site = mongoose.model('Site', SiteSchema);

export default Site;