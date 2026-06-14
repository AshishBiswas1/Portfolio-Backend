const express = require('express');
const authController = require('../controllers/authController');

const router = express.Router();

router.route('/login').post(authController.login);

router.route('forget-password').post(authController.forgetPassword);

router.route('/reset-password/:token').post(authController.resetPassword);

module.exports = router;
