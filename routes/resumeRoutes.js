const express = require('express');
const authController = require('../controllers/authController');
const resumeController = require('../controllers/resumeController');
const upload = require('../util/uploadMiddleware');

const router = express.Router();

router.route('/').get(resumeController.getActiveResume);

router.use(authController.protect, authController.restrictTo('admin'));

router
  .route('/')
  .post(upload.single('resumePdf'), resumeController.createResume);

router
  .route('/:id')
  .patch(upload.single('resumePdf'), resumeController.updateResume)
  .delete(resumeController.deleteResume);

module.exports = router;
