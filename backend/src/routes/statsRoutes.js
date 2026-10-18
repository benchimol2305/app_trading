const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth');
const { summary, equity, pnlSeries } = require('../controllers/statsController');

router.use(protect);

router.get('/summary', summary);
router.get('/equity', equity);
router.get('/pnl', pnlSeries);

module.exports = router;
