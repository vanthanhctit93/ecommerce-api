import mongoose from 'mongoose';

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

const Poll = mongoose.model('Poll', PollSchema);

export default Poll;