const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth');
const { getMe, updateMe, deleteMe } = require('../controllers/userController');

router.get('/me', protect, getMe);
router.put('/me', protect, updateMe);
router.delete('/me', protect, deleteMe);

module.exports = router;
