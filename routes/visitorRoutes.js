const express = require('express');
const visitorController = require('../controllers/visitorController');

const router = express.Router();

router.post('/track', visitorController.trackVisitor);
router.get('/stats', visitorController.getVisitorStats);

module.exports = router;
