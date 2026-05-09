const express = require('express');
const { getComments, addComment } = require('../controllers/commentController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/:taskId', protect, getComments);
router.post('/', protect, addComment);

module.exports = router;
