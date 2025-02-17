const mongoose = require('mongoose');

const taskSchema = mongoose.Schema(
    {
        id: {
            type: Number
        },

        title: {
            type: String,
            required: [true, 'Please add a title']
        },

        description: {
            type: String,
        },

        status: {
            type: String,
        },

        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Please add a owner']
        },

        dueDate: {
            type: String,
        },
    },
    {
        timestamp: true
    }
)

module.exports = mongoose.model('Task', taskSchema);