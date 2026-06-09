const express = require('express');
const qualificationController = require('../controllers/qualificationController');
const authController = require('../controllers/authController');

const router = express.Router();

router.route('/').get(qualificationController.getAllQualification);

router.route('/:id').get(qualificationController.getQualification);

router.use(authController.protect, authController.restrictTo('admin'));

router.route('/').post(qualificationController.addQualification);

router
  .route('/:id')
  .patch(qualificationController.updateQualification)
  .delete(qualificationController.deleteQualification);

module.exports = router;
