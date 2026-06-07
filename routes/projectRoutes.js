const express = require('express');
const authController = require('../controllers/authController');
const projectController = require('../controllers/projectController');

const router = express.Router();

router.route('/').get(projectController.getTopProjects);
router.route('/all').get(projectController.getAllProjects);

router.use(authController.protect, authController.restrictTo('admin'));

router.route('/').post(projectController.createProject);

router
  .route('/:id')
  .patch(projectController.updateProject)
  .delete(projectController.deleteProject);

module.exports = router;
