const { text } = require('express');
const mongoose = require('mongoose');

const PollSchema = mongoose.Schema(
    {
        question: {
            type: String,
            required: [true, 'Please add a question']
        },

        choices: [{
            text: {
                type: String,
                required: [true, 'Please add a choice']
            },
            votes: {
                type: Number,
                default: 0
            }
        }],
    },
    {
        timestamp: true
    }
);

module.exports = mongoose.model('Poll', PollSchema);