const express = require('express');
const { body } = require('express-validator');
const { getTasks, createTask, updateTask, deleteTask, getTaskStats } = require('../controllers/taskController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', protect, getTasks);
router.get('/stats', protect, getTaskStats);

router.post(
  '/',
  protect,
  adminOnly,
  [
    body('title').trim().notEmpty().withMessage('Task title is required'),
    body('project').notEmpty().withMessage('Project is required'),
  ],
  createTask
);

router.put('/:id', protect, updateTask);
router.delete('/:id', protect, adminOnly, deleteTask);

module.exports = router;
