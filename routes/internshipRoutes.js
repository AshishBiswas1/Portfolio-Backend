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
  .post(
    upload.fields([
      { name: 'certificate', maxCount: 1 },
      { name: 'offerLetter', maxCount: 1 },
      { name: 'recommendationLetter', maxCount: 1 }
    ]),
    internshipController.addInternship
  );

router
  .route('/:id')
  .patch(
    upload.fields([
      { name: 'certificate', maxCount: 1 },
      { name: 'offerLetter', maxCount: 1 },
      { name: 'recommendationLetter', maxCount: 1 }
    ]),
    internshipController.updateInternship
  )
  .delete(internshipController.deleteInternship);

module.exports = router;
