const express = require('express');
const frameController = require('../controllers/frameController');

const router = express.Router();

router.route('/').get(frameController.getFrames);

module.exports = router;
