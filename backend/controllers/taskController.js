const { validationResult } = require('express-validator');
const Task = require('../models/Task');
const Comment = require('../models/Comment');

// @route   GET /api/tasks
// @access  Private
const getTasks = async (req, res, next) => {
  try {
    let query;
    if (req.user.role === 'admin') {
      query = Task.find();
    } else {
      query = Task.find({ assignedTo: req.user._id });
    }

    // Filter by project if provided
    if (req.query.project) {
      query = query.where('project').equals(req.query.project);
    }

    const tasks = await query
      .populate('project', 'title')
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: tasks.length, data: tasks });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/tasks
// @access  Private (Admin only)
const createTask = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const task = await Task.create({ ...req.body, createdBy: req.user._id });
    await task.populate('project', 'title');
    await task.populate('assignedTo', 'name email');

    res.status(201).json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
};

// @route   PUT /api/tasks/:id
// @access  Private
const updateTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    // Members can only update status
    if (req.user.role === 'member') {
      const allowedFields = { status: req.body.status };
      const updated = await Task.findByIdAndUpdate(req.params.id, allowedFields, { new: true })
        .populate('project', 'title')
        .populate('assignedTo', 'name email');
      return res.json({ success: true, data: updated });
    }

    const updated = await Task.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate('project', 'title')
      .populate('assignedTo', 'name email');

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

// @route   DELETE /api/tasks/:id
// @access  Private (Admin only)
const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    await Comment.deleteMany({ task: req.params.id });
    await task.deleteOne();

    res.json({ success: true, message: 'Task deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/tasks/stats
// @access  Private
const getTaskStats = async (req, res, next) => {
  try {
    let matchQuery = {};
    if (req.user.role === 'member') {
      matchQuery.assignedTo = req.user._id;
    }

    const stats = await Task.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const priorityStats = await Task.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 },
        },
      },
    ]);

    res.json({ success: true, data: { statusStats: stats, priorityStats } });
  } catch (error) {
    next(error);
  }
};

module.exports = { getTasks, createTask, updateTask, deleteTask, getTaskStats };
