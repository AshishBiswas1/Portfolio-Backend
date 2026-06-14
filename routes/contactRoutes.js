const express = require('express');
const contactController = require('../controllers/ContactController');
const authController = require('../controllers/authController');

const router = express.Router();

router.route('/').post(contactController.submitContactForm);

// All routes below this line are protected and require authentication
router.use(authController.protect, authController.restrictTo('admin'));

router.route('/').get(contactController.getAllContacts);
router
  .route('/:id')
  .get(contactController.getContact)
  .delete(contactController.deleteContact);
router.route('/:id/reply').post(contactController.replyToContact);

module.exports = router;
