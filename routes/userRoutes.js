const express = require('express');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');
const upload = require('../util/uploadMiddleware');

const router = express.Router();

router.route('/').get(userController.getUserDetails);

router.use(authController.protect, authController.restrictTo('admin'));

router
  .route('/update')
  .patch(upload.single('photo'), userController.updateUserDetails);

module.exports = router;
