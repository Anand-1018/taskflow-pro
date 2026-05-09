const { validationResult } = require('express-validator');
const Project = require('../models/Project');
const Task = require('../models/Task');

// @route   GET /api/projects
// @access  Private
const getProjects = async (req, res, next) => {
  try {
    let query;
    if (req.user.role === 'admin') {
      query = Project.find();
    } else {
      query = Project.find({ members: req.user._id });
    }

    const projects = await query
      .populate('createdBy', 'name email')
      .populate('members', 'name email')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: projects.length, data: projects });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/projects
// @access  Private (Admin only)
const createProject = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const project = await Project.create({ ...req.body, createdBy: req.user._id });
    await project.populate('createdBy', 'name email');

    res.status(201).json({ success: true, data: project });
  } catch (error) {
    next(error);
  }
};

// @route   PUT /api/projects/:id
// @access  Private (Admin only)
const updateProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const updated = await Project.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('createdBy', 'name email').populate('members', 'name email');

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

// @route   DELETE /api/projects/:id
// @access  Private (Admin only)
const deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    // Delete associated tasks too
    await Task.deleteMany({ project: req.params.id });
    await project.deleteOne();

    res.json({ success: true, message: 'Project deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getProjects, createProject, updateProject, deleteProject };
