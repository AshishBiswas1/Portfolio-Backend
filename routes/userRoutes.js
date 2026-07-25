const express = require('express');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');
const upload = require('../util/uploadMiddleware');

const router = express.Router();

// Public routes
router.route('/').get(userController.getUserDetails);
router.route('/login').post(authController.login);
router.route('/forgotPassword').post(authController.forgetPassword);
router.route('/forget-password').post(authController.forgetPassword);
router.route('/forgot-password').post(authController.forgetPassword);
router.route('/resetPassword/:token').patch(authController.resetPassword);
router.route('/reset-password/:token').patch(authController.resetPassword);

// Protected admin routes
router.use(authController.protect, authController.restrictTo('admin'));

router
  .route('/update')
  .patch(upload.single('photo'), userController.updateUserDetails);

router.route('/update-password').patch(userController.updatePassword);

module.exports = router;
