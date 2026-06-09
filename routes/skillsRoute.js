const express = require('express');
const skillController = require('../controllers/skillController');
const authController = require('../controllers/authController');

const router = express.Router();

router.route('/').get(skillController.getTopSkills);
router.route('/all').get(skillController.getAllSkills);

router.use(authController.protect, authController.restrictTo('admin'));

router.route('/').post(skillController.addSkill);

router
  .route('/:id')
  .patch(skillController.updateSkill)
  .delete(skillController.deleteSkill);

module.exports = router;
