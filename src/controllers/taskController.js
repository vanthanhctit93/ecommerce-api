import express from 'express';
import TaskModel from '../model/Task';

exports.createTask = async (req, res, next) => {
    try {
        const { title, description, status } = req.body;
        const task = new TaskModel({
            title,
            description,
            owner: req.user.id,
        });

        await task.save();
        res.status(201).json({ message: 'Tạo task thành công' });
    } catch (err) {
        next(err);
    }
};

exports.getTasks = async (req, res, next) => {
    try {
        const tasks = await TaskModel.find({ owner: req.user.id });
        res.status(200).json(tasks);
    } catch (err) {
        next(err);
    }
}

exports.getTask = async (req, res, next) => {
    try {
        const task = await TaskModel.findOne({ _id: req.params.id, owner: req.user.id });

        if (!task) {
            return res.status(404).json({ message: 'Task không tồn tại' });
        }

        res.status(200).json(task);
    } catch (err) {
        next(err);
    }
}

exports.updateTask = async (req, res, next) => {
    try {
        const updated = req.body;
        const task = await TaskModel.findOneAndUpdate(
            { 
                _id: req.params.id, 
                owner: req.user.id 
            }, 
            updated, 
            { 
                new: true 
            }
        );

        if (!task) {
            return res.status(404).json({ message: 'Task không tồn tại' });
        }
    } catch (err) {
        next(err);
    }
}

exports.deleteTask = async (req, res, next) => {
    try {
        const task = await TaskModel.findOneAndDelete({ _id: req.params.id, owner: req.user.id });

        if (!task) {
            return res.status(404).json({ message: 'Task không tồn tại' });
        }

        res.status(200).json({ message: 'Xóa task thành công' });
    } catch (err) {
        next(err);
    }
}
