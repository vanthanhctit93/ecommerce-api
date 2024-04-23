const mongoose = require('mongoose');

const siteSchema = mongoose.Schema(
    {
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
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('Site', siteSchema);