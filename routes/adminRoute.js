const express = require('express');
const authController = require('../controllers/authController');

const router = express.Router();

router.route('/login').post(authController.login);

router.route('/forget-password').post(authController.forgetPassword);
router.route('/forgot-password').post(authController.forgetPassword);
router.route('/forgotPassword').post(authController.forgetPassword);

router.route('/reset-password/:token').patch(authController.resetPassword);
router.route('/resetPassword/:token').patch(authController.resetPassword);

module.exports = router;
