const express = require('express');
const { body } = require('express-validator');
const { getProjects, createProject, updateProject, deleteProject } = require('../controllers/projectController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', protect, getProjects);

router.post(
  '/',
  protect,
  adminOnly,
  [body('title').trim().notEmpty().withMessage('Project title is required')],
  createProject
);

router.put('/:id', protect, adminOnly, updateProject);
router.delete('/:id', protect, adminOnly, deleteProject);

module.exports = router;
