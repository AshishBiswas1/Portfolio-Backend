const express = require('express');
const authController = require('../controllers/authController');
const internshipController = require('../controllers/internshipController');
const upload = require('../util/uploadMiddleware');

const router = express.Router();

router.route('/').get(internshipController.getTopInternships);
router.route('/all').get(internshipController.getAllInternships);
router.route('/:id').get(internshipController.getInternship);

router.use(authController.protect, authController.restrictTo('admin'));

router
  .route('/')
  .post(upload.single('certificate'), internshipController.addInternship);

router
  .route('/:id')
  .patch(upload.single('certificate'), internshipController.updateInternship)
  .delete(internshipController.deleteInternship);

module.exports = router;
