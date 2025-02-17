const PollModel = require('../models/Poll');

exports.createPoll = async (req, res, next) => {
    try {
        const { question, choices } = req.body;

        if (!question || !choices || !Array.isArray(choices) || choices.length < 2) {
            return res.status(400).json({ message: 'Thiếu câu hỏi' });
        }

        const pollChoices = choices.map(choice => { 
            return { 
                text: choice, 
                votes: 0 
            } 
        });
        
        const poll = new PollModel({
            question,
            choices: pollChoices
        });

        await poll.save();
        res.status(201).json({ message: 'Tạo poll thành công' });
    } catch (err) {
        next(err);
    }
}

exports.getPoll = async (req, res, next) => {
    try {
        const poll = await PollModel.findById(req.params.id);

        if (!poll) {
            return res.status(404).json({ message: 'Poll không tồn tại' });
        }

        res.status(200).json(poll);
    } catch (err) {
        next(err);
    }
}

exports.votePoll = async (req, res, next) => {
    try {
        const { choice } = req.body;
        const poll = await PollModel.findById(req.params.id);

        if (!poll) {
            return res.status(404).json({ message: 'Poll không tồn tại' });
        }

        if (choice < 0 || choice >= poll.choices.length) {
            return res.status(400).json({ message: 'Lựa chọn không được để trống' });
        }

        const pollChoice = poll.choices.id(choice);

        if (!pollChoice) {
            return res.status(404).json({ message: 'Lựa chọn không tồn tại' });
        }

        pollChoice.votes = pollChoice.votes + 1;
        await poll.save();

        req.io.emit('pollUpdate', pollChoice);
        res.status(200).json({ message: 'Bỏ phiếu thành công' });
    } catch (err) {
        next(err);
    }
}