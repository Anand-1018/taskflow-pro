const Comment = require('../models/Comment');
const Task = require('../models/Task');

// @route   GET /api/comments/:taskId
// @access  Private
const getComments = async (req, res, next) => {
  try {
    const comments = await Comment.find({ task: req.params.taskId })
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: comments });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/comments
// @access  Private
const addComment = async (req, res, next) => {
  try {
    const { text, taskId } = req.body;

    if (!text || !taskId) {
      return res.status(400).json({ message: 'Text and taskId are required' });
    }

    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const comment = await Comment.create({
      text,
      task: taskId,
      createdBy: req.user._id,
    });

    await comment.populate('createdBy', 'name email');

    res.status(201).json({ success: true, data: comment });
  } catch (error) {
    next(error);
  }
};

module.exports = { getComments, addComment };
