const express = require('express');
const objectiveController = require('../controllers/objectiveController');
const authController = require('../controllers/authController');

const router = express.Router();

router.route('/').get(objectiveController.getCarrierObjective);

router.use(authController.protect, authController.restrictTo('admin'));

router.route('/').post(objectiveController.createCarrierObjective);

router
  .route('/:id')
  .patch(objectiveController.updateCarrierObjective)
  .delete(objectiveController.deleteCarrierObjective);

module.exports = router;
