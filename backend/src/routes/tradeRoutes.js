const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth');
const { getAll, getOne, create, update, remove } = require('../controllers/tradeController');

router.use(protect);

router.route('/').get(getAll).post(create);
router.route('/:id').get(getOne).put(update).delete(remove);

module.exports = router;
